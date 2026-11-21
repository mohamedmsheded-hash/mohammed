-- ==============================================================================
-- 20261121000001_initial_core_schema.sql
-- ERP System for Construction Materials Trading (نظام إدارة مخازن وتجارة مواد البناء)
-- Based on: docs/ERD.md & docs/DATA_DICTIONARY.md
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAIN TYPES
CREATE TYPE cost_method_enum AS ENUM ('FIFO', 'MOVING_AVG');
CREATE TYPE movement_type_enum AS ENUM (
    'OPENING_BALANCE',
    'PURCHASE_RECEIPT',
    'SALES_ISSUE',
    'SALES_RETURN',
    'SUPPLIER_RETURN',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'ADJUSTMENT_ADD',
    'ADJUSTMENT_SUB',
    'SCRAP_ISSUE'
);
CREATE TYPE invoice_status_enum AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'COMPLETED',
    'CANCELLED',
    'REVERSED'
);
CREATE TYPE payment_type_enum AS ENUM ('CASH', 'CREDIT', 'SPLIT');
CREATE TYPE delivery_status_enum AS ENUM (
    'PREPARING',
    'DISPATCHED',
    'DELIVERED',
    'RETURNED_PARTIAL',
    'CANCELLED'
);
CREATE TYPE cash_movement_type_enum AS ENUM (
    'RECEIPT',
    'PAYMENT',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'ADJUSTMENT'
);

-- ==============================================================================
-- 3. TENANCY, BRANCHES & IAM
-- ==============================================================================

-- Organizations (المنشأة/الشركة)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar VARCHAR(150) NOT NULL,
    tax_number VARCHAR(50),
    commercial_reg VARCHAR(50),
    base_currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Africa/Cairo',
    cost_method cost_method_enum NOT NULL DEFAULT 'FIFO',
    allow_negative_stock BOOLEAN NOT NULL DEFAULT false,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Branches (الفروع)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    code VARCHAR(20) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(25),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_branch_code UNIQUE (organization_id, code)
);

-- Warehouses (المخازن ومستودعات التخزين)
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE RESTRICT,
    code VARCHAR(20) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    address TEXT,
    is_scrap_yard BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_warehouse_code UNIQUE (organization_id, code)
);

-- Profiles (المستخدمون مرتبطة بـ auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE RESTRICT,
    full_name VARCHAR(100) NOT NULL,
    role_code VARCHAR(30) NOT NULL DEFAULT 'STAFF',
    phone VARCHAR(25),
    max_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (max_discount_pct >= 0 AND max_discount_pct <= 100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles (الأدوار الوظيفية)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_role_code UNIQUE (organization_id, code)
);

-- Permissions (الصلاحيات الدقيقة)
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    name_ar VARCHAR(150) NOT NULL,
    description TEXT
);

-- Role Permissions (ربط الأدوار بالصلاحيات)
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- User Roles
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- User Warehouse Access (تقييد المستخدمين بمخازن محددة)
CREATE TABLE user_warehouse_access (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    can_issue BOOLEAN NOT NULL DEFAULT true,
    can_receive BOOLEAN NOT NULL DEFAULT true,
    can_adjust BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (user_id, warehouse_id)
);

-- ==============================================================================
-- 4. UNITS, CATALOG & PRICING
-- ==============================================================================

-- Units (وحدات القياس)
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name_ar VARCHAR(50) NOT NULL,
    decimal_places SMALLINT NOT NULL DEFAULT 0 CHECK (decimal_places >= 0 AND decimal_places <= 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories (تصنيفات الأصناف)
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    code VARCHAR(30) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES product_categories(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_category_code UNIQUE (organization_id, code)
);

-- Brands (الماركات والشركات المصنعة)
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name_ar VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products (الأصناف والمنتجات)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
    brand_id UUID REFERENCES brands(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    barcode VARCHAR(100),
    name_ar VARCHAR(200) NOT NULL,
    base_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    
    -- Construction Material Specific Attributes
    steel_diameter_mm NUMERIC(5,2),
    nominal_weight_per_m NUMERIC(8,4),
    bag_weight_kg NUMERIC(6,2),
    is_bulk BOOLEAN NOT NULL DEFAULT false,
    
    current_sale_price NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (current_sale_price >= 0),
    replacement_cost NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (replacement_cost >= 0),
    min_reorder_qty NUMERIC(15,3) NOT NULL DEFAULT 0.000 CHECK (min_reorder_qty >= 0),
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_code UNIQUE (organization_id, code)
);

-- Product Unit Conversions (معاملات التحويل المتخصصة لكل صنف)
CREATE TABLE product_unit_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    from_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    to_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    multiplier NUMERIC(18,6) NOT NULL CHECK (multiplier > 0),
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_conversion UNIQUE (product_id, from_unit_id, to_unit_id, version)
);

