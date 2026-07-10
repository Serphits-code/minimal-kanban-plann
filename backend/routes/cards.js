import express from 'express';
import db from '../config/database.js';
import { sendPushToUsers } from '../lib/pushNotifications.js';

const router = express.Router();

// Safe JSON parse - handles already-parsed JSONB objects from pg
const safeParse = (val, defaultVal = []) => {
  if (val === null || val === undefined) return defaultVal;
  if (Array.isArray(val) || typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return defaultVal; }
};

// Helper function to handle undefined values
const sanitizeValue = (value, defaultValue = null) => {
  if (value === undefined) return defaultValue;
  if (value === null) return null;
  return value;
};

// Helper to ensure dates are properly formatted or null
const sanitizeDate = (dateValue) => {
  if (!dateValue || dateValue === undefined) return null;
  if (typeof dateValue === 'string' && dateValue.trim() === '') return null;
  return dateValue;
};

// Helper to normalize time format (remove seconds if present)
const normalizeTime = (timeValue) => {
  console.log('normalizeTime input:', timeValue);
  if (!timeValue) return null;
  if (typeof timeValue === 'string' && timeValue.includes(':')) {
    // Convert "HH:mm:ss" to "HH:mm"
    const parts = timeValue.split(':');
    const normalized = `${parts[0]}:${parts[1]}`;
    console.log('normalizeTime output:', normalized);
    return normalized;
  }
  console.log('normalizeTime output (unchanged):', timeValue);
  return timeValue;
};

// GET /api/cards - Listar todos os cards (com filtro opcional por board)
router.get('/', async (req, res) => {
  try {
    const { boardId } = req.query;
    
    let query = `SELECT c.*, e.name as assignee_name, e.email as assignee_email, e.avatar as assignee_avatar, e.role as assignee_role
      FROM cards c
      LEFT JOIN employees e ON c.assignee_id = e.id`;
    let params = [];
    
    if (boardId) {
      query += ' WHERE c.board_id = ?';
      params.push(boardId);
    }
    
    query += ' ORDER BY c.order_position ASC';
    
    const cards = await db.query(query, params);
    
    // Parse JSON columns
    const formattedCards = cards.map(card => ({
      ...card,
      tags: safeParse(card.tags),
      checklist: safeParse(card.checklist),
      attachments: safeParse(card.attachments),
      column: card.column_id,
      boardId: card.board_id,
      order: card.order_position,
      dueDate: card.due_date,
      scheduledDate: card.scheduled_date,
      scheduledTime: normalizeTime(card.scheduled_time),
      scheduledTimeDate: card.scheduled_time_date ? card.scheduled_time_date.toISOString().split('T')[0] : null,
      createdAt: card.created_at,
      assigneeId: card.assignee_id,
      assigneeIds: safeParse(card.assignee_ids, []),
      assignee: card.assignee_id ? {
        id: card.assignee_id,
        name: card.assignee_name,
        email: card.assignee_email,
        avatar: card.assignee_avatar,
        role: card.assignee_role
      } : null,
      priority: card.priority || 'medium',
      status: card.status || 'not_started',
      groupId: card.group_id
    }));

    res.json(formattedCards);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cards' });
  }
});

// GET /api/cards/:id - Buscar card específico
router.get('/:id', async (req, res) => {
  try {
    const [card] = await db.query('SELECT * FROM cards WHERE id = ?', [req.params.id]);
    
    if (!card) {
      return res.status(404).json({ error: 'Card não encontrado' });
    }

    const formattedCard = {
      ...card,
      tags: safeParse(card.tags),
      checklist: safeParse(card.checklist),
      attachments: safeParse(card.attachments),
      column: card.column_id,
      boardId: card.board_id,
      order: card.order_position,
      dueDate: card.due_date,
      scheduledDate: card.scheduled_date,
      scheduledTime: normalizeTime(card.scheduled_time),
      scheduledTimeDate: card.scheduled_time_date ? card.scheduled_time_date.toISOString().split('T')[0] : null,
      createdAt: card.created_at,
      assigneeId: card.assignee_id,
      assigneeIds: safeParse(card.assignee_ids, []),
      priority: card.priority || 'medium',
      status: card.status || 'not_started',
      groupId: card.group_id
    };

    res.json(formattedCard);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar card' });
  }
});

