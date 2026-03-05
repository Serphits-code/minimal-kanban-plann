import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /api/employees - Listar todos os funcionários
router.get('/', async (req, res) => {
  try {
    const employees = await db.query('SELECT * FROM employees ORDER BY name ASC');
    
    const formattedEmployees = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      avatar: emp.avatar,
      role: emp.role,
      userId: emp.user_id,
      createdAt: emp.created_at
    }));

    res.json(formattedEmployees);
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
    res.status(500).json({ error: 'Erro ao buscar funcionários' });
  }
});

// GET /api/employees/:id - Buscar funcionário específico
router.get('/:id', async (req, res) => {
  try {
    const [employee] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    
    if (!employee) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    const formattedEmployee = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      avatar: employee.avatar,
      role: employee.role,
      userId: employee.user_id,
      createdAt: employee.created_at
    };

    res.json(formattedEmployee);
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error);
    res.status(500).json({ error: 'Erro ao buscar funcionário' });
  }
});

// POST /api/employees - Criar novo funcionário
router.post('/', async (req, res) => {
  try {
    const { name, email, avatar, role } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const id = crypto.randomUUID();

    await db.query(
      'INSERT INTO employees (id, name, email, avatar, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email || null, avatar || null, role || null]
    );

    const newEmployee = {
      id,
      name,
      email: email || null,
      avatar: avatar || null,
      role: role || null,
      createdAt: new Date().toISOString()
    };

    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    res.status(500).json({ error: 'Erro ao criar funcionário' });
  }
});

// PUT /api/employees/:id - Atualizar funcionário
router.put('/:id', async (req, res) => {
  try {
    const { name, email, avatar, role } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    await db.query(
      'UPDATE employees SET name = ?, email = ?, avatar = ?, role = ? WHERE id = ?',
      [name, email || null, avatar || null, role || null, req.params.id]
    );

    const [updatedEmployee] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    
    if (!updatedEmployee) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    const formattedEmployee = {
      id: updatedEmployee.id,
      name: updatedEmployee.name,
      email: updatedEmployee.email,
      avatar: updatedEmployee.avatar,
      role: updatedEmployee.role,
      userId: updatedEmployee.user_id,
      createdAt: updatedEmployee.created_at
    };

    res.json(formattedEmployee);
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
    res.status(500).json({ error: 'Erro ao atualizar funcionário' });
  }
});

// DELETE /api/employees/:id - Deletar funcionário
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    res.json({ message: 'Funcionário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar funcionário:', error);
    res.status(500).json({ error: 'Erro ao deletar funcionário' });
  }
});

// GET /api/employees/search/:query - Buscar funcionários por nome
router.get('/search/:query', async (req, res) => {
  try {
    const searchQuery = `%${req.params.query}%`;
    const employees = await db.query(
      'SELECT * FROM employees WHERE name LIKE ? OR email LIKE ? ORDER BY name ASC LIMIT 10',
      [searchQuery, searchQuery]
    );
    
    const formattedEmployees = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      avatar: emp.avatar,
      role: emp.role,
      createdAt: emp.created_at
    }));

    res.json(formattedEmployees);
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
    res.status(500).json({ error: 'Erro ao buscar funcionários' });
  }
});

export default router;