-- Product Price History (سجل تغير الأسعار الحالية)
CREATE TABLE product_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    price_type VARCHAR(30) NOT NULL,
    old_price NUMERIC(15,2) NOT NULL,
    new_price NUMERIC(15,2) NOT NULL,
    reason TEXT,
    changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    effective_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 5. INVENTORY & COSTING ENGINE (IMMUTABLE LEDGER)
-- ==============================================================================

-- Goods Receipts (أذون استلام البضاعة من الشراء)
CREATE TABLE goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    supplier_id UUID,
    receipt_number VARCHAR(50) NOT NULL,
    supplier_invoice_ref VARCHAR(100),
    receipt_date DATE NOT NULL,
    truck_plate VARCHAR(30),
    gross_weight_kg NUMERIC(12,3),
    tare_weight_kg NUMERIC(12,3),
    net_weight_kg NUMERIC(12,3),
    notes TEXT,
    received_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_goods_receipt_num UNIQUE (organization_id, receipt_number)
);

-- Goods Receipt Lines (بنود إذن الاستلام)
CREATE TABLE goods_receipt_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    received_qty_entered NUMERIC(15,3) NOT NULL CHECK (received_qty_entered > 0),
    entered_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    conversion_factor NUMERIC(18,6) NOT NULL DEFAULT 1.000000,
    base_unit_qty NUMERIC(15,3) NOT NULL CHECK (base_unit_qty > 0),
    purchase_unit_price NUMERIC(15,4) NOT NULL CHECK (purchase_unit_price >= 0),
    allocated_freight_unit NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    allocated_unloading_unit NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    total_landed_unit_cost NUMERIC(15,4) GENERATED ALWAYS AS (purchase_unit_price + allocated_freight_unit + allocated_unloading_unit) STORED,
    total_line_cost NUMERIC(15,2) NOT NULL
);

-- Goods Receipt Expenses (مصاريف النولون والعتالة المصاحبة للتوريد)
CREATE TABLE goods_receipt_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE RESTRICT,
    expense_type VARCHAR(50) NOT NULL, -- FREIGHT, UNLOADING_MASHAL, WEIGHING
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    paid_to VARCHAR(150),
    allocation_method VARCHAR(20) NOT NULL DEFAULT 'BY_WEIGHT', -- BY_WEIGHT, BY_VALUE
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory Cost Layers (طبقات تكلفة المخزون - FIFO Engine)
CREATE TABLE inventory_cost_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    goods_receipt_line_id UUID REFERENCES goods_receipt_lines(id) ON DELETE RESTRICT,
    initial_qty NUMERIC(15,3) NOT NULL CHECK (initial_qty > 0),
    remaining_qty NUMERIC(15,3) NOT NULL CHECK (remaining_qty >= 0),
    purchase_unit_price NUMERIC(15,4) NOT NULL,
    landed_cost_unit NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    total_unit_cost NUMERIC(15,4) NOT NULL,
    is_exhausted BOOLEAN NOT NULL DEFAULT false,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock Movements (دفتر حركات المخزون التراكمي - Immutable Ledger)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_type movement_type_enum NOT NULL,
    quantity NUMERIC(15,3) NOT NULL CHECK (quantity <> 0),
    unit_cost_allocated NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    source_doc_type VARCHAR(50) NOT NULL,
    source_doc_id UUID NOT NULL,
    movement_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT
);

-- ==============================================================================
-- 6. CUSTOMERS & SALES
-- ==============================================================================

-- Customers (العملاء والمقاولون)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    code VARCHAR(30) NOT NULL,
    name_ar VARCHAR(150) NOT NULL,
    phone VARCHAR(25) NOT NULL,
    tax_id VARCHAR(50),
    commercial_reg VARCHAR(50),
    credit_limit NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (credit_limit >= 0),
    payment_terms_days INTEGER NOT NULL DEFAULT 0 CHECK (payment_terms_days >= 0),
    opening_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    address TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_customer_code UNIQUE (organization_id, code)
);

-- Sales Invoices (فواتير المبيعات)
CREATE TABLE sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL,
    status invoice_status_enum NOT NULL DEFAULT 'DRAFT',
    payment_type payment_type_enum NOT NULL DEFAULT 'CASH',
    
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    freight_charge NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (freight_charge >= 0),
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    remaining_balance NUMERIC(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    
    notes TEXT,
    delivery_destination TEXT,
    approved_by UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    approved_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_sales_invoice_num UNIQUE (organization_id, invoice_number)
);

