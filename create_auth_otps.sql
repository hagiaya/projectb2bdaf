-- Table for storing WhatsApp OTPs
CREATE TABLE public.auth_otps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup
CREATE INDEX idx_auth_otps_phone ON public.auth_otps(phone_number, is_used);

-- Only service role can access this table directly
ALTER TABLE public.auth_otps ENABLE ROW LEVEL SECURITY;
