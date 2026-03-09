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
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    let uid = String((body.uid || '').trim());
    let expiry = body.expiry;

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
    const record = {
      uid,
      key,
      expiry: new Date(expiry).toISOString(),
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
