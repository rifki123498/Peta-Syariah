-- Anonymous product events (no names, no money amounts).
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT,
  name TEXT NOT NULL,
  anon_id TEXT,
  arm INTEGER,
  price INTEGER,
  ref TEXT,
  url TEXT,
  props TEXT,
  ua TEXT,
  country TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_name_time ON events(name, created_at);
CREATE INDEX IF NOT EXISTS idx_events_anon ON events(anon_id);

-- Checkout attempts and payments.
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  anon_id TEXT,
  price INTEGER NOT NULL,
  arm INTEGER,
  ref TEXT,
  mode TEXT NOT NULL,            -- 'invoice' | 'waitlist'
  status TEXT NOT NULL,          -- 'pending' | 'paid' | 'expired' | 'failed' | 'waitlist'
  provider_ref TEXT,
  invoice_url TEXT,
  created_at INTEGER NOT NULL,
  paid_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_orders_anon ON orders(anon_id);
