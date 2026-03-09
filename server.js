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

function generateUid() {
  return 'UID-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

// API: Validate UID + Key (used by the app)
app.post('/api/validate', (req, res) => {
  const { uid, key } = req.body || {};
  if (!uid || !key) {
    return res.status(400).json({ valid: false });
  }
  const data = loadKeys();
  const found = data.keys.some(
    (k) => k.uid === String(uid).trim() && k.key === String(key).trim()
  );
  res.status(found ? 200 : 401).json({ valid: found });
});

// API: Generate new UID + Key (admin)
app.post('/api/generate', (req, res) => {
  const uid = generateUid();
  const key = generateKey();
  const data = loadKeys();
  data.keys.push({ uid, key, createdAt: new Date().toISOString() });
  saveKeys(data);
  res.json({ uid, key });
});

// API: List all keys (admin)
app.get('/api/keys', (req, res) => {
  const data = loadKeys();
  res.json(data.keys);
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Betting backend running on http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin`);
});
