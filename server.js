// ============================================================
//  Vinkällaren – Produktionsserver
//  Node.js, inga npm-beroenden utöver 'better-sqlite3'
//  Kör: npm install && node server.js
// ============================================================

const http    = require('http');
const https   = require('https');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');
const Database = require('better-sqlite3');

// ── Miljövariabler (sätt dessa i Railway eller .env) ─────────
const PORT                 = process.env.PORT                 || 3000;
const ANTHROPIC_API_KEY    = process.env.ANTHROPIC_API_KEY    || '';
const STRIPE_SECRET_KEY    = process.env.STRIPE_SECRET_KEY    || '';
const STRIPE_WEBHOOK_SECRET= process.env.STRIPE_WEBHOOK_SECRET|| '';
const PRICE_IDS = {
  monthly:  process.env.PRICE_MONTHLY  || '',
  yearly:   process.env.PRICE_YEARLY   || '',
  lifetime: process.env.PRICE_LIFETIME || '',
};
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// ── Databas (SQLite) ─────────────────────────────────────────
const db = new Database('vinkallaren.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT UNIQUE NOT NULL,
    stripe_id   TEXT,
    premium     INTEGER DEFAULT 0,
    plan        TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token       TEXT PRIMARY KEY,
    email       TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now'))
  );
`);

// ── Databashjälpare ──────────────────────────────────────────
const dbGetUser    = db.prepare('SELECT * FROM users WHERE email = ?');
const dbUpsertUser = db.prepare(`
  INSERT INTO users (email, stripe_id, premium, plan)
  VALUES (@email, @stripe_id, @premium, @plan)
  ON CONFLICT(email) DO UPDATE SET
    stripe_id = excluded.stripe_id,
    premium   = excluded.premium,
    plan      = excluded.plan
`);
const dbCreateSession = db.prepare('INSERT INTO sessions (token, email) VALUES (?, ?)');
const dbGetSession    = db.prepare('SELECT * FROM sessions WHERE token = ?');
const dbDeleteSession = db.prepare('DELETE FROM sessions WHERE token = ?');

// ── HTTPS-hjälpare (Stripe & Anthropic) ─────────────────────
function apiRequest(hostname, method, path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const isForm = typeof body === 'object' && !(body instanceof Buffer) && !extraHeaders['Content-Type']?.includes('json');
    const data   = !body ? '' : isForm ? new URLSearchParams(body).toString() : (Buffer.isBuffer(body) ? body : JSON.stringify(body));
    const contentType = isForm ? 'application/x-www-form-urlencoded' : 'application/json';
    const options = {
      hostname, path, method,
      headers: {
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(data),
        ...extraHeaders,
      },
    };
    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch(e) { resolve(Buffer.concat(chunks).toString()); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function stripeRequest(method, endpoint, body) {
  return apiRequest('api.stripe.com', method, `/v1/${endpoint}`, body, {
    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
  });
}

function anthropicRequest(messages) {
  return apiRequest('api.anthropic.com', 'POST', '/v1/messages',
    { model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages },
    {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    }
  );
}

// ── Webhook-verifiering ──────────────────────────────────────
function verifyWebhook(payload, sigHeader, secret) {
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')));
  const signed = `${parts.t}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  return expected === parts.v1;
}

// ── Session-token ────────────────────────────────────────────
function generateToken() { return crypto.randomBytes(32).toString('hex'); }

function getEmailFromRequest(req) {
  const cookie = req.headers.cookie || '';
  const match  = cookie.match(/vk_session=([a-f0-9]{64})/);
  if (!match) return null;
  const row = dbGetSession.get(match[1]);
  return row ? row.email : null;
}

// ── Body-parser ──────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ── MIME-typer ───────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
};

