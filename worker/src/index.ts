import { Router } from 'itty-router'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

interface Env {
  DB: D1Database
  PYTHON_API_URL: string
}

const router = Router()

// Authentication - placeholder
router.post('/auth/login', async (request: Request) => {
  // TODO: implement JWT issuance
  return new Response(JSON.stringify({ token: 'TODO' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// Begin Telegram session - send code
router.post('/session/connect', async (request: Request, env: Env) => {
  const { phone } = await request.json()
  console.log('worker /session/connect phone', phone)
  const accountId = 1

  let resp
  try {
    resp = await fetch(`${env.PYTHON_API_URL}/session/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    })
  } catch (err) {
    console.error('worker connect fetch error', err)
    return new Response('Failed to contact API', { status: 500 })
  }
  console.log('python api response status', resp.status)
  let data
  try {
    data = await resp.json()
  } catch (err) {
    console.error('worker connect json error', err)
    return new Response('Bad response from API', { status: 500 })
  }
  console.log('python api response body', data)
  if (!resp.ok) {
    return new Response(JSON.stringify(data), { status: resp.status })
  }

  await env.DB.prepare(
    'INSERT OR REPLACE INTO pending_sessions (account_id, phone, session, phone_code_hash) VALUES (?1, ?2, ?3, ?4)'
  )
    .bind(accountId, phone, data.session, data.phone_code_hash)
    .run()
  return new Response(JSON.stringify({ status: 'code_sent' }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

// Verify telegram login code
router.post('/session/verify', async (request: Request, env: Env) => {
  const { phone, code } = await request.json()
  console.log('worker /session/verify phone', phone, 'code', code)
  const accountId = 1
  const row = await env.DB.prepare(
    'SELECT session, phone_code_hash FROM pending_sessions WHERE account_id=?1'
  )
    .bind(accountId)
    .first<any>()

  if (!row) {
    return new Response('No pending session', { status: 400 })
  }

  let resp
  try {
    resp = await fetch(`${env.PYTHON_API_URL}/session/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        code,
        session: row.session,
        phone_code_hash: row.phone_code_hash
      })
    })
  } catch (err) {
    console.error('worker verify fetch error', err)
    return new Response('Failed to contact API', { status: 500 })
  }

  console.log('python api verify status', resp.status)


  let data
  try {
    data = await resp.json()
  } catch (err) {
    console.error('worker verify json error', err)
    return new Response('Bad response from API', { status: 500 })
  }

  console.log('python api verify body', data)
  if (!resp.ok) {
    return new Response(JSON.stringify(data), { status: resp.status })
  }

  await env.DB.prepare(
    'INSERT OR REPLACE INTO telegram_sessions (account_id, encrypted_session_data) VALUES (?1, ?2)'
  )
    .bind(accountId, data.session)
    .run()

  await env.DB.prepare('DELETE FROM pending_sessions WHERE account_id=?1')
    .bind(accountId)
    .run()

  return new Response(JSON.stringify({ status: 'connected' }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

// Campaign creation placeholder
router.post('/campaigns', async (request: Request) => {
  // TODO: validate JWT and create campaign in D1
  return new Response(JSON.stringify({ status: 'created' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// Start campaign - schedule job
router.post('/campaigns/:id/start', async ({ params }) => {
  // TODO: enqueue job payload to worker queue for Python API
  return new Response(JSON.stringify({ status: 'scheduled', id: params?.id }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// List categories
router.get('/categories', async (request: Request, env: Env) => {
  const accountId = 1
  const { results } = await env.DB.prepare(

    'SELECT id, name, keywords_json, description, sample_chats_json FROM categories WHERE account_id=?1'

  )
    .bind(accountId)
    .all<any>()
  return new Response(JSON.stringify({ categories: results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// Create category
router.post('/categories', async (request: Request, env: Env) => {

  const { name, keywords, description, examples } = await request.json()
  const accountId = 1
  const res = await env.DB.prepare(
    'INSERT INTO categories (account_id, name, keywords_json, description, sample_chats_json) VALUES (?1, ?2, ?3, ?4, ?5)'
  )
    .bind(accountId, name, JSON.stringify(keywords || []), description || '', JSON.stringify(examples || []))

    .run()
  return new Response(JSON.stringify({ id: res.lastRowId }), {
    headers: { 'Content-Type': 'application/json' },
  })
})


// Analytics summary
router.get('/analytics/summary', async (request: Request, env: Env) => {
  const accountId = 1
  const totalRow = await env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM sent_logs WHERE account_id=?1'
  )
    .bind(accountId)
    .first<any>()
  const successRow = await env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM sent_logs WHERE account_id=?1 AND status='sent'"
  )
    .bind(accountId)
    .first<any>()
  const failRow = await env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM sent_logs WHERE account_id=?1 AND status!='sent'"
  )
    .bind(accountId)
    .first<any>()
  const revenueRow = await env.DB.prepare(
    'SELECT SUM(revenue) as rev FROM trackable_links tl JOIN campaigns c ON c.id=tl.campaign_id WHERE c.account_id=?1'
  )
    .bind(accountId)
    .first<any>()
  const categoryRows = await env.DB.prepare(
    'SELECT category, COUNT(*) as count FROM customer_categories WHERE account_id=?1 GROUP BY category'
  )
    .bind(accountId)
    .all<any>()
  const campaignRows = await env.DB.prepare(
    'SELECT c.id, c.message_text, COALESCE(a.total_sent,0) as total_sent FROM campaigns c LEFT JOIN campaign_analytics a ON c.id=a.campaign_id WHERE c.account_id=?1'
  )
    .bind(accountId)
    .all<any>()
  const revenueDayRows = await env.DB.prepare(
    'SELECT strftime("%Y-%m-%d", tl.created_at) as day, SUM(tl.revenue) as rev FROM trackable_links tl JOIN campaigns c ON c.id=tl.campaign_id WHERE c.account_id=?1 GROUP BY day ORDER BY day'
  )
    .bind(accountId)
    .all<any>()
  const metrics = {
    messages_sent: totalRow?.cnt || 0,
    successes: successRow?.cnt || 0,
    failures: failRow?.cnt || 0,
    revenue: revenueRow?.rev || 0,
  }
  return new Response(
    JSON.stringify({
      metrics,
      categories: categoryRows,
      campaigns: campaignRows,
      revenueByDay: revenueDayRows,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})

router.get('/campaigns/:id/analytics', async ({ params }, env: Env) => {
  const row = await env.DB.prepare(
    'SELECT * FROM campaign_analytics WHERE campaign_id=?1'
  )
    .bind(params?.id)
    .first<any>()
  return new Response(JSON.stringify({ analytics: row }), {
    headers: { 'Content-Type': 'application/json' },
  })
})


// Default route
router.all('*', () => new Response('Not Found', { status: 404 }))

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    if (request.method === 'OPTIONS') {
      return new Response('', { status: 204, headers: corsHeaders })
    }
    const resp = await router.handle(request, env, ctx)
    resp.headers.set('Access-Control-Allow-Origin', '*')
    resp.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    resp.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return resp
  }
}
