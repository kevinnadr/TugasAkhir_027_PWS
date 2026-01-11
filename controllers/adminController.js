const db = require('../config/database');

// --- ADMIN DASHBOARD ---

// READ: Ambil Semua Data (Produk & User) untuk Dashboard
exports.getDashboardData = (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Bukan Admin' });
    }
    
    const queryProds = 'SELECT * FROM products';
    const queryUsers = 'SELECT id, username, password, api_key, role FROM users WHERE role="user"'; 
    
    db.query(queryProds, (err, products) => {
        if (err) {
            return res.status(500).json({ error: 'Gagal mengambil data produk' });
        }
        
        db.query(queryUsers, (err, users) => {
            if (err) {
                return res.status(500).json({ error: 'Gagal mengambil data user' });
            }
            
            res.json({ products, users });
        });
    });
};

// --- USER MANAGEMENT (ADMIN) ---

// CREATE: Tambah User Baru (Manual oleh Admin)
exports.createUser = (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Bukan Admin' });
    }
    
    const { username, password } = req.body;
    
    // Validasi input
    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }
    
    db.query('INSERT INTO users (username, password, role) VALUES (?, ?, "user")', [username, password], (err) => {
        if (err) {
            console.error('Error creating user:', err);
            return res.status(400).json({ success: false, message: 'Username sudah ada' });
        }
        res.json({ 
            success: true, 
            message: 'User berhasil ditambahkan' 
        });
    });
};

// READ: Ambil Semua User
exports.getAllUsers = (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Bukan Admin' });
    }
    
    db.query('SELECT id, username, api_key, role FROM users', (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: 'Gagal mengambil data user' });
        }
        res.json(results);
    });
};

// READ: Ambil User Berdasarkan ID
exports.getUserById = (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Bukan Admin' });
    }
    
    const { id } = req.params;
    
    db.query('SELECT id, username, password, api_key, role FROM users WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ error: 'Gagal mengambil data user' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }
        
        res.json(results[0]);
    });
};

// UPDATE: Edit User (Ganti Username/Password)
exports.updateUser = (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Bukan Admin' });
    }
    
    const { id } = req.params;
    const { username, password } = req.body;
    
    // Validasi input
    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }
    
    db.query('UPDATE users SET username = ?, password = ? WHERE id = ?', [username, password, id], (err) => {
        if (err) {
            console.error('Error updating user:', err);
            return res.status(400).json({ success: false, message: 'Username sudah ada atau error lainnya' });
        }
        res.json({ 
            success: true, 
            message: 'User berhasil diubah' 
        });
    });
};

// DELETE: Hapus User
exports.deleteUser = (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Bukan Admin' });
    }
    
    const { id } = req.params;
    
    // Prevent deleting self
    if (id == req.session.userid) {
        return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
    }
    
    db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ error: 'Gagal menghapus user' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }
        
        res.json({ 
            success: true, 
            message: 'User berhasil dihapus' 
        });
    });
};
