# Goal: Complete Supabase-backed ERP

## User Request

"أنا عايز كل الميزات الموجوده حاليا تكون موجوده علي سوبابيز وتكون شغاله فعليا مش مجرد شكل"

## Refined Goal

تحويل جميع ميزات ERP المعروضة حاليًا إلى نظام حقيقي يعمل فوق Supabase: المصادقة، عزل المؤسسات والمخازن، جلب/حفظ بيانات العملاء والموردين والمنتجات والمخزون والمشتريات والمبيعات والخزينة والمرتجعات والتوصيل والتقارير والأرشيف والمصروفات والمستخدمين وExcel. يجب أن تكون العمليات المحاسبية والمخزنية ذرة، مرتبطة بالهوية الحقيقية، ومحمية بـRLS.

## Acceptance Criteria

- [ ] لا تبقى البيانات التشغيلية الأساسية على صفحات المنتج/العمليات بصيغة mock state.
- [ ] تسجيل دخول Supabase Auth حقيقي وحماية المسارات غير المصادق عليها.
- [ ] جميع mutations تستخدم جلسة المستخدم أو RPC ذريًا، ولا تستخدم UUIDs ثابتة لصاحب العملية.
- [ ] كل صفحة رئيسية تقرأ وتكتب الجداول/دوال Supabase ذات الصلة.
- [ ] التقارير مبنية من الحركات والفواتير والسندات الفعلية، وليس arrays ثابتة.
- [ ] تشغيل اختبارات unit/integration وpnpm build بنجاح.
- [ ] migrations مطبقة على الإنتاج بعد التحقق، والنشر على Vercel ناجح.

## Scope Boundaries

**In scope:**
- Authentication and authorization.
- Supabase schema, migrations, RLS, RPCs, and storage.
- Real CRUD for ERP entities and operational workflows.
- Real accounting, inventory, reports, audit, and Excel import/export.
- Supabase production deployment and Vercel production deployment.

**Out of scope:**
- Replacing Next.js UI framework or redesigning it from scratch.
- Mobile native app or external integrations not currently represented in the codebase.
- Hard deletion of existing production data.

## Applicable Project Conventions

**Quality gate command:**
- `pnpm test && pnpm build`

**Commit convention:**
- Conventional commits with subagent role markers.
- Assisted-by trailer required for builder commits.

**Guidelines:**
- No project AGENTS.md or CONSTITUTION.md is currently present.
- Keep changes focused; do not delete existing production records.

## Initial State

- 18 unit tests passing.
- Next.js build previously passed.
- 24 routes compile after auth middleware was added.
- Four core Supabase migrations applied; one national_id migration is pending approval.
