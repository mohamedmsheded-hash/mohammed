-- ==============================================================================
-- 20261121000004_rls_policies.sql
-- Phase 4: Roles, Permissions, Warehouse Scoping & Append-Only RLS Policies
-- ==============================================================================

-- 1. Helper function to get current user's organization_id
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Helper function to check if current user has permission code
CREATE OR REPLACE FUNCTION user_has_permission(p_permission_code VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON rp.role_id = ur.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = auth.uid()
          AND p.code = p_permission_code
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Helper function to check if current user can access a warehouse
CREATE OR REPLACE FUNCTION user_can_access_warehouse(p_warehouse_id UUID, p_mode VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_role_code VARCHAR;
BEGIN
    -- Super admins and branch managers have access to all org warehouses
    SELECT role_code INTO v_role_code
    FROM profiles
    WHERE id = auth.uid();

    IF v_role_code IN ('ADMIN', 'GENERAL_MANAGER') THEN
        RETURN true;
    END IF;

    IF p_mode = 'ISSUE' THEN
        RETURN EXISTS (
            SELECT 1 FROM user_warehouse_access
            WHERE user_id = auth.uid()
              AND warehouse_id = p_warehouse_id
              AND can_issue = true
        );
    ELSIF p_mode = 'RECEIVE' THEN
        RETURN EXISTS (
            SELECT 1 FROM user_warehouse_access
            WHERE user_id = auth.uid()
              AND warehouse_id = p_warehouse_id
              AND can_receive = true
        );
    ELSE
        RETURN EXISTS (
            SELECT 1 FROM user_warehouse_access
            WHERE user_id = auth.uid()
              AND warehouse_id = p_warehouse_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 4. ENABLE RLS ON CORE TABLES
-- ==============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_cost_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_return_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 5. MULTI-TENANT ISOLATION POLICIES (ORGANIZATION LEVEL)
-- ==============================================================================

-- Products: Read/Write within own organization
CREATE POLICY rls_products_org_select ON products
    FOR SELECT USING (organization_id = auth_org_id());

CREATE POLICY rls_products_org_insert ON products
    FOR INSERT WITH CHECK (organization_id = auth_org_id());

CREATE POLICY rls_products_org_update ON products
    FOR UPDATE USING (organization_id = auth_org_id());

-- Invoices: Read within own organization
CREATE POLICY rls_sales_invoices_org_select ON sales_invoices
    FOR SELECT USING (organization_id = auth_org_id());

CREATE POLICY rls_sales_invoices_org_insert ON sales_invoices
    FOR INSERT WITH CHECK (organization_id = auth_org_id());

-- Warehouse Access Scoped Movements: Keepers can only see their warehouse
CREATE POLICY rls_stock_movements_warehouse ON stock_movements
    FOR SELECT USING (
        organization_id = auth_org_id()
        AND user_can_access_warehouse(warehouse_id, 'VIEW')
    );

-- ==============================================================================
-- 6. STRICT IMMUTABILITY POLICIES (NO UPDATES/DELETES ON POSTED LEDGERS)
-- ==============================================================================

-- Stock Movements is strictly Append-Only (Never DELETE or UPDATE)
CREATE POLICY rls_stock_movements_no_delete ON stock_movements
    FOR DELETE USING (false);

CREATE POLICY rls_stock_movements_no_update ON stock_movements
    FOR UPDATE USING (false);

-- Cash Movements is strictly Append-Only
CREATE POLICY rls_cash_movements_no_delete ON cash_movements
    FOR DELETE USING (false);

CREATE POLICY rls_cash_movements_no_update ON cash_movements
    FOR UPDATE USING (false);

-- Audit Logs is strictly Append-Only
CREATE POLICY rls_audit_logs_no_delete ON audit_logs
    FOR DELETE USING (false);

CREATE POLICY rls_audit_logs_no_update ON audit_logs
    FOR UPDATE USING (false);

-- Approved Sales Invoices cannot be deleted
CREATE POLICY rls_sales_invoices_no_delete_approved ON sales_invoices
    FOR DELETE USING (status = 'DRAFT');
