import { Hono } from 'hono';
import auth from './auth';
import session from './session';

import campaigns from './campaigns';
import analytics from './analytics';


const app = new Hono();

app.route('/auth', auth);
app.route('/session', session);

app.route('/campaigns', campaigns);
app.route('/analytics', analytics);


export default app;
