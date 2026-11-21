-- ==============================================================================
-- 20261121000003_returns_and_delivery_rpcs.sql
-- Logistics, Proof of Delivery & Strict Historical Returns
-- Implements Phase 9: Invariant 1 (Historical Cost Immutability on Returns)
-- & Invariant 4 (Scrap Warehouse Segregation for Damaged Goods)
-- ==============================================================================

-- 1. ATOMIC SALES RETURN PROCESSING FUNCTION
CREATE OR REPLACE FUNCTION rpc_process_sales_return(
    p_original_invoice_id UUID,
    p_return_date DATE,
    p_reason TEXT,
    p_refund_method VARCHAR, -- 'CASH' or 'CREDIT'
    p_cashbox_id UUID,        -- Required if p_refund_method = 'CASH'
    p_approved_by UUID,
    p_lines JSONB             -- Array of objects: { original_line_id, returned_qty, is_damaged, custom_notes }
) RETURNS JSONB AS $$
DECLARE
    v_inv RECORD;
    v_item JSONB;
    v_orig_line RECORD;
    v_scrap_warehouse_id UUID;
    v_target_wh_id UUID;
    v_return_id UUID;
    v_return_num VARCHAR;
    v_already_returned NUMERIC(15,3);
    v_unit_historical_cost NUMERIC(15,4);
    v_line_refund NUMERIC(15,2);
    v_total_refund NUMERIC(15,2) := 0.00;
    v_item_returned_qty NUMERIC(15,3);
    v_item_is_damaged BOOLEAN;
