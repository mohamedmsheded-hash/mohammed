-- ==============================================================================
-- 20261121000002_atomic_transactions.sql
-- Atomic ACID Transactions for Construction ERP
-- Implements: Section 0.2, Rule 10 & 11 (All critical operations inside DB transactions)
-- ==============================================================================

-- 1. ATOMIC SALES INVOICE APPROVAL FUNCTION
CREATE OR REPLACE FUNCTION rpc_approve_sales_invoice(
    p_invoice_id UUID,
    p_approved_by UUID
) RETURNS JSONB AS $$
DECLARE
    v_inv RECORD;
    v_line RECORD;
    v_layer RECORD;
    v_org_allow_negative BOOLEAN;
    v_needed NUMERIC(15,3);
    v_take NUMERIC(15,3);
    v_line_cogs NUMERIC(15,2);
    v_total_cogs NUMERIC(15,2) := 0.00;
    v_total_profit NUMERIC(15,2) := 0.00;
    v_default_cashbox_id UUID;
BEGIN
    -- 1. Lock invoice row to prevent race conditions
    SELECT * INTO v_inv
    FROM sales_invoices
    WHERE id = p_invoice_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'الفاتورة غير موجودة برقم المعرف: %', p_invoice_id;
    END IF;

    IF v_inv.status NOT IN ('DRAFT', 'PENDING_APPROVAL') THEN
        RAISE EXCEPTION 'لا يمكن اعتماد الفاتورة لأن حالتها الحالية هي: %', v_inv.status;
    END IF;

    -- Check org negative stock setting
    SELECT allow_negative_stock INTO v_org_allow_negative
    FROM organizations
    WHERE id = v_inv.organization_id;

    -- 2. Iterate through each line item
    FOR v_line IN
        SELECT * FROM sales_invoice_lines
        WHERE sales_invoice_id = p_invoice_id
        FOR UPDATE
    LOOP
        v_needed := v_line.base_quantity;
        v_line_cogs := 0.00;

        -- Loop through open FIFO cost layers for this product and warehouse
        FOR v_layer IN
            SELECT * FROM inventory_cost_layers
            WHERE warehouse_id = v_inv.warehouse_id
              AND product_id = v_line.product_id
              AND is_exhausted = false
              AND remaining_qty > 0
            ORDER BY received_at ASC
            FOR UPDATE
        LOOP
            IF v_needed <= 0 THEN
                EXIT;
            END IF;

            v_take := LEAST(v_layer.remaining_qty, v_needed);
            v_line_cogs := v_line_cogs + (v_take * v_layer.total_unit_cost);

            -- Record cost allocation
            INSERT INTO cost_allocations (
                sales_invoice_line_id,
                cost_layer_id,
                quantity_consumed,
                unit_cost_applied,
                total_cost
            ) VALUES (
                v_line.id,
                v_layer.id,
                v_take,
                v_layer.total_unit_cost,
                v_take * v_layer.total_unit_cost
            );

            -- Update layer remaining quantity
            UPDATE inventory_cost_layers
            SET remaining_qty = remaining_qty - v_take,
                is_exhausted = (remaining_qty - v_take <= 0)
            WHERE id = v_layer.id;

            v_needed := v_needed - v_take;
        END LOOP;

        -- Check negative stock policy
        IF v_needed > 0 AND NOT v_org_allow_negative THEN
            RAISE EXCEPTION 'رصيد الصنف غير كافٍ في المخزن المعتمد. العجز المتبقي: % بوحدة الأساس', v_needed;
        END IF;

        -- Update line item with historical COGS snapshot
        UPDATE sales_invoice_lines
        SET historical_cogs = v_line_cogs
        WHERE id = v_line.id;

        -- Record stock movement (Append-only stock ledger)
        INSERT INTO stock_movements (
            organization_id,
            warehouse_id,
            product_id,
            movement_type,
            quantity,
            unit_cost_allocated,
            source_doc_type,
            source_doc_id,
            created_by
        ) VALUES (
            v_inv.organization_id,
            v_inv.warehouse_id,
            v_line.product_id,
            'SALES_ISSUE',
            -v_line.base_quantity,
            CASE WHEN v_line.base_quantity > 0 THEN v_line_cogs / v_line.base_quantity ELSE 0 END,
            'SALES_INVOICE',
            v_inv.id,
            p_approved_by
        );

        v_total_cogs := v_total_cogs + v_line_cogs;
    END LOOP;

    -- 3. Financial Ledgers: Cash vs Credit
    IF v_inv.customer_id IS NOT NULL THEN
        -- Increase customer balance with remaining unpaid balance
        UPDATE customers
        SET current_balance = current_balance + v_inv.remaining_balance,
            updated_at = now()
        WHERE id = v_inv.customer_id;
    END IF;

    -- If immediate cash payment was made
    IF v_inv.paid_amount > 0 THEN
        -- Find default branch cashbox
        SELECT id INTO v_default_cashbox_id
        FROM cashboxes
        WHERE branch_id = v_inv.branch_id
          AND type = 'CASH'
          AND is_active = true
        LIMIT 1;

        IF v_default_cashbox_id IS NOT NULL THEN
            -- Record cash movement (Append-only financial ledger)
            INSERT INTO cash_movements (
                organization_id,
                cashbox_id,
                movement_type,
                amount,
                source_doc_type,
                source_doc_id,
                notes,
                created_by
            ) VALUES (
                v_inv.organization_id,
                v_default_cashbox_id,
                'RECEIPT',
                v_inv.paid_amount,
                'SALES_INVOICE',
                v_inv.id,
                'تحصيل نقدي فوري لفاتورة مبيعات رقم ' || v_inv.invoice_number,
                p_approved_by
            );

            -- Update cashbox current balance
            UPDATE cashboxes
            SET current_balance = current_balance + v_inv.paid_amount
            WHERE id = v_default_cashbox_id;
        END IF;
    END IF;

    -- 4. Finalize invoice status
    UPDATE sales_invoices
    SET status = 'APPROVED',
        approved_by = p_approved_by,
        approved_at = now(),
        updated_at = now()
    WHERE id = p_invoice_id;

    -- 5. Audit Log Entry
    INSERT INTO audit_logs (
        organization_id,
        user_id,
        action,
        entity_name,
        entity_id,
        new_values
    ) VALUES (
        v_inv.organization_id,
        p_approved_by,
        'APPROVE',
        'sales_invoices',
        v_inv.id,
        jsonb_build_object(
            'invoice_number', v_inv.invoice_number,
            'total_amount', v_inv.total_amount,
            'historical_cogs', v_total_cogs,
            'historical_profit', v_inv.total_amount - v_total_cogs
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'invoice_id', v_inv.id,
        'invoice_number', v_inv.invoice_number,
        'status', 'APPROVED',
        'historical_cogs', v_total_cogs,
        'historical_profit', v_inv.total_amount - v_total_cogs
    );
END;
$$ LANGUAGE plpgsql;

-- 2. ATOMIC GOODS RECEIPT WITH LANDED COSTS & COST LAYERS
CREATE OR REPLACE FUNCTION rpc_receive_goods_with_layers(
    p_receipt_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_rcpt RECORD;
    v_line RECORD;
    v_total_freight NUMERIC(15,2) := 0.00;
    v_total_unloading NUMERIC(15,2) := 0.00;
    v_total_weight NUMERIC(15,3) := 0.00;
    v_unit_freight NUMERIC(15,4);
    v_unit_unloading NUMERIC(15,4);
    v_layer_id UUID;
BEGIN
    SELECT * INTO v_rcpt
    FROM goods_receipts
    WHERE id = p_receipt_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'إذن الاستلام غير موجود';
    END IF;

    -- Calculate total freight and unloading expenses
    SELECT
        COALESCE(SUM(CASE WHEN expense_type = 'FREIGHT' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN expense_type = 'UNLOADING_MASHAL' THEN amount ELSE 0 END), 0)
    INTO v_total_freight, v_total_unloading
    FROM goods_receipt_expenses
    WHERE goods_receipt_id = p_receipt_id;

    -- Calculate total weight in kg across all lines
    SELECT COALESCE(SUM(base_unit_qty), 0) INTO v_total_weight
    FROM goods_receipt_lines
    WHERE goods_receipt_id = p_receipt_id;

    -- Process each line item
    FOR v_line IN
        SELECT * FROM goods_receipt_lines
        WHERE goods_receipt_id = p_receipt_id
        FOR UPDATE
    LOOP
        -- Calculate landed costs allocation
        IF v_total_weight > 0 THEN
            v_unit_freight := (v_total_freight / v_total_weight);
            v_unit_unloading := (v_total_unloading / v_total_weight);
        ELSE
            v_unit_freight := 0.0000;
            v_unit_unloading := 0.0000;
        END IF;

        -- Update line with allocated costs
        UPDATE goods_receipt_lines
        SET allocated_freight_unit = v_unit_freight,
            allocated_unloading_unit = v_unit_unloading
        WHERE id = v_line.id;

        -- Create open FIFO cost layer
        INSERT INTO inventory_cost_layers (
            organization_id,
            warehouse_id,
            product_id,
            goods_receipt_line_id,
            initial_qty,
            remaining_qty,
            purchase_unit_price,
            landed_cost_unit,
            total_unit_cost,
            is_exhausted,
            received_at
        ) VALUES (
            v_rcpt.organization_id,
            v_rcpt.warehouse_id,
            v_line.product_id,
            v_line.id,
            v_line.base_unit_qty,
            v_line.base_unit_qty,
            v_line.purchase_unit_price,
            (v_unit_freight + v_unit_unloading),
            (v_line.purchase_unit_price + v_unit_freight + v_unit_unloading),
            false,
            now()
        ) RETURNING id INTO v_layer_id;

        -- Record stock movement (Stock Ledger Inbound)
        INSERT INTO stock_movements (
            organization_id,
            warehouse_id,
            product_id,
            movement_type,
            quantity,
            unit_cost_allocated,
            source_doc_type,
            source_doc_id,
            created_by
        ) VALUES (
            v_rcpt.organization_id,
            v_rcpt.warehouse_id,
            v_line.product_id,
            'PURCHASE_RECEIPT',
            v_line.base_unit_qty,
            (v_line.purchase_unit_price + v_unit_freight + v_unit_unloading),
            'GOODS_RECEIPT',
            v_rcpt.id,
            v_rcpt.received_by
        );
    END LOOP;

    -- Update supplier balance if supplier is linked
    IF v_rcpt.supplier_id IS NOT NULL THEN
        UPDATE suppliers
        SET current_balance = current_balance + (
            SELECT COALESCE(SUM(total_line_cost), 0)
            FROM goods_receipt_lines
            WHERE goods_receipt_id = p_receipt_id
        ),
        updated_at = now()
        WHERE id = v_rcpt.supplier_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'receipt_id', v_rcpt.id,
        'receipt_number', v_rcpt.receipt_number
    );
END;
$$ LANGUAGE plpgsql;
