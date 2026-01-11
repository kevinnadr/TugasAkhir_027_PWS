const db = require('../config/database');

// --- CRUD ORDERS ---

// CREATE: Buat Pesanan Baru
exports.createOrder = (req, res) => {
    if (!req.session.loggedin) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const { fullName, phone, province, city, postalCode, address, paymentMethod, items, subtotal, shippingCost, totalAmount } = req.body;
    
    // Validasi input
    if (!fullName || !phone || !address || !paymentMethod || !items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }
    
    const user_id = req.session.userid;
    const itemsJSON = JSON.stringify(items);
    
    const sql = `INSERT INTO orders (user_id, customer_name, phone, province, city, postal_code, address, payment_method, items, subtotal, shipping_cost, total_amount, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`;
    
    db.query(sql, [user_id, fullName, phone, province, city, postalCode, address, paymentMethod, itemsJSON, subtotal, shippingCost, totalAmount], (err, result) => {
        if (err) {
            console.error('Error creating order:', err);
            return res.status(500).json({ success: false, message: 'Gagal membuat pesanan' });
        }
        res.json({ 
            success: true, 
            orderId: result.insertId, 
            message: 'Pesanan berhasil dibuat' 
        });
    });
};

// READ: Ambil History Order User (untuk user sendiri)
exports.getUserOrders = (req, res) => {
    if (!req.session.loggedin) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const user_id = req.session.userid;
    db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [user_id], (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ error: 'Gagal mengambil data pesanan' });
        }
        res.json(results);
    });
};

// READ: Ambil Order Berdasarkan ID (User hanya bisa lihat pesanan sendiri)
exports.getOrderById = (req, res) => {
    if (!req.session.loggedin) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const user_id = req.session.userid;
    
    db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, user_id], (err, results) => {
        if (err) {
            console.error('Error fetching order:', err);
            return res.status(500).json({ error: 'Gagal mengambil data pesanan' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
        }
        
        res.json(results[0]);
    });
};

// --- ADMIN ONLY ROUTES ---

// READ: Ambil Semua Orders (Admin)
exports.getAllOrders = (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Bukan Admin' });
    }
    
    db.query('SELECT * FROM orders ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ error: 'Gagal mengambil data pesanan' });
        }
        res.json(results);
    });
};

// READ: Ambil Order Berdasarkan ID (Admin)
exports.getOrderByIdAdmin = (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Bukan Admin' });
    }
    
    const { id } = req.params;
    
    db.query('SELECT * FROM orders WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error fetching order:', err);
            return res.status(500).json({ error: 'Gagal mengambil data pesanan' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
        }
        
        res.json(results[0]);
    });
};

// UPDATE: Ubah Status Order (Admin Only)
exports.updateOrderStatus = (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Bukan Admin' });
    }
    
    const { id } = req.params;
    const { status } = req.body;
    const validStatus = ['pending', 'send', 'cancel'];
    
    if (!validStatus.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status tidak valid. Gunakan: pending, send, atau cancel' });
    }
    
    db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id], (err) => {
        if (err) {
            console.error('Error updating order status:', err);
            return res.status(500).json({ success: false, message: 'Gagal mengubah status pesanan' });
        }
        res.json({ 
            success: true, 
            message: 'Status pesanan berhasil diubah' 
        });
    });
};

// DELETE: Hapus Order (Admin Only)
exports.deleteOrder = (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Bukan Admin' });
    }
    
    const { id } = req.params;
    
    db.query('DELETE FROM orders WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting order:', err);
            return res.status(500).json({ error: 'Gagal menghapus pesanan' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
        }
        
        res.json({ 
            success: true, 
            message: 'Pesanan berhasil dihapus' 
        });
    });
};
