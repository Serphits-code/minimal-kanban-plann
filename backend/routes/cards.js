import express from 'express';
import db from '../config/database.js';

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
      createdAt: card.created_at,
      assigneeId: card.assignee_id,
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
      createdAt: card.created_at,
      assigneeId: card.assignee_id,
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

    await db.query(
      `INSERT INTO cards (
        id, title, description, tags, checklist, attachments, 
        due_date, scheduled_date, scheduled_time, duration,
        column_id, board_id, order_position, assignee_id, priority, status, group_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        sanitizeValue(assigneeId, null),
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
      assigneeId: assigneeId || null,
      priority: priority || 'medium',
      status: status || 'not_started',
      groupId: groupId || null
    };

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
      priority,
      status,
      groupId
    } = req.body;

    // Validação básica
    if (!title && title !== '') {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    // Debug log
    console.log('Updating card with data:', {
      title, description, tags, checklist, attachments,
      dueDate, scheduledDate, scheduledTime, duration,
      column, order, completed, boardId, assigneeId, priority, status, groupId
    });

    // Prepare sanitized parameters
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
      sanitizeValue(column, ''), 
      sanitizeValue(order, 0), 
      sanitizeValue(completed, false),
      sanitizeValue(boardId, null),
      sanitizeValue(assigneeId, null),
      sanitizeValue(priority, 'medium'),
      sanitizeValue(status, 'not_started'),
      sanitizeValue(groupId, null),
      req.params.id
    ];

    console.log('Sanitized parameters:', params);

    await db.query(
      `UPDATE cards SET 
        title = ?, description = ?, tags = ?, checklist = ?, attachments = ?,
        due_date = ?, scheduled_date = ?, scheduled_time = ?, duration = ?,
        column_id = ?, order_position = ?, completed = ?, board_id = ?,
        assignee_id = ?, priority = ?, status = ?, group_id = ?
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
      createdAt: updatedCard.created_at,
      assigneeId: updatedCard.assignee_id,
      priority: updatedCard.priority || 'medium',
      status: updatedCard.status || 'not_started',
      groupId: updatedCard.group_id
    };

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
      priority: updatedCard.priority || 'medium',
      status: updatedCard.status || 'not_started',
      groupId: updatedCard.group_id
    };

    res.json(formattedCard);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao mover card' });
  }
});

export default router;