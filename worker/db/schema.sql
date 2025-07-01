-- Database schema for multi-tenant retargeting platform

CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    api_key TEXT NOT NULL,
    plan_type TEXT
);

CREATE TABLE campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    message_text TEXT,
    status TEXT,
    filters_json TEXT,
    quiet_hours_json TEXT,
    nudge_settings_json TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE telegram_sessions (
    account_id INTEGER PRIMARY KEY,
    encrypted_session_data TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE sent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    campaign_id INTEGER NOT NULL,
    user_phone TEXT,
    status TEXT,
    error_details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

CREATE TABLE customer_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    user_phone TEXT,
    category TEXT,
    confidence_score REAL,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE trackable_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    original_url TEXT,
    tracking_code TEXT,
    clicks INTEGER DEFAULT 0,
    revenue REAL DEFAULT 0,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

CREATE TABLE campaign_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    total_sent INTEGER,
    total_clicks INTEGER,
    total_revenue REAL,
    best_performing_lines TEXT,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Temporary storage for ongoing Telegram logins
CREATE TABLE pending_sessions (
    account_id INTEGER PRIMARY KEY,
    phone TEXT,
    session TEXT,
    phone_code_hash TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);
