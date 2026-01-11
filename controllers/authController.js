const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// --- LOGIN USER ---
exports.login = (req, res) => {
    const { username, password } = req.body;
    
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) {
            return res.json({ success: false, message: 'Error pada server' });
        }
        
        if (results.length > 0) {
            req.session.loggedin = true;
            req.session.userid = results[0].id;
            req.session.role = results[0].role;
            
            // Redirect sesuai role
            res.json({ 
                success: true, 
                redirect: results[0].role === 'admin' ? '/admin_dashboard.html' : '/user_dashboard.html' 
            });
        } else {
            res.json({ success: false, message: 'Username atau Password Salah' });
        }
    });
};

// --- REGISTER USER BARU ---
exports.register = (req, res) => {
    const { username, password, role } = req.body;
    
    // Validasi role (hanya admin atau user)
    const validRole = (role === 'admin' || role === 'user') ? role : 'user';

    db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, validRole], (err) => {
        if (err) {
            return res.json({ success: false, message: 'Username sudah digunakan' });
        }
        res.json({ success: true, message: 'Registrasi berhasil' });
    });
};

// --- LOGOUT USER ---
exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/index.html');
};

// --- CEK SESSION STATUS ---
exports.checkSession = (req, res) => {
    if (req.session.loggedin) {
        res.json({ 
            loggedin: true, 
            userid: req.session.userid, 
            role: req.session.role 
        });
    } else {
        res.json({ loggedin: false });
    }
};

// --- AMBIL INFO USER YANG LOGIN ---
exports.getUserInfo = (req, res) => {
    if (!req.session.loggedin) return res.status(401).json({ error: 'Unauthorized' });
    
    db.query('SELECT username, api_key FROM users WHERE id = ?', [req.session.userid], (err, result) => {
        if (err) {
            return res.json({ error: 'Error pada server' });
        }
        res.json(result[0]);
    });
};

// --- GENERATE API KEY BARU ---
exports.generateAPIKey = (req, res) => {
    if (!req.session.loggedin) return res.status(401).json({ error: 'Unauthorized' });
    
    const newKey = uuidv4(); // Buat UUID unik
    db.query('UPDATE users SET api_key = ? WHERE id = ?', [newKey, req.session.userid], (err) => {
        if (err) {
            return res.json({ success: false, message: 'Error pada server' });
        }
        res.json({ success: true, api_key: newKey });
    });
};

// --- VALIDASI API KEY ---
exports.validateAPIKey = (req, res) => {
    if (!req.session.loggedin) return res.status(401).json({ error: 'Unauthorized' });
    
    const { input_key } = req.body;
    // Cek apakah key cocok dengan user yang login
    db.query('SELECT * FROM users WHERE id = ? AND api_key = ?', [req.session.userid, input_key], (err, results) => {
        if (err) {
            return res.json({ success: false, message: 'Error pada server' });
        }
        
        if (results.length > 0) {
            req.session.product_access = true; // Beri akses sesi
            res.json({ success: true, message: 'API Key valid' });
        } else {
            res.json({ success: false, message: 'API Key tidak cocok' });
        }
    });
};
