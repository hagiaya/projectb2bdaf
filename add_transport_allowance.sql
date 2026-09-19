-- ==============================================================================
-- ADD TRANSPORT ALLOWANCE TO SALES & SALES PAYROLLS
-- ==============================================================================

-- 1. Add transport_allowance column to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS transport_allowance DECIMAL(15, 2) DEFAULT 500000.00;

-- 2. Add transport_allowance column to sales_payrolls table
ALTER TABLE public.sales_payrolls 
ADD COLUMN IF NOT EXISTS transport_allowance DECIMAL(15, 2) DEFAULT 500000.00;

-- 3. Ensure SPV base_salary and transport_allowance are 0 by default for SPVs
UPDATE public.sales
SET base_salary = 0,
    transport_allowance = 0
WHERE is_spv = true;
