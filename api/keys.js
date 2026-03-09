const getSupabase = require('../lib/supabase');

module.exports = async (req, res) => {
  const supabase = getSupabase();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('app_keys')
      .select('uid, key, expiry, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const keys = (data || []).map((k) => ({
      uid: k.uid,
      key: k.key,
      expiry: k.expiry,
      createdAt: k.created_at,
    }));

    return res.status(200).json(keys);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};
