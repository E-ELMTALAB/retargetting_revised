INSERT INTO accounts (id, email, api_key, plan_type) VALUES
  (1, 'demo@example.com', 'demo_key', 'free');

INSERT INTO campaigns (id, account_id, message_text, status, filters_json, quiet_hours_json, nudge_settings_json)
VALUES
  (1, 1, 'Hello {{first_name}}, check out our sale!', 'completed', '{}', '{}', '{}');

-- Some sent logs for analytics
INSERT INTO sent_logs (account_id, campaign_id, user_phone, status, error_details)
VALUES
  (1, 1, '+10000000001', 'sent', NULL),
  (1, 1, '+10000000002', 'sent', NULL),
  (1, 1, '+10000000003', 'failed', 'blocked'),
  (1, 1, '+10000000004', 'sent', NULL),
  (1, 1, '+10000000005', 'sent', NULL);

-- Sample trackable link
INSERT INTO trackable_links (campaign_id, original_url, tracking_code, clicks, revenue, created_at)
VALUES
  (1, 'https://example.com', 'abc123', 5, 200.0, '2025-07-01 12:00:00');

-- Campaign analytics summary
INSERT INTO campaign_analytics (campaign_id, total_sent, total_clicks, total_revenue, best_performing_lines)
VALUES
  (1, 5, 5, 200.0, '["Great deal today"]');

-- Category definitions
INSERT INTO categories (account_id, name, keywords_json, description, sample_chats_json)
VALUES
  (1, 'Buyer', '["bought","purchased"]', 'Users who recently purchased', '["I bought this","Thanks for the product"]'),
  (1, 'Browser', '["looking","interested"]', 'Potential customers browsing products', '["I am looking at your site","Just checking"]'),
  (1, 'Refund Risk', '["refund","return"]', 'Users asking about refunds', '["I want a refund","What is your return policy?"]');

-- Customer category assignments
INSERT INTO customer_categories (account_id, user_phone, category, confidence_score)
VALUES
  (1, '+10000000001', 'Buyer', 0.9),
  (1, '+10000000002', 'Browser', 0.8),
  (1, '+10000000003', 'Refund Risk', 0.95),
  (1, '+10000000004', 'Buyer', 0.85),
  (1, '+10000000005', 'Browser', 0.75);
