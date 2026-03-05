import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /api/project-groups - Listar todos os grupos (com filtro opcional por board)
router.get('/', async (req, res) => {
  try {
    const { boardId } = req.query;
    
    let query = 'SELECT * FROM project_groups';
    let params = [];
    
    if (boardId) {
      query += ' WHERE board_id = ?';
      params.push(boardId);
    }
    
    query += ' ORDER BY order_position ASC';
    
    const groups = await db.query(query, params);
    
    const formattedGroups = groups.map(group => ({
      id: group.id,
      name: group.name,
      boardId: group.board_id,
      order: group.order_position,
      color: group.color,
      createdAt: group.created_at
    }));

    res.json(formattedGroups);
  } catch (error) {
    console.error('Erro ao buscar grupos:', error);
    res.status(500).json({ error: 'Erro ao buscar grupos de projeto' });
  }
});

// GET /api/project-groups/:id - Buscar grupo específico
router.get('/:id', async (req, res) => {
  try {
    const [group] = await db.query('SELECT * FROM project_groups WHERE id = ?', [req.params.id]);
    
    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    const formattedGroup = {
      id: group.id,
      name: group.name,
      boardId: group.board_id,
      order: group.order_position,
      color: group.color,
      createdAt: group.created_at
    };

    res.json(formattedGroup);
  } catch (error) {
    console.error('Erro ao buscar grupo:', error);
    res.status(500).json({ error: 'Erro ao buscar grupo de projeto' });
  }
});

// POST /api/project-groups - Criar novo grupo
router.post('/', async (req, res) => {
  try {
    const { name, boardId, color } = req.body;
    
    if (!name || !boardId) {
      return res.status(400).json({ error: 'Nome e boardId são obrigatórios' });
    }

    // Get next order position
    const [maxOrder] = await db.query(
      'SELECT COALESCE(MAX(order_position), -1) as max_order FROM project_groups WHERE board_id = ?',
      [boardId]
    );

    const id = crypto.randomUUID();
    const order = maxOrder.max_order + 1;

    await db.query(
      'INSERT INTO project_groups (id, name, board_id, order_position, color) VALUES (?, ?, ?, ?, ?)',
      [id, name, boardId, order, color || '#6366f1']
    );

    const newGroup = {
      id,
      name,
      boardId,
      order,
      color: color || '#6366f1',
      createdAt: new Date().toISOString()
    };

    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    res.status(500).json({ error: 'Erro ao criar grupo de projeto' });
  }
});

// PUT /api/project-groups/:id - Atualizar grupo
router.put('/:id', async (req, res) => {
  try {
    const { name, order, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    await db.query(
      'UPDATE project_groups SET name = ?, order_position = ?, color = ? WHERE id = ?',
      [name, order || 0, color || '#6366f1', req.params.id]
    );

    const [updatedGroup] = await db.query('SELECT * FROM project_groups WHERE id = ?', [req.params.id]);
    
    if (!updatedGroup) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    const formattedGroup = {
      id: updatedGroup.id,
      name: updatedGroup.name,
      boardId: updatedGroup.board_id,
      order: updatedGroup.order_position,
      color: updatedGroup.color,
      createdAt: updatedGroup.created_at
    };

    res.json(formattedGroup);
  } catch (error) {
    console.error('Erro ao atualizar grupo:', error);
    res.status(500).json({ error: 'Erro ao atualizar grupo de projeto' });
  }
});

// DELETE /api/project-groups/:id - Deletar grupo
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM project_groups WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    res.json({ message: 'Grupo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar grupo:', error);
    res.status(500).json({ error: 'Erro ao deletar grupo de projeto' });
  }
});

export default router;