// ── JSON-svar ────────────────────────────────────────────────
function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ════════════════════════════════════════════════════════════
//  HTTP-server
// ════════════════════════════════════════════════════════════
const server = http.createServer(async (req, res) => {
  const url  = new URL(req.url, `http://localhost`);
  const path_ = url.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  try {

    // ── POST /analyze ── AI-vinanalys (proxy mot Anthropic) ──
    if (req.method === 'POST' && path_ === '/analyze') {
      const body = JSON.parse(await readBody(req));
      const { imageBase64, mediaType } = body;
      const currentYear = new Date().getFullYear();

      const prompt = `Du är en expert på vin och vinlagring. Analysera etiketten på vinflaskan i bilden och svara ENBART med ett JSON-objekt utan markdown eller förklaringar.

JSON-schema:
{
  "name": "vinets fullständiga namn inkl. producent",
  "type": "Rött/Vitt/Rosé/Mousserande/Dessertvin",
  "grape": "huvuddruvsort(er)",
  "vintage": "årgång eller Okänd",
  "region": "region och land",
  "alcohol": "alkoholhalt eller Okänd",
  "aging": "lagringspotential i år, t.ex. 5–15 år",
  "drinkFrom": ${currentYear},
  "drinkTo": ${currentYear + 10},
  "peakStart": ${currentYear + 2},
  "peakEnd": ${currentYear + 7},
  "priceCategory": "Ekonomi/Mellansegment/Premium/Lyx",
  "tastingNotes": "2–4 meningar om smak, doft och karaktär på svenska",
  "drinkAdvice": "en mening om när vinet är som bäst på svenska"
}

Svara ENBART med JSON.`;

      const aiRes = await anthropicRequest([{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          { type: 'text', text: prompt }
        ]
      }]);

      const text  = (aiRes.content || []).map(i => i.text || '').join('');
      const clean = text.replace(/```json|```/g, '').trim();
      const wine  = JSON.parse(clean);
      return json(res, 200, { wine });
    }

    // ── POST /create-checkout ── Stripe Checkout ─────────────
    if (req.method === 'POST' && path_ === '/create-checkout') {
      const body = JSON.parse(await readBody(req));
      const { plan, email } = body;
      const priceId = PRICE_IDS[plan];
      if (!priceId) return json(res, 400, { error: 'Okänd plan' });

      const isLifetime = plan === 'lifetime';
      const params = {
        'line_items[0][price]':    priceId,
        'line_items[0][quantity]': '1',
        'mode':                    isLifetime ? 'payment' : 'subscription',
        'success_url':             `${BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url':              `${BASE_URL}/`,
        ...(email ? { 'customer_email': email } : {}),
      };

      const session = await stripeRequest('POST', 'checkout/sessions', params);
      if (session.error) throw new Error(session.error.message);
      return json(res, 200, { url: session.url });
    }

    // ── GET /verify-session ── Bekräfta betalning ────────────
    if (req.method === 'GET' && path_ === '/verify-session') {
      const sessionId = url.searchParams.get('session_id');
      if (!sessionId) return json(res, 400, {});

      const session = await stripeRequest('GET', `checkout/sessions/${sessionId}`, '');
      const paid    = session.payment_status === 'paid' || session.status === 'complete';
      const email   = session.customer_details?.email || '';

      if (paid && email) {
        dbUpsertUser.run({ email, stripe_id: session.customer || '', premium: 1, plan: 'stripe' });
        const token = generateToken();
        dbCreateSession.run(token, email);
        res.setHeader('Set-Cookie', `vk_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
      }
      return json(res, 200, { success: paid, email });
    }

    // ── GET /me ── Hämta inloggad användares status ──────────
    if (req.method === 'GET' && path_ === '/me') {
      const email = getEmailFromRequest(req);
      if (!email) return json(res, 200, { premium: false });
      const user = dbGetUser.get(email);
      return json(res, 200, { premium: !!user?.premium, email, plan: user?.plan });
    }

    // ── POST /logout ─────────────────────────────────────────
    if (req.method === 'POST' && path_ === '/logout') {
      const cookie = req.headers.cookie || '';
      const match  = cookie.match(/vk_session=([a-f0-9]{64})/);
      if (match) dbDeleteSession.run(match[1]);
      res.setHeader('Set-Cookie', 'vk_session=; Path=/; Max-Age=0');
      return json(res, 200, { ok: true });
    }

    // ── POST /webhook ── Stripe-webhook ──────────────────────
    if (req.method === 'POST' && path_ === '/webhook') {
      const rawBody = await readBody(req);
      const sig     = req.headers['stripe-signature'];
      if (!verifyWebhook(rawBody.toString(), sig, STRIPE_WEBHOOK_SECRET)) {
        res.writeHead(400); res.end('Ogiltig signatur'); return;
      }
      const event = JSON.parse(rawBody.toString());
      console.log('Webhook:', event.type);

      if (event.type === 'checkout.session.completed') {
        const s     = event.data.object;
        const email = s.customer_details?.email;
        if (email) dbUpsertUser.run({ email, stripe_id: s.customer || '', premium: 1, plan: 'stripe' });
      }
      if (event.type === 'customer.subscription.deleted') {
        const sub   = event.data.object;
        const email = sub.customer_email || '';
        if (email) db.prepare('UPDATE users SET premium=0 WHERE email=?').run(email);
      }
      res.writeHead(200); res.end('OK'); return;
    }

    // ── Statiska filer ────────────────────────────────────────
    let filePath = path_ === '/' ? '/index.html' : path_;
    filePath = path.join(__dirname, 'public', filePath);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Sidan hittades inte'); return; }
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });

  } catch (err) {
    console.error('Serverfel:', err.message);
    json(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n🍷 Vinkällaren körs på ${BASE_URL}`);
  console.log(`   Databas: vinkallaren.db`);
  if (!ANTHROPIC_API_KEY) console.warn('   ⚠️  ANTHROPIC_API_KEY saknas!');
  if (!STRIPE_SECRET_KEY)  console.warn('   ⚠️  STRIPE_SECRET_KEY saknas!');
  console.log('');
});
