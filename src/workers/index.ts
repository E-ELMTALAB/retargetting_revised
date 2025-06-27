import { Hono } from 'hono';
import auth from './auth';
import session from './session';
import campaigns from './campaigns';

const app = new Hono();

app.route('/auth', auth);
app.route('/session', session);
app.route('/campaigns', campaigns);

export default app;
