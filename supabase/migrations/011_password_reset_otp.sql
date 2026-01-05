-- Migration: OTP-based Password Reset
-- Adds password_reset_otps table for storing OTP codes

-- Create OTP storage table
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_email ON password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_otp_code ON password_reset_otps(otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON password_reset_otps(expires_at);

-- Clean up expired OTPs automatically (can be triggered by cron or manually)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_otps 
    WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON password_reset_otps TO authenticated;
GRANT ALL ON password_reset_otps TO service_role;

COMMENT ON TABLE password_reset_otps IS 'Stores OTP codes for password reset with expiry and usage tracking';
