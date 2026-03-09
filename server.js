const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const KEYS_FILE = path.join(__dirname, 'keys.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadKeys() {
  try {
    const data = fs.readFileSync(KEYS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { keys: [] };
  }
}

function saveKeys(data) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2));
}

function generateKey() {
  return crypto.randomBytes(16).toString('hex');
}

// API: Validate UID + Key (used by the app) - returns expiry when valid
app.post('/api/validate', (req, res) => {
  const { uid, key } = req.body || {};
  if (!uid || !key) {
    return res.status(400).json({ valid: false });
  }
  const data = loadKeys();
  const entry = data.keys.find(
    (k) => k.uid === String(uid).trim() && k.key === String(key).trim()
  );
  if (!entry) {
    return res.status(401).json({ valid: false });
  }
  const now = Date.now();
  const expiryMs = entry.expiry ? new Date(entry.expiry).getTime() : 0;
  if (expiryMs > 0 && now >= expiryMs) {
    return res.status(401).json({ valid: false });
  }
  res.status(200).json({ valid: true, expiry: entry.expiry || null });
});

// API: Generate key for given UID (admin) - UID and expiry written manually, key auto-generated
app.post('/api/generate', (req, res) => {
  let uid = req.body?.uid;
  let expiry = req.body?.expiry;
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      uid = parsed.uid;
      expiry = parsed.expiry;
    } catch {}
  }
  uid = String((uid || '').trim());
  if (!uid) {
    return res.status(400).json({ error: 'UID is required' });
  }
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (!expiry) {
    const defDate = tomorrow.toISOString().slice(0, 10);
    const defTime = now.toTimeString().slice(0, 5);
    expiry = new Date(`${defDate}T${defTime}:00`).toISOString();
  }
  const key = generateKey();
  const data = loadKeys();
  const existing = data.keys.findIndex((k) => k.uid === uid);
  const record = { uid, key, expiry, createdAt: new Date().toISOString() };
  if (existing >= 0) {
    data.keys[existing] = record;
  } else {
    data.keys.push(record);
  }
  saveKeys(data);
  res.json({ uid, key, expiry });
});

// API: List all keys (admin)
app.get('/api/keys', (req, res) => {
  const data = loadKeys();
  res.json(data.keys.map((k) => ({ ...k, key: k.key })));
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Betting backend running on http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin`);
});
