const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// **MySQL Veritabanı Bağlantısı**
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Qaras.2002',
    database: 'health_management_system'
});

db.connect(err => {
    if (err) {
        console.error('❌ Veritabanı bağlantı hatası:', err.stack);
        return;
    }
    console.log('✅ Veritabanına bağlandı.');
});

// **Hasta Listesini Getir (GET /patients)**
app.get('/patients', (req, res) => {
    const query = 'SELECT id, phone, role, first_name, created_at FROM users WHERE role = "patient"';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Hasta listesi alınırken hata oluştu' });
        }
        res.status(200).json(results);
    });
});


// **Yeni Hasta Ekleme (POST /patients)**
app.post('/patients', (req, res) => {
    const { name, phone } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ message: 'Ad ve telefon gereklidir!' });
    }

    const query = 'INSERT INTO users (phone, password, role, first_name) VALUES (?, ?, ?, ?)';
    db.query(query, [phone, bcrypt.hashSync('123456', 10), "patient", name], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Hasta eklenemedi', error: err });
        }
        res.status(200).json({ message: 'Hasta başarıyla eklendi', userId: result.insertId });
    });
});



// **Hasta Silme (DELETE /patients/:id)**
app.delete('/patients/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'DELETE FROM users WHERE id = ?';

    db.query(query, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Hasta silinirken hata oluştu' });
        }
        res.status(200).json({ message: 'Hasta başarıyla silindi' });
    });
});

// **Sekreter Listesini Getir (GET /secretaries)**
app.get('/secretaries', (req, res) => {
    const query = 'SELECT id, phone, role, first_name, created_at FROM users WHERE role = "secretary"';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Sekreter listesi alınırken hata oluştu' });
        }
        res.status(200).json(results);
    });
});

// **Yeni Sekreter Ekleme (POST /secretaries)**
app.post('/secretaries', (req, res) => {
    const {phone, password } = req.body;
    
    if (!phone || !password) {
        return res.status(400).json({ message: 'Ad, telefon ve şifre gereklidir!' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    const query = 'INSERT INTO users (phone, password, role, first_name) VALUES (?, ?, ?, ?)';
    db.query(query, [phone, hashedPassword, "secretary", name], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Sekreter eklenemedi', error: err });
        }
        res.status(200).json({ message: 'Sekreter başarıyla eklendi', userId: result.insertId });
    });
});

// **Sekreter Silme (DELETE /secretaries/:id)**
app.delete('/secretaries/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'DELETE FROM users WHERE id = ? AND role = "secretary"';
    
    db.query(query, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Sekreter silinirken hata oluştu', error: err });
        }
        res.status(200).json({ message: 'Sekreter başarıyla silindi' });
    });
});


// **Sunucuyu Başlat**
app.listen(port, () => {
    console.log(`🚀 Sunucu http://localhost:${port} adresinde çalışıyor`);
});

