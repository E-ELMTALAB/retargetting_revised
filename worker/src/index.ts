import { Router } from "itty-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface Env {
  DB: D1Database;
  PYTHON_API_URL: string;
}

const router = Router();

// Temporary type fixes for D1Database and ExecutionContext
type D1Database = any;
type ExecutionContext = any;

const INIT_SCHEMA = `
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    plan_type TEXT
);
CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    telegram_session_id INTEGER,
    message_text TEXT,
    status TEXT,
    filters_json TEXT,
    quiet_hours_json TEXT,
    nudge_settings_json TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (telegram_session_id) REFERENCES telegram_sessions(id)
);
CREATE TABLE IF NOT EXISTS telegram_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    phone TEXT,
    encrypted_session_data TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);
CREATE TABLE IF NOT EXISTS sent_logs (
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
CREATE TABLE IF NOT EXISTS customer_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    user_phone TEXT,
    category TEXT,
    confidence_score REAL,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    name TEXT,
    keywords_json TEXT,
    description TEXT,
    regex_pattern TEXT,
    sample_chats_json TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);
CREATE TABLE IF NOT EXISTS trackable_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    original_url TEXT,
    tracking_code TEXT,
    clicks INTEGER DEFAULT 0,
    revenue REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    total_sent INTEGER,
    total_clicks INTEGER,
    total_revenue REAL,
    best_performing_lines TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
CREATE TABLE IF NOT EXISTS pending_sessions (
    account_id INTEGER PRIMARY KEY,
    phone TEXT,
    session TEXT,
    phone_code_hash TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);
`;

async function ensureSchema(db: D1Database) {
  try {
    await db.exec(INIT_SCHEMA);
    const acctColsRes: any = await db
      .prepare("PRAGMA table_info(accounts)")
      .all();
    const acctCols = Array.isArray(acctColsRes)
      ? acctColsRes
      : acctColsRes.results || [];
    const names = acctCols.map((c: any) => c.name);
    if (!names.includes("password_hash")) {
      console.log("adding password_hash column");
      try {
        await db.exec("ALTER TABLE accounts ADD COLUMN password_hash TEXT");
      } catch (e) {
        console.log("alter accounts error", e);
      }
    }

    const catColsRes: any = await db
      .prepare("PRAGMA table_info(categories)")
      .all();
    const catCols = Array.isArray(catColsRes)
      ? catColsRes
      : catColsRes.results || [];
    const catNames = catCols.map((c: any) => c.name);
    if (!catNames.includes("regex_pattern")) {
      console.log("adding regex_pattern column");
      try {
        await db.exec(
          "ALTER TABLE categories ADD COLUMN regex_pattern TEXT",
        );
      } catch (e) {
        console.log("alter categories error", e);
      }
    }
  } catch (err) {
    console.error("schema init error", err);
  }
}

