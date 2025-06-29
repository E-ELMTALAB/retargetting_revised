import { Router } from 'itty-router'

const router = Router()

// Authentication - placeholder
router.post('/auth/login', async (request: Request) => {
  // TODO: implement JWT issuance
  return new Response(JSON.stringify({ token: 'TODO' }), {
    headers: { 'Content-Type': 'application/json' },
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
  fetch: (request: Request) => router.handle(request),
}
