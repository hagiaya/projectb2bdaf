-- ==============================================================================
-- PUSAT RESET DATA B2B DAP (OPTIONAL SQL HELPER)
-- Jalankan bagian yang Anda butuhkan di Supabase SQL Editor
-- ==============================================================================

-- 1. RESET JUMLAH STOK SELURUH PRODUK KE 0
-- UPDATE public.products SET stock = 0;
-- DELETE FROM public.stock_logs;

-- 2. RESET DATA TRANSAKSI (ORDERS, ORDER ITEMS, RETURNS)
-- DELETE FROM public.returns;
-- DELETE FROM public.order_items;
-- DELETE FROM public.orders;
-- UPDATE public.dealers SET outstanding_balance = 0;

-- 3. RESET DATA DEALER / TOKO
-- DELETE FROM public.dealer_program_participants;
-- DELETE FROM public.returns;
-- DELETE FROM public.order_items;
-- DELETE FROM public.orders;
-- DELETE FROM public.dealers;
-- UPDATE public.profiles SET role = 'USER' WHERE role = 'DEALER';

-- 4. RESET DATA SALES & SPV (KINERJA & PENGGAJIAN)
-- DELETE FROM public.sales_payrolls;
-- DELETE FROM public.sales_targets;
-- DELETE FROM public.sales_visits;
-- DELETE FROM public.sales_attendances;
-- DELETE FROM public.sales_leaves;
-- UPDATE public.dealers SET sales_id = NULL;
-- UPDATE public.sales SET balance = 0;

-- 5. RESET DATA MASTER PRODUK
-- DELETE FROM public.order_items;
-- DELETE FROM public.stock_logs;
-- DELETE FROM public.products;
