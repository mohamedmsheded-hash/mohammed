-- Restore demo master data for the default tenant.
-- Uses fixed UUIDs so the seed can be rerun safely.

UPDATE organizations
SET name_ar = 'شركه شديد'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

INSERT INTO branches (
    id, organization_id, code, name_ar, address, phone, is_active
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'BR-MAIN',
    'الفرع الرئيسي والمخازن المركزية',
    'طريق الواحات - المنطقة الصناعية - 6 أكتوبر',
    '01012345678',
    true
) ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    name_ar = EXCLUDED.name_ar,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    is_active = true;

INSERT INTO warehouses (
    id, organization_id, branch_id, code, name_ar, is_scrap_yard, address, is_active
) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'WH-CEM', 'مخزن الأسمنت والجبس المغطى', false,
    'عنبر أ - الساحة المركزية', true
),
(
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'WH-STEEL', 'ساحة تشوين وتخزين حديد التسليح', false,
    'الساحة المفتوحة ب - ونش علوي', true
),
(
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'WH-SCRAP', 'مستودع التوالف والكسر والهالك المعزول', true,
    'عنبر التوالف ج', true
) ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    branch_id = EXCLUDED.branch_id,
    name_ar = EXCLUDED.name_ar,
    address = EXCLUDED.address,
    is_scrap_yard = EXCLUDED.is_scrap_yard,
    is_active = true;

INSERT INTO units (id, code, name_ar, decimal_places) VALUES
('d0000000-0000-0000-0000-000000000001', 'TON', 'طن', 3),
('d0000000-0000-0000-0000-000000000002', 'BAG', 'شيكارة', 0),
('d0000000-0000-0000-0000-000000000003', 'M3', 'متر مكعب', 3),
('d0000000-0000-0000-0000-000000000004', 'KG', 'كيلوجرام', 3),
('d0000000-0000-0000-0000-000000000005', 'PIECE', 'قطعة', 0),
('d0000000-0000-0000-0000-000000000006', 'THOUSAND_BRICKS', 'ألف طوبة', 2)
ON CONFLICT (code) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    decimal_places = EXCLUDED.decimal_places;