async function hashPassword(pw: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(pw));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper to return JSON with CORS headers
function jsonResponse(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

interface Chat {
  phone: string;
  messages: string[];
}

// Fetch chats for categorization from the Python API
async function fetchChats(env: Env, session: string): Promise<Chat[]> {
  try {
    const resp = await fetch(`${env.PYTHON_API_URL}/chats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok && data && Array.isArray(data.chats)) {
      console.log(`[CATEGORIZE] fetched ${data.chats.length} chats`);
      return data.chats as Chat[];
    }
    console.log("[CATEGORIZE] no chats returned");
  } catch (err) {
    console.error("fetchChats error", err);
  }
  return [];
}

// Categorize chats based on keywords
async function categorizeChats(
  env: Env,
  accountId: number,
  session: string,
): Promise<void> {
  const catRes: any = await env.DB.prepare(
    "SELECT name, keywords_json FROM categories WHERE account_id=?1",
  )
    .bind(accountId)
    .all();
  const categories = Array.isArray(catRes) ? catRes : catRes.results || [];
  if (!categories.length) {
    console.log("[CATEGORIZE] no categories defined");
    return;
  }
  const chats = await fetchChats(env, session);
  for (const chat of chats) {
    const text = (chat.messages || []).join(" \n").toLowerCase();
    for (const cat of categories) {
      let kws: string[] = [];
      try {
        kws = JSON.parse(cat.keywords_json || "[]");
      } catch {}
      if (!Array.isArray(kws)) kws = [];
      const hit = kws.some((kw) => kw && text.includes(String(kw).toLowerCase()));
      if (hit) {
        const existing = await env.DB.prepare(
          "SELECT id FROM customer_categories WHERE account_id=?1 AND user_phone=?2 AND category=?3",
        )
          .bind(accountId, chat.phone, cat.name)
          .first();
        if (existing && existing.id) {
          await env.DB.prepare(
            "UPDATE customer_categories SET confidence_score=?1 WHERE id=?2",
          )
            .bind(0.8, existing.id)
            .run();
        } else {
          await env.DB.prepare(
            "INSERT INTO customer_categories (account_id, user_phone, category, confidence_score) VALUES (?1, ?2, ?3, ?4)",
          )
            .bind(accountId, chat.phone, cat.name, 0.8)
            .run();
        }
        console.log(
          `[CATEGORIZE] user ${chat.phone} matched category ${cat.name}`,
        );
      }
    }
  }
}

// Sign up new account
router.post("/auth/signup", async (request: Request, env: Env) => {
  const { email, password } = (await request.json()) as any;
  console.log("POST /auth/signup", email);
  if (!email || !password) {
    return jsonResponse({ error: "missing parameters" }, 400);
  }
  const hash = await hashPassword(password);
  try {
    const colRes: any = await env.DB.prepare(
      "PRAGMA table_info(accounts)",
    ).all();
    const cols = Array.isArray(colRes) ? colRes : colRes.results || [];
    const names = cols.map((c: any) => c.name);
    const fields = ["email", "plan_type"];
    const placeholders = ["?1", "?2"];
    const values: any[] = [email, "basic"];
    let idx = 3;
    if (names.includes("password_hash")) {
      fields.push("password_hash");
      placeholders.push("?" + idx);
      values.push(hash);
      idx++;
    }
    const sql = `INSERT INTO accounts (${fields.join(", ")}) VALUES (${placeholders.join(", ")})`;
    console.log("signup query", sql);
    const res = await env.DB.prepare(sql)
      .bind(...values)
      .run();
    console.log("created account id", res.lastRowId);
    return jsonResponse({ id: res.lastRowId });
  } catch (err: any) {
    console.error("/auth/signup error", err);
    if ((err.message || "").includes("UNIQUE")) {
      return jsonResponse({ error: "account exists" }, 409);
    }
    return jsonResponse({ error: "db error" }, 500);
  }
});

// Authentication - simple login
router.post("/auth/login", async (request: Request, env: Env) => {
  const { email, password } = (await request.json()) as any;
  console.log("POST /auth/login", email);
  if (!email || !password) {
    return jsonResponse({ error: "missing parameters" }, 400);
  }
  const hash = await hashPassword(password);
  let row;
  try {
    row = await env.DB.prepare(
      "SELECT id, password_hash FROM accounts WHERE email=?1",
    )
      .bind(email)
      .first();
  } catch (err) {
    console.error("/auth/login query error", err);
    return jsonResponse({ error: "db error" }, 500);
  }
  if (row && row.password_hash && row.password_hash === hash) {
    console.log("login success for account", row.id);
    return jsonResponse({ id: row.id });
  }
  console.log("login failed for", email);
  return jsonResponse({ error: "invalid credentials" }, 401);
});

// Begin Telegram session - send code
router.post("/session/connect", async (request: Request, env: Env) => {
  const { phone, account_id } = (await request.json()) as any;
  console.log("worker /session/connect phone", phone, "account", account_id);
  const accountId = Number(account_id || 0);
  if (!accountId) {
    return new Response(JSON.stringify({ error: "account_id required" }), {
      status: 400,
    });
  }

  let resp;
  try {
    resp = await fetch(`${env.PYTHON_API_URL}/session/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
  } catch (err) {
    console.error("worker connect fetch error", err);
    return new Response(
      JSON.stringify({
        error: "Failed to contact API",
        details:
          err && ((err as any).stack || (err as any).message || err.toString()),
      }),
      { status: 500 },
    );
  }
  console.log("python api response status", resp.status);
  let data;
  try {
    data = await resp.json();
  } catch (err) {
    console.error("worker connect json error", err);
    return new Response(
      JSON.stringify({
        error: "Bad response from API",
        details:
          err && ((err as any).stack || (err as any).message || err.toString()),
      }),
      { status: 500 },
    );
  }
  console.log("python api response body", data);
  if (!resp.ok) {
    console.error("worker /session/connect python api error", data);
    return new Response(
      JSON.stringify({ error: "Python API error", details: data }),
      { status: resp.status },
    );
  }
  if (!(data && (data as any).session && (data as any).phone_code_hash)) {
    console.error(
      "worker /session/connect missing session or phone_code_hash",
      data,
    );
    return new Response(
      JSON.stringify({ error: "Failed to send code", details: data }),
      { status: 500 },
    );
  }
  try {
    await env.DB.prepare(
      "INSERT OR REPLACE INTO pending_sessions (account_id, phone, session, phone_code_hash) VALUES (?1, ?2, ?3, ?4)",
    )
      .bind(
        accountId,
        phone,
        (data as any).session,
        (data as any).phone_code_hash,
      )
      .run();
  } catch (err) {
    console.error("worker /session/connect DB error", err);
    return new Response(
      JSON.stringify({
        error: "DB error",
        details:
          err && ((err as any).stack || (err as any).message || err.toString()),
      }),
      { status: 500 },
    );
  }
  return new Response(JSON.stringify({ status: "code_sent" }), {
    headers: { "Content-Type": "application/json" },
  });
});

// Verify telegram login code
router.post("/session/verify", async (request: Request, env: Env) => {
  const { phone, code, account_id } = (await request.json()) as any;
  console.log(
    "worker /session/verify phone",
    phone,
    "code",
    code,
    "account",
    account_id,
  );
  const accountId = Number(account_id || 0);
  if (!accountId) {
    return new Response("account_id required", { status: 400 });
  }
  const row = await env.DB.prepare(
    "SELECT phone, session, phone_code_hash FROM pending_sessions WHERE account_id=?1",
  )
    .bind(accountId)
    .first();

  if (!row) {
    return new Response("No pending session", { status: 400 });
  }

  let resp;
  try {
    resp = await fetch(`${env.PYTHON_API_URL}/session/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        code,
        session: row.session,
        phone_code_hash: row.phone_code_hash,
      }),
    });
  } catch (err) {
    console.error("worker verify fetch error", err);
    return new Response("Failed to contact API", { status: 500 });
  }

  console.log("python api verify status", resp.status);

  let data;
  try {
    data = await resp.json();
  } catch (err) {
    console.error("worker verify json error", err);
    return new Response("Bad response from API", { status: 500 });
  }

  console.log("python api verify body", data);
  if (!resp.ok) {
    return new Response(JSON.stringify(data), { status: resp.status });
  }

  const insertRes = await env.DB.prepare(
    "INSERT INTO telegram_sessions (account_id, phone, encrypted_session_data) VALUES (?1, ?2, ?3)",
  )
    .bind(accountId, row.phone, (data as any).session)
    .run();
  const newSessionId = insertRes.lastRowId;
  console.log("stored session id", newSessionId);

  await env.DB.prepare("DELETE FROM pending_sessions WHERE account_id=?1")
    .bind(accountId)
    .run();

  return new Response(
    JSON.stringify({ status: "connected", session_id: newSessionId }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
});

// Check if a telegram session exists for the account
router.get("/session/status", async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const accountId = Number(url.searchParams.get("account_id") || 0);
  console.log("GET /session/status account", accountId);
  if (!accountId) {
    return new Response(JSON.stringify({ error: "account_id required" }), {
      status: 400,
    });
  }
  const { results } = await env.DB.prepare(
    "SELECT id, phone FROM telegram_sessions WHERE account_id=?1",
  )
    .bind(accountId)
    .all();
  const sessions = Array.isArray(results) ? results : results.results || [];
  console.log("session list", sessions);
  return new Response(JSON.stringify({ sessions }), {
    headers: { "Content-Type": "application/json" },
  });
});

// Campaign creation placeholder
router.post("/campaigns", async (request: Request, env: Env) => {
  const { account_id, telegram_session_id, message_text, chat_start_time, chat_start_time_cmp, newest_chat_time, newest_chat_time_cmp, sleep_time } =
    (await request.json()) as any;
  console.log("POST /campaigns", { account_id, telegram_session_id });
  const accountId = Number(account_id || 0);
  if (!accountId || !telegram_session_id || !message_text) {
    return jsonResponse({ error: "missing parameters" }, 400);
  }

  const filters = {
    chat_start_time,
    chat_start_time_cmp,
    newest_chat_time,
    newest_chat_time_cmp,
    sleep_time,
  };
  const res = await env.DB.prepare(
    "INSERT INTO campaigns (account_id, telegram_session_id, message_text, status, filters_json) VALUES (?1, ?2, ?3, ?4, ?5)",
  )
    .bind(accountId, telegram_session_id, message_text, "created", JSON.stringify(filters))
    .run();

  return jsonResponse({ id: res.lastRowId });
});

// List campaigns for an account
router.get("/campaigns", async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const accountId = Number(url.searchParams.get("account_id") || 0);
  if (!accountId) return jsonResponse({ error: "account_id required" }, 400);

  const { results } = await env.DB.prepare(
    `SELECT c.id, c.message_text, c.status, c.filters_json, c.telegram_session_id, t.phone as session_phone, a.email as account_email
     FROM campaigns c
     LEFT JOIN telegram_sessions t ON c.telegram_session_id = t.id
     LEFT JOIN accounts a ON c.account_id = a.id
     WHERE c.account_id=?1 ORDER BY c.id DESC`
  )
    .bind(accountId)
    .all();
  const rows = Array.isArray(results) ? results : results.results || [];
  return jsonResponse({ campaigns: rows });
});

// Start campaign - schedule job
router.post("/campaigns/:id/start", async ({ params, request }, env: Env) => {
  const id = Number(params?.id || 0);
  console.log("POST /campaigns/:id/start", id);
  console.log("Fetching campaign details for", id);
  if (!id) return jsonResponse({ error: "invalid id" }, 400);

  const row = await env.DB.prepare(
    `SELECT c.id, c.account_id, c.message_text, c.telegram_session_id, c.filters_json, t.encrypted_session_data
     FROM campaigns c JOIN telegram_sessions t ON c.telegram_session_id=t.id
     WHERE c.id=?1`,
  )
    .bind(id)
    .first();

  console.log("Campaign row:", row);
  if (!row) return jsonResponse({ error: "not found" }, 404);

  if (!row.encrypted_session_data) {
    console.error("No session data found for campaign", id);
    return jsonResponse({ error: "no session data found" }, 400);
  }

  // Categorize users based on chat history before sending
  try {
    await categorizeChats(env, row.account_id, row.encrypted_session_data);
  } catch (e) {
    console.error("categorizeChats error", e);
  }

  let limit: number | undefined;
  try {
    const body = await request.json();
    limit = Number(body?.limit);
    if (!Number.isFinite(limit) || limit <= 0) limit = undefined;
  } catch (err) {
    limit = undefined;
  }

  let filters = {};
  try {
    filters = row.filters_json ? JSON.parse(row.filters_json) : {};
  } catch {}

  // Log the request being sent to Python API
  const requestBody = {
    session: row.encrypted_session_data,
    message: row.message_text,
    account_id: row.account_id,
    campaign_id: row.id,
    ...(limit ? { limit } : {}),
    ...filters,
  };
  console.log("Sending to Python API:", {
    ...requestBody,
    session: row.encrypted_session_data
      ? row.encrypted_session_data.substring(0, 50) + "..."
      : "null",
  });

  await env.DB.prepare("UPDATE campaigns SET status=?1 WHERE id=?2")
    .bind("running", id)
    .run();
  console.log("campaign", id, "status set to running");

  let resp: Response;
  try {
    resp = await fetch(`${env.PYTHON_API_URL}/execute_campaign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    console.log("execute_campaign response status", resp.status);
  } catch (err) {
    console.error("fetch execute_campaign error", err);
    return jsonResponse(
      {
        error: "api request failed",
        details:
          err && ((err as any).stack || (err as any).message || err.toString()),
      },
      500,
    );
  }

  const data = await resp.json().catch(() => ({}));
  console.log("execute_campaign response data:", data);
  if (!resp.ok) {
    console.error("Python API returned error:", data);
    return jsonResponse({ error: "python error", details: data }, resp.status);
  }

  return jsonResponse({ status: "started", result: data });
});

// Stop a running campaign (POST and GET, with and without trailing slash)
const stopCampaignHandler = async ({ params }: { params: any }, env: Env) => {
  const logs: string[] = [];
  const id = Number(params?.id || 0);
  logs.push(`[STOP] Called for campaign id: ${id}`);
  if (!id) {
    logs.push("[STOP] Invalid id");
    return jsonResponse({ error: "invalid id", logs }, 400);
  }

  let resp: Response;
  try {
    logs.push(
      `[STOP] Sending request to Python API: ${env.PYTHON_API_URL}/stop_campaign/${id}`,
    );
    resp = await fetch(`${env.PYTHON_API_URL}/stop_campaign/${id}`, {
      method: "POST",
    });
    logs.push(`[STOP] Python API response status: ${resp.status}`);
  } catch (err) {
    logs.push(
      `[STOP] Fetch error: ${err && ((err as any).stack || (err as any).message || err.toString())}`,
    );
    return jsonResponse({ error: "api request failed", logs }, 500);
  }

  const data = await resp.json().catch((e) => {
    logs.push(`[STOP] JSON parse error: ${e}`);
    return {};
  });
  logs.push(`[STOP] Python API response data: ${JSON.stringify(data)}`);
  if (!resp.ok) {
    logs.push("[STOP] Python API returned error");
    return jsonResponse(
      { error: "python error", details: data, logs },
      resp.status,
    );
  }

  try {
    await env.DB.prepare("UPDATE campaigns SET status=?1 WHERE id=?2")
      .bind("stopped", id)
      .run();
    logs.push(`[STOP] Campaign ${id} status set to stopped in DB`);
  } catch (err) {
    logs.push(
      `[STOP] DB update error: ${err && ((err as any).stack || (err as any).message || err.toString())}`,
    );
    return jsonResponse({ error: "db error", logs }, 500);
  }

  logs.push(`[STOP] Success for campaign ${id}`);
  return jsonResponse({ status: "stopped", result: data, logs });
};
router.post("/campaigns/:id/stop", stopCampaignHandler);
router.post("/campaigns/:id/stop/", stopCampaignHandler);
router.get("/campaigns/:id/stop", stopCampaignHandler);
router.get("/campaigns/:id/stop/", stopCampaignHandler);

// Get campaign data for editing
router.get("/campaigns/:id/data", async ({ params }, env: Env) => {
  const id = Number(params?.id || 0);
  if (!id) return jsonResponse({ error: "invalid id" }, 400);

  try {
    const resp = await fetch(`${env.PYTHON_API_URL}/campaign_data/${id}`);
    const data = await resp.json();
    
    if (!resp.ok) {
      return jsonResponse({ error: "python error", details: data }, resp.status);
    }
    
    return jsonResponse(data);
  } catch (err) {
    console.error("get campaign data error", err);
    return jsonResponse({ error: "api request failed" }, 500);
  }
});

// Update campaign data
router.post("/campaigns/:id/update", async ({ params, request }, env: Env) => {
  const id = Number(params?.id || 0);
  if (!id) return jsonResponse({ error: "invalid id" }, 400);

  try {
    const body = await request.json();
    const resp = await fetch(`${env.PYTHON_API_URL}/update_campaign/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    const data = await resp.json();
    if (!resp.ok) {
      return jsonResponse({ error: "python error", details: data }, resp.status);
    }
    
    return jsonResponse(data);
  } catch (err) {
    console.error("update campaign error", err);
    return jsonResponse({ error: "api request failed" }, 500);
  }
});

// Resume campaign
router.post("/campaigns/:id/resume", async ({ params }, env: Env) => {
  const id = Number(params?.id || 0);
  if (!id) return jsonResponse({ error: "invalid id" }, 400);

  let row: any;
  try {
    row = await env.DB.prepare(
      `SELECT c.account_id, t.encrypted_session_data FROM campaigns c JOIN telegram_sessions t ON c.telegram_session_id=t.id WHERE c.id=?1`,
    )
      .bind(id)
      .first();
  } catch {}

  if (row && row.encrypted_session_data) {
    try {
      await categorizeChats(env, row.account_id, row.encrypted_session_data);
    } catch (e) {
      console.error("categorizeChats error", e);
    }
  }

  try {
    const resp = await fetch(`${env.PYTHON_API_URL}/resume_campaign/${id}`, {
      method: "POST",
    });
    
    const data = await resp.json();
    if (!resp.ok) {
      return jsonResponse({ error: "python error", details: data }, resp.status);
    }
    
    // Update campaign status in DB
    await env.DB.prepare("UPDATE campaigns SET status=?1 WHERE id=?2")
      .bind("running", id)
      .run();
    
    return jsonResponse(data);
  } catch (err) {
    console.error("resume campaign error", err);
    return jsonResponse({ error: "api request failed" }, 500);
  }
});

// List categories
router.get("/categories", async (request: Request, env: Env) => {
  const accountId = 1;
  let logs = [];
  try {
    logs.push(`GET /categories account ${accountId}`);
    const { results } = await env.DB.prepare(
      "SELECT id, name, keywords_json, description, regex_pattern, sample_chats_json FROM categories WHERE account_id=?1",
    )
      .bind(accountId)
      .all();
    logs.push(`categories results: ${JSON.stringify(results)}`);
    return new Response(JSON.stringify({ categories: results, logs }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    const e = err as any;
    logs.push(`ERROR: ${e && (e.stack || e.message || e.toString())}`);
    return new Response(JSON.stringify({ error: "failed to fetch categories", logs }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

// Create category
router.post("/categories", async (request: Request, env: Env) => {
  const { name, keywords, description, regex, examples } =
    (await request.json()) as any;
  const accountId = 1;
  console.log("POST /categories", {
    name,
    keywords,
    description,
    regex,
    examples,
  });

  const res = await env.DB.prepare(
    "INSERT INTO categories (account_id, name, keywords_json, description, regex_pattern, sample_chats_json) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
  )
    .bind(
      accountId,
      name,
      JSON.stringify(keywords || []),
      description || "",
      regex || null,
      JSON.stringify(examples || []),
    )

    .run();
  console.log("inserted category id", res.lastRowId);

  return new Response(JSON.stringify({ id: res.lastRowId }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});

// Update category
router.put("/categories/:id", async ({ params, request }: any, env: Env) => {
  const id = Number(params?.id || 0);
  if (!id) return jsonResponse({ error: "invalid id" }, 400);
  const { name, keywords, description, regex, examples } =
    (await request.json()) as any;
  const accountId = 1;
  await env.DB.prepare(
    "UPDATE categories SET name=?1, keywords_json=?2, description=?3, regex_pattern=?4, sample_chats_json=?5 WHERE id=?6 AND account_id=?7",
  )
    .bind(
      name,
      JSON.stringify(keywords || []),
      description || "",
      regex || null,
      JSON.stringify(examples || []),
      id,
      accountId,
    )
    .run();
  return jsonResponse({ id });
});

// Delete category
router.delete("/categories/:id", async ({ params }: any, env: Env) => {
  const id = Number(params?.id || 0);
  if (!id) return jsonResponse({ error: "invalid id" }, 400);
  const accountId = 1;
  await env.DB.prepare(
    "DELETE FROM categories WHERE id=?1 AND account_id=?2",
  )
    .bind(id, accountId)
    .run();
  return jsonResponse({ id, deleted: true });
});

// Analytics summary
router.get("/analytics/summary", async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const accountId = Number(url.searchParams.get("account_id") || 0);
  const sessionId = Number(url.searchParams.get("session_id") || 0);

  console.log(
    "GET /analytics/summary account",
    accountId,
    "session",
    sessionId,
  );
  try {
    const totalRow = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM sent_logs s JOIN campaigns c ON s.campaign_id=c.id WHERE c.account_id=?1${sessionId ? " AND c.telegram_session_id=?2" : ""}`,
    )
      .bind(accountId, sessionId)
      .first();
    console.log("totalRow", totalRow);

    const successRow = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM sent_logs s JOIN campaigns c ON s.campaign_id=c.id WHERE c.account_id=?1 AND s.status='sent'${sessionId ? " AND c.telegram_session_id=?2" : ""}`,
    )
      .bind(accountId, sessionId)
      .first();
    console.log("successRow", successRow);

    const failRow = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM sent_logs s JOIN campaigns c ON s.campaign_id=c.id WHERE c.account_id=?1 AND s.status!='sent'${sessionId ? " AND c.telegram_session_id=?2" : ""}`,
    )
      .bind(accountId, sessionId)
      .first();
    console.log("failRow", failRow);

    const revenueRow = await env.DB.prepare(
      `SELECT SUM(revenue) as rev FROM trackable_links tl JOIN campaigns c ON c.id=tl.campaign_id WHERE c.account_id=?1${sessionId ? " AND c.telegram_session_id=?2" : ""}`,
    )
      .bind(accountId, sessionId)
      .first();
    console.log("revenueRow", revenueRow);

    const categoryRowsResult = await env.DB.prepare(
      `SELECT category, COUNT(*) as count FROM customer_categories WHERE account_id=?1 GROUP BY category`,
    )
      .bind(accountId)
      .all();
    const categoryRows = Array.isArray(categoryRowsResult)
      ? categoryRowsResult
      : categoryRowsResult.results || [];
    console.log("categoryRows", categoryRows);

    const campaignRowsResult = await env.DB.prepare(
      `SELECT c.id, c.message_text, COALESCE(a.total_sent,0) as total_sent, c.telegram_session_id FROM campaigns c LEFT JOIN campaign_analytics a ON c.id=a.campaign_id WHERE c.account_id=?1${sessionId ? " AND c.telegram_session_id=?2" : ""}`,
    )
      .bind(accountId, sessionId)
      .all();
    const campaignRows = Array.isArray(campaignRowsResult)
      ? campaignRowsResult
      : campaignRowsResult.results || [];
    console.log("campaignRows", campaignRows);

    let revenueDayRows = [];
    try {
      revenueDayRows = await env.DB.prepare(
        `SELECT strftime("%Y-%m-%d", tl.created_at) as day, SUM(tl.revenue) as rev FROM trackable_links tl JOIN campaigns c ON c.id=tl.campaign_id WHERE c.account_id=?1${sessionId ? " AND c.telegram_session_id=?2" : ""} GROUP BY day ORDER BY day`,
      )
        .bind(accountId, sessionId)
        .all();
      if (!Array.isArray(revenueDayRows)) revenueDayRows = [];
    } catch (e) {
      console.error("revenueDayRows query failed", e);
      revenueDayRows = [];
    }
    console.log("revenueDayRows", revenueDayRows);

    const metrics = {
      messages_sent: totalRow?.cnt || 0,
      successes: successRow?.cnt || 0,
      failures: failRow?.cnt || 0,
      revenue: revenueRow?.rev || 0,
    };
    console.log("metrics", metrics);

    return new Response(
      JSON.stringify({
        metrics,
        categories: categoryRows,
        campaigns: campaignRows,
        revenueByDay: revenueDayRows,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("/analytics/summary error", err);
    return new Response(JSON.stringify({ error: "analytics failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

router.get("/campaigns/:id/analytics", async ({ params }, env: Env) => {
  const row = await env.DB.prepare(
    "SELECT * FROM campaign_analytics WHERE campaign_id=?1",
  )
    .bind(params?.id)
    .first();
  return new Response(JSON.stringify({ analytics: row }), {
    headers: { "Content-Type": "application/json" },
  });
});

// Fetch logs for a campaign from the Python API (GET, with and without trailing slash)
const campaignLogsHandler = async ({ params }: { params: any }, env: Env) => {
  const id = Number(params?.id || 0);
  if (!id) {
    return jsonResponse({ error: "invalid id" }, 400);
  }
  let resp: Response;
  try {
    resp = await fetch(`${env.PYTHON_API_URL}/campaign_logs/${id}`);
  } catch (err) {
    return jsonResponse({ error: "api request failed" }, 500);
  }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return jsonResponse({ error: "python error", details: data }, resp.status);
  }
  // Only forward the actual logs/status from Python API
  return jsonResponse(data);
};
router.get("/campaigns/:id/logs", campaignLogsHandler);
router.get("/campaigns/:id/logs/", campaignLogsHandler);

// Get campaign status from Python API (GET, with and without trailing slash)
const campaignStatusHandler = async ({ params }: { params: any }, env: Env) => {
  const logs: string[] = [];
  const id = Number(params?.id || 0);
  logs.push(`[STATUS] Called for campaign id: ${id}`);
  if (!id) {
    logs.push("[STATUS] Invalid id");
    return jsonResponse({ error: "invalid id", logs }, 400);
  }
  let resp: Response;
  try {
    logs.push(
      `[STATUS] Fetching status from Python API: ${env.PYTHON_API_URL}/campaign_status/${id}`,
    );
    resp = await fetch(`${env.PYTHON_API_URL}/campaign_status/${id}`);
    logs.push(`[STATUS] Python API response status: ${resp.status}`);
  } catch (err) {
    logs.push(
      `[STATUS] Fetch error: ${err && ((err as any).stack || (err as any).message || err.toString())}`,
    );
    return jsonResponse({ error: "api request failed", logs }, 500);
  }
  const data = await resp.json().catch((e) => {
    logs.push(`[STATUS] JSON parse error: ${e}`);
    return {};
  });
  logs.push(`[STATUS] Python API response data: ${JSON.stringify(data)}`);
  if (!resp.ok) {
    logs.push("[STATUS] Python API returned error");
    return jsonResponse(
      { error: "python error", details: data, logs },
      resp.status,
    );
  }
  logs.push(`[STATUS] Success for campaign ${id}`);
  const safeData =
    data && typeof data === "object" && !Array.isArray(data) ? data : { data };
  return jsonResponse({ ...safeData, logs });
};
router.get("/campaigns/:id/status", campaignStatusHandler);
router.get("/campaigns/:id/status/", campaignStatusHandler);

// Debug endpoint to check recipients and add test data
router.get("/debug/recipients", async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const accountId = Number(url.searchParams.get("account_id") || 1);

  console.log("GET /debug/recipients for account", accountId);

  // Check existing recipients
  const existingRecipients = await env.DB.prepare(
    "SELECT user_phone, category FROM customer_categories WHERE account_id=?1",
  )
    .bind(accountId)
    .all();
  const recipients = Array.isArray(existingRecipients)
    ? existingRecipients
    : existingRecipients.results || [];

  console.log("Existing recipients:", recipients);

  // If no recipients, add some test data
  if (recipients.length === 0) {
    console.log("No recipients found, adding test data");
    const testRecipients = [
      "+1234567890",
      "+9876543210",
      "+5555555555",
      "+1111111111",
      "+2222222222",
    ];

    for (const phone of testRecipients) {
      await env.DB.prepare(
        "INSERT INTO customer_categories (account_id, user_phone, category, confidence_score) VALUES (?1, ?2, ?3, ?4)",
      )
        .bind(accountId, phone, "test_category", 0.8)
        .run();
    }

    console.log("Added test recipients:", testRecipients);

    return jsonResponse({
      message: "Added test recipients",
      recipients: testRecipients,
      account_id: accountId,
    });
  }

  return jsonResponse({
    message: "Recipients found",
    recipients: recipients.map((r: any) => ({
      phone: r.user_phone,
      category: r.category,
    })),
    count: recipients.length,
    account_id: accountId,
  });
});

// Debug endpoint to check campaign details
router.get("/debug/campaign/:id", async ({ params }, env: Env) => {
  const id = Number(params?.id || 0);
  console.log("GET /debug/campaign/:id", id);

  if (!id) return jsonResponse({ error: "invalid id" }, 400);

  const campaign = await env.DB.prepare(
    `SELECT c.*, t.phone as session_phone, t.encrypted_session_data
     FROM campaigns c 
     LEFT JOIN telegram_sessions t ON c.telegram_session_id=t.id
     WHERE c.id=?1`,
  )
    .bind(id)
    .first();

  if (!campaign) return jsonResponse({ error: "campaign not found" }, 404);

  const recipients = await env.DB.prepare(
    "SELECT user_phone FROM customer_categories WHERE account_id=?1",
  )
    .bind(campaign.account_id)
    .all();
  const recipientList = Array.isArray(recipients)
    ? recipients
    : recipients.results || [];

  const sentLogs = await env.DB.prepare(
    "SELECT user_phone, status FROM sent_logs WHERE campaign_id=?1",
  )
    .bind(id)
    .all();
  const sentList = Array.isArray(sentLogs) ? sentLogs : sentLogs.results || [];

  return jsonResponse({
    campaign: {
      id: campaign.id,
      account_id: campaign.account_id,
      message_text: campaign.message_text,
      status: campaign.status,
      telegram_session_id: campaign.telegram_session_id,
      session_phone: campaign.session_phone,
      has_session_data: !!campaign.encrypted_session_data,
    },
    recipients: {
      total: recipientList.length,
      phones: recipientList.map((r: any) => r.user_phone),
    },
    sent_logs: {
      total: sentList.length,
      sent: sentList.filter((r: any) => r.status === "sent").length,
      failed: sentList.filter((r: any) => r.status !== "sent").length,
      logs: sentList,
    },
  });
});

// Add a /test endpoint for deployment debugging
router.all("/test", (request: Request) => {
  return jsonResponse({ ok: true, method: request.method, url: request.url });
});

// Add a catch-all logger for unmatched routes
router.all("*", (request: Request) => {
  const logs = [
    `[CATCH-ALL] Unmatched route: ${request.method} ${request.url}`,
  ];
  return jsonResponse({ error: "Not Found", logs }, 404);
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    if (request.method === "OPTIONS") {
      return new Response("", { status: 204, headers: corsHeaders });
    }

    await ensureSchema(env.DB);

    console.log(
      "incoming request",
      request.method,
      new URL(request.url).pathname,
    );

    let resp: Response;
    try {
      resp = await router.handle(request, env, ctx);
      if (!resp) {
        resp = new Response("Not Found", { status: 404 });
      }
    } catch (err) {
      console.error("router error", err);
      resp = new Response("Internal Error", { status: 500 });
    }
    resp.headers.set("Access-Control-Allow-Origin", "*");
    resp.headers.set("Access-Control-Allow-Headers", "Content-Type");
    resp.headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    return resp;
  },
};
