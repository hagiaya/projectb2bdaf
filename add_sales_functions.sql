-- Functions and Triggers for Sales Role Logic

-- 1. Function to enforce 30-minute minimum visit duration
CREATE OR REPLACE FUNCTION public.check_visit_duration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only check if we are updating check_out_time
    IF NEW.check_out_time IS NOT NULL AND OLD.check_out_time IS NULL THEN
        -- Calculate difference in minutes
        IF EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time))/60 < 30 THEN
            RAISE EXCEPTION 'Durasi kunjungan (visit) tidak boleh kurang dari 30 menit. Kunjungan baru berjalan % menit.', ROUND((EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time))/60)::numeric, 1);
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger for 30-minute minimum visit duration
DROP TRIGGER IF EXISTS enforce_visit_duration ON public.sales_visits;
CREATE TRIGGER enforce_visit_duration
    BEFORE UPDATE ON public.sales_visits
    FOR EACH ROW
    EXECUTE FUNCTION public.check_visit_duration();

-- 2. Function to enforce 2-day visit cooldown per dealer
CREATE OR REPLACE FUNCTION public.check_visit_cooldown()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_visit_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Find the most recent completed visit to the same dealer by the same sales person
    SELECT MAX(check_in_time) INTO last_visit_time
    FROM public.sales_visits
    WHERE sales_id = NEW.sales_id
      AND dealer_id = NEW.dealer_id
      AND status = 'COMPLETED'
      AND id != NEW.id; -- Exclude current row if updating

    -- If a previous visit exists, check if it's within the last 2 days
    IF last_visit_time IS NOT NULL THEN
        IF EXTRACT(DAY FROM (NEW.check_in_time - last_visit_time)) < 2 THEN
            RAISE EXCEPTION 'Dealer ini sudah dikunjungi dalam 2 hari terakhir. Kunjungan terakhir pada %', TO_CHAR(last_visit_time, 'YYYY-MM-DD HH24:MI:SS');
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger for 2-day visit cooldown
DROP TRIGGER IF EXISTS enforce_visit_cooldown ON public.sales_visits;
CREATE TRIGGER enforce_visit_cooldown
    BEFORE INSERT OR UPDATE ON public.sales_visits
    FOR EACH ROW
    EXECUTE FUNCTION public.check_visit_cooldown();

-- 3. Function to automatically mark attendance as late if check-in is after 10:00 AM
CREATE OR REPLACE FUNCTION public.check_attendance_late()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the check_in_time's hour is >= 10 in the local timezone (assuming server is set up correctly or using UTC offset)
    -- This example assumes timestamps are handled correctly by the app passing them in, or we compare time component
    -- We convert to time and check if it's past 10:00:00.
    -- Note: Ensure timezone aligns with your business logic (e.g., AT TIME ZONE 'Asia/Jakarta')
    IF NEW.check_in_time IS NOT NULL AND OLD.check_in_time IS NULL THEN
        IF (NEW.check_in_time AT TIME ZONE 'Asia/Jakarta')::time > '10:00:00'::time THEN
            NEW.is_late = true;
        ELSE
            NEW.is_late = false;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger for attendance late check
DROP TRIGGER IF EXISTS check_attendance_late_trigger ON public.sales_attendance;
CREATE TRIGGER check_attendance_late_trigger
    BEFORE INSERT OR UPDATE ON public.sales_attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.check_attendance_late();