INSERT INTO product_categories (id, organization_id, code, name_ar) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'CAT-CEMENT', 'أسمنت ومواد رابطة'),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'CAT-STEEL', 'حديد تسليح'),
('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'CAT-AGGREGATE', 'رمل وزلط ومحاجر'),
('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'CAT-BRICKS', 'طوب بناء')
ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    name_ar = EXCLUDED.name_ar;

INSERT INTO brands (id, organization_id, name_ar) VALUES
('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'أسمنت السويدي'),
('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'حديد عز'),
('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'أسمنت سيناء')
ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    name_ar = EXCLUDED.name_ar;

INSERT INTO products (
    id, organization_id, category_id, brand_id, code, barcode, name_ar, base_unit_id,
    steel_diameter_mm, nominal_weight_per_m, bag_weight_kg, is_bulk,
    current_sale_price, replacement_cost, min_reorder_qty, is_active
) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'PRD-CEM-SWD', '622100011101',
    'أسمنت السويدي مقاوم 42.5 (شيكارة 50 كجم)',
    'd0000000-0000-0000-0000-000000000002',
    NULL, NULL, 50.00, false, 145.00, 138.00, 200.000, true
),
(
    '10000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000002',
    'PRD-STL-EZZ-10', '622200022201',
    'حديد تسليح عز 10 مم مشرشر أطوال',
    'd0000000-0000-0000-0000-000000000001',
    10.00, 0.6170, NULL, false, 42500.00, 41200.00, 15.000, true
),
(
    '10000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000002',
    'PRD-STL-EZZ-12', '622200022202',
    'حديد تسليح عز 12 مم مشرشر أطوال',
    'd0000000-0000-0000-0000-000000000001',
    12.00, 0.8880, NULL, false, 42300.00, 41000.00, 20.000, true
),
(
    '10000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000003',
    NULL,
    'PRD-AGG-SND-01', NULL,
    'رمل محاجر حرش مغسول (متر مكعب)',
    'd0000000-0000-0000-0000-000000000003',
    NULL, NULL, NULL, true, 180.00, 140.00, 50.000, true
) ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    category_id = EXCLUDED.category_id,
    brand_id = EXCLUDED.brand_id,
    barcode = EXCLUDED.barcode,
    name_ar = EXCLUDED.name_ar,
    base_unit_id = EXCLUDED.base_unit_id,
    steel_diameter_mm = EXCLUDED.steel_diameter_mm,
    nominal_weight_per_m = EXCLUDED.nominal_weight_per_m,
    bag_weight_kg = EXCLUDED.bag_weight_kg,
    is_bulk = EXCLUDED.is_bulk,
    current_sale_price = EXCLUDED.current_sale_price,
    replacement_cost = EXCLUDED.replacement_cost,
    min_reorder_qty = EXCLUDED.min_reorder_qty,
    is_active = true;

INSERT INTO product_unit_conversions (
    product_id, from_unit_id, to_unit_id, multiplier, version, is_active
) VALUES (
    '10000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    20.000000, 1, true
) ON CONFLICT DO NOTHING;

INSERT INTO cashboxes (
    id, organization_id, branch_id, name_ar, type, opening_balance, current_balance, is_active
) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'الخزينة النقدية الرئيسية', 'CASH', 50000.00, 50000.00, true
),
(
    '20000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'حساب البنك الأهلي المصري', 'BANK', 350000.00, 350000.00, true
) ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    branch_id = EXCLUDED.branch_id,
    name_ar = EXCLUDED.name_ar,
    type = EXCLUDED.type,
    is_active = true;

INSERT INTO customers (
    id, organization_id, code, name_ar, phone, credit_limit,
    opening_balance, current_balance, is_active
) VALUES
(
    '30000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'CUST-001', 'شركة المعمار الحديث للمقاولات (المهندس أحمد)',
    '01099887766', 150000.00, 0.00, 0.00, true
),
(
    '30000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'CUST-CASH', 'عميل نقدي عام (مبيعات حرة)',
    '01000000000', 0.00, 0.00, 0.00, true
) ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    name_ar = EXCLUDED.name_ar,
    phone = EXCLUDED.phone,
    credit_limit = EXCLUDED.credit_limit,
    is_active = true;

INSERT INTO suppliers (
    id, organization_id, code, name_ar, supplier_type, phone,
    current_balance, is_active
) VALUES
(
    '40000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'SUP-EZZ', 'شركة العز لصناعة حديد التسليح',
    'STEEL_MILL', '0233445566', 0.00, true
),
(
    '40000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'SUP-SWD', 'شركة السويدي للأسمنت وبطائن العزل',
    'CEMENT_FACTORY', '0222334455', 0.00, true
) ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    name_ar = EXCLUDED.name_ar,
    supplier_type = EXCLUDED.supplier_type,
    phone = EXCLUDED.phone,
    is_active = true;

INSERT INTO inventory_cost_layers (
    id, organization_id, warehouse_id, product_id,
    initial_qty, remaining_qty, purchase_unit_price,
    landed_cost_unit, total_unit_cost, is_exhausted
) VALUES (
    '50000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    1000.000, 1000.000, 125.0000, 5.0000, 130.0000, false
) ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    warehouse_id = EXCLUDED.warehouse_id,
    product_id = EXCLUDED.product_id,
    initial_qty = EXCLUDED.initial_qty,
    remaining_qty = EXCLUDED.remaining_qty,
    purchase_unit_price = EXCLUDED.purchase_unit_price,
    landed_cost_unit = EXCLUDED.landed_cost_unit,
    total_unit_cost = EXCLUDED.total_unit_cost,
    is_exhausted = false;
