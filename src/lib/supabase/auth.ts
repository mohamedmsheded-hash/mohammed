import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("يجب تسجيل الدخول أولًا");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, branch_id, role_code, is_active")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();

  if (profileError || !profile) {
    throw new Error("حساب الموظف غير موجود أو غير نشط");
  }

  return { supabase, user, profile };
}
