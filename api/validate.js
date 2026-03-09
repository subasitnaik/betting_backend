const getSupabase = require('../lib/supabase');

module.exports = async (req, res) => {
  const supabase = getSupabase();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const uid = String((body.uid || '').trim());
    const key = String((body.key || '').trim());

    if (!uid || !key) {
      return res.status(400).json({ valid: false });
    }

    const { data: entry, error } = await supabase
      .from('app_keys')
      .select('uid, key, expiry')
      .eq('uid', uid)
      .eq('key', key)
      .single();

    if (error || !entry) {
      return res.status(401).json({ valid: false });
    }

    const now = Date.now();
    const expiryMs = entry.expiry ? new Date(entry.expiry).getTime() : 0;
    if (expiryMs > 0 && now >= expiryMs) {
      return res.status(401).json({ valid: false });
    }

    return res.status(200).json({
      valid: true,
      expiry: entry.expiry || null,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ valid: false });
  }
};