// POST /api/cards - Criar novo card
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description = '', 
      tags = [], 
      checklist = [], 
      attachments = [],
      dueDate,
      scheduledDate,
      scheduledTime,
      duration,
      column, 
      boardId,
      assigneeId,
      assigneeIds = [],
      priority,
      status,
      groupId
    } = req.body;
    
    if (!title || !column || !boardId) {
      return res.status(400).json({ error: 'Título, coluna e board são obrigatórios' });
    }

    // Get next order position
    const [maxOrder] = await db.query(
      'SELECT COALESCE(MAX(order_position), -1) as max_order FROM cards WHERE board_id = ? AND column_id = ?',
      [boardId, column]
    );

    const id = crypto.randomUUID();
    const order = maxOrder.max_order + 1;

    // Normalise: assigneeIds wins; fall back to legacy assigneeId
    const normIds = assigneeIds.length > 0 ? assigneeIds : (assigneeId ? [assigneeId] : []);
    const primaryId = normIds[0] || null;

    await db.query(
      `INSERT INTO cards (
        id, title, description, tags, checklist, attachments, 
        due_date, scheduled_date, scheduled_time, duration,
        column_id, board_id, order_position, assignee_id, assignee_ids, priority, status, group_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        sanitizeValue(title, ''), 
        sanitizeValue(description, ''), 
        JSON.stringify(sanitizeValue(tags, [])), 
        JSON.stringify(sanitizeValue(checklist, [])), 
        JSON.stringify(sanitizeValue(attachments, [])),
        sanitizeDate(dueDate), 
        sanitizeDate(scheduledDate), 
        sanitizeValue(scheduledTime, null), 
        sanitizeValue(duration, null),
        column, boardId, order,
        primaryId,
        JSON.stringify(normIds),
        sanitizeValue(priority, 'medium'),
        sanitizeValue(status, 'not_started'),
        sanitizeValue(groupId, null)
      ]
    );

    const newCard = {
      id,
      title,
      description,
      tags,
      checklist,
      attachments,
      dueDate,
      scheduledDate,
      scheduledTime,
      duration,
      column,
      boardId,
      order,
      completed: false,
      createdAt: new Date().toISOString(),
      assigneeId: primaryId,
      assigneeIds: normIds,
      priority: priority || 'medium',
      status: status || 'not_started',
      groupId: groupId || null
    };

    req.app.get('io').emit('card:created', newCard);

    // Push notification: notify all assignees on creation
    if (normIds.length > 0) {
      db.query(
        `SELECT u.id as user_id FROM employees e JOIN users u ON u.id = e.user_id WHERE e.id = ANY(?)`,
        [normIds]
      ).then(rows => {
        const userIds = rows.map(r => r.user_id);
        if (userIds.length > 0) {
          sendPushToUsers(userIds, {
            title: '📌 Você foi atribuído a uma tarefa',
            body: title,
            url: '/',
          });
        }
      }).catch(() => {});
    }

    res.status(201).json(newCard);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar card' });
  }
});

// PUT /api/cards/:id - Atualizar card
router.put('/:id', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      tags, 
      checklist, 
      attachments,
      dueDate,
      scheduledDate,
      scheduledTime,
      duration,
      column,
      order,
      completed,
      boardId,
      assigneeId,
      assigneeIds,
      priority,
      status,
      groupId,
      scheduledTimeDate
    } = req.body;

    if (!title && title !== '') {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    // Normalise assigneeIds
    const normIds = Array.isArray(assigneeIds) && assigneeIds.length > 0
      ? assigneeIds
      : (assigneeId ? [assigneeId] : []);
    const primaryId = normIds[0] || null;

    // Capture old assigneeIds for push comparison
    const [oldCard] = await db.query('SELECT assignee_ids, title FROM cards WHERE id = ?', [req.params.id]);
    const oldAssigneeIds = oldCard ? safeParse(oldCard.assignee_ids, []) : [];

    const params = [
      sanitizeValue(title, ''), 
      sanitizeValue(description, ''), 
      JSON.stringify(sanitizeValue(tags, [])), 
      JSON.stringify(sanitizeValue(checklist, [])), 
      JSON.stringify(sanitizeValue(attachments, [])),
      sanitizeDate(dueDate), 
      sanitizeDate(scheduledDate), 
      sanitizeValue(scheduledTime, null), 
      sanitizeValue(duration, null),
      sanitizeDate(scheduledTimeDate),
      sanitizeValue(column, ''), 
      sanitizeValue(order, 0), 
      sanitizeValue(completed, false),
      sanitizeValue(boardId, null),
      primaryId,
      JSON.stringify(normIds),
      sanitizeValue(priority, 'medium'),
      sanitizeValue(status, 'not_started'),
      sanitizeValue(groupId, null),
      req.params.id
    ];

    await db.query(
      `UPDATE cards SET 
        title = ?, description = ?, tags = ?, checklist = ?, attachments = ?,
        due_date = ?, scheduled_date = ?, scheduled_time = ?, duration = ?,
        scheduled_time_date = ?,
        column_id = ?, order_position = ?, completed = ?, board_id = ?,
        assignee_id = ?, assignee_ids = ?, priority = ?, status = ?, group_id = ?
      WHERE id = ?`,
      params
    );

    const [updatedCard] = await db.query('SELECT * FROM cards WHERE id = ?', [req.params.id]);
    
    if (!updatedCard) {
      return res.status(404).json({ error: 'Card não encontrado' });
    }

    const formattedCard = {
      ...updatedCard,
      tags: safeParse(updatedCard.tags),
      checklist: safeParse(updatedCard.checklist),
      attachments: safeParse(updatedCard.attachments),
      column: updatedCard.column_id,
      boardId: updatedCard.board_id,
      order: updatedCard.order_position,
      dueDate: updatedCard.due_date,
      scheduledDate: updatedCard.scheduled_date,
      scheduledTime: normalizeTime(updatedCard.scheduled_time),
      scheduledTimeDate: updatedCard.scheduled_time_date ? updatedCard.scheduled_time_date.toISOString().split('T')[0] : null,
      createdAt: updatedCard.created_at,
      assigneeId: updatedCard.assignee_id,
      assigneeIds: safeParse(updatedCard.assignee_ids, []),
      priority: updatedCard.priority || 'medium',
      status: updatedCard.status || 'not_started',
      groupId: updatedCard.group_id
    };

    req.app.get('io').emit('card:updated', formattedCard);

    // Push notification: notify newly added assignees
    const newlyAdded = normIds.filter(id => !oldAssigneeIds.includes(id));
    if (newlyAdded.length > 0) {
      const employees = await db.query(
        `SELECT e.id as employee_id, u.id as user_id, u.name
         FROM employees e
         JOIN users u ON u.id = e.user_id
         WHERE e.id = ANY(?)`,
        [newlyAdded]
      );
      const userIds = employees.map(e => e.user_id);
      if (userIds.length > 0) {
        const cardTitle = oldCard?.title || title || 'um card';
        sendPushToUsers(userIds, {
          title: '📌 Você foi atribuído a uma tarefa',
          body: cardTitle,
          url: '/',
        });
      }
    }

    res.json(formattedCard);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar card' });
  }
});

// DELETE /api/cards/:id - Deletar card
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM cards WHERE id = ?', [req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Card não encontrado' });
    }

    req.app.get('io').emit('card:deleted', { id: req.params.id });
    res.json({ message: 'Card deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar card' });
  }
});

// POST /api/cards/:id/move - Mover card entre colunas
router.post('/:id/move', async (req, res) => {
  try {
    const { newColumn, newOrder, newGroupId } = req.body;
    
    let query = 'UPDATE cards SET column_id = ?, order_position = ?';
    let params = [newColumn, newOrder];
    
    if (newGroupId !== undefined) {
      query += ', group_id = ?';
      params.push(newGroupId);
    }
    
    query += ' WHERE id = ?';
    params.push(req.params.id);
    
    await db.query(query, params);

    const [updatedCard] = await db.query('SELECT * FROM cards WHERE id = ?', [req.params.id]);
    
    const formattedCard = {
      ...updatedCard,
      tags: safeParse(updatedCard.tags),
      checklist: safeParse(updatedCard.checklist),
      attachments: safeParse(updatedCard.attachments),
      column: updatedCard.column_id,
      boardId: updatedCard.board_id,
      order: updatedCard.order_position,
      dueDate: updatedCard.due_date,
      scheduledDate: updatedCard.scheduled_date,
      scheduledTime: normalizeTime(updatedCard.scheduled_time),
      createdAt: updatedCard.created_at,
      assigneeId: updatedCard.assignee_id,
      assigneeIds: safeParse(updatedCard.assignee_ids, []),
      priority: updatedCard.priority || 'medium',
      status: updatedCard.status || 'not_started',
      groupId: updatedCard.group_id
    };

    req.app.get('io').emit('card:moved', formattedCard);
    res.json(formattedCard);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao mover card' });
  }
});

export default router;