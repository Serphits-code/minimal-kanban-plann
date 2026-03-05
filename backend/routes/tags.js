import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /api/tags - Listar todas as tags
router.get('/', async (req, res) => {
  try {
    const tags = await db.query('SELECT * FROM tags ORDER BY name ASC');
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tags' });
  }
});

// GET /api/tags/:id - Buscar tag específica
router.get('/:id', async (req, res) => {
  try {
    const [tag] = await db.query('SELECT * FROM tags WHERE id = ?', [req.params.id]);
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }

    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tag' });
  }
});

// POST /api/tags - Criar nova tag
router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name || !color) {
      return res.status(400).json({ error: 'Nome e cor são obrigatórios' });
    }

    const id = crypto.randomUUID();

    await db.query(
      'INSERT INTO tags (id, name, color) VALUES (?, ?, ?)',
      [id, name, color]
    );

    const newTag = {
      id,
      name,
      color,
      created_at: new Date().toISOString()
    };

    res.status(201).json(newTag);
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Tag com este nome já existe' });
    } else {
      res.status(500).json({ error: 'Erro ao criar tag' });
    }
  }
});

// PUT /api/tags/:id - Atualizar tag
router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;
    
    await db.query(
      'UPDATE tags SET name = ?, color = ? WHERE id = ?',
      [name, color, req.params.id]
    );

    const [updatedTag] = await db.query('SELECT * FROM tags WHERE id = ?', [req.params.id]);
    
    if (!updatedTag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }

    res.json(updatedTag);
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Tag com este nome já existe' });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar tag' });
    }
  }
});

// DELETE /api/tags/:id - Deletar tag
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM tags WHERE id = ?', [req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }

    res.json({ message: 'Tag deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar tag' });
  }
});

export default router;