-- Tambahkan hak akses DELETE untuk Admin pada tabel dealer_program_participants

DROP POLICY IF EXISTS "Admins can delete program participation" ON public.dealer_program_participants;
CREATE POLICY "Admins can delete program participation" ON public.dealer_program_participants
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );
