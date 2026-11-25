-- Complete the default tenant and automatically bind Auth users to an ERP profile.

INSERT INTO organizations (
    id, name_ar, tax_number, commercial_reg, base_currency, timezone,
    cost_method, allow_negative_stock, settings
)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'شركة الأهرام لتجارة مواد البناء والمقاولات',
    '100-245-890',
    '45982',
    'EGP',
    'Africa/Cairo',
    'FIFO',
    false,
    '{}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    tax_number = EXCLUDED.tax_number,
    commercial_reg = EXCLUDED.commercial_reg;

INSERT INTO branches (
    id, organization_id, code, name_ar, address, phone, is_active
)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'BR-MAIN',
    'الفرع الرئيسي والمخازن المركزية',
    'طريق الواحات - المنطقة الصناعية - 6 أكتوبر',
    '01012345678',
    true
)
ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    name_ar = EXCLUDED.name_ar,
    is_active = true;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_organization_id UUID;
    v_branch_id UUID;
    v_full_name TEXT;
    v_role_code TEXT;
BEGIN
    v_organization_id := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'organization_id', '')::UUID,
        'a0000000-0000-0000-0000-000000000001'::UUID
    );
    v_branch_id := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'branch_id', '')::UUID,
        'b0000000-0000-0000-0000-000000000001'::UUID
    );
    v_full_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1));
    v_role_code := COALESCE(NULLIF(UPPER(NEW.raw_user_meta_data->>'role_code'), ''), 'STAFF');

    INSERT INTO public.profiles (
        id, organization_id, branch_id, full_name, role_code, phone,
        max_discount_pct, is_active
    )
    VALUES (
        NEW.id,
        v_organization_id,
        v_branch_id,
        v_full_name,
        v_role_code,
        NULL,
        0,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        branch_id = EXCLUDED.branch_id,
        full_name = EXCLUDED.full_name,
        is_active = true;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warehouse_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rls_customers_org ON customers;
CREATE POLICY rls_customers_org ON customers
FOR ALL
USING (organization_id = auth_org_id())
WITH CHECK (organization_id = auth_org_id());

DROP POLICY IF EXISTS rls_suppliers_org ON suppliers;
CREATE POLICY rls_suppliers_org ON suppliers
FOR ALL
USING (organization_id = auth_org_id())
WITH CHECK (organization_id = auth_org_id());

DROP POLICY IF EXISTS rls_categories_org ON product_categories;
CREATE POLICY rls_categories_org ON product_categories
FOR ALL
USING (organization_id = auth_org_id())
WITH CHECK (organization_id = auth_org_id());

DROP POLICY IF EXISTS rls_profiles_org ON profiles;
CREATE POLICY rls_profiles_org ON profiles
FOR SELECT
USING (organization_id = auth_org_id());

DROP POLICY IF EXISTS rls_branches_org ON branches;
CREATE POLICY rls_branches_org ON branches
FOR SELECT
USING (organization_id = auth_org_id());

DROP POLICY IF EXISTS rls_organizations_self ON organizations;
CREATE POLICY rls_organizations_self ON organizations
FOR SELECT
USING (id = auth_org_id());
