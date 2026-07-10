import webpush from '../config/vapid.js';
import db from '../config/database.js';

/**
 * Send a push notification to all subscriptions for a given user.
 * Silently removes expired/invalid subscriptions from DB.
 */
export async function sendPushToUser(userId, payload) {
  try {
    const subs = await db.query(
      'SELECT * FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );
    if (!subs.length) return;

    const message = JSON.stringify(typeof payload === 'string' ? { title: payload } : payload);

    await Promise.allSettled(
      subs.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };
        try {
          await webpush.sendNotification(pushSubscription, message);
        } catch (err) {
          // 410 Gone or 404 = subscription no longer valid → remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await db.query(
              'DELETE FROM push_subscriptions WHERE id = ?',
              [sub.id]
            );
          } else {
            console.error('[Push] sendNotification error:', err.statusCode, err.body);
          }
        }
      })
    );
  } catch (err) {
    console.error('[Push] sendPushToUser error:', err);
  }
}

/**
 * Send push notifications to multiple users at once.
 */
export async function sendPushToUsers(userIds, payload) {
  await Promise.allSettled(userIds.map((id) => sendPushToUser(id, payload)));
}

/**
 * Daily 7 AM digest: for every employee linked to a user account,
 * fetch cards that are assigned to them with no scheduled_date or
 * with scheduled_date = today, and send a summary notification.
 */
export async function sendDailyDigest() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // Get all users who have at least one push subscription
    const users = await db.query(
      `SELECT DISTINCT u.id, u.name, e.id as employee_id
       FROM users u
       JOIN push_subscriptions ps ON ps.user_id = u.id
       LEFT JOIN employees e ON e.user_id = u.id`
    );

    for (const user of users) {
      if (!user.employee_id) continue;

      // Find cards assigned today OR unscheduled (no scheduled_date) that aren't completed
      const cards = await db.query(
        `SELECT c.title, c.scheduled_date
         FROM cards c
         WHERE (
           c.assignee_id = ?
           OR c.assignee_ids::jsonb @> ?::jsonb
         )
         AND c.completed = false
         AND (
           c.scheduled_date IS NULL
           OR c.scheduled_date::date = ?::date
         )
         ORDER BY c.order_position ASC
         LIMIT 20`,
        [
          user.employee_id,
          JSON.stringify([user.employee_id]),
          todayStr,
        ]
      );

      if (!cards.length) continue;

      const scheduled = cards.filter((c) => c.scheduled_date);
      const unscheduled = cards.filter((c) => !c.scheduled_date);

      let body = '';
      if (scheduled.length && unscheduled.length) {
        body = `${scheduled.length} tarefa(s) para hoje + ${unscheduled.length} sem data.\n`;
      } else if (scheduled.length) {
        body = `${scheduled.length} tarefa(s) agendada(s) para hoje.\n`;
      } else {
        body = `${unscheduled.length} tarefa(s) pendente(s) sem data.\n`;
      }

      // List first 3 card titles
      const preview = cards
        .slice(0, 3)
        .map((c) => `• ${c.title}`)
        .join('\n');

      await sendPushToUser(user.id, {
        title: '🗓️ Bom dia! Suas tarefas de hoje',
        body: body + preview + (cards.length > 3 ? `\n+${cards.length - 3} mais...` : ''),
        url: '/',
      });
    }

    console.log(`[Push] Daily digest sent to ${users.length} user(s)`);
  } catch (err) {
    console.error('[Push] Daily digest error:', err);
  }
}

/**
 * Check recurring tasks and send push notifications on their scheduled day_of_month.
 */
export async function sendRecurringTaskNotifications() {
  try {
    const today = new Date();
    const dayOfMonth = today.getDate();

    const tasks = await db.query(
      `SELECT rt.*, u.name as user_name
       FROM recurring_tasks rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.day_of_month = ? AND rt.active = true`,
      [dayOfMonth]
    );

    if (!tasks.length) {
      console.log(`[Push] No recurring tasks for day ${dayOfMonth}`);
      return;
    }

    // Group tasks by user
    const tasksByUser = {};
    for (const task of tasks) {
      if (!tasksByUser[task.user_id]) {
        tasksByUser[task.user_id] = [];
      }
      tasksByUser[task.user_id].push(task);
    }

    for (const [userId, userTasks] of Object.entries(tasksByUser)) {
      const preview = userTasks
        .slice(0, 3)
        .map((t) => `• ${t.title}`)
        .join('\n');

      const body = userTasks.length === 1
        ? userTasks[0].title
        : `${userTasks.length} tarefa(s) recorrente(s) para hoje:\n${preview}${userTasks.length > 3 ? `\n+${userTasks.length - 3} mais...` : ''}`;

      await sendPushToUser(userId, {
        title: '🔁 Lembrete de tarefa recorrente',
        body,
        url: '/',
      });
    }

    console.log(`[Push] Recurring task notifications sent for day ${dayOfMonth}`);
  } catch (err) {
    console.error('[Push] Recurring task notification error:', err);
  }
}
