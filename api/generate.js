const crypto = require('crypto');
const getSupabase = require('../lib/supabase');

function generateKey() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabase();

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch { body = {}; }
    }
    body = body || {};
    let uid = String((body.uid || '').trim());
    let expiry = body.expiry;

    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (expiry === undefined || expiry === null || String(expiry).trim() === '') {
      const defDate = tomorrow.toISOString().slice(0, 10);
      const defTime = now.toTimeString().slice(0, 5);
      expiry = new Date(`${defDate}T${defTime}:00`).toISOString();
    }

    const expiryDate = new Date(expiry);
    if (isNaN(expiryDate.getTime())) {
      return res.status(400).json({ error: 'Invalid expiry date format' });
    }

    const key = generateKey();
    const record = {
      uid,
      key,
      expiry: expiryDate.toISOString(),
    };

    const { data: existing } = await supabase
      .from('app_keys')
      .select('id')
      .eq('uid', uid)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('app_keys')
        .update({ key: record.key, expiry: record.expiry })
        .eq('uid', uid);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('app_keys').insert(record);
      if (error) throw error;
    }

    return res.status(200).json({ uid, key, expiry: record.expiry });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};
