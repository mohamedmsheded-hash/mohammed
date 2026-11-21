# قاموس البيانات ومواصفات الجداول (Data Dictionary)
## نظام إدارة مخازن وتجارة مواد البناء (ERP)

---

## 1. المعايير العامة للأنواع والقيود (Data Conventions)

1. **المعرفات الأساسية (Primary Keys):** جميع الجداول تستخدم `UUID` بتهيئة تلقائية عبر دالة `gen_random_uuid()` لتفادي التكرار وتمكين المزامنة الآمنة.
2. **المبالغ المالية (Monetary Amounts):** يتم استخدام `NUMERIC(15, 2)` لجميع القيم النقدية، و`NUMERIC(15, 4)` لتكاليف وأسعار الوحدات الدقيقة لمنع تراكم أخطاء التقريب. يمنع استخدام `float` أو `double precision`.
3. **الكميات والأوزان (Quantities & Weights):** يتم استخدام `NUMERIC(15, 3)` لدعم دقة تصل إلى جرام واحد في الأطنان (0.001 طن = 1 كجم) أو كسور المتر المكعب في الرمل والزلط.
4. **التواريخ والأوقات (Timestamps):** تستخدم جميع الجداول `TIMESTAMPTZ` لتخزين التوقيت مع المنطقة الزمنية (`Africa/Cairo` افتراضياً).
5. **سلامة المراجع (Referential Integrity):** جميع المفاتيح الأجنبية للمستندات والعمليات تستخدم `ON DELETE RESTRICT` لمنع حذف أي سجل يعتمد عليه مستند آخر.

---

## 2. تفاصيل الجداول والأعمدة والقيود

### 2.1 منظومة المنشأة والوصول (Tenancy & IAM)

#### جدول `organizations`
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT gen_random_uuid() | المعرف الفريد للمنشأة |
| `name_ar` | VARCHAR(150) | NOT NULL | اسم الشركة أو المخزن بالعربية |
| `tax_number` | VARCHAR(50) | NULLABLE | رقم التسجيل الضريبي |
| `commercial_reg` | VARCHAR(50) | NULLABLE | رقم السجل التجاري |
| `base_currency` | VARCHAR(3) | DEFAULT 'EGP', NOT NULL | كود العملة الأساسية |
| `cost_method` | VARCHAR(20) | DEFAULT 'FIFO', CHECK in ('FIFO','MOVING_AVG') | سياسة تكلفة المخزون المعتمدة |
| `allow_negative_stock` | BOOLEAN | DEFAULT false, NOT NULL | منع المخزون السالب افتراضياً |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | تاريخ إنشاء السجل |

#### جدول `warehouses`
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT gen_random_uuid() | معرف المخزن الفريد |
| `organization_id` | UUID | FK -> organizations(id), NOT NULL | المنشأة المالكة |
| `branch_id` | UUID | FK -> branches(id), NULLABLE | الفرع التابع له المخزن |
| `name_ar` | VARCHAR(100) | NOT NULL | اسم المخزن (رئيسي، ساحة حديد، محطة رمل) |
| `code` | VARCHAR(20) | NOT NULL, UNIQUE(org, code) | كود المخزن (WH-01) |
| `is_scrap_yard` | BOOLEAN | DEFAULT false, NOT NULL | مخصص للبضاعة التالفة/المرتجعات المعيبة |
| `is_active` | BOOLEAN | DEFAULT true, NOT NULL | حالة تشغيل المخزن |

#### جدول `profiles`
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, FK -> auth.users(id) | مطابق لمعرف المستخدم في Supabase Auth |
| `organization_id` | UUID | FK -> organizations(id), NOT NULL | منشأة المستخدم |
| `full_name` | VARCHAR(100) | NOT NULL | الاسم الثلاثي للموظف |
| `role_code` | VARCHAR(30) | NOT NULL | كود الدور (OWNER, CASHIER, STOREKEEPER...) |
| `phone` | VARCHAR(25) | NULLABLE | رقم الهاتف للتواصل |
| `max_discount_pct` | NUMERIC(5,2) | DEFAULT 0.00, CHECK (0 to 100) | أقصى نسبة خصم مصرح للموظف بمنحها |
| `is_active` | BOOLEAN | DEFAULT true, NOT NULL | تفعيل/تعطيل الحساب |

---

### 2.2 دليل المنتجات والوحدات وسجل الأسعار (Catalog & Pricing)

