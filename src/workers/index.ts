import { Hono } from 'hono';
import auth from './auth';
import session from './session';

const app = new Hono();

app.route('/auth', auth);
app.route('/session', session);

export default app;
