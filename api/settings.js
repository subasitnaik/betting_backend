const getSupabase = require('../lib/supabase');

async function getSettings(supabase) {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['telegram_bot_token', 'telegram_channel_id']);
  if (error) throw error;
  const map = {};
  (data || []).forEach((r) => { map[r.key] = r.value || ''; });
  return {
    telegramBotToken: map.telegram_bot_token || '',
    telegramChannelId: map.telegram_channel_id || '',
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabase();

  try {
    if (req.method === 'GET') {
      const settings = await getSettings(supabase);
      return res.status(200).json(settings);
    }

    if (req.method !== 'PUT') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch { body = {}; }
    }
    body = body || {};

    const token = String(body.telegramBotToken ?? '').trim();
    const channelId = String(body.telegramChannelId ?? '').trim();

    const upsert = (key, value) =>
      supabase.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    const { error: err1 } = await upsert('telegram_bot_token', token);
    if (err1) throw err1;
    const { error: err2 } = await upsert('telegram_channel_id', channelId);
    if (err2) throw err2;

    const settings = await getSettings(supabase);
    return res.status(200).json({ ok: true, settings });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};
