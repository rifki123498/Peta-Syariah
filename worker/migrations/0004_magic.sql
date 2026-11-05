-- Magic-link tokens for the "Laporanku" page (email → link → list of paid reports).
CREATE TABLE IF NOT EXISTS magic (token TEXT PRIMARY KEY, email TEXT NOT NULL, expires_at INTEGER NOT NULL);
