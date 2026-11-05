CREATE TABLE IF NOT EXISTS waitlist (email TEXT NOT NULL, product TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (email, product));
