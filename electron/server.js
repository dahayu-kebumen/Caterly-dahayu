
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Menangani error agar server tidak langsung mati jika ada kesalahan
process.on('uncaughtException', (err) => {
  console.error('\n[DATABASE ERROR] Ada masalah pada sistem:');
  console.error(err.message);
});

process.on('unhandledRejection', (reason) => {
  console.warn('[UNHANDLED REJECTION]:', reason);
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'caterly_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 3000
};

let pool = null;
let isDbConnected = false;
const memoryStore = new Map();

async function initDB() {
  console.log('>>> Mengecek ketersediaan database...');
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      connectTimeout: 3000
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.end();

    pool = mysql.createPool(dbConfig);
    await pool.query('SELECT 1');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_data (
        id VARCHAR(50) PRIMARY KEY,
        content LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✔ DATABASE: TERHUBUNG (MySQL Aktif)');
    isDbConnected = true;
  } catch (err) {
    console.log('ℹ [Caterly OS] Berjalan dalam mode Cloud / Penyimpanan Mandiri (Tanpa MySQL XAMPP).');
    isDbConnected = false;
  }
}

// API Routes
app.get('/api/ping', (req, res) => {
  res.json({ status: 'alive', info: 'Caterly Backend Port 3000' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    mode: isDbConnected ? 'mysql' : 'cloud_standalone',
    db: isDbConnected ? 'connected' : 'standalone'
  });
});

app.get('/api/data/:key', async (req, res) => {
  if (isDbConnected && pool) {
    try {
      const [rows] = await pool.query('SELECT content FROM app_data WHERE id = ?', [req.params.key]);
      if (rows.length > 0) {
        return res.json(JSON.parse(rows[0].content));
      }
    } catch (err) {
      console.warn('MySQL Read Error, falling back to memoryStore:', err.message);
    }
  }

  if (memoryStore.has(req.params.key)) {
    return res.json(memoryStore.get(req.params.key));
  }
  res.status(404).json({ error: 'Not found' });
});

app.post('/api/data/:key', async (req, res) => {
  memoryStore.set(req.params.key, req.body);

  if (isDbConnected && pool) {
    try {
      const content = JSON.stringify(req.body);
      await pool.query(
        'INSERT INTO app_data (id, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = ?',
        [req.params.key, content, content]
      );
    } catch (err) {
      console.warn('MySQL Write Error:', err.message);
    }
  }

  res.json({ success: true });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          res.status(500).send('Application build files not found. Please run npm run build.');
        }
      });
    });
  }

  app.listen(PORT, HOST, () => {
    console.log('\n====================================================');
    console.log(`🚀 CATERLY SMART OS AKTIF DI: http://${HOST}:${PORT}`);
    console.log('====================================================');
    console.log('Akses dari perangkat lain menggunakan IP komputer ini.');
    initDB();
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting Caterly server:', err);
  process.exit(1);
});
