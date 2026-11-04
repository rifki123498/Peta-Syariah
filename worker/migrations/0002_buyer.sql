-- Buyer data collected at checkout (name, email, optional WhatsApp) and the consent record.
-- Personal data under UU 27/2022 (PDP): used only to deliver access, send receipts and handle refunds.
ALTER TABLE orders ADD COLUMN buyer_name TEXT;
ALTER TABLE orders ADD COLUMN buyer_email TEXT;
ALTER TABLE orders ADD COLUMN buyer_wa TEXT;
ALTER TABLE orders ADD COLUMN consent_at INTEGER;
ALTER TABLE orders ADD COLUMN terms_version TEXT;
-- 1 when the buyer accepted the ad cookie bar; Meta CAPI Purchase is sent only then.
ALTER TABLE orders ADD COLUMN meta_consent INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS orders_email ON orders(buyer_email);
