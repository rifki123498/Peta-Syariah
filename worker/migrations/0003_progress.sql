-- Opt-in server copy of a buyer's plan so it can be restored on another device with the access code (order id).
CREATE TABLE IF NOT EXISTS progress (order_id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL);
