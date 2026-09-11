-- 1. Create Sales Table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ktp_number VARCHAR(50),
    ktp_image_url TEXT,
    region_id UUID REFERENCES public.regions(id),
    balance DECIMAL(15, 2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Modify Dealers Table
ALTER TABLE public.dealers
ADD COLUMN IF NOT EXISTS sales_id UUID REFERENCES public.sales(id);

-- 3. Create Sales Attendance Table
CREATE TABLE IF NOT EXISTS public.sales_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sales_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    is_late BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (sales_id, attendance_date) -- Ensures only one attendance record per day per sales
);

-- 4. Create Sales Visits Table
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
    earned_amount DECIMAL(15, 2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Sales Leaves Table
CREATE TABLE IF NOT EXISTS public.sales_leaves (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sales_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('SICK', 'ANNUAL')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    proof_image_url TEXT,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_leaves ENABLE ROW LEVEL SECURITY;

-- 7. Add basic RLS policies
-- Sales can view their own profile
CREATE POLICY "Sales can view their own profile" ON public.sales
    FOR SELECT USING (profile_id = auth.uid());

-- Sales can view their own attendance
CREATE POLICY "Sales can view their own attendance" ON public.sales_attendance
    FOR SELECT USING (sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid()));
CREATE POLICY "Sales can insert their own attendance" ON public.sales_attendance
    FOR INSERT WITH CHECK (sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid()));
CREATE POLICY "Sales can update their own attendance" ON public.sales_attendance
    FOR UPDATE USING (sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid()));

-- Sales can view their own visits
CREATE POLICY "Sales can view their own visits" ON public.sales_visits
    FOR SELECT USING (sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid()));
CREATE POLICY "Sales can insert their own visits" ON public.sales_visits
    FOR INSERT WITH CHECK (sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid()));
CREATE POLICY "Sales can update their own visits" ON public.sales_visits
    FOR UPDATE USING (sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid()));

-- Sales can view their own leaves
CREATE POLICY "Sales can view their own leaves" ON public.sales_leaves
    FOR SELECT USING (sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid()));
CREATE POLICY "Sales can insert their own leaves" ON public.sales_leaves
    FOR INSERT WITH CHECK (sales_id IN (SELECT id FROM public.sales WHERE profile_id = auth.uid()));

-- Admin policies (Admins can do everything)
CREATE POLICY "Admins have full access to sales" ON public.sales
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
    );
CREATE POLICY "Admins have full access to sales_attendance" ON public.sales_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
    );
CREATE POLICY "Admins have full access to sales_visits" ON public.sales_visits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
    );
CREATE POLICY "Admins have full access to sales_leaves" ON public.sales_leaves
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
    );
