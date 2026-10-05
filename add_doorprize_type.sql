ALTER TABLE public.dealer_programs DROP CONSTRAINT IF EXISTS dealer_programs_program_type_check;
ALTER TABLE public.dealer_programs ADD CONSTRAINT dealer_programs_program_type_check CHECK (program_type IN ('BARANG_SUPPORT', 'TRIP', 'CASHBACK', 'HADIAH_DOORPRIZE'));
