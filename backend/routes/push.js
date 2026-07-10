import express from 'express';
import db from '../config/database.js';
import { vapidKeys } from '../config/vapid.js';

const router = express.Router();

// GET /api/push/vapid-key — return public VAPID key (no auth needed)
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// POST /api/push/subscribe — save or update a push subscription for the logged-in user
router.post('/subscribe', async (req, res) => {
  try {
    const userId = req.user.id;
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Subscription inválida' });
    }

    // Upsert: update auth/p256dh if endpoint already exists for this user
    await db.query(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
       VALUES (gen_random_uuid()::varchar, ?, ?, ?, ?)
       ON CONFLICT (user_id, endpoint) DO UPDATE
         SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
      [userId, endpoint, keys.p256dh, keys.auth]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('[Push] subscribe error:', error);
    res.status(500).json({ error: 'Erro ao salvar subscription' });
  }
});

// DELETE /api/push/unsubscribe — remove a push subscription
router.delete('/unsubscribe', async (req, res) => {
  try {
    const userId = req.user.id;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint obrigatório' });
    }

    await db.query(
      'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, endpoint]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('[Push] unsubscribe error:', error);
    res.status(500).json({ error: 'Erro ao remover subscription' });
  }
});

export default router;
