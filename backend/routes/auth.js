import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register - Registrar novo usuário
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'member' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Verificar se email já existe
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = crypto.randomUUID();

    // Criar usuário
    await db.query(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, passwordHash, role]
    );

    // Criar employee vinculado automaticamente
    const employeeId = crypto.randomUUID();
    await db.query(
      'INSERT INTO employees (id, name, email, role, user_id) VALUES (?, ?, ?, ?, ?)',
      [employeeId, name, email, role === 'admin' ? 'Administrador' : 'Membro', userId]
    );

    // Gerar token
    const token = jwt.sign(
      { id: userId, email, name, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        role,
        employeeId,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// POST /api/auth/login - Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Gerar token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// GET /api/auth/me - Dados do usuário logado
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [user] = await db.query('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
});

// PUT /api/auth/profile - Atualizar perfil
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    const userId = req.user.id;

    if (email) {
      const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existing) {
        return res.status(409).json({ error: 'Email já está em uso' });
      }
    }

    await db.query(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), avatar = COALESCE(?, avatar) WHERE id = ?',
      [name, email, avatar, userId]
    );

    // Atualizar employee vinculado
    await db.query(
      'UPDATE employees SET name = COALESCE(?, name), email = COALESCE(?, email), avatar = COALESCE(?, avatar) WHERE user_id = ?',
      [name, email, avatar, userId]
    );

    const [updated] = await db.query('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?', [userId]);
    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      avatar: updated.avatar,
      createdAt: updated.created_at
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// GET /api/auth/users - Listar todos os usuários (admin only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await db.query('SELECT id, name, email, role, avatar, created_at FROM users ORDER BY name');
    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      createdAt: u.created_at
    })));
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// DELETE /api/auth/users/:id - Deletar usuário (admin only)
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem deletar usuários' });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
    }

    // Deletar employee vinculado 
    await db.query('DELETE FROM employees WHERE user_id = ?', [req.params.id]);
    
    const result = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

export default router;
