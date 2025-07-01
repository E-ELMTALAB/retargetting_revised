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
  const resp = await fetch(`${env.PYTHON_API_URL}/session/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  })
  console.log('python api response status', resp.status)
  if (!resp.ok) {
    return new Response('Failed to contact API', { status: 500 })
  }
  const data = await resp.json()
  console.log('python api response body', data)
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

  const resp = await fetch(`${env.PYTHON_API_URL}/session/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone,
      code,
      session: row.session,
      phone_code_hash: row.phone_code_hash
    })
  })

  console.log('python api verify status', resp.status)

  const data = await resp.json()
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
