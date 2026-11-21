-- ==============================================================================
-- supabase/seed.sql
-- Realistic Seed Data for Construction Materials Trading ERP
-- ==============================================================================

-- 1. Create Default Organization
INSERT INTO organizations (
    id, name_ar, tax_number, commercial_reg, base_currency, timezone, cost_method, allow_negative_stock
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'شركة الأهرام لتجارة مواد البناء والمقاولات',
    '100-245-890',
    '45982',
    'EGP',
    'Africa/Cairo',
    'FIFO',
    false
) ON CONFLICT DO NOTHING;

-- 2. Branches
INSERT INTO branches (
    id, organization_id, code, name_ar, address, phone
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'BR-MAIN',
    'الفرع الرئيسي والمخازن المركزية',
    'طريق الواحات - المنطقة الصناعية - 6 أكتوبر',
    '01012345678'
) ON CONFLICT DO NOTHING;

-- 3. Warehouses
INSERT INTO warehouses (
    id, organization_id, branch_id, code, name_ar, is_scrap_yard, address
) VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'WH-CEM',
    'مخزن الأسمنت والجبس المغطى',
    false,
    'عنبر أ - الساحة المركزية'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'WH-STEEL',
    'ساحة تشوين وتخزين حديد التسليح',
    false,
    'الساحة المفتوحة ب - ونش علوي'
),
(
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'WH-SCRAP',
    'مستودع التوالف والكسر والهالك المعزول',
    true,
    'عنبر التوالف ج'
) ON CONFLICT DO NOTHING;

-- 4. Units
INSERT INTO units (id, code, name_ar, decimal_places) VALUES
('u0000000-0000-0000-0000-000000000001', 'TON', 'طن', 3),
('u0000000-0000-0000-0000-000000000002', 'BAG', 'شيكارة', 0),
('u0000000-0000-0000-0000-000000000003', 'M3', 'متر مكعب', 3),
('u0000000-0000-0000-0000-000000000004', 'KG', 'كيلوجرام', 3),
('u0000000-0000-0000-0000-000000000005', 'PIECE', 'قطعة', 0),
('u0000000-0000-0000-0000-000000000006', 'THOUSAND_BRICKS', 'ألف طوبة', 2)
ON CONFLICT (code) DO NOTHING;

-- 5. Categories & Brands
INSERT INTO product_categories (id, organization_id, code, name_ar) VALUES
('cat00000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'CAT-CEMENT', 'أسمنت ومواد رابطة'),
('cat00000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'CAT-STEEL', 'حديد تسليح'),
('cat00000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'CAT-AGGREGATE', 'رمل وزلط ومحاجر'),
('cat00000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'CAT-BRICKS', 'طوب بناء')
ON CONFLICT DO NOTHING;

INSERT INTO brands (id, organization_id, name_ar) VALUES
('brd00000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'أسمنت السويدي'),
('brd00000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'حديد عز'),
('brd00000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'أسمنت سيناء')
ON CONFLICT DO NOTHING;

-- 6. Products
INSERT INTO products (
    id, organization_id, category_id, brand_id, code, barcode, name_ar, base_unit_id,
    steel_diameter_mm, nominal_weight_per_m, bag_weight_kg, is_bulk,
    current_sale_price, replacement_cost, min_reorder_qty
) VALUES
(
    'p0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'cat00000-0000-0000-0000-000000000001',
    'brd00000-0000-0000-0000-000000000001',
    'PRD-CEM-SWD',
    '622100011101',
    'أسمنت السويدي مقاوم 42.5 (شيكارة 50 كجم)',
    'u0000000-0000-0000-0000-000000000002', -- base unit: BAG
    NULL, NULL, 50.00, false,
    145.00, 138.00, 200.000
),
(
    'p0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'cat00000-0000-0000-0000-000000000002',
    'brd00000-0000-0000-0000-000000000002',
    'PRD-STL-EZZ-10',
    '622200022201',
    'حديد تسليح عز 10 مم مشرشر أطوال',
    'u0000000-0000-0000-0000-000000000001', -- base unit: TON
    10.00, 0.6170, NULL, false,
    42500.00, 41200.00, 15.000
),
(
    'p0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'brd00000-0000-0000-0000-000000000002',
    'PRD-STL-EZZ-12',
    '622200022202',
    'حديد تسليح عز 12 مم مشرشر أطوال',
    'u0000000-0000-0000-0000-000000000001', -- base unit: TON
    12.00, 0.8880, NULL, false,
    42300.00, 41000.00, 20.000
),
(
    'p0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000003',
    NULL,
    'PRD-AGG-SND-01',
    NULL,
    'رمل محاجر حرش مغسول (متر مكعب)',
    'u0000000-0000-0000-0000-000000000003', -- base unit: M3
    NULL, NULL, NULL, true,
    180.00, 140.00, 50.000
) ON CONFLICT DO NOTHING;

-- 7. Product Unit Conversions (1 Ton Cement = 20 Bags)
INSERT INTO product_unit_conversions (
    product_id, from_unit_id, to_unit_id, multiplier, version
) VALUES (
    'p0000000-0000-0000-0000-000000000001',
    'u0000000-0000-0000-0000-000000000001', -- TON
    'u0000000-0000-0000-0000-000000000002', -- BAG
    20.000000,
    1
) ON CONFLICT DO NOTHING;

-- 8. Cashboxes
INSERT INTO cashboxes (
    id, organization_id, branch_id, name_ar, type, opening_balance, current_balance
) VALUES
(
    'box00000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'الخزينة النقدية الرئيسية',
    'CASH',
    50000.00,
    50000.00
),
(
    'box00000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'حساب البنك الأهلي المصري',
    'BANK',
    350000.00,
    350000.00
) ON CONFLICT DO NOTHING;

-- 9. Customers & Suppliers
INSERT INTO customers (
    id, organization_id, code, name_ar, phone, credit_limit, opening_balance, current_balance
) VALUES
(
    'cust0000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'CUST-001',
    'شركة المعمار الحديث للمقاولات (المهندس أحمد)',
    '01099887766',
    150000.00,
    0.00,
    0.00
),
(
    'cust0000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'CUST-CASH',
    'عميل نقدي عام (مبيعات حرة)',
    '01000000000',
    0.00,
    0.00,
    0.00
) ON CONFLICT DO NOTHING;

INSERT INTO suppliers (
    id, organization_id, code, name_ar, supplier_type, phone, current_balance
) VALUES
(
    'sup00000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'SUP-EZZ',
    'شركة العز لصناعة حديد التسليح',
    'STEEL_MILL',
    '0233445566',
    0.00
),
(
    'sup00000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'SUP-SWD',
    'شركة السويدي للأسمنت وبطائن العزل',
    'CEMENT_FACTORY',
    '0222334455',
    0.00
) ON CONFLICT DO NOTHING;

-- 10. Initial Opening Stock & Cost Layers
-- 1000 Bags of Cement at 125 EGP (Landed cost 130 EGP)
INSERT INTO inventory_cost_layers (
    id, organization_id, warehouse_id, product_id,
    initial_qty, remaining_qty, purchase_unit_price, landed_cost_unit, total_unit_cost, is_exhausted
) VALUES (
    'layer000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001', -- WH-CEM
    'p0000000-0000-0000-0000-000000000001', -- Cement
    1000.000, 1000.000, 125.0000, 5.0000, 130.0000, false
) ON CONFLICT DO NOTHING;

INSERT INTO stock_movements (
    organization_id, warehouse_id, product_id, movement_type, quantity, unit_cost_allocated,
    source_doc_type, source_doc_id, created_by
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'p0000000-0000-0000-0000-000000000001',
    'OPENING_BALANCE',
    1000.000,
    130.0000,
    'SYSTEM_SEED',
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000' -- system user
) ON CONFLICT DO NOTHING;
