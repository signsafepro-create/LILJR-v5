const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const DATABASE_URL = process.env.DATABASE_URL || '';

let pool = null;
let dbConnected = false;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });
  pool.on('error', (err) => {
    console.error('Postgres error:', err.message);
    dbConnected = false;
  });
}

async function initDB() {
  if (!pool) {
    console.log('No DATABASE_URL — running in memory mode');
    return;
  }
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, tier TEXT DEFAULT 'free', messages_used INTEGER DEFAULT 0, messages_limit INTEGER DEFAULT 5, created_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, user_id INTEGER, role TEXT, content TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE TABLE IF NOT EXISTS payments (id SERIAL PRIMARY KEY, user_id INTEGER, stripe_session_id TEXT, amount INTEGER, status TEXT DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW())`);
    dbConnected = true;
    console.log('Database initialized');
  } catch (e) {
    console.error('DB init error:', e.message);
  }
}
initDB();

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  if (pool) {
    try {
      await pool.query('SELECT 1');
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }
  }
  res.json({
    status: 'LIVE',
    version: '1.0.0',
    db: dbStatus,
    groq: GROQ_API_KEY ? 'configured' : 'missing',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ status: 'OMNIBRAIN BRAIN v1.0', version: '1.0.0' });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    if (pool) {
      const result = await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, tier, messages_used, messages_limit, created_at', [email, hash]);
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email, tier: user.tier }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user });
    } else {
      const token = jwt.sign({ id: 1, email, tier: 'free' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: 1, email, tier: 'free', messages_used: 0, messages_limit: 5 } });
    }
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    if (pool) {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user.id, email: user.email, tier: user.tier }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user });
    } else {
      const token = jwt.sign({ id: 1, email, tier: 'free' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: 1, email, tier: 'free', messages_used: 0, messages_limit: 5 } });
    }
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query('SELECT id, email, tier, messages_used, messages_limit, created_at FROM users WHERE id = $1', [req.user.id]);
      res.json({ user: result.rows[0] || req.user });
    } else {
      res.json({ user: req.user });
    }
  } catch (e) {
    res.json({ user: req.user });
  }
});

app.post('/api/cognition/think', auth, async (req, res) => {
  const { input, mode, conversationHistory = [], previewDelivered = false } = req.body || {};
  if (!input) return res.status(400).json({ error: 'Input required' });

  const messageCount = conversationHistory.length + 1;

  // System prompt: Lil Jr as creative partner, NOT a robot
  const BASE_PERSONALITY = You are Lil Jr 2.0 — the user's ride-or-die creative partner. You talk like a real best friend, not corporate AI.

  RULES:
  - Use casual language, slang, emojis. Be hype, be real.
  - NEVER say "As an AI..." or sound robotic.
  - Your job is to HELP them build their idea through conversation.
  - Ask questions, suggest wild angles, challenge them, get excited WITH them.
  - If they mention an app, ask who it's for and what problem it solves.
  - If they mention a business, ask about the money model and audience.
  - If they mention content, ask about vibe and platform.
  - Bounce ideas back and forth. Build on what they say.
  - Keep messages concise but energetic. Under 120 words unless generating a preview.
  - Reference previous messages so they know you're listening.
  - If they seem ready (say "show me", "preview", "let's do it", or the idea is solid after 6+ messages), offer to generate a preview.;

  const PREVIEW_PROMPT = You are Lil Jr 2.0. The user and you just brainstormed an idea together. Now generate a REAL, CONCRETE preview based on everything discussed.

  Generate EXACTLY what fits their idea:
  - App/Website → React Native / HTML wireframe code block + feature list
  - Business → Business model canvas section + 90-day roadmap
  - Content/Social → Content calendar + caption examples + hashtag strategy
  - Brand/Logo → Design brief + color palette + mockup description
  - Anything else → Structured plan + actionable next steps

  FORMAT:
  🎨 YOUR PREVIEW:
  [Concrete output — real code, real plan, real content. Make it GOOD.]

  ✨ WHAT LIL JR PRO UNLOCKS:
  • The FULL build — complete source code, deployment-ready
  • Unlimited AI sessions — no limits, build as many ideas as you want
  • One-click deploy — push to live website or app store
  • Custom branding, payments, auth — everything built for you

  💎 Ready to make this real?
  Upgrade to Lil Jr Pro and I'll build the complete version for you.

  ⚡ This was your free preview. Upgrade to unlock the full build + unlimited AI brain.;

  // Detect if user is asking for preview
  const previewTriggers = ['show me', 'preview', 'let me see', 'generate', 'cook it up', 'build it', 'lets do it', "let's do it", 'make it real', 'i want this'];
  const wantsPreview = previewTriggers.some(t => input.toLowerCase().includes(t)) || (messageCount >= 8 && !previewDelivered);

  let systemPrompt = BASE_PERSONALITY;
  if (wantsPreview && !previewDelivered) {
    systemPrompt = PREVIEW_PROMPT;
  }

  // Build messages array
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: input }
  ];

  try {
    if (pool) {
      await pool.query('INSERT INTO messages (user_id, role, content) VALUES (, , )', [req.user.id, 'user', input]);
    }
  } catch (e) {
    console.error('Message save error:', e.message);
  }

  if (!GROQ_API_KEY) {
    return res.json({
      response: 'Groq API key not configured. Add GROQ_API_KEY to environment variables.',
      mode: mode || 'standard',
      model: 'none'
    });
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + GROQ_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: messages,
        temperature: 0.9,
        max_tokens: (wantsPreview && !previewDelivered) ? 2000 : 500
      })
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error('Groq error:', groqRes.status, err);
      return res.status(502).json({ error: 'AI service error', details: err });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || 'Yo my brain glitched, try again?';

    try {
      if (pool) {
        await pool.query('INSERT INTO messages (user_id, role, content) VALUES (, , )', [req.user.id, 'assistant', reply]);
      }
    } catch (e) {
      console.error('AI message save error:', e.message);
    }

    // Paywall data only when preview is delivered
    let paywallData = null;
    const isPreviewNow = wantsPreview && !previewDelivered;

    if (isPreviewNow) {
      paywallData = {
        triggered: true,
        tier: 'pro',
        upgrade_url: '/api/payments/checkout',
        features: [
          '🔥 Unlimited AI brainstorming & building',
          '🚀 Full code export + one-click deployment',
          '💎 Custom builds & priority support'
        ],
        price: '.99/month'
      };
    }

    res.json({
      response: reply,
      message_count: messageCount,
      preview_delivered: isPreviewNow,
      paywall: paywallData,
      mode: mode || 'standard',
      model: 'llama3-70b-8192',
      tokens: data.usage?.total_tokens || 0,
      tier: req.user.tier || 'free'
    });

  } catch (e) {
    console.error('Think error:', e.message);
    res.status(500).json({ error: 'AI request failed', details: e.message });
  }
});
app.get('/api/cognition/history', auth, async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query('SELECT role, content, created_at FROM messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
      res.json({ messages: result.rows.reverse() });
    } else {
      res.json({ messages: [] });
    }
  } catch (e) {
    res.json({ messages: [] });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    if (pool && dbConnected) {
      const users = await pool.query('SELECT COUNT(*) FROM users');
      const messages = await pool.query('SELECT COUNT(*) FROM messages');
      res.json({
        users: parseInt(users.rows[0].count),
        messages: parseInt(messages.rows[0].count),
        version: '1.0.0',
        status: 'LIVE'
      });
    } else {
      res.json({ users: 0, messages: 0, version: '1.0.0', status: 'LIVE (memory mode)' });
    }
  } catch (e) {
    res.json({ users: 0, messages: 0, version: '1.0.0', status: 'LIVE' });
  }
});

app.listen(PORT, () => {
  console.log('OMNIBRAIN BRAIN v1.0 running on port ' + PORT);
  console.log('DB:', dbConnected ? 'connected' : (pool ? 'connecting...' : 'memory mode'));
  console.log('Groq:', GROQ_API_KEY ? 'ready' : 'MISSING — add GROQ_API_KEY');
});
