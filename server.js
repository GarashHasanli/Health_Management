const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(express.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Qaras.2002',
  database: 'health_management_system',
  waitForConnections: true,
  connectionLimit: 10
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Health Management System API çalışıyor!');
});

// ✅ Login
app.post('/login', async (req, res) => {
  const { phone, password, role } = req.body;

  if (!phone || !password || !role) {
    return res.status(400).json({ error: 'Telefon, şifre ve rol gereklidir' });
  }

  if (!['patient', 'secretary', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Geçersiz rol' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, phone, password, role, first_name FROM users WHERE phone = ? LIMIT 1`,
      [phone]
    );

    if (rows.length === 0) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Şifre yanlış' });

    if (user.role !== role && user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu giriş sayfasından giriş yetkiniz yok.' });
    }

    res.json({
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        role: user.role,
        first_name: user.first_name
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ✅ Register (Sadece hasta)
app.post('/register', async (req, res) => {
  const { first_name, last_name, phone, password, role } = req.body;

  if (role !== 'patient') {
    return res.status(400).json({ error: 'Sadece hasta kayıt olabilir' });
  }

  if (!first_name || !last_name || !phone || !password) {
    return res.status(400).json({ error: 'Tüm alanlar gereklidir' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (phone, password, role, first_name, last_name, created_at)
       VALUES (?, ?, 'patient', ?, ?, NOW())`,
      [phone, hashed, first_name, last_name]
    );

    res.json({ message: 'Kayıt başarılı', id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Kayıt sırasında hata oluştu' });
  }
});

// ✅ Sekreterleri getir
app.get('/secretaries', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, first_name, last_name, phone, created_at
      FROM users
      WHERE role = 'secretary'
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ✅ Sekreter ekle
app.post('/secretaries', async (req, res) => {
  const { first_name, last_name, phone, password } = req.body;

  if (!first_name || !last_name || !phone || !password) {
    return res.status(400).json({ error: 'Zorunlu alanlar eksik' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const [r] = await pool.query(`
      INSERT INTO users (phone, password, role, first_name, last_name, created_at)
      VALUES (?, ?, 'secretary', ?, ?, NOW())`,
      [phone, hashed, first_name, last_name]
    );

    res.json({ message: 'Sekreter eklendi', id: r.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sekreter eklenemedi' });
  }
});

// ✅ Hastaları getir
app.get('/patients', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, first_name, last_name, phone, created_at,
             tedavi_baslangic AS treatment_start,
             tedavi_bitis     AS treatment_end,
             haftalik_adim    AS weekly_step_goal,
             notlar           AS notes
      FROM users
      WHERE role = 'patient'
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ✅ Yeni hasta ekle
app.post('/patients', async (req, res) => {
  const {
    first_name, last_name, phone, password,
    treatment_start, treatment_end, weekly_step_goal, notes
  } = req.body;

  if (!first_name || !last_name || !phone || !password) {
    return res.status(400).json({ error: 'Zorunlu alanlar eksik' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const [r] = await pool.query(`
      INSERT INTO users
      (phone, password, role, first_name, last_name, tedavi_baslangic, tedavi_bitis, haftalik_adim, notlar, created_at)
      VALUES (?, ?, 'patient', ?, ?, ?, ?, ?, ?, NOW())`,
      [phone, hashed, first_name, last_name, treatment_start, treatment_end, weekly_step_goal, notes]
    );

    res.json({ message: 'Hasta eklendi', id: r.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Hasta eklenemedi' });
  }
});

// ✅ Hasta getir (tek)
app.get('/patients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT id, first_name, last_name, phone, created_at,
             tedavi_baslangic AS treatment_start,
             tedavi_bitis     AS treatment_end,
             haftalik_adim    AS weekly_step_goal,
             notlar           AS notes
      FROM users
      WHERE role = 'patient' AND id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Hasta bulunamadı' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ✅ Hasta güncelle (şifre isteğe bağlı)
app.put('/patients/:id', async (req, res) => {
  const { id } = req.params;
  const {
    first_name, last_name, phone, password,
    treatment_start, treatment_end, weekly_step_goal, notes
  } = req.body;

  if (!first_name || !last_name || !phone) {
    return res.status(400).json({ error: 'Zorunlu alanlar eksik' });
  }

  let query = `UPDATE users SET first_name = ?, last_name = ?, phone = ?, 
               tedavi_baslangic = ?, tedavi_bitis = ?, haftalik_adim = ?, notlar = ?`;
  const params = [first_name, last_name, phone, treatment_start, treatment_end, weekly_step_goal, notes];

  if (password && password.trim() !== '') {
    const hashedPassword = await bcrypt.hash(password, 10);
    query += `, password = ?`;
    params.push(hashedPassword);
  }

  query += ` WHERE id = ? AND role = 'patient'`;
  params.push(id);

  try {
    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hasta bulunamadı' });
    }
    res.json({ message: 'Hasta güncellendi' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Güncelleme sırasında hata oluştu' });
  }
});

// ✅ Hasta sil
app.delete('/patients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(`DELETE FROM users WHERE id = ? AND role = 'patient'`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hasta bulunamadı' });
    }
    res.json({ message: 'Hasta silindi' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Silme sırasında hata oluştu' });
  }
});

// Hatalar
app.use((req, res) => {
  res.status(404).send('Sayfa bulunamadı');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Bir hata oluştu!');
});

const server = app.listen(port, () => {
  console.log(`🚀 Sunucu http://localhost:${port} adresinde çalışıyor`);
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('🔴 Sunucu durduruldu.');
    process.exit(0);
  });
});