-- Sales Invoice Lines (سطور الفاتورة - لقطة تاريخية غير قابلة للتعديل)
CREATE TABLE sales_invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name_snap VARCHAR(200) NOT NULL,
    entered_quantity NUMERIC(15,3) NOT NULL CHECK (entered_quantity > 0),
    entered_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    conversion_factor NUMERIC(18,6) NOT NULL DEFAULT 1.000000,
    base_quantity NUMERIC(15,3) NOT NULL CHECK (base_quantity > 0),
    unit_price_snap NUMERIC(15,2) NOT NULL CHECK (unit_price_snap >= 0),
    line_discount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (line_discount >= 0),
    total_line_amount NUMERIC(15,2) NOT NULL,
    historical_cogs NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    historical_profit NUMERIC(15,2) GENERATED ALWAYS AS (total_line_amount - historical_cogs) STORED
);

-- Cost Allocations (تخصيص طبقات التكلفة لكل سطر فاتورة)
CREATE TABLE cost_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_invoice_line_id UUID NOT NULL REFERENCES sales_invoice_lines(id) ON DELETE RESTRICT,
    cost_layer_id UUID NOT NULL REFERENCES inventory_cost_layers(id) ON DELETE RESTRICT,
    quantity_consumed NUMERIC(15,3) NOT NULL CHECK (quantity_consumed > 0),
    unit_cost_applied NUMERIC(15,4) NOT NULL,
    total_cost NUMERIC(15,2) NOT NULL,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales Returns (المرتجعات المربوطة بالفاتورة الأصلية)
CREATE TABLE sales_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    original_invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE RESTRICT,
    return_number VARCHAR(50) NOT NULL,
    return_date DATE NOT NULL,
    total_refund_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    reason TEXT NOT NULL,
    approved_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_sales_return_num UNIQUE (organization_id, return_number)
);

-- Sales Return Lines
CREATE TABLE sales_return_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_return_id UUID NOT NULL REFERENCES sales_returns(id) ON DELETE RESTRICT,
    original_line_id UUID NOT NULL REFERENCES sales_invoice_lines(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    returned_quantity NUMERIC(15,3) NOT NULL CHECK (returned_quantity > 0),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    is_damaged BOOLEAN NOT NULL DEFAULT false,
    target_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    historical_unit_cost NUMERIC(15,4) NOT NULL,
    total_refund NUMERIC(15,2) NOT NULL
);

-- ==============================================================================
-- 7. SUPPLIERS & PURCHASES
-- ==============================================================================

-- Suppliers (الموردون والمصانع والمقالع)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    code VARCHAR(30) NOT NULL,
    name_ar VARCHAR(150) NOT NULL,
    supplier_type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    phone VARCHAR(25) NOT NULL,
    tax_id VARCHAR(50),
    commercial_reg VARCHAR(50),
    current_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_supplier_code UNIQUE (organization_id, code)
);

-- Purchase Orders (أوامر الشراء)
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL,
    target_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    status VARCHAR(25) NOT NULL DEFAULT 'OPEN', -- OPEN, PARTIAL, COMPLETED, CANCELLED
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_purchase_order_num UNIQUE (organization_id, order_number)
);

-- Purchase Order Lines
CREATE TABLE purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    ordered_qty NUMERIC(15,3) NOT NULL CHECK (ordered_qty > 0),
    received_qty NUMERIC(15,3) NOT NULL DEFAULT 0.000 CHECK (received_qty >= 0),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    unit_price NUMERIC(15,4) NOT NULL CHECK (unit_price >= 0),
    total_amount NUMERIC(15,2) NOT NULL
);

-- ==============================================================================
-- 8. FINANCE & CASHBOXES (IMMUTABLE FINANCIAL LEDGER)
-- ==============================================================================

-- Cashboxes (الخزائن والبنوك)
CREATE TABLE cashboxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    name_ar VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'CASH' CHECK (type IN ('CASH', 'BANK')),
    opening_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cash Movements (دفتر الأستاذ النقدي - Append-Only)
CREATE TABLE cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    cashbox_id UUID NOT NULL REFERENCES cashboxes(id) ON DELETE RESTRICT,
    movement_type cash_movement_type_enum NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    source_doc_type VARCHAR(50) NOT NULL,
    source_doc_id UUID NOT NULL,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Receipts (سندات القبض من العملاء)
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    cashbox_id UUID NOT NULL REFERENCES cashboxes(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    receipt_number VARCHAR(50) NOT NULL,
    receipt_date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH',
    check_number VARCHAR(50),
    check_due_date DATE,
    notes TEXT,
    received_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_receipt_num UNIQUE (organization_id, receipt_number)
);

-- Receipt Allocations (تخصيص سند القبض على فواتير محددة)
CREATE TABLE receipt_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE RESTRICT,
    sales_invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE RESTRICT,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments (سندات الصرف للموردين والمصروفات)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    cashbox_id UUID NOT NULL REFERENCES cashboxes(id) ON DELETE RESTRICT,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    payment_number VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH',
    notes TEXT,
    paid_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_payment_num UNIQUE (organization_id, payment_number)
);

