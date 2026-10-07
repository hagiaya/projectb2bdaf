-- ====================================================================
-- FIX RLS POLICIES UNTUK ORDERS & ORDER_ITEMS
-- Perbaikan: Menghapus "OR true" yang membuat SEMUA user bisa baca SEMUA orders
-- Sekarang: Dealer hanya bisa lihat order miliknya sendiri,
--           Sales hanya bisa lihat order dari toko binaannya,
--           Admin tetap full access.
-- ====================================================================

-- ========== ORDERS TABLE ==========
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama yang terlalu permisif
DROP POLICY IF EXISTS "Allow admin full access to orders" ON public.orders;
DROP POLICY IF EXISTS "Dealers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can view orders of their dealers" ON public.orders;
DROP POLICY IF EXISTS "Allow dealer update order receiving" ON public.orders;

-- 1. Admin: Full access (tanpa "OR true")
CREATE POLICY "Allow admin full access to orders"
ON public.orders FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR auth.role() = 'service_role'
);

-- 2. Dealer: Hanya bisa SELECT orders miliknya sendiri
CREATE POLICY "Dealers can view their own orders"
ON public.orders FOR SELECT
USING (
    dealer_id IN (
        SELECT id FROM public.dealers WHERE profile_id = auth.uid()
    )
);

-- 3. Dealer: Bisa INSERT order untuk dirinya sendiri
DROP POLICY IF EXISTS "Dealers can insert their own orders" ON public.orders;
CREATE POLICY "Dealers can insert their own orders"
ON public.orders FOR INSERT
WITH CHECK (
    dealer_id IN (
        SELECT id FROM public.dealers WHERE profile_id = auth.uid()
    )
);

-- 4. Dealer: Bisa UPDATE order miliknya (untuk receiving, upload bukti, dll)
CREATE POLICY "Allow dealer update own orders"
ON public.orders FOR UPDATE
USING (
    dealer_id IN (
        SELECT id FROM public.dealers WHERE profile_id = auth.uid()
    )
);

-- 5. Sales: Bisa SELECT orders dari toko binaan mereka
CREATE POLICY "Sales can view orders of their dealers"
ON public.orders FOR SELECT
USING (
    dealer_id IN (
        SELECT d.id FROM public.dealers d
        JOIN public.sales s ON (d.sales_id = s.id OR d.sales_id = s.profile_id)
        WHERE s.profile_id = auth.uid()
    )
);


-- ========== ORDER_ITEMS TABLE ==========
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama yang terlalu permisif
DROP POLICY IF EXISTS "Allow admin full access to order_items" ON public.order_items;

-- 1. Admin: Full access (tanpa "OR true")
CREATE POLICY "Allow admin full access to order_items"
ON public.order_items FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR auth.role() = 'service_role'
);

-- 2. Dealer: Bisa lihat order_items dari order miliknya
DROP POLICY IF EXISTS "Dealers can view their own order_items" ON public.order_items;
CREATE POLICY "Dealers can view their own order_items"
ON public.order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.dealers d ON d.id = o.dealer_id
        WHERE o.id = order_items.order_id
        AND d.profile_id = auth.uid()
    )
);

-- 3. Dealer: Bisa insert order_items untuk order miliknya
DROP POLICY IF EXISTS "Dealers can insert their own order_items" ON public.order_items;
CREATE POLICY "Dealers can insert their own order_items"
ON public.order_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.dealers d ON d.id = o.dealer_id
        WHERE o.id = order_items.order_id
        AND d.profile_id = auth.uid()
    )
);

-- 4. Sales: Bisa lihat order_items dari order toko binaan mereka
DROP POLICY IF EXISTS "Sales can view order_items of their dealers" ON public.order_items;
CREATE POLICY "Sales can view order_items of their dealers"
ON public.order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.dealers d ON d.id = o.dealer_id
        JOIN public.sales s ON (d.sales_id = s.id OR d.sales_id = s.profile_id)
        WHERE o.id = order_items.order_id
        AND s.profile_id = auth.uid()
    )
);

-- ====================================================================
-- VERIFIKASI: Setelah menjalankan migration ini, cek policies
-- SELECT * FROM pg_policies WHERE tablename IN ('orders', 'order_items');
-- ====================================================================
