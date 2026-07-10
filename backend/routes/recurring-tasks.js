import { Router } from 'express';
import db from '../config/database.js';
import crypto from 'crypto';

const router = Router();

// GET /api/recurring-tasks - List all recurring tasks for the authenticated user
router.get('/', async (req, res) => {
  try {
    const tasks = await db.query(
      'SELECT * FROM recurring_tasks WHERE user_id = ? ORDER BY day_of_month ASC',
      [req.user.id]
    );
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching recurring tasks:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas recorrentes' });
  }
});

// POST /api/recurring-tasks - Create a new recurring task
router.post('/', async (req, res) => {
  try {
    const { title, description, dayOfMonth } = req.body;

    if (!title || !dayOfMonth) {
      return res.status(400).json({ error: 'Título e dia do mês são obrigatórios' });
    }

    const day = parseInt(dayOfMonth, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      return res.status(400).json({ error: 'Dia do mês deve ser entre 1 e 31' });
    }

    const id = crypto.randomUUID();
    await db.query(
      'INSERT INTO recurring_tasks (id, title, description, day_of_month, user_id) VALUES (?, ?, ?, ?, ?)',
      [id, title, description || '', day, req.user.id]
    );

    const [task] = await db.query('SELECT * FROM recurring_tasks WHERE id = ?', [id]);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating recurring task:', error);
    res.status(500).json({ error: 'Erro ao criar tarefa recorrente' });
  }
});

// PUT /api/recurring-tasks/:id - Update a recurring task
router.put('/:id', async (req, res) => {
  try {
    const { title, description, dayOfMonth, active } = req.body;
    const { id } = req.params;

    // Verify ownership
    const [existing] = await db.query(
      'SELECT * FROM recurring_tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Tarefa recorrente não encontrada' });
    }

    const day = dayOfMonth !== undefined ? parseInt(dayOfMonth, 10) : existing.day_of_month;
    if (isNaN(day) || day < 1 || day > 31) {
      return res.status(400).json({ error: 'Dia do mês deve ser entre 1 e 31' });
    }

    await db.query(
      `UPDATE recurring_tasks SET title = ?, description = ?, day_of_month = ?, active = ? WHERE id = ? AND user_id = ?`,
      [
        title !== undefined ? title : existing.title,
        description !== undefined ? description : existing.description,
        day,
        active !== undefined ? active : existing.active,
        id,
        req.user.id,
      ]
    );

    const [updated] = await db.query('SELECT * FROM recurring_tasks WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating recurring task:', error);
    res.status(500).json({ error: 'Erro ao atualizar tarefa recorrente' });
  }
});

// DELETE /api/recurring-tasks/:id - Delete a recurring task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM recurring_tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tarefa recorrente não encontrada' });
    }

    res.json({ message: 'Tarefa recorrente excluída' });
  } catch (error) {
    console.error('Error deleting recurring task:', error);
    res.status(500).json({ error: 'Erro ao excluir tarefa recorrente' });
  }
});

export default router;
