const getSupabase = require('../lib/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabase();

  try {
    let uid = req.query?.uid;
    if (!uid && req.body) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      uid = body.uid;
    }
    uid = String((uid || '').trim());

    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }

    const { error } = await supabase
      .from('app_keys')
      .delete()
      .eq('uid', uid);

    if (error) throw error;

    return res.status(200).json({ deleted: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};