-- Expenses (المصروفات التشغيلية)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    cashbox_id UUID NOT NULL REFERENCES cashboxes(id) ON DELETE RESTRICT,
    category VARCHAR(50) NOT NULL, -- RENT, ELECTRICITY, SALARIES, MAINTENANCE, BUFFET
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    paid_to VARCHAR(150),
    notes TEXT,
    receipt_image_url TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cash Sessions (الورديات وإغلاق الخزينة اليومي والمطابقة)
CREATE TABLE cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    cashbox_id UUID NOT NULL REFERENCES cashboxes(id) ON DELETE RESTRICT,
    opened_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    opening_cash NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    closed_by UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    closed_at TIMESTAMPTZ,
    expected_cash NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    actual_cash_counted NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    variance_amount NUMERIC(15,2) GENERATED ALWAYS AS (actual_cash_counted - expected_cash) STORED,
    notes TEXT
);

-- ==============================================================================
-- 9. LOGISTICS & DELIVERY
-- ==============================================================================

-- Vehicles (السيارات والشاحنات)
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    plate_number VARCHAR(30) NOT NULL,
    model VARCHAR(50),
    max_payload_tons NUMERIC(8,3) NOT NULL CHECK (max_payload_tons > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drivers (السائقون)
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name_ar VARCHAR(100) NOT NULL,
    phone VARCHAR(25) NOT NULL,
    license_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Delivery Orders (أوامر التوصيل بالمواقع)
CREATE TABLE delivery_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    sales_invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE RESTRICT,
    delivery_number VARCHAR(50) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES drivers(id) ON DELETE RESTRICT,
    destination_address TEXT NOT NULL,
    recipient_phone VARCHAR(25),
    status delivery_status_enum NOT NULL DEFAULT 'PREPARING',
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    proof_of_delivery_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_delivery_num UNIQUE (organization_id, delivery_number)
);

-- Delivery Order Lines
CREATE TABLE delivery_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_order_id UUID NOT NULL REFERENCES delivery_orders(id) ON DELETE RESTRICT,
    sales_invoice_line_id UUID NOT NULL REFERENCES sales_invoice_lines(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_to_deliver NUMERIC(15,3) NOT NULL CHECK (quantity_to_deliver > 0),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT
);

-- ==============================================================================
-- 10. AUDIT, EXCEL & SYSTEM
-- ==============================================================================

-- Audit Logs (سجل التدقيق الأمني غير القابل للتعديل)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document Sequences (توليد أرقام متتالية ذرية موثوقة)
CREATE TABLE document_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    document_type VARCHAR(30) NOT NULL,
    prefix VARCHAR(10) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    current_value BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_doc_seq UNIQUE (organization_id, document_type, fiscal_year)
);

-- Import Jobs (مركز Excel للاستيراد الآمن)
CREATE TABLE import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    file_name VARCHAR(255) NOT NULL,
    target_entity VARCHAR(50) NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    valid_rows INTEGER NOT NULL DEFAULT 0,
    error_rows INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(25) NOT NULL DEFAULT 'PENDING',
    mapping_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_summary JSONB,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 11. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX idx_stock_movements_query ON stock_movements (warehouse_id, product_id, movement_at);
CREATE INDEX idx_cost_layers_fifo ON inventory_cost_layers (warehouse_id, product_id, received_at) WHERE is_exhausted = false;
CREATE INDEX idx_invoices_search ON sales_invoices (organization_id, invoice_date, customer_id, status);
CREATE INDEX idx_cash_movements_box ON cash_movements (cashbox_id, created_at);
CREATE INDEX idx_audit_entity ON audit_logs (organization_id, entity_name, entity_id);

-- ==============================================================================
-- 12. HELPER FUNCTIONS
-- ==============================================================================

-- Helper function to generate atomic document numbers
CREATE OR REPLACE FUNCTION get_next_document_number(
    p_org_id UUID,
    p_doc_type VARCHAR,
    p_prefix VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    v_next_val BIGINT;
    v_result VARCHAR;
BEGIN
    INSERT INTO document_sequences (organization_id, document_type, prefix, fiscal_year, current_value)
    VALUES (p_org_id, p_doc_type, p_prefix, v_year, 1)
    ON CONFLICT (organization_id, document_type, fiscal_year)
    DO UPDATE SET current_value = document_sequences.current_value + 1
    RETURNING current_value INTO v_next_val;

    v_result := p_prefix || '-' || v_year::TEXT || '-' || LPAD(v_next_val::TEXT, 5, '0');
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