#### جدول `units`
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | معرف الوحدة |
| `code` | VARCHAR(20) | UNIQUE, NOT NULL | كود الوحدة (TON, BAG, M3, KG, PIECE) |
| `name_ar` | VARCHAR(50) | NOT NULL | الاسم العربي (طن، شيكارة، متر مكعب، كجم) |
| `decimal_places` | SMALLINT | DEFAULT 0, CHECK (0 to 4) | عدد الخانات العشرية المسموح بها |

#### جدول `products`
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | معرف الصنف الفريد |
| `organization_id` | UUID | FK -> organizations(id), NOT NULL | المنشأة |
| `category_id` | UUID | FK -> product_categories(id), NOT NULL | التصنيف (أسمنت، حديد، رمل...) |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE(org, code) | كود الصنف (PRD-CEM-01) |
| `name_ar` | VARCHAR(200) | NOT NULL | اسم الصنف (أسمنت السويدي مقاوم 42.5) |
| `base_unit_id` | UUID | FK -> units(id), NOT NULL | وحدة الأساس لحساب الرصيد المخزني |
| `steel_diameter_mm` | NUMERIC(5,2) | NULLABLE | قطر الحديد بالملليمتر (10, 12, 16...) |
| `nominal_weight_per_m`| NUMERIC(8,4)| NULLABLE | الوزن الهندسي النظري للمتر |
| `bag_weight_kg` | NUMERIC(6,2) | NULLABLE | وزن الشيكارة بالكيلو (50.00) |
| `current_sale_price` | NUMERIC(15,2)| DEFAULT 0.00, NOT NULL | سعر البيع الإرشادي الحالي |
| `replacement_cost` | NUMERIC(15,2)| DEFAULT 0.00, NOT NULL | تكلفة الاستبدال الحالية المقدرة (مؤشر إداري) |
| `min_reorder_qty` | NUMERIC(15,3)| DEFAULT 0.000, NOT NULL | حد إعادة الطلب للتنبيه |
| `is_active` | BOOLEAN | DEFAULT true, NOT NULL | نشط أم معطل |

#### جدول `product_unit_conversions`
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | معرف معامل التحويل |
| `product_id` | UUID | FK -> products(id), NOT NULL | الصنف المرتبط |
| `from_unit_id` | UUID | FK -> units(id), NOT NULL | الوحدة المدخلة (مثال: طن) |
| `to_unit_id` | UUID | FK -> units(id), NOT NULL | الوحدة الناتجة (مثال: شيكارة) |
| `multiplier` | NUMERIC(18,6)| NOT NULL, CHECK (multiplier > 0) | معامل التحويل (1 طن = 20 شيكارة) |
| `version` | INTEGER | DEFAULT 1, NOT NULL | رقم الإصدار لضمان عدم تعديل الماضي |
| `is_active` | BOOLEAN | DEFAULT true, NOT NULL | سريان المعامل الحالي |

#### جدول `product_price_history`
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | معرف حركة تغيير السعر |
| `product_id` | UUID | FK -> products(id), NOT NULL | الصنف |
| `price_type` | VARCHAR(30) | NOT NULL | نوع السعر (SALE_PRICE, REPLACEMENT_COST) |
| `old_price` | NUMERIC(15,2)| NOT NULL | السعر السابق |
| `new_price` | NUMERIC(15,2)| NOT NULL | السعر الجديد |
| `reason` | TEXT | NULLABLE | سبب التغيير (زيادة مصنع، تغير سوق) |
| `changed_by` | UUID | FK -> profiles(id), NOT NULL | المستخدم المنفذ |
| `effective_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | وقت وتاريخ السريان |

---

### 2.3 دفتر حركات المخزون وطبقات التكلفة (Stock & Costing Engine)

#### جدول `stock_movements` (Immutable Ledger)
* **القاعدة:** جدول متراكم لا يقبل الحذف أو التعديل، ويوثق كل حركة مخزنية داخلية أو خارجية.
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | معرف الحركة الفريد |
| `organization_id` | UUID | FK -> organizations(id), NOT NULL | المنشأة |
| `warehouse_id` | UUID | FK -> warehouses(id), NOT NULL | المخزن المتأثر بالحركة |
| `product_id` | UUID | FK -> products(id), NOT NULL | الصنف المحرك |
| `movement_type` | VARCHAR(30) | NOT NULL | نوع الحركة (RECEIPT, ISSUE, TRANSFER, ADJUSTMENT) |
| `quantity` | NUMERIC(15,3)| NOT NULL, CHECK (quantity != 0) | الكمية بوحدة الأساس (+ للوارد، - للمنصرف) |
| `unit_cost_snapshot`| NUMERIC(15,4)| NOT NULL | تكلفة الوحدة التاريخية المخصصة للحركة |
| `source_doc_type` | VARCHAR(50) | NOT NULL | نوع المستند (SALES_INVOICE, GOODS_RECEIPT...) |
| `source_doc_id` | UUID | NOT NULL | معرف المستند المنشئ للحركة |
| `movement_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | وقت وتاريخ الحركة |
| `created_by` | UUID | FK -> profiles(id), NOT NULL | المستخدم المسؤول عن الحركة |

