# مصفوفة تتبع المتطلبات (Requirements Traceability Matrix - RTM)
## نظام إدارة مخازن وتجارة مواد البناء (ERP)

---

| رقم المتطلب | الوصف الوظيفي | الشاشة المرتبطة | جداول قاعدة البيانات | الخدمة / المعاملة الخادمية | سيناريو الاختبار المعتمد |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-CAT-01** | إدارة المنتجات وتصنيفاتها وخصائصها (حديد، أسمنت، رمل) | `page-products` | `products`, `product_categories`, `units` | `catalog.service.ts` | اختبار إضافة صنف مع مواصفات الأقطار والأوزان |
| **REQ-CAT-02** | معاملات تحويل الوحدات وإصداراتها التاريخية | `page-products` | `product_unit_conversions`, `units` | `units.service.ts` | اختبار تحويل 1 طن إلى 20 شيكارة مع منع تعديل الإصدار القديم |
| **REQ-CAT-03** | سجل تغير الأسعار وفصل السعر الحالي عن تكلفة الاستبدال | `page-products` | `product_price_history`, `products` | `pricing.service.ts` | اختبار تغيير سعر البيع وتأكيد عدم تأثر الفواتير السابقة |
| **REQ-INV-01** | دفتر حركات المخزون التراكمي (Stock Ledger) | `page-inventory` | `stock_movements`, `warehouses` | `inventory.service.ts` / RPC | استعلام رصيد المخزن ومطابقته التامة مع مجموع الحركات |
| **REQ-INV-02** | منع المخزون السالب والتحقق من الكميات المتاحة | `page-sales`, `page-inventory` | `stock_movements`, `warehouses` | `rpc_approve_sales_invoice` | محاولة صرف كمية أكبر من الرصيد والتحقق من رفض العملية |
| **REQ-INV-03** | تحويل البضاعة بين المخازن وتتبع البضاعة في الطريق | `page-inventory` | `stock_transfers`, `stock_transfer_lines` | `transfer.service.ts` | إرسال شحنة من مخزن A وتأكيد استلامها في مخزن B |
| **REQ-INV-04** | الجرد بنمط العمي (Blind Count) وإنشاء التسويات | `page-inventory` | `stock_counts`, `stock_adjustments` | `stock_count.service.ts` | تسجيل الجرد الفعلي ومقارنته بالدفتري واعتماد التسوية |
| **REQ-PUR-01** | دورة الشراء من أمر الشراء إلى إذن الاستلام الفعلي | `page-purchases` | `purchase_orders`, `goods_receipts` | `procurement.service.ts` | استلام شحنة حديد جزئية وتحديث المتبقي في أمر الشراء |
| **REQ-PUR-02** | توزيع مصاريف الشراء (نولون وتفريغ) وتوليد طبقات التكلفة | `page-purchases` | `goods_receipt_expenses`, `inventory_cost_layers` | `rpc_receive_goods_with_landed_costs` | فحص إضافة 4000 ج.م نولون على 20 طن وحساب تكلفة الطن الشاملة |
| **REQ-SAL-01** | دورة إنشاء مسودة فاتورة البيع والتحقق منها | `page-sales` | `sales_invoices`, `sales_invoice_lines` | `sales.service.ts` | إنشاء مسودة، فحص الحسابات، ومنع الاعتماد بخصم يتجاوز صلاحية المستخدم |
| **REQ-SAL-02** | اعتماد الفاتورة الذري (حجز/خصم مخزن + تخصيص FIFO + مديونية) | `page-sales` | `sales_invoices`, `stock_movements`, `cost_allocations` | `rpc_approve_sales_invoice` | اختبار المعاملة الذرية والتأكد من إرجاع Rollback عند أي فشل |
| **REQ-SAL-03** | ثبات أرباح الفاتورة القديمة عند ارتفاع سعر السوق الحالي | `page-sales`, `page-reports` | `sales_invoice_lines`, `cost_allocations` | `reports.service.ts` | اختبار: شراء بـ 80، بيع بـ 100، تحديث السوق لـ 120 -> الربح التاريخي يظل 20 |
| **REQ-FIN-01** | سندات القبض وتحصيل مديونيات العملاء وتخصيصها | `page-finance`, `page-customers` | `receipts`, `receipt_allocations`, `cash_movements` | `finance.service.ts` | تحصيل دفعة وتخفيض مديونية العميل وربطها بالفاتورة في الخزينة |
| **REQ-FIN-02** | سندات الصرف والمصروفات وسداد الموردين | `page-finance`, `page-expenses` | `payments`, `payment_allocations`, `cash_movements` | `finance.service.ts` | صرف مستحقات مورد وتخفيض رصيد الخزينة مع منع التكرار |
| **REQ-FIN-03** | إغلاق الوردية والمطابقة النقدية اليومية | `page-finance` | `cash_sessions`, `cash_movements` | `cash_session.service.ts` | مطابقة النقدية بالدرج مع الرصيد الدفتري وتسجيل الفروق |
| **REQ-RET-01** | المرتجعات المربوطة بالفاتورة الأصلية وعزل التوالف | `page-returns` | `sales_returns`, `reversal_documents` | `returns.service.ts` | إنشاء مرتجع بضاعة صالحة بالتكلفة التاريخية وتوجيه التالف لمخزن العزل |
| **REQ-DEL-01** | أوامر التوصيل والتسليم على دفعات بالمواقع | `page-delivery` | `delivery_orders`, `vehicles`, `drivers` | `delivery.service.ts` | تسليم 10 أطنان من فاتورة 50 طن ومنع خصم المخزون المزدوج |
| **REQ-XLS-01** | استيراد Excel خماسي المراحل مع كشف الأخطاء | `page-excel` | `import_jobs`, `import_job_rows` | `excel_import.service.ts` | رفع ملف أصناف غير مكتمل، تشغيل Dry Run، وتنزيل تقرير الأخطاء |
| **REQ-XLS-02** | تصدير Excel وPDF منسق ومحمي من Formula Injection | `page-excel`, `page-reports` | جميع الجداول ذات الصلة | `excel_export.service.ts` | تصدير كشف حساب عميل بصيغة XLSX والتأكد من تعقيم الصيغ |
| **REQ-AUD-01** | سجل التدقيق غير القابل للتعديل لجميع العمليات | `page-activity` | `audit_logs` | `audit.service.ts` / Triggers | فحص توثيق كل حركة تغيير أسعار، اعتماد، أو تسوية بالقيم القديمة والجديدة |
| **REQ-SEC-01** | تطبيق الصلاحيات وعزل الفروع والمخازن بـ RLS | جميع الشاشات | جميع الجداول التشغيلية | RLS Policies في PostgreSQL | محاولة مستخدم فرع A قراءة فواتير فرع B والتحقق من الحظر |
