import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import boardRoutes from './routes/boards.js';
import cardRoutes from './routes/cards.js';
import tagRoutes from './routes/tags.js';
import employeeRoutes from './routes/employees.js';
import projectGroupRoutes from './routes/project-groups.js';
import authRoutes from './routes/auth.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas públicas (sem autenticação)
app.use('/api/auth', authRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Kanban Backend API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rotas protegidas (requerem autenticação)
app.use('/api/boards', authenticateToken, boardRoutes);
app.use('/api/cards', authenticateToken, cardRoutes);
app.use('/api/tags', authenticateToken, tagRoutes);
app.use('/api/employees', authenticateToken, employeeRoutes);
app.use('/api/project-groups', authenticateToken, projectGroupRoutes);

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});