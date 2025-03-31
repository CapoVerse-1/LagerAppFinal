-- JTI 1-2-1 Inventory Management System - Supabase Setup
-- This script creates all necessary tables, relationships, and security policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create transaction_type enum
CREATE TYPE transaction_type AS ENUM ('take_out', 'return', 'burn', 'restock');

-- Create employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    initials TEXT NOT NULL CHECK (char_length(initials) BETWEEN 2 AND 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create brands table
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL
);

-- Create items table
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    image_url TEXT,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    is_shared BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    original_quantity INTEGER NOT NULL CHECK (original_quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL
);

-- Create item_sizes table
CREATE TABLE item_sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    original_quantity INTEGER NOT NULL CHECK (original_quantity >= 0),
    available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0),
    in_circulation INTEGER NOT NULL DEFAULT 0 CHECK (in_circulation >= 0),
    UNIQUE(item_id, size)
);

-- Create promoters table
CREATE TABLE promoters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_type transaction_type NOT NULL,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    item_size_id UUID REFERENCES item_sizes(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    promoter_id UUID REFERENCES promoters(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create shared_items table
CREATE TABLE shared_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    UNIQUE(item_id, brand_id)
);

-- Create indexes for performance
CREATE INDEX idx_items_brand_id ON items(brand_id);
CREATE INDEX idx_item_sizes_item_id ON item_sizes(item_id);
CREATE INDEX idx_transactions_item_id ON transactions(item_id);
CREATE INDEX idx_transactions_item_size_id ON transactions(item_size_id);
CREATE INDEX idx_transactions_promoter_id ON transactions(promoter_id);
CREATE INDEX idx_transactions_employee_id ON transactions(employee_id);
CREATE INDEX idx_shared_items_item_id ON shared_items(item_id);
CREATE INDEX idx_shared_items_brand_id ON shared_items(brand_id);

-- Create storage buckets
-- Note: This needs to be done through the Supabase dashboard or API
-- The following are placeholders for documentation purposes

-- brand-logos bucket
-- CREATE BUCKET brand-logos;

-- item-images bucket
-- CREATE BUCKET item-images;

-- promoter-photos bucket
-- CREATE BUCKET promoter-photos;

-- Create or replace function to handle inventory updates on transactions
CREATE OR REPLACE FUNCTION handle_inventory_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- For take_out: decrease available, increase in_circulation
    IF NEW.transaction_type = 'take_out' THEN
        UPDATE item_sizes
        SET 
            available_quantity = available_quantity - NEW.quantity,
            in_circulation = in_circulation + NEW.quantity
        WHERE id = NEW.item_size_id;
    
    -- For return: increase available, decrease in_circulation
    ELSIF NEW.transaction_type = 'return' THEN
        UPDATE item_sizes
        SET 
            available_quantity = available_quantity + NEW.quantity,
            in_circulation = in_circulation - NEW.quantity
        WHERE id = NEW.item_size_id;
    
    -- For burn: decrease in_circulation only
    ELSIF NEW.transaction_type = 'burn' THEN
        UPDATE item_sizes
        SET in_circulation = in_circulation - NEW.quantity
        WHERE id = NEW.item_size_id;
    
    -- For restock: increase original_quantity and available_quantity
    ELSIF NEW.transaction_type = 'restock' THEN
        UPDATE item_sizes
        SET 
            original_quantity = original_quantity + NEW.quantity,
            available_quantity = available_quantity + NEW.quantity
        WHERE id = NEW.item_size_id;
        
        -- Also update the original_quantity in the items table
        UPDATE items
        SET original_quantity = original_quantity + NEW.quantity
        WHERE id = NEW.item_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory updates
CREATE TRIGGER update_inventory_on_transaction
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION handle_inventory_transaction();

-- Create function to update brand active status and cascade to items
CREATE OR REPLACE FUNCTION update_items_on_brand_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        -- When brand is set to inactive, set all non-shared items to inactive
        UPDATE items
        SET is_active = FALSE
        WHERE brand_id = NEW.id AND is_shared = FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for brand status changes
CREATE TRIGGER cascade_brand_status_to_items
AFTER UPDATE OF is_active ON brands
FOR EACH ROW
WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
EXECUTE FUNCTION update_items_on_brand_status_change();

-- Set up Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoters ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_items ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Employees table policies
CREATE POLICY "Employees can be viewed by authenticated users"
ON employees FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Employees can be inserted by authenticated users"
ON employees FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Employees can be updated by authenticated users"
ON employees FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Employees can be deleted by authenticated users"
ON employees FOR DELETE
TO authenticated
USING (true);

-- Brands table policies
CREATE POLICY "Brands can be viewed by authenticated users"
ON brands FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Brands can be inserted by authenticated users"
ON brands FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Brands can be updated by authenticated users"
ON brands FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Brands can be deleted by authenticated users"
ON brands FOR DELETE
TO authenticated
USING (true);

-- Items table policies
CREATE POLICY "Items can be viewed by authenticated users"
ON items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Items can be inserted by authenticated users"
ON items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Items can be updated by authenticated users"
ON items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Items can be deleted by authenticated users"
ON items FOR DELETE
TO authenticated
USING (true);

-- Item_sizes table policies
CREATE POLICY "Item sizes can be viewed by authenticated users"
ON item_sizes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Item sizes can be inserted by authenticated users"
ON item_sizes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Item sizes can be updated by authenticated users"
ON item_sizes FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Item sizes can be deleted by authenticated users"
ON item_sizes FOR DELETE
TO authenticated
USING (true);

-- Promoters table policies
CREATE POLICY "Promoters can be viewed by authenticated users"
ON promoters FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Promoters can be inserted by authenticated users"
ON promoters FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Promoters can be updated by authenticated users"
ON promoters FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Promoters can be deleted by authenticated users"
ON promoters FOR DELETE
TO authenticated
USING (true);

-- Transactions table policies
CREATE POLICY "Transactions can be viewed by authenticated users"
ON transactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Transactions can be inserted by authenticated users"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Transactions can be updated by authenticated users"
ON transactions FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Transactions can be deleted by authenticated users"
ON transactions FOR DELETE
TO authenticated
USING (true);

-- Shared_items table policies
CREATE POLICY "Shared items can be viewed by authenticated users"
ON shared_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Shared items can be inserted by authenticated users"
ON shared_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Shared items can be updated by authenticated users"
ON shared_items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Shared items can be deleted by authenticated users"
ON shared_items FOR DELETE
TO authenticated
USING (true);

-- Create views for common queries

-- View for item inventory summary
CREATE OR REPLACE VIEW item_inventory_summary AS
SELECT 
    i.id AS item_id,
    i.name AS item_name,
    i.product_id,
    i.image_url,
    b.id AS brand_id,
    b.name AS brand_name,
    isz.id AS item_size_id,
    isz.size,
    isz.original_quantity,
    isz.available_quantity,
    isz.in_circulation,
    (isz.available_quantity + isz.in_circulation) AS total_quantity,
    i.is_shared,
    i.is_active,
    b.is_active AS brand_is_active
FROM 
    items i
JOIN 
    brands b ON i.brand_id = b.id
JOIN 
    item_sizes isz ON i.id = isz.item_id;

-- View for promoter inventory
CREATE OR REPLACE VIEW promoter_current_inventory AS
SELECT 
    p.id AS promoter_id,
    p.name AS promoter_name,
    i.id AS item_id,
    i.name AS item_name,
    i.product_id,
    isz.size,
    b.id AS brand_id,
    b.name AS brand_name,
    SUM(
        CASE 
            WHEN t.transaction_type = 'take_out' THEN t.quantity
            WHEN t.transaction_type = 'return' THEN -t.quantity
            WHEN t.transaction_type = 'burn' THEN -t.quantity
            ELSE 0
        END
    ) AS current_quantity
FROM 
    promoters p
JOIN 
    transactions t ON p.id = t.promoter_id
JOIN 
    items i ON t.item_id = i.id
JOIN 
    item_sizes isz ON t.item_size_id = isz.id
JOIN 
    brands b ON i.brand_id = b.id
GROUP BY 
    p.id, p.name, i.id, i.name, i.product_id, isz.size, b.id, b.name
HAVING 
    SUM(
        CASE 
            WHEN t.transaction_type = 'take_out' THEN t.quantity
            WHEN t.transaction_type = 'return' THEN -t.quantity
            WHEN t.transaction_type = 'burn' THEN -t.quantity
            ELSE 0
        END
    ) > 0;

-- Create stored procedures for data import transactions
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void AS $$
BEGIN
  -- Start a new transaction
  -- This is actually redundant since every function runs in a transaction by default
  -- But we keep it for clarity and potential future use
  -- DO NOTHING
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void AS $$
BEGIN
  -- Commit the current transaction
  -- This is actually redundant since successful function execution will commit automatically
  -- But we keep it for clarity and potential future use
  -- DO NOTHING
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void AS $$
BEGIN
  -- Rollback the current transaction
  RAISE EXCEPTION 'Transaction rolled back';
END;
$$ LANGUAGE plpgsql;

-- Create a function to validate imported data
CREATE OR REPLACE FUNCTION validate_imported_data()
RETURNS trigger AS $$
BEGIN
  -- Add validation logic here
  -- For example, check if required fields are present
  -- Check if foreign key references exist
  -- etc.
  
  -- For now, we just pass through
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for data validation
CREATE TRIGGER validate_imported_brands
  BEFORE INSERT ON brands
  FOR EACH ROW
  EXECUTE FUNCTION validate_imported_data();

CREATE TRIGGER validate_imported_items
  BEFORE INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION validate_imported_data();

CREATE TRIGGER validate_imported_item_sizes
  BEFORE INSERT ON item_sizes
  FOR EACH ROW
  EXECUTE FUNCTION validate_imported_data();

CREATE TRIGGER validate_imported_promoters
  BEFORE INSERT ON promoters
  FOR EACH ROW
  EXECUTE FUNCTION validate_imported_data();

CREATE TRIGGER validate_imported_transactions
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_imported_data();

CREATE TRIGGER validate_imported_employees
  BEFORE INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION validate_imported_data();

-- Instructions for creating storage buckets:
-- These need to be created through the Supabase dashboard or API
-- 1. Go to Storage in the Supabase dashboard
-- 2. Create the following buckets:
--    - brand-logos
--    - item-images
--    - promoter-photos
-- 3. Set appropriate RLS policies for each bucket 