BEGIN
    -- 1. Lock and validate original invoice
    SELECT * INTO v_inv
    FROM sales_invoices
    WHERE id = p_original_invoice_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'فاتورة المبيعات الأصلية غير موجودة برقم: %', p_original_invoice_id;
    END IF;

    IF v_inv.status != 'APPROVED' THEN
        RAISE EXCEPTION 'لا يمكن عمل مرتجع إلا على فاتورة مبيعات معتمدة (الحالة الحالية: %)', v_inv.status;
    END IF;

    -- Find organization's dedicated scrap / damaged warehouse
    SELECT id INTO v_scrap_warehouse_id
    FROM warehouses
    WHERE organization_id = v_inv.organization_id
      AND is_scrap_yard = true
      AND is_active = true
    LIMIT 1;

    -- Generate atomic sequential return number
    v_return_num := get_next_document_number(v_inv.organization_id, 'RET', 'RET');

    -- Create Sales Return Header
    INSERT INTO sales_returns (
        organization_id,
        original_invoice_id,
        return_number,
        return_date,
        total_refund_amount,
        reason,
        approved_by
    ) VALUES (
        v_inv.organization_id,
        v_inv.id,
        v_return_num,
        p_return_date,
        0.00, -- Updated below
        p_reason,
        p_approved_by
    ) RETURNING id INTO v_return_id;

    -- Process Each Return Line
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        v_item_returned_qty := (v_item->>'returned_qty')::NUMERIC(15,3);
        v_item_is_damaged := COALESCE((v_item->>'is_damaged')::BOOLEAN, false);

        IF v_item_returned_qty <= 0 THEN
            RAISE EXCEPTION 'كمية المرتجع يجب أن تكون أكبر من الصفر';
        END IF;

        -- Lock original line
        SELECT * INTO v_orig_line
        FROM sales_invoice_lines
        WHERE id = (v_item->>'original_line_id')::UUID
          AND sales_invoice_id = p_original_invoice_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'بند الفاتورة الأصلي غير موجود: %', (v_item->>'original_line_id');
        END IF;

        -- Check total previously returned quantity for this line
        SELECT COALESCE(SUM(returned_quantity), 0) INTO v_already_returned
        FROM sales_return_lines
        WHERE original_line_id = v_orig_line.id;

        IF (v_already_returned + v_item_returned_qty) > v_orig_line.entered_quantity THEN
            RAISE EXCEPTION 'الكمية المرتجعة الإجمالية (%) تتجاوز الكمية المباعة الأصلية (%) للصنف: %',
                (v_already_returned + v_item_returned_qty), v_orig_line.entered_quantity, v_orig_line.product_name_snap;
        END IF;

        -- Invariant 1: Calculate unit historical cost from the exact sale COGS snapshot
        IF v_orig_line.entered_quantity > 0 THEN
            v_unit_historical_cost := v_orig_line.historical_cogs / v_orig_line.entered_quantity;
        ELSE
            v_unit_historical_cost := 0.0000;
        END IF;

        -- Calculate refund amount based on original selling unit price
        v_line_refund := v_item_returned_qty * v_orig_line.unit_price_snap;
        v_total_refund := v_total_refund + v_line_refund;

        -- Invariant 4: Segregate damaged goods to WH-SCRAP
        IF v_item_is_damaged THEN
            IF v_scrap_warehouse_id IS NULL THEN
                RAISE EXCEPTION 'لا يوجد مخزن توالف/سكراب مسجل بالمؤسسة لإيداع البضاعة التالفة';
            END IF;
            v_target_wh_id := v_scrap_warehouse_id;
        ELSE
            v_target_wh_id := v_inv.warehouse_id;
        END IF;

        -- Insert Return Line
        INSERT INTO sales_return_lines (
            sales_return_id,
            original_line_id,
            product_id,
            returned_quantity,
            unit_id,
            is_damaged,
            target_warehouse_id,
            historical_unit_cost,
            total_refund
        ) VALUES (
            v_return_id,
            v_orig_line.id,
            v_orig_line.product_id,
            v_item_returned_qty,
            v_orig_line.entered_unit_id,
            v_item_is_damaged,
            v_target_wh_id,
            v_unit_historical_cost,
            v_line_refund
        );

        -- Record Stock Movement (Inbound Return)
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
            v_target_wh_id,
            v_orig_line.product_id,
            'SALES_RETURN',
            v_item_returned_qty,
            v_unit_historical_cost,
            'SALES_RETURN',
            v_return_id,
            p_approved_by
        );

        -- If undamaged, reopen or add an active FIFO cost layer at the historical cost
        IF NOT v_item_is_damaged THEN
            INSERT INTO inventory_cost_layers (
                organization_id,
                warehouse_id,
                product_id,
                initial_qty,
                remaining_qty,
                purchase_unit_price,
                landed_cost_unit,
                total_unit_cost,
                is_exhausted,
                received_at
            ) VALUES (
                v_inv.organization_id,
                v_target_wh_id,
                v_orig_line.product_id,
                v_item_returned_qty,
                v_item_returned_qty,
                v_unit_historical_cost,
                0.0000,
                v_unit_historical_cost,
                false,
                now()
            );
        END IF;
    END LOOP;

    -- Update total refund on return header
    UPDATE sales_returns
    SET total_refund_amount = v_total_refund
    WHERE id = v_return_id;

    -- Financial Settlement
    IF p_refund_method = 'CREDIT' THEN
        IF v_inv.customer_id IS NOT NULL THEN
            UPDATE customers
            SET current_balance = current_balance - v_total_refund,
                updated_at = now()
            WHERE id = v_inv.customer_id;
        END IF;
    ELSIF p_refund_method = 'CASH' THEN
        IF p_cashbox_id IS NULL THEN
            RAISE EXCEPTION 'يجب تحديد الخزينة لصرف المرتجع النقدي';
        END IF;

        -- Record cash movement (Append-only PAYMENT)
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
            p_cashbox_id,
            'PAYMENT',
            v_total_refund,
            'SALES_RETURN',
            v_return_id,
            'رد نقدي لمرتجع مبيعات رقم ' || v_return_num || ' عن فاتورة ' || v_inv.invoice_number,
            p_approved_by
        );

        -- Update cashbox current balance
        UPDATE cashboxes
        SET current_balance = current_balance - v_total_refund
        WHERE id = p_cashbox_id;
    END IF;

    -- Audit Log Entry
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
        'SALES_RETURN',
        'sales_returns',
        v_return_id,
        jsonb_build_object(
            'return_number', v_return_num,
            'original_invoice_number', v_inv.invoice_number,
            'total_refund_amount', v_total_refund,
            'refund_method', p_refund_method
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'return_id', v_return_id,
        'return_number', v_return_num,
        'total_refund_amount', v_total_refund
    );
END;
$$ LANGUAGE plpgsql;

