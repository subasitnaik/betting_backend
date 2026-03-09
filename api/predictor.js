const https = require('https');
const getSupabase = require('../lib/supabase');

// In-memory store for latest predictor state
let latestState = null;

async function getTelegramSettings() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['telegram_bot_token', 'telegram_channel_id']);
  if (error) return { token: '', channelId: '' };
  const map = {};
  (data || []).forEach((r) => { map[r.key] = r.value || ''; });
  return {
    token: map.telegram_bot_token || '',
    channelId: map.telegram_channel_id || '',
  };
}

async function sendTelegramMessage(text, token, channelId) {
  if (!token || !channelId) return;

  const body = JSON.stringify({
    chat_id: channelId,
    text,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function buildTelegramMessage(state) {
  const { periodNumber, nextBet, result } = state;
  if (result === 'win') return `WIN ✅`;
  if (result === 'loss') return `LOSS ❌`;
  const side = (nextBet?.side || 'BIG').toUpperCase();
  const amount = nextBet?.amount ?? 1;
  return `${periodNumber} ${side} ${amount}x`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(latestState || {});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body || '{}');
      } catch {
        body = {};
      }
    }
    body = body || {};

    const state = {
      periodNumber: body.periodNumber,
      currentNumber: body.currentNumber,
      timer: body.timer,
      nextBet: body.nextBet || { side: 'BIG', amount: 1 },
      result: body.result,
      updatedAt: new Date().toISOString(),
    };

    latestState = state;

    // Send to Telegram if configured (from Supabase)
    const { token, channelId } = await getTelegramSettings();
    if (token && channelId) {
      const msg = buildTelegramMessage(state);
      await sendTelegramMessage(msg, token, channelId).catch((err) =>
        console.error('Telegram send error:', err)
      );
    }

    return res.status(200).json({ ok: true, state });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};
