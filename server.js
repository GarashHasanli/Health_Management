const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Dosya yükleme ayarı
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = path.join(__dirname, 'uploads');
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + unique + ext);
  }
});
const upload = multer({ storage });

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

// ---------------- Login ----------------
app.post('/login', async (req, res) => {
  const { phone, password, role } = req.body;
  if (!phone || !password || !role) return res.status(400).json({ error: 'Telefon, şifre ve rol gereklidir' });

  try {
    const [rows] = await pool.query(`SELECT id, phone, password, role, first_name FROM users WHERE phone = ? LIMIT 1`, [phone]);
    if (rows.length === 0) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Şifre yanlış' });
    if (user.role !== role && user.role !== 'admin') return res.status(403).json({ error: 'Bu giriş sayfasından giriş yetkiniz yok.' });

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

// ---------------- Register (hasta) ----------------
app.post('/register', async (req, res) => {
  const { first_name, last_name, phone, password, role } = req.body;
  if (role !== 'patient') return res.status(400).json({ error: 'Sadece hasta kayıt olabilir' });
  if (!first_name || !last_name || !phone || !password) return res.status(400).json({ error: 'Tüm alanlar gereklidir' });

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

// ---------------- Sekreter CRUD ----------------
app.get('/secretaries', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, first_name, last_name, phone, created_at
      FROM users WHERE role = 'secretary'
      ORDER BY created_at DESC`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

app.post('/secretaries', async (req, res) => {
  const { first_name, last_name, phone, password } = req.body;
  if (!first_name || !last_name || !phone || !password) return res.status(400).json({ error: 'Zorunlu alanlar eksik' });

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

app.put('/secretaries/:id', async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, phone, password } = req.body;
  if (!first_name || !last_name || !phone) return res.status(400).json({ error: 'Zorunlu alanlar eksik' });

  try {
    let query = `UPDATE users SET first_name = ?, last_name = ?, phone = ?`;
    const params = [first_name, last_name, phone];
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query += `, password = ?`;
      params.push(hashed);
    }
    query += ` WHERE id = ? AND role = 'secretary'`;
    params.push(id);

    await pool.query(query, params);
    res.json({ message: 'Sekreter güncellendi' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Güncelleme hatası' });
  }
});

app.delete('/secretaries/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(`DELETE FROM users WHERE id = ? AND role = 'secretary'`, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Sekreter bulunamadı' });
    res.json({ message: 'Sekreter silindi' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Silme sırasında hata oluştu' });
  }
});

// ---------------- Hasta CRUD ----------------
app.get('/patients', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, first_name, last_name, phone, created_at,
             tedavi_baslangic AS treatment_start,
             tedavi_bitis     AS treatment_end,
             haftalik_adim    AS weekly_step_goal,
             notlar           AS notes
      FROM users WHERE role = 'patient'
      ORDER BY created_at DESC`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

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

app.get('/patients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`SELECT * FROM users WHERE id = ? AND role = 'patient'`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Hasta bulunamadı' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

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

app.delete('/patients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(`DELETE FROM users WHERE id = ? AND role = 'patient'`, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Hasta bulunamadı' });
    res.json({ message: 'Hasta silindi' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Silme sırasında hata oluştu' });
  }
});

// ---------------- Rapor CRUD ----------------

app.post('/raporlar', upload.fields([{ name: 'video' }, { name: 'foto' }]), async (req, res) => {
  let { user_id, isim, soyisim, adim, aci, ozel_not } = req.body;
  const video = req.files?.video?.[0]?.filename || null;
  const foto = req.files?.foto?.[0]?.filename || null;

  // Adım verisini düzgün sayıya çevir (10.000 → 10000)
  adim = typeof adim === 'string' ? adim.replace(/\./g, '').replace(',', '.') : adim;
  const hedefAdim = parseFloat(adim);

  if (isNaN(hedefAdim)) {
    return res.status(400).json({ error: 'Geçersiz adım değeri' });
  }

  try {
    const [r] = await pool.query(`
      INSERT INTO raporlar (user_id, isim, soyisim, adim, aci, video, foto, ozel_not, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [user_id, isim, soyisim, hedefAdim, aci, video, foto, ozel_not]
    );

    const bugun = new Date().toISOString().split("T")[0];
    const [existing] = await pool.query(`
      SELECT id FROM adim_kayitlari
      WHERE user_id = ? AND tarih = ?`, [user_id, bugun]);

    if (existing.length === 0) {
      await pool.query(`
        INSERT INTO adim_kayitlari (user_id, isim, soyisim, tarih, hedef_adim)
        VALUES (?, ?, ?, ?, ?)`,
        [user_id, isim, soyisim, bugun, hedefAdim]
      );
    } else {
      await pool.query(`
        UPDATE adim_kayitlari SET hedef_adim = ?
        WHERE id = ?`,
        [hedefAdim, existing[0].id]
      );
    }

    res.json({ message: 'Rapor eklendi', id: r.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Rapor eklenemedi' });
  }
});

app.get('/raporlar', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM raporlar ORDER BY created_at DESC`);
    const withURLs = rows.map(r => ({
      ...r,
      video: r.video ? `/uploads/${r.video}` : null,
      foto: r.foto ? `/uploads/${r.foto}` : null
    }));
    res.json(withURLs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Listeleme hatası' });
  }
});

app.get('/raporlar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`SELECT * FROM raporlar WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Rapor bulunamadı' });
    const rapor = rows[0];
    rapor.video = rapor.video ? `/uploads/${rapor.video}` : null;
    rapor.foto = rapor.foto ? `/uploads/${rapor.foto}` : null;
    res.json(rapor);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

app.get('/raporlar/kullanici/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT * FROM raporlar
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1`, [user_id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Rapor bulunamadı' });
    const r = rows[0];
    r.video = r.video ? `/uploads/${r.video}` : null;
    r.foto = r.foto ? `/uploads/${r.foto}` : null;
    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Rapor getirme hatası' });
  }
});

app.put('/raporlar/:id', upload.fields([{ name: 'video' }, { name: 'foto' }]), async (req, res) => {
  const { id } = req.params;
  let { isim, soyisim, adim, aci, ozel_not } = req.body;
  const video = req.files?.video?.[0]?.filename;
  const foto = req.files?.foto?.[0]?.filename;

  adim = typeof adim === 'string' ? adim.replace(/\./g, '').replace(',', '.') : adim;
  const hedefAdim = parseFloat(adim);

  try {
    const [rows] = await pool.query(`SELECT * FROM raporlar WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Rapor bulunamadı" });
    const current = rows[0];

    await pool.query(`
      UPDATE raporlar SET
        isim = ?, soyisim = ?, adim = ?, aci = ?, video = ?, foto = ?, ozel_not = ?
      WHERE id = ?`,
      [
        isim || current.isim,
        soyisim || current.soyisim,
        isNaN(hedefAdim) ? current.adim : hedefAdim,
        aci || current.aci,
        video || current.video,
        foto || current.foto,
        ozel_not || current.ozel_not,
        id
      ]
    );

    // Hedef adımı adim_kayitlari tablosunda da güncelle
    const bugun = new Date().toISOString().split("T")[0];
    if (!user_id) user_id = current.user_id;

    if (!isNaN(hedefAdim)) {
      const [existing] = await pool.query(`
        SELECT id FROM adim_kayitlari
        WHERE user_id = ? AND tarih = ?`,
        [user_id, bugun]
      );

      if (existing.length > 0) {
        await pool.query(`
          UPDATE adim_kayitlari SET hedef_adim = ?
          WHERE id = ?`,
          [hedefAdim, existing[0].id]
        );
      }
    }

    res.json({ message: "Rapor güncellendi" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Güncelleme hatası" });
  }
});

app.delete('/raporlar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(`DELETE FROM raporlar WHERE id = ?`, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Rapor bulunamadı' });
    res.json({ message: 'Rapor silindi' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Silme hatası' });
  }
});



// ---------------- Günlük Adım Kayıtları ----------------

// ---------------- Günlük Adım Kayıtları ----------------

app.post('/adimlar', async (req, res) => {
  let { user_id, isim, soyisim, tarih, hedef_adim, hasta_adim } = req.body;

  if (!user_id || !isim || !soyisim) {
    return res.status(400).json({ error: 'Zorunlu alanlar eksik' });
  }

  if (!tarih) {
    tarih = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  }

  const hedef = hedef_adim !== undefined ? parseFloat(hedef_adim) : null;
  const hasta = hasta_adim !== undefined ? parseFloat(hasta_adim) : null;

  try {
    const [existing] = await pool.query(
      `SELECT id FROM adim_kayitlari WHERE user_id = ? AND tarih = ?`,
      [user_id, tarih]
    );

    if (existing.length > 0) {
      // Kayıt varsa hasta_adim güncellenir
      await pool.query(
        `UPDATE adim_kayitlari SET hasta_adim = ? WHERE id = ?`,
        [hasta, existing[0].id]
      );
      return res.json({ message: "Adım kaydı güncellendi", id: existing[0].id });
    } else {
      // Kayıt yoksa yeni kayıt eklenir
      const [r] = await pool.query(
        `INSERT INTO adim_kayitlari (user_id, isim, soyisim, tarih, hedef_adim, hasta_adim)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, isim, soyisim, tarih, isNaN(hedef) ? null : hedef, isNaN(hasta) ? null : hasta]
      );
      return res.json({ message: 'Adım kaydı eklendi', id: r.insertId });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Adım kaydı sırasında hata oluştu' });
  }
});



app.put('/adimlar/:id', async (req, res) => {
  const { id } = req.params;
  let { hasta_adim } = req.body;

  hasta_adim = parseFloat(hasta_adim);
  if (isNaN(hasta_adim)) {
    return res.status(400).json({ error: 'Geçerli bir hasta adım sayısı girilmelidir.' });
  }

  try {
    const [r] = await pool.query(`
      UPDATE adim_kayitlari SET hasta_adim = ? WHERE id = ?`,
      [hasta_adim, id]
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }
    res.json({ message: 'Adım verisi güncellendi' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Güncelleme hatası' });
  }
});

app.get('/adimlar/kullanici/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT * FROM adim_kayitlari
      WHERE user_id = ?
      ORDER BY tarih DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Adım kayıtları listelenemedi' });
  }
});

//----------Bildirim Kurallarını Listeleme-------------
app.get('/bildirim-kurallari', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, tedavi_gunu, kosul, mesaj, created_at
      FROM bildirim_kurallari
      ORDER BY tedavi_gunu ASC
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Bildirim kuralları alınamadı' });
  }
});


//---------------Yeni Bildirim Kuralı Ekleme---------
app.post('/bildirim-kurallari', async (req, res) => {
  const { tedavi_gunu, kosul, mesaj } = req.body;

  if (!tedavi_gunu || !kosul || !mesaj) {
    return res.status(400).json({ error: 'Tüm alanlar gereklidir' });
  }

  try {
    const [r] = await pool.query(`
      INSERT INTO bildirim_kurallari (tedavi_gunu, kosul, mesaj)
      VALUES (?, ?, ?)
    `, [tedavi_gunu, kosul, mesaj]);

    res.json({ message: 'Bildirim kuralı eklendi', id: r.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ekleme hatası' });
  }
});


//----------------Bildirim Kuralı Silme-------------
app.delete('/bildirim-kurallari/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [r] = await pool.query(`DELETE FROM bildirim_kurallari WHERE id = ?`, [id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Kural bulunamadı' });
    res.json({ message: 'Kural silindi' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Silme hatası' });
  }
});



// ---------------- Hata Yakalama ----------------

app.use((req, res) => {
  res.status(404).send('Sayfa bulunamadı');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Bir hata oluştu!');
});

const server = app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Sunucu durduruldu.');
    process.exit(0);
  });
});
