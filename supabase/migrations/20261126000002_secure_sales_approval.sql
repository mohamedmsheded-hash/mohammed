-- Secure sales approval entry point.
-- The approval RPC itself remains atomic; this wrapper adds tenant and identity checks.

ALTER FUNCTION public.rpc_approve_sales_invoice(UUID, UUID)
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.rpc_approve_sales_invoice_secure(
    p_invoice_id UUID,
    p_approved_by UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invoice_org_id UUID;
    v_profile_org_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'يجب تسجيل الدخول أولًا';
    END IF;

    SELECT organization_id INTO v_profile_org_id
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_active = true;

    IF v_profile_org_id IS NULL THEN
        RAISE EXCEPTION 'حساب الموظف غير موجود أو غير نشط';
    END IF;

    IF p_approved_by <> auth.uid() THEN
        RAISE EXCEPTION 'المستخدم المعتمد يجب أن يطابق المستخدم المسجل دخوله';
    END IF;

    SELECT organization_id INTO v_invoice_org_id
    FROM public.sales_invoices
    WHERE id = p_invoice_id;

    IF v_invoice_org_id IS NULL THEN
        RAISE EXCEPTION 'الفاتورة غير موجودة';
    END IF;

    IF v_invoice_org_id <> v_profile_org_id THEN
        RAISE EXCEPTION 'لا يمكن اعتماد فاتورة لمؤسسة أخرى';
    END IF;

    RETURN public.rpc_approve_sales_invoice(p_invoice_id, p_approved_by);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_approve_sales_invoice_secure(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_approve_sales_invoice_secure(UUID, UUID) TO authenticated;
