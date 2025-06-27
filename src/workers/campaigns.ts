import { Hono } from 'hono';

interface Campaign {
  id: string;
  message_text: string;
  category: string;
  quiet_start: string;
  quiet_end: string;
  nudge_text: string;
  nudge_delay: number;
  tracking_url: string;
  media?: string;
  status: 'created' | 'running';
}

const campaigns = new Map<string, Campaign>();
let currentCampaignId: string | null = null;

const app = new Hono();

app.post('/', async c => {
  const form = await c.req.formData();
  const id = Math.random().toString(36).slice(2, 8);
  const campaign: Campaign = {
    id,
    message_text: form.get('message_text') as string,
    category: form.get('category') as string,
    quiet_start: form.get('quiet_start') as string,
    quiet_end: form.get('quiet_end') as string,
    nudge_text: form.get('nudge_text') as string,
    nudge_delay: Number(form.get('nudge_delay')) || 0,
    tracking_url: form.get('tracking_url') as string,
    media: form.get('media') ? 'uploaded' : undefined,
    status: 'created'
  };
  campaigns.set(id, campaign);
  return c.json({ id });
});

app.post('/:id/start', c => {
  const id = c.req.param('id');
  const camp = campaigns.get(id);
  if (!camp) return c.text('Not found', 404);
  camp.status = 'running';
  currentCampaignId = id;
  return c.json({ status: 'started' });
});

app.get('/current/status', c => {
  if (!currentCampaignId) return c.json({ status: 'Idle' });
  const camp = campaigns.get(currentCampaignId)!;
  return c.json({
    status: camp.status,
    errors: 'None',
    quiet: false,
    nudge: camp.nudge_text ? 'Active' : 'Inactive',
    revenue: 0
  });
});

app.post('/:id/nudge', async c => {
  const id = c.req.param('id');
  const camp = campaigns.get(id);
  if (!camp) return c.text('Not found', 404);
  const body = await c.req.json();
  camp.nudge_text = body.nudge_text;
  camp.nudge_delay = body.nudge_delay;
  return c.text('updated');
});

app.get('/:id/analytics', c => {
  const id = c.req.param('id');
  const camp = campaigns.get(id);
  if (!camp) return c.text('Not found', 404);
  return c.json({
    id,
    total_sent: 0,
    total_clicks: 0,
    total_revenue: 0,
    best_performing_lines: []
  });
});

export default app;
