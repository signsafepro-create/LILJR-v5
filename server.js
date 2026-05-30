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
  const { input, mode } = req.body || {};
  if (!input) return res.status(400).json({ error: 'Input required' });
  
  try {
    if (pool && req.user.tier === 'free') {
      const u = await pool.query('SELECT messages_used, messages_limit FROM users WHERE id = $1', [req.user.id]);
      const user = u.rows[0];
      if (user && user.messages_used >= user.messages_limit) {
        return res.status(402).json({
          error: 'Daily limit reached',
          upgrade_url: '/api/payments/checkout',
          tier: 'free',
          used: user.messages_used,
          limit: user.messages_limit
        });
      }
      await pool.query('UPDATE users SET messages_used = messages_used + 1 WHERE id = $1', [req.user.id]);
    }
  } catch (e) {
    console.error('Limit check error:', e.message);
  }

  try {
    if (pool) {
      await pool.query('INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)', [req.user.id, 'user', input]);
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
        messages: [
          { role: 'system', content: 'You are OMNIBRAIN, an autonomous AI assistant built by Lil Jr. Be helpful, direct, and powerful.' },
          { role: 'user', content: input }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error('Groq error:', groqRes.status, err);
      return res.status(502).json({ error: 'AI service error', details: err });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || 'No response from AI';

    try {
      if (pool) {
        await pool.query('INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)', [req.user.id, 'assistant', reply]);
      }
    } catch (e) {
      console.error('AI message save error:', e.message);
    }

    res.json({
      response: reply,
      mode: mode || 'standard',
      model: 'llama3-70b-8192',
      tokens: data.usage?.total_tokens || 0
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
