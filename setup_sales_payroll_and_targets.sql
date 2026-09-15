-- ==============================================================================
-- SETUP SALES PAYROLL, TARGETS, SPV COVERAGE & ACHIEVEMENT SYSTEM (SAFE MIGRATION)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update Profiles role check constraint to support SPV
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('ADMIN', 'DEALER', 'SALES', 'SPV'));

-- 3. Enhance public.sales table
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS is_spv BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spv_id UUID REFERENCES public.sales(id),
ADD COLUMN IF NOT EXISTS base_salary DECIMAL(15, 2) DEFAULT 4500000.00,
ADD COLUMN IF NOT EXISTS daily_visit_target INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS work_days_per_month INTEGER DEFAULT 26,
ADD COLUMN IF NOT EXISTS direct_commission_pct DECIMAL(5, 2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS team_bonus_pct DECIMAL(5, 2) DEFAULT 0.25;

-- 4. Enhance public.regions table for Coverage Management
ALTER TABLE public.regions
ADD COLUMN IF NOT EXISTS assigned_sales_id UUID REFERENCES public.sales(id),
ADD COLUMN IF NOT EXISTS coverage_status VARCHAR(50) DEFAULT 'UNCOVERED';

-- 5. Enhance public.orders table for SPV Direct Sales in Uncovered Regions
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS is_spv_direct_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spv_id UUID REFERENCES public.sales(id),
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES public.regions(id);

-- 6. Create Sales Targets Table (Base)
CREATE TABLE IF NOT EXISTS public.sales_targets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6.1 Ensure ALL columns exist on sales_targets (handles existing tables without missing columns)
ALTER TABLE public.sales_targets
ADD COLUMN IF NOT EXISTS sales_id UUID,
ADD COLUMN IF NOT EXISTS spv_id UUID,
ADD COLUMN IF NOT EXISTS period_month VARCHAR(20) DEFAULT 'September',
ADD COLUMN IF NOT EXISTS period_year INTEGER DEFAULT 2026,
ADD COLUMN IF NOT EXISTS daily_visit_target INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS work_days INTEGER DEFAULT 26,
ADD COLUMN IF NOT EXISTS target_visits INTEGER DEFAULT 156,
ADD COLUMN IF NOT EXISTS achieved_visits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS visit_achievement_pct DECIMAL(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS target_amount DECIMAL(15, 2) DEFAULT 100000000.00,
ADD COLUMN IF NOT EXISTS achieved_amount DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS sales_achievement_pct DECIMAL(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS is_spv_target BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spv_direct_target_amount DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS spv_direct_achieved_amount DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS spv_team_target_amount DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS spv_team_achieved_amount DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 7. Create Sales Payrolls Table (Base)
CREATE TABLE IF NOT EXISTS public.sales_payrolls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payroll_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7.1 Ensure ALL columns exist on sales_payrolls
ALTER TABLE public.sales_payrolls
ADD COLUMN IF NOT EXISTS payroll_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS sales_id UUID,
ADD COLUMN IF NOT EXISTS spv_id UUID,
ADD COLUMN IF NOT EXISTS period_month VARCHAR(20) DEFAULT 'September',
ADD COLUMN IF NOT EXISTS period_year INTEGER DEFAULT 2026,
ADD COLUMN IF NOT EXISTS nominal_base_salary DECIMAL(15, 2) DEFAULT 4500000.00,
ADD COLUMN IF NOT EXISTS daily_visit_target INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS work_days INTEGER DEFAULT 26,
ADD COLUMN IF NOT EXISTS target_visits INTEGER DEFAULT 156,
ADD COLUMN IF NOT EXISTS achieved_visits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS visit_achievement_pct DECIMAL(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS value_per_visit DECIMAL(15, 2) DEFAULT 28846.15,
ADD COLUMN IF NOT EXISTS earned_visit_salary DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS target_sales_amount DECIMAL(15, 2) DEFAULT 100000000.00,
ADD COLUMN IF NOT EXISTS achieved_sales_amount DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS sales_achievement_pct DECIMAL(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS incentive_percentage DECIMAL(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS earned_incentive_amount DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS spv_direct_sales_amount DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS spv_direct_sales_commission DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS team_bonus_amount DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS other_bonus DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS bonus_notes TEXT,
ADD COLUMN IF NOT EXISTS deductions_amount DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS deduction_notes TEXT,
ADD COLUMN IF NOT EXISTS net_salary DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'DRAFT',
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'BANK_TRANSFER',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 8. Create Unique Indexes (Safe idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_sales_targets_period ON public.sales_targets(sales_id, period_month, period_year);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_sales_payrolls_period ON public.sales_payrolls(sales_id, period_month, period_year);

-- 9. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_sales_targets_period ON public.sales_targets(period_month, period_year);
CREATE INDEX IF NOT EXISTS idx_sales_payrolls_period ON public.sales_payrolls(period_month, period_year);
CREATE INDEX IF NOT EXISTS idx_sales_spv_id ON public.sales(spv_id);
CREATE INDEX IF NOT EXISTS idx_regions_assigned_sales ON public.regions(assigned_sales_id);
CREATE INDEX IF NOT EXISTS idx_orders_is_spv_direct ON public.orders(is_spv_direct_sale);

-- 10. Enable RLS
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_payrolls ENABLE ROW LEVEL SECURITY;

-- 11. Policies for sales_targets
DROP POLICY IF EXISTS "Full access targets for admin" ON public.sales_targets;
CREATE POLICY "Full access targets for admin" ON public.sales_targets
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SPV')));

DROP POLICY IF EXISTS "Sales can view their own targets" ON public.sales_targets;
CREATE POLICY "Sales can view their own targets" ON public.sales_targets
    FOR SELECT USING (
        sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid())
        OR spv_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SPV'))
    );

-- 12. Policies for sales_payrolls
DROP POLICY IF EXISTS "Full access payrolls for admin" ON public.sales_payrolls;
CREATE POLICY "Full access payrolls for admin" ON public.sales_payrolls
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "Sales can view their own payroll" ON public.sales_payrolls;
CREATE POLICY "Sales can view their own payroll" ON public.sales_payrolls
    FOR SELECT USING (
        sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );
