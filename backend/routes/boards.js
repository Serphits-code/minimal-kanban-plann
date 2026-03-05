import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Safe JSON parse - handles already-parsed JSONB objects from pg
const safeParse = (val, defaultVal = null) => {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return defaultVal; }
};

// GET /api/boards - Listar todos os boards
router.get('/', async (req, res) => {
  try {
    const boards = await db.query('SELECT * FROM boards ORDER BY created_at DESC');
    
    // Parse JSON columns
    const formattedBoards = boards.map(board => ({
      ...board,
      columns: safeParse(board.columns)
    }));

    res.json(formattedBoards);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar boards' });
  }
});

// GET /api/boards/:id - Buscar board específico
router.get('/:id', async (req, res) => {
  try {
    const [board] = await db.query('SELECT * FROM boards WHERE id = ?', [req.params.id]);
    
    if (!board) {
      return res.status(404).json({ error: 'Board não encontrado' });
    }

    const formattedBoard = {
      ...board,
      columns: safeParse(board.columns)
    };

    res.json(formattedBoard);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar board' });
  }
});

// POST /api/boards - Criar novo board
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const id = crypto.randomUUID();
    const defaultColumns = [
      { id: 'todo', name: 'A Fazer', order: 0 },
      { id: 'progress', name: 'Em Progresso', order: 1 },
      { id: 'done', name: 'Concluído', order: 2 }
    ];

    await db.query(
      'INSERT INTO boards (id, name, columns) VALUES (?, ?, ?)',
      [id, name, JSON.stringify(defaultColumns)]
    );

    const newBoard = {
      id,
      name,
      columns: defaultColumns,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    res.status(201).json(newBoard);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar board' });
  }
});

// PUT /api/boards/:id - Atualizar board
router.put('/:id', async (req, res) => {
  try {
    const { name, columns } = req.body;
    
    await db.query(
      'UPDATE boards SET name = ?, columns = ? WHERE id = ?',
      [name, JSON.stringify(columns), req.params.id]
    );

    const [updatedBoard] = await db.query('SELECT * FROM boards WHERE id = ?', [req.params.id]);
    
    if (!updatedBoard) {
      return res.status(404).json({ error: 'Board não encontrado' });
    }

    const formattedBoard = {
      ...updatedBoard,
      columns: safeParse(updatedBoard.columns)
    };

    res.json(formattedBoard);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar board' });
  }
});

// DELETE /api/boards/:id - Deletar board
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM boards WHERE id = ?', [req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Board não encontrado' });
    }

    res.json({ message: 'Board deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar board' });
  }
});

export default router;