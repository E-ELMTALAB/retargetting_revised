import { Hono } from 'hono';
import auth from './auth';
import session from './session';
import ui from './ui';

const app = new Hono();

app.route('/auth', auth);
app.route('/session', session);
app.route('/', ui);

export default app;
