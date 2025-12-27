const axios = require('axios');

async function subscribe() {
  const CLIENT_ID = 'u0nec0e6cxflnnywrevwyveiproplx';
  const CLIENT_SECRET = 'wuoikm2mnxyessdv426gq19g6a2vfa';
  const CALLBACK_URL = 'https://wizardduels-backend.onrender.com/api/twitch/webhook';
  const WEBHOOK_SECRET = 'aa7a61bc09b2620bbaa6aaaa1b06c881'; // Must match Render environment variable
  const BROADCASTER_ID = 'potterfan92993'; // Use a tool to find your ID from your username

  try {
    // 1. Get an Access Token from Twitch
    const tokenResponse = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`);
    const token = tokenResponse.data.access_token;

    // 2. Tell Twitch to send "Wizard Duel!" redemptions to Render
    const response = await axios.post('https://api.twitch.tv/helix/eventsub/subscriptions', {
      type: 'channel.channel_points_custom_reward_redemption.add',
      version: '1',
      condition: { broadcaster_user_id: BROADCASTER_ID },
      transport: {
        method: 'webhook',
        callback: CALLBACK_URL,
        secret: WEBHOOK_SECRET
      }
    }, {
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Subscription Successful!', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

subscribe();