-- 2. ATOMIC DELIVERY ORDER CREATION
CREATE OR REPLACE FUNCTION rpc_create_delivery_order(
    p_invoice_id UUID,
    p_vehicle_id UUID,
    p_driver_id UUID,
    p_destination_address TEXT,
    p_recipient_phone VARCHAR,
    p_notes TEXT,
    p_lines JSONB -- Array of { sales_invoice_line_id, quantity_to_deliver }
) RETURNS JSONB AS $$
DECLARE
    v_inv RECORD;
    v_del_id UUID;
    v_del_num VARCHAR;
    v_item JSONB;
    v_inv_line RECORD;
    v_already_scheduled NUMERIC(15,3);
    v_qty_to_deliver NUMERIC(15,3);
BEGIN
    SELECT * INTO v_inv
    FROM sales_invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'فاتورة المبيعات غير موجودة';
    END IF;

    IF v_inv.status != 'APPROVED' THEN
        RAISE EXCEPTION 'لا يمكن إنشاء إذن توصيل لفاتورة غير معتمدة';
    END IF;

    v_del_num := get_next_document_number(v_inv.organization_id, 'DEL', 'DEL');

    INSERT INTO delivery_orders (
        organization_id,
        sales_invoice_id,
        delivery_number,
        vehicle_id,
        driver_id,
        destination_address,
        recipient_phone,
        status,
        notes
    ) VALUES (
        v_inv.organization_id,
        v_inv.id,
        v_del_num,
        p_vehicle_id,
        p_driver_id,
        p_destination_address,
        p_recipient_phone,
        'PREPARING',
        p_notes
    ) RETURNING id INTO v_del_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        v_qty_to_deliver := (v_item->>'quantity_to_deliver')::NUMERIC(15,3);

        SELECT * INTO v_inv_line
        FROM sales_invoice_lines
        WHERE id = (v_item->>'sales_invoice_line_id')::UUID;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'بند الفاتورة غير موجود';
        END IF;

        -- Check previously scheduled deliveries for this line
        SELECT COALESCE(SUM(quantity_to_deliver), 0) INTO v_already_scheduled
        FROM delivery_order_lines dol
        JOIN delivery_orders do ON do.id = dol.delivery_order_id
        WHERE dol.sales_invoice_line_id = v_inv_line.id
          AND do.status != 'CANCELLED';

        IF (v_already_scheduled + v_qty_to_deliver) > v_inv_line.entered_quantity THEN
            RAISE EXCEPTION 'إجمالي كميات التوصيل المطلوبة تجاوز كمية الفاتورة الأصلية للصنف: %', v_inv_line.product_name_snap;
        END IF;

        INSERT INTO delivery_order_lines (
            delivery_order_id,
            sales_invoice_line_id,
            product_id,
            quantity_to_deliver,
            unit_id
        ) VALUES (
            v_del_id,
            v_inv_line.id,
            v_inv_line.product_id,
            v_qty_to_deliver,
            v_inv_line.entered_unit_id
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'delivery_id', v_del_id,
        'delivery_number', v_del_num
    );
END;
$$ LANGUAGE plpgsql;

-- 3. ATOMIC DELIVERY STATUS UPDATE & PROOF OF DELIVERY
CREATE OR REPLACE FUNCTION rpc_update_delivery_status(
    p_delivery_id UUID,
    p_new_status VARCHAR, -- 'DISPATCHED', 'DELIVERED', 'CANCELLED'
    p_proof_of_delivery_url TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_del RECORD;
BEGIN
    SELECT * INTO v_del
    FROM delivery_orders
    WHERE id = p_delivery_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'أمر التوصيل غير موجود';
    END IF;

    IF p_new_status = 'DISPATCHED' THEN
        UPDATE delivery_orders
        SET status = 'DISPATCHED',
            dispatched_at = now(),
            notes = COALESCE(p_notes, notes)
        WHERE id = p_delivery_id;
    ELSIF p_new_status = 'DELIVERED' THEN
        UPDATE delivery_orders
        SET status = 'DELIVERED',
            delivered_at = now(),
            proof_of_delivery_url = COALESCE(p_proof_of_delivery_url, proof_of_delivery_url),
            notes = COALESCE(p_notes, notes)
        WHERE id = p_delivery_id;
    ELSIF p_new_status = 'CANCELLED' THEN
        UPDATE delivery_orders
        SET status = 'CANCELLED',
            notes = COALESCE(p_notes, notes)
        WHERE id = p_delivery_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'delivery_id', p_delivery_id,
        'new_status', p_new_status
    );
END;
$$ LANGUAGE plpgsql;
