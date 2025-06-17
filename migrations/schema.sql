-- D1 schema for retargeting platform
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    api_key TEXT NOT NULL,
    plan_type TEXT NOT NULL
);

CREATE TABLE campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    message_text TEXT NOT NULL,
    status TEXT NOT NULL,
    filters_json TEXT,
    quiet_hours_json TEXT,
    nudge_settings_json TEXT,
    FOREIGN KEY(account_id) REFERENCES accounts(id)
);

CREATE TABLE telegram_sessions (
    account_id INTEGER PRIMARY KEY,
    encrypted_session_data TEXT NOT NULL,
    FOREIGN KEY(account_id) REFERENCES accounts(id)
);

CREATE TABLE sent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    campaign_id INTEGER NOT NULL,
    user_phone TEXT NOT NULL,
    status TEXT NOT NULL,
    error_details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(account_id) REFERENCES accounts(id),
    FOREIGN KEY(campaign_id) REFERENCES campaigns(id)
);

CREATE TABLE customer_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    user_phone TEXT NOT NULL,
    category TEXT NOT NULL,
    confidence_score REAL,
    FOREIGN KEY(account_id) REFERENCES accounts(id)
);

CREATE TABLE trackable_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    original_url TEXT NOT NULL,
    tracking_code TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    revenue REAL DEFAULT 0,
    FOREIGN KEY(campaign_id) REFERENCES campaigns(id)
);

CREATE TABLE campaign_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    total_sent INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_revenue REAL DEFAULT 0,
    best_performing_lines TEXT,
    FOREIGN KEY(campaign_id) REFERENCES campaigns(id)
);
