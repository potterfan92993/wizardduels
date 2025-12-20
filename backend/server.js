import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

client.connect();

// Get current leaderboard (for the overlay)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await client.query(
      'SELECT caster, spells_cast, total_damage, rank FROM leaderboard ORDER BY rank ASC LIMIT 10'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Cast a spell (called from Twitch or your control panel)
app.post('/api/spells/cast', async (req, res) => {
  const { spell_name, caster, damage, effect } = req.body;

  try {
    // Insert spell
    const spellResult = await client.query(
      'INSERT INTO spells (spell_name, caster, effect, damage, cast_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [spell_name, caster, effect, damage || 0]
    );

    // Update leaderboard
    await client.query(
      `INSERT INTO leaderboard (caster, spells_cast, total_damage) 
       VALUES ($1, 1, $2)
       ON CONFLICT (caster) DO UPDATE SET 
         spells_cast = leaderboard.spells_cast + 1,
         total_damage = leaderboard.total_damage + $2,
         updated_at = NOW()`,
      [caster, damage || 0]
    );

    // Recalculate ranks
    await client.query(`
      UPDATE leaderboard SET rank = (
        SELECT COUNT(*) FROM leaderboard lb2 
        WHERE lb2.total_damage > leaderboard.total_damage
      ) + 1
    `);

    res.json({ success: true, spell: spellResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cast spell' });
  }
});

// Get latest spell cast (for the alert popup)
app.get('/api/spells/latest', async (req, res) => {
  try {
    const result = await client.query(
      'SELECT * FROM spells ORDER BY cast_at DESC LIMIT 1'
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch latest spell' });
  }
});

// Receives events from Twitch
app.post('/api/twitch/webhook', (req, res) => {
  const { subscription_type, event } = req.body;

  console.log(`Twitch event: ${subscription_type}`, event);

  if (subscription_type === 'stream.online' || subscription_type === 'channel.update') {
    const casterName = event?.broadcaster_user_name || 'Streamer';

    client.query(
      'INSERT INTO spells (spell_name, caster, effect, damage, cast_at) VALUES ($1, $2, $3, $4, NOW())',
      ['Channel Power', casterName, 'Stream activated!', 10]
    );
  }

  res.json({ received: true });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
