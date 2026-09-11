-- ==============================================================================
-- SALES COMPLETE MIGRATION & RLS SCRIPT
-- ==============================================================================

-- 1. Create / Update Sales Table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ktp_number VARCHAR(50),
    ktp_image_url TEXT,
    region_id UUID REFERENCES public.regions(id),
    balance DECIMAL(15, 2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Modify Dealers Table
ALTER TABLE public.dealers
ADD COLUMN IF NOT EXISTS sales_id UUID REFERENCES public.sales(id);

-- 3. Modify Orders Table (track sales canvassing / assisted orders)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS sales_id UUID REFERENCES public.sales(id);

-- 4. Create / Update Sales Attendance Table
CREATE TABLE IF NOT EXISTS public.sales_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sales_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    is_late BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (sales_id, attendance_date)
);

-- 5. Create / Update Sales Visits Table
CREATE TABLE IF NOT EXISTS public.sales_visits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sales_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    check_out_time TIMESTAMP WITH TIME ZONE,
    unit_percentage INTEGER CHECK (unit_percentage >= 0 AND unit_percentage <= 100),
    owner_met BOOLEAN DEFAULT false,
    selfie_url TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    notes TEXT,
    earned_amount DECIMAL(15, 2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure notes column exists
ALTER TABLE public.sales_visits ADD COLUMN IF NOT EXISTS notes TEXT;

-- 6. Create / Update Sales Leaves Table
CREATE TABLE IF NOT EXISTS public.sales_leaves (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sales_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('SICK', 'ANNUAL')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    proof_image_url TEXT,
    admin_notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sales_leaves ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 7. Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_leaves ENABLE ROW LEVEL SECURITY;

-- 8. Policies for Sales Table
DROP POLICY IF EXISTS "Sales can view their own profile" ON public.sales;
CREATE POLICY "Sales can view their own profile" ON public.sales
    FOR SELECT USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "Public can view active sales for registration" ON public.sales;
CREATE POLICY "Public can view active sales for registration" ON public.sales
    FOR SELECT USING (status = 'ACTIVE');

DROP POLICY IF EXISTS "Admins have full access to sales" ON public.sales;
CREATE POLICY "Admins have full access to sales" ON public.sales
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- 9. Policies for Dealers Table (Permit Sales to view and insert)
DROP POLICY IF EXISTS "Sales can view assigned dealers" ON public.dealers;
CREATE POLICY "Sales can view assigned dealers" ON public.dealers
    FOR SELECT USING (
        sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid()) 
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SALES'
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
        OR profile_id = auth.uid()
    );

DROP POLICY IF EXISTS "Sales can insert new dealers" ON public.dealers;
CREATE POLICY "Sales can insert new dealers" ON public.dealers
    FOR INSERT WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SALES'
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );

-- 9.1 Policies for Orders Table (Allow Sales to view orders of their toko binaan)
DROP POLICY IF EXISTS "Sales can view orders of their dealers" ON public.orders;
CREATE POLICY "Sales can view orders of their dealers" ON public.orders
    FOR SELECT USING (
        dealer_id IN (
            SELECT id FROM public.dealers 
            WHERE sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid())
        )
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SALES'))
    );

-- 9.2 Policies for Order Items Table
DROP POLICY IF EXISTS "Sales can view order items of their dealers" ON public.order_items;
CREATE POLICY "Sales can view order items of their dealers" ON public.order_items
    FOR SELECT USING (
        order_id IN (
            SELECT o.id FROM public.orders o
            JOIN public.dealers d ON o.dealer_id = d.id
            WHERE d.sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid())
        )
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SALES'))
    );

-- 10. Policies for Attendance
DROP POLICY IF EXISTS "Sales attendance select" ON public.sales_attendance;
CREATE POLICY "Sales attendance select" ON public.sales_attendance
    FOR SELECT USING (
        sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

DROP POLICY IF EXISTS "Sales attendance insert" ON public.sales_attendance;
CREATE POLICY "Sales attendance insert" ON public.sales_attendance
    FOR INSERT WITH CHECK (
        sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

DROP POLICY IF EXISTS "Sales attendance update" ON public.sales_attendance;
CREATE POLICY "Sales attendance update" ON public.sales_attendance
    FOR UPDATE USING (
        sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

-- 11. Policies for Visits
DROP POLICY IF EXISTS "Sales visits select" ON public.sales_visits;
CREATE POLICY "Sales visits select" ON public.sales_visits
    FOR SELECT USING (
        sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

DROP POLICY IF EXISTS "Sales visits insert" ON public.sales_visits;
CREATE POLICY "Sales visits insert" ON public.sales_visits
    FOR INSERT WITH CHECK (
        sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

DROP POLICY IF EXISTS "Sales visits update" ON public.sales_visits;
CREATE POLICY "Sales visits update" ON public.sales_visits
    FOR UPDATE USING (
        sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

-- 12. Policies for Leaves
DROP POLICY IF EXISTS "Sales leaves select" ON public.sales_leaves;
CREATE POLICY "Sales leaves select" ON public.sales_leaves
    FOR SELECT USING (
        sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

DROP POLICY IF EXISTS "Sales leaves insert" ON public.sales_leaves;
CREATE POLICY "Sales leaves insert" ON public.sales_leaves
    FOR INSERT WITH CHECK (
        sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

DROP POLICY IF EXISTS "Sales leaves update" ON public.sales_leaves;
CREATE POLICY "Sales leaves update" ON public.sales_leaves
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

-- 13. Auto-populate sales record for any existing profile with role = 'SALES'
INSERT INTO public.sales (profile_id, status)
SELECT p.id, 'ACTIVE'
FROM public.profiles p
WHERE p.role = 'SALES'
  AND NOT EXISTS (SELECT 1 FROM public.sales s WHERE s.profile_id = p.id);