#### جدول `inventory_cost_layers` (FIFO Layers)
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | معرف طبقة التكلفة |
| `organization_id` | UUID | FK -> organizations(id), NOT NULL | المنشأة |
| `warehouse_id` | UUID | FK -> warehouses(id), NOT NULL | المخزن |
| `product_id` | UUID | FK -> products(id), NOT NULL | الصنف |
| `goods_receipt_line_id`| UUID | FK -> goods_receipt_lines(id), NULLABLE| سطر إذن الاستلام المولد للطبقة |
| `initial_qty` | NUMERIC(15,3)| NOT NULL, CHECK (initial_qty > 0) | الكمية المشتراة الأصلية بوحدة الأساس |
| `remaining_qty` | NUMERIC(15,3)| NOT NULL, CHECK (remaining_qty >= 0) | الكمية المتبقية المتاحة للاستهلاك |
| `purchase_unit_price` | NUMERIC(15,4)| NOT NULL | سعر شراء الوحدة الصافي من المورد |
| `landed_cost_unit` | NUMERIC(15,4)| DEFAULT 0.0000, NOT NULL | نصيب الوحدة من مصاريف النقل والتفريغ |
| `total_unit_cost` | NUMERIC(15,4)| GENERATED ALWAYS AS (purchase_unit_price + landed_cost_unit) STORED | إجمالي التكلفة الشاملة للوحدة |
| `is_exhausted` | BOOLEAN | DEFAULT false, NOT NULL | تم استنزاف الطبقة بالكامل |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | وقت وتاريخ إنشاء الطبقة |

#### جدول `cost_allocations`
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | معرف تخصيص التكلفة |
| `sales_invoice_line_id`| UUID | FK -> sales_invoice_lines(id), NOT NULL| سطر فاتورة البيع |
| `cost_layer_id` | UUID | FK -> inventory_cost_layers(id), NOT NULL| الطبقة المستهلكة |
| `quantity_consumed` | NUMERIC(15,3)| NOT NULL, CHECK (quantity_consumed > 0) | الكمية المستهلكة من هذه الطبقة |
| `unit_cost_applied` | NUMERIC(15,4)| NOT NULL | التكلفة التاريخية المطبقة للوحدة |
| `total_cost` | NUMERIC(15,2)| NOT NULL | إجمالي التكلفة = الكمية × التكلفة المطبقة |

---

### 2.4 المبيعات والعملاء (Sales & Customers)

#### جدول `customers`
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | معرف العميل الفريد |
| `organization_id` | UUID | FK -> organizations(id), NOT NULL | المنشأة |
| `code` | VARCHAR(30) | NOT NULL, UNIQUE(org, code) | كود العميل (CUST-001) |
| `name_ar` | VARCHAR(150) | NOT NULL | اسم العميل أو المقاول أو الشركة |
| `phone` | VARCHAR(25) | NOT NULL | رقم الهاتف الأساسي |
| `address` | TEXT | NULLABLE | العنوان / مواقع التوريد المعتادة |
| `credit_limit` | NUMERIC(15,2)| DEFAULT 0.00, NOT NULL | سقف الائتمان المسموح به للمديونية |
| `payment_terms_days` | INTEGER | DEFAULT 0, NOT NULL | فترة السماح بالسداد بالأيام |
| `opening_balance` | NUMERIC(15,2)| DEFAULT 0.00, NOT NULL | الرصيد الافتتاحي (+ مدين، - دائن) |
| `is_active` | BOOLEAN | DEFAULT true, NOT NULL | نشط أم متوقف |

#### جدول `sales_invoices`
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | معرف الفاتورة |
| `organization_id` | UUID | FK -> organizations(id), NOT NULL | المنشأة |
| `branch_id` | UUID | FK -> branches(id), NOT NULL | الفرع المصدر للفاتورة |
| `warehouse_id` | UUID | FK -> warehouses(id), NOT NULL | المخزن المصروف منه البضاعة |
| `invoice_number` | VARCHAR(50) | NOT NULL, UNIQUE(org, number) | رقم الفاتورة التسلسلي (INV-2026-0001) |
| `customer_id` | UUID | FK -> customers(id), NULLABLE | العميل (NULL = عميل نقدي عام) |
| `invoice_date` | DATE | NOT NULL | تاريخ إصدار الفاتورة |
| `status` | VARCHAR(25) | NOT NULL, CHECK in ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CANCELLED', 'REVERSED') | حالة الفاتورة في دورة العمل |
| `payment_type` | VARCHAR(20) | NOT NULL, CHECK in ('CASH', 'CREDIT', 'SPLIT') | طريقة الدفع المتفق عليها |
| `subtotal` | NUMERIC(15,2)| NOT NULL, CHECK (subtotal >= 0) | مجموع سطور الفاتورة قبل الخصم |
| `discount_amount` | NUMERIC(15,2)| DEFAULT 0.00, CHECK (discount_amount >= 0) | إجمالي الخصم الممنوح على الفاتورة |
| `tax_amount` | NUMERIC(15,2)| DEFAULT 0.00, CHECK (tax_amount >= 0) | إجمالي ضريبة القيمة المضافة |
| `freight_charge` | NUMERIC(15,2)| DEFAULT 0.00, CHECK (freight_charge >= 0) | مصاريف النقل المحملة على العميل |
| `total_amount` | NUMERIC(15,2)| NOT NULL | إجمالي الفاتورة الصافي النهائي المستحق |
| `paid_amount` | NUMERIC(15,2)| DEFAULT 0.00, NOT NULL | المبلغ المسدد فعلياً حتى الآن |
| `remaining_balance` | NUMERIC(15,2)| GENERATED ALWAYS AS (total_amount - paid_amount) STORED | المتبقي على العميل من هذه الفاتورة |
| `approved_by` | UUID | FK -> profiles(id), NULLABLE | الموظف الذي اعتمد الفاتورة نهائياً |
| `approved_at` | TIMESTAMPTZ | NULLABLE | وقت الاعتماد الرسمي للفاتورة |
| `created_by` | UUID | FK -> profiles(id), NOT NULL | منشئ مسودة الفاتورة |

#### جدول `sales_invoice_lines`
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | معرف سطر الفاتورة |
| `sales_invoice_id` | UUID | FK -> sales_invoices(id), NOT NULL | الفاتورة التابع لها |
| `product_id` | UUID | FK -> products(id), NOT NULL | الصنف المباع |
| `product_name_snap` | VARCHAR(200) | NOT NULL | اسم الصنف وقت البيع (لحماية الأرشيف) |
| `entered_quantity` | NUMERIC(15,3)| NOT NULL, CHECK (entered_quantity > 0) | الكمية المدخلة بالوحدة المختارة |
| `entered_unit_id` | UUID | FK -> units(id), NOT NULL | الوحدة التي بيع بها (طن، شيكارة...) |
| `conversion_factor`| NUMERIC(18,6)| NOT NULL | معامل التحويل إلى وحدة الأساس وقت البيع |
| `base_quantity` | NUMERIC(15,3)| NOT NULL | الكمية المعادلة بوحدة الأساس المخزنية |
| `unit_price_snap` | NUMERIC(15,2)| NOT NULL, CHECK (unit_price_snap >= 0) | سعر بيع الوحدة المعتمد لحظة الفاتورة |
| `line_discount` | NUMERIC(15,2)| DEFAULT 0.00, NOT NULL | خصم السطر |
| `total_line_amount`| NUMERIC(15,2)| NOT NULL | إجمالي السطر = (الكمية × السعر) - الخصم |
| `historical_cogs` | NUMERIC(15,2)| NOT NULL | تكلفة البضاعة المباعة التاريخية المخصصة للبند |
| `historical_profit`| NUMERIC(15,2)| GENERATED ALWAYS AS (total_line_amount - historical_cogs) STORED | الربح المحقق التاريخي الثابت للبند |

---

### 2.5 الخزينة والحركات النقدية (Cashbox & Finance)

#### جدول `cashboxes`
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | معرف الخزينة |
| `organization_id` | UUID | FK -> organizations(id), NOT NULL | المنشأة |
| `branch_id` | UUID | FK -> branches(id), NOT NULL | الفرع |
| `name_ar` | VARCHAR(100) | NOT NULL | اسم الخزينة (الرئيسية، درج كاشير 1، بنك مصر) |
| `type` | VARCHAR(20) | NOT NULL, CHECK in ('CASH', 'BANK') | نقدية أم حساب بنكي |
| `opening_balance` | NUMERIC(15,2)| DEFAULT 0.00, NOT NULL | الرصيد الافتتاحي للخزينة |
| `is_active` | BOOLEAN | DEFAULT true, NOT NULL | حالة التشغيل |

#### جدول `cash_movements` (Immutable Financial Ledger)
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | معرف الحركة النقدية |
| `cashbox_id` | UUID | FK -> cashboxes(id), NOT NULL | الخزينة المعنية |
| `movement_type` | VARCHAR(30) | NOT NULL | نوع الحركة (RECEIPT, PAYMENT, TRANSFER_IN, TRANSFER_OUT) |
| `amount` | NUMERIC(15,2)| NOT NULL, CHECK (amount > 0) | قيمة المبلغ المقبوض أو المصروف |
| `source_doc_type` | VARCHAR(50) | NOT NULL | نوع السند (RECEIPT_VOUCHER, EXPENSE_VOUCHER) |
| `source_doc_id` | UUID | NOT NULL | معرف السند المرتبط |
| `description` | TEXT | NULLABLE | شرح الحركة والملاحظات |
| `created_by` | UUID | FK -> profiles(id), NOT NULL | الموظف الذي أجرى الحركة |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | وقت وتاريخ الحركة |

---

### 2.6 سجل التدقيق ومركز Excel والأرشيف (Audit & System)

#### جدول `audit_logs` (Append-Only)
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | معرف سجل التدقيق |
| `organization_id` | UUID | NOT NULL | المنشأة |
| `user_id` | UUID | NULLABLE | معرف المستخدم المنفذ |
| `action` | VARCHAR(50) | NOT NULL | نوع الإجراء (CREATE, APPROVE, REVERSE, EXPORT, LOGIN) |
| `entity_name` | VARCHAR(50) | NOT NULL | اسم الجدول أو الكيان (sales_invoices, products...) |
| `entity_id` | UUID | NULLABLE | معرف الكيان المعني |
| `old_values` | JSONB | NULLABLE | الحالة السابقة للقيم قبل التعديل |
| `new_values` | JSONB | NULLABLE | الحالة الجديدة للقيم بعد التعديل |
| `ip_address` | VARCHAR(45) | NULLABLE | عنوان IP لطلب العميل |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | وقت وتاريخ التدقيق |

#### جدول `import_jobs`
| الحقل | النوع | القيود | الوصف الدلالي |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | معرف مهمة الاستيراد |
| `organization_id` | UUID | NOT NULL | المنشأة |
| `file_name` | VARCHAR(255) | NOT NULL | اسم ملف الـ Excel المرفوع |
| `target_entity` | VARCHAR(50) | NOT NULL | الكيان المستهدف (PRODUCTS, CUSTOMERS, STOCK) |
| `total_rows` | INTEGER | NOT NULL | إجمالي عدد الصفوف المقروءة |
| `valid_rows` | INTEGER | DEFAULT 0, NOT NULL | عدد الصفوف السليمة المطابقة للتحقق |
| `error_rows` | INTEGER | DEFAULT 0, NOT NULL | عدد الصفوف التي تحوي أخطاء |
| `status` | VARCHAR(25) | NOT NULL, CHECK in ('PENDING', 'VALIDATED', 'COMMITTED', 'FAILED') | حالة المهمة |
| `mapping_config` | JSONB | NOT NULL | إعدادات ربط الأعمدة المحفوظة |
| `error_summary` | JSONB | NULLABLE | تقرير الأخطاء التفصيلي بالصف والعمود |
| `created_by` | UUID | FK -> profiles(id), NOT NULL | المستخدم صاحب المهمة |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | وقت وتاريخ رفع الملف |

---

## 3. الفهارس الموصى بها للأداء (Performance Indexes)

1. `CREATE INDEX idx_stock_movements_query ON stock_movements (warehouse_id, product_id, movement_at);`
   * لتسريع احتساب رصيد المخزن وكشف حركة الصنف التاريخي.
2. `CREATE INDEX idx_cost_layers_fifo ON inventory_cost_layers (warehouse_id, product_id, created_at) WHERE is_exhausted = false;`
   * لتسريع استدعاء أقدم الطبقات المفتوحة لحظة اعتماد الفاتورة.
3. `CREATE INDEX idx_invoices_search ON sales_invoices (organization_id, invoice_date, customer_id, status);`
   * لتسريع استعراض فواتير اليوم والتقارير المالية.
4. `CREATE INDEX idx_cash_movements_box ON cash_movements (cashbox_id, created_at);`
   * لتسريع استعلام رصيد الخزينة ومطابقة الوردية.
5. `CREATE INDEX idx_audit_entity ON audit_logs (organization_id, entity_name, entity_id);`
   * لتسريع استعراض Timeline العمليات لأي مستند أو صنف.
