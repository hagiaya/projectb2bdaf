CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    color VARCHAR(50) DEFAULT '#8ec44a',
    accent VARCHAR(50) DEFAULT '#4a6b22',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed some initial banners
INSERT INTO public.banners (title, subtitle, color, accent) VALUES
('Promo Akhir Tahun', 'Diskon hingga 30% untuk semua produk', '#8ec44a', '#4a6b22'),
('Flash Sale Hari Ini', 'Hemat lebih banyak, stok terbatas!', '#ca8a04', '#713f12'),
('Gratis Ongkir', 'Untuk pembelian minimal Rp 500.000', '#7eb33a', '#166534');

-- Seed some initial notifications
INSERT INTO public.notifications (title, description) VALUES
('Pesanan INV-20231024-001 Diproses', 'Semen Gresik 40kg (50 sak) sedang disiapkan oleh gudang.'),
('Promo Diskon 15%', 'Gunakan kode YEAREND15 sebelum 31 Des 2026.'),
('Selamat Datang!', 'Akun Toko Makmur Jaya telah terverifikasi sebagai Dealer Resmi.');

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Everyone can view notifications" ON public.notifications FOR SELECT USING (true);
