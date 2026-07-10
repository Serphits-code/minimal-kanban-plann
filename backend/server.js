import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { mkdirSync } from 'fs';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import boardRoutes from './routes/boards.js';
import cardRoutes from './routes/cards.js';
import tagRoutes from './routes/tags.js';
import employeeRoutes from './routes/employees.js';
import projectGroupRoutes from './routes/project-groups.js';
import authRoutes from './routes/auth.js';
import pushRoutes from './routes/push.js';
import recurringTaskRoutes from './routes/recurring-tasks.js';
import { authenticateToken } from './middleware/auth.js';
import cron from 'node-cron';
import { sendDailyDigest, sendRecurringTaskNotifications } from './lib/pushNotifications.js';
import { vapidKeys } from './config/vapid.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
  'http://localhost:3000',
  'https://projetosobj.almeida.marketing',
];

// Socket.io
const io = new SocketIOServer(httpServer, {
  cors: { origin: allowedOrigins, credentials: true }
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

// Middlewares
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configurar multer para upload de arquivos
const uploadsDir = path.join(__dirname, 'uploads');
mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomUUID()}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    // Block executable files
    const blocked = /\.(exe|bat|cmd|sh|ps1|msi|com)$/i;
    if (blocked.test(file.originalname)) {
      return cb(new Error('Tipo de arquivo não permitido'));
    }
    cb(null, true);
  }
});

// POST /api/upload - Upload de arquivo
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    name: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype,
  });
});

// Route multer errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError || error.message === 'Tipo de arquivo não permitido') {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

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
app.use('/api/recurring-tasks', authenticateToken, recurringTaskRoutes);
// Push: /vapid-key is public, subscribe/unsubscribe require auth
app.get('/api/push/vapid-key', (req, res) => res.json({ publicKey: vapidKeys.publicKey }));
app.use('/api/push', authenticateToken, pushRoutes);

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

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Daily digest at 07:00 server time (America/Sao_Paulo)
cron.schedule('0 7 * * *', () => {
  console.log('[Cron] Running daily push digest');
  sendDailyDigest();
}, { timezone: 'America/Sao_Paulo' });

// Check recurring tasks daily at 08:00 - notify on the day_of_month
cron.schedule('0 8 * * *', () => {
  console.log('[Cron] Checking recurring task notifications');
  sendRecurringTaskNotifications();
}, { timezone: 'America/Sao_Paulo' });