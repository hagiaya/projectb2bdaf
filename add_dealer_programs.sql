-- ==============================================================================
-- MIGRATION: DEALER LOYALTY & TARGET PROGRAMS
-- Program Kategori:
-- 1. BARANG_SUPPORT : Target pengajuan barang support (Etalase, Banner, Display)
-- 2. TRIP           : Target trip (Jalan-jalan / liburan luar negeri & domestik)
-- 3. CASHBACK       : Target program cashback tunai / potongan nota
-- ==============================================================================

-- 1. Create Table dealer_programs
CREATE TABLE IF NOT EXISTS public.dealer_programs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    program_type VARCHAR(50) NOT NULL CHECK (program_type IN ('BARANG_SUPPORT', 'TRIP', 'CASHBACK')),
    description TEXT,
    target_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.0,
    reward_description TEXT NOT NULL,
    banner_url TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Table dealer_program_participants
CREATE TABLE IF NOT EXISTS public.dealer_program_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES public.dealer_programs(id) ON DELETE CASCADE,
    dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_progress_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.0,
    status VARCHAR(50) NOT NULL DEFAULT 'ENROLLED' CHECK (status IN ('ENROLLED', 'ACHIEVED', 'CLAIMED', 'REJECTED')),
    claim_notes TEXT,
    admin_notes TEXT,
    claimed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (program_id, dealer_id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.dealer_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_program_participants ENABLE ROW LEVEL SECURITY;

-- 4. Policies for dealer_programs
DROP POLICY IF EXISTS "Public can view active programs" ON public.dealer_programs;
CREATE POLICY "Public can view active programs" ON public.dealer_programs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins have full access to programs" ON public.dealer_programs;
CREATE POLICY "Admins have full access to programs" ON public.dealer_programs
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- 5. Policies for dealer_program_participants
DROP POLICY IF EXISTS "Dealers can view their own program participation" ON public.dealer_program_participants;
CREATE POLICY "Dealers can view their own program participation" ON public.dealer_program_participants
    FOR SELECT USING (
        dealer_id IN (SELECT id FROM public.dealers WHERE profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SALES'))
    );

DROP POLICY IF EXISTS "Dealers can enroll in programs" ON public.dealer_program_participants;
CREATE POLICY "Dealers can enroll in programs" ON public.dealer_program_participants
    FOR INSERT WITH CHECK (
        dealer_id IN (SELECT id FROM public.dealers WHERE profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

DROP POLICY IF EXISTS "Dealers and Admins can update program participation" ON public.dealer_program_participants;
CREATE POLICY "Dealers and Admins can update program participation" ON public.dealer_program_participants
    FOR UPDATE USING (
        dealer_id IN (SELECT id FROM public.dealers WHERE profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

-- 6. Initial Seed Sample Programs (Langsung aktif dan siap dipakai)
INSERT INTO public.dealer_programs (id, title, program_type, description, target_amount, reward_description, banner_url, start_date, end_date, status)
VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'Program Etalase & Display Support Toko 2026',
    'BARANG_SUPPORT',
    'Dapatkan dukungan 1 unit etalase kaca display resmi DAP lengkap dengan neon box akrilik untuk mempercantik outlet Anda setelah mencapai target akumulasi order.',
    25000000.00,
    '1 Unit Etalase Kaca Display DAP Premium (P 120cm x T 100cm) + 1 Neon Box Akrilik LED',
    'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=600',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '90 days',
    'ACTIVE'
),
(
    '22222222-2222-2222-2222-222222222222',
    'Mega Trip Liburan Eksklusif ke Bangkok 4D3N',
    'TRIP',
    'Kumpulkan omset belanja aksesoris Anda dan nikmati liburan mewah ke Bangkok Thailand bersama seluruh dealer terbaik DAP. Seluruh biaya tiket, akomodasi hotel bintang 5 & tur ditanggung penuh!',
    120000000.00,
    '1 Tiket All-In Tour Bangkok 4H3M (Tiket PP, Hotel Bintang 5, Full Board Meals, City Tour & Visa)',
    'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '180 days',
    'ACTIVE'
),
(
    '33333333-3333-3333-3333-333333333333',
    'Program Super Cashback Loyalty 5%',
    'CASHBACK',
    'Program akselerasi keuntungan dealer! Capai target belanja minimum Rp 40 Juta dan dapatkan cashback tunai 5% langsung cair ke rekening atau dipotongkan pada tagihan nota berikutnya.',
    40000000.00,
    'Cashback Tunai 5% (Senilai Rp 2.000.000) langsung cair ke rekening bank pemilik toko',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '60 days',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;
