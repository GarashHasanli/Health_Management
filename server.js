const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware’ler
app.use(cors({
  origin: [ 'http://localhost:5500', 'http://127.0.0.1:5500' ],
  credentials: true
}));
app.use(express.json());

// MySQL bağlantı pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Qaras.2002',
  database: 'health_management_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Tüm istekleri logla
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Kök route
app.get('/', (req, res) => {
  res.send('Health Management System API çalışıyor!');
});

/* ===================
   AUTH (Kayıt & Giriş)
   =================== */

// Yeni kullanıcı (hasta veya sekreter) kaydı
app.post('/register', async (req, res) => {
  const { phone, password, role, name } = req.body;
  if (!phone || !password || !role || !name) {
    return res.status(400).json({ error: 'Telefon, şifre, rol ve isim gereklidir' });
  }
  if (!['patient','secretary','admin'].includes(role)) {
    return res.status(400).json({ error: 'Geçersiz rol' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(`
      INSERT INTO users (phone, password, role, first_name)
      VALUES (?, ?, ?, ?)
    `, [phone, hashed, role, name]);

    res.json({ message: 'Kayıt başarılı', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kayıt yapılamadı' });
  }
});

// Giriş (login)
app.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Telefon ve şifre gereklidir' });
  }
  try {
    const [rows] = await pool.query(`
      SELECT id, phone, password, role, first_name
      FROM users WHERE phone = ? LIMIT 1
    `, [phone]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Şifre yanlış' });
    }

    // Giriş başarılı
    res.json({
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        role: user.role,
        first_name: user.first_name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

/* ============================
   HASTA (patients) işlemleri
   ============================ */

app.get('/patients', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, phone, first_name,
             tedavi_baslangic AS startDate,
             tedavi_bitis    AS endDate,
             haftalik_adim   AS stepGoal,
             notlar          AS notes
      FROM users WHERE role = 'patient'
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

app.post('/patients', async (req, res) => {
  const { name, phone, startDate, endDate, stepGoal, notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Ad ve telefon gereklidir' });
  }
  try {
    const hashed = await bcrypt.hash('123456', 10);
    const [result] = await pool.query(`
      INSERT INTO users
      (phone, password, role, first_name, tedavi_baslangic, tedavi_bitis, haftalik_adim, notlar)
      VALUES (?, ?, 'patient', ?, ?, ?, ?, ?)
    `, [phone, hashed, name, startDate, endDate, stepGoal, notes]);
    res.json({ message: 'Hasta başarıyla eklendi', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hasta eklenemedi' });
  }
});

/* ==============================
   SEKRETER (secretaries) işlemleri
   ============================== */

app.get('/secretaries', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, phone, first_name
      FROM users WHERE role = 'secretary'
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

app.post('/secretaries', async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Ad ve telefon gereklidir' });
  }
  try {
    const hashed = await bcrypt.hash('123456', 10);
    const [result] = await pool.query(`
      INSERT INTO users
      (phone, password, role, first_name)
      VALUES (?, ?, 'secretary', ?)
    `, [phone, hashed, name]);
    res.json({ message: 'Sekreter başarıyla eklendi', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sekreter eklenemedi' });
  }
});

/* ==============================
   404 ve Hata Yönetimi
   ============================== */

app.use((req, res) => {
  res.status(404).send('Sayfa bulunamadı');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Bir hata oluştu!');
});

/* ==============================
   Sunucu Başlatma
   ============================== */

const server = app.listen(port, () => {
  console.log(`🚀 Sunucu http://localhost:${port} adresinde çalışıyor`);
});

process.on('SIGINT', () => {
  console.log('Sunucu kapatılıyor...');
  server.close(() => {
    console.log('Sunucu başarıyla kapatıldı');
    process.exit(0);
  });
});
