const db = require('../config/database');

// --- CRUD PRODUK (CompuStore) ---

// READ: Ambil Semua Produk
exports.getAllProducts = (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error mengambil data produk' });
        }
        res.json(results);
    });
};

// READ: Ambil Produk Berdasarkan ID
exports.getProductById = (req, res) => {
    const { id } = req.params;
    
    db.query('SELECT * FROM products WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error mengambil data produk' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Produk tidak ditemukan' });
        }
        
        res.json(results[0]);
    });
};

// CREATE: Tambah Produk Baru (Admin Only)
exports.createProduct = (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Bukan Admin' });
    }
    
    const { nama, harga, stok, deskripsi } = req.body;
    const gambar = req.file ? '/uploads/' + req.file.filename : null;

    // Validasi input
    if (!nama || !harga || !stok) {
        return res.status(400).json({ error: 'Nama, harga, dan stok wajib diisi' });
    }

    const sql = 'INSERT INTO products (nama_barang, harga, stok, deskripsi, gambar) VALUES (?,?,?,?,?)';
    db.query(sql, [nama, harga, stok, deskripsi, gambar], (err, result) => {
        if (err) {
            console.error('Error creating product:', err);
            return res.status(500).json({ error: 'Gagal menambah produk' });
        }
        res.json({ 
            success: true, 
            message: 'Produk berhasil ditambahkan',
            productId: result.insertId 
        });
    });
};

// UPDATE: Edit Produk (Admin Only)
exports.updateProduct = (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Bukan Admin' });
    }

    const { nama, harga, stok, deskripsi } = req.body;
    const { id } = req.params;

    // Validasi input
    if (!nama || !harga || !stok) {
        return res.status(400).json({ error: 'Nama, harga, dan stok wajib diisi' });
    }

    let sql;
    let params;

    if (req.file) {
        // Jika admin upload gambar baru -> Update kolom gambar juga
        const gambar = '/uploads/' + req.file.filename;
        sql = 'UPDATE products SET nama_barang = ?, harga = ?, stok = ?, deskripsi = ?, gambar = ? WHERE id = ?';
        params = [nama, harga, stok, deskripsi, gambar, id];
    } else {
        // Jika tidak upload gambar -> Update data teks saja
        sql = 'UPDATE products SET nama_barang = ?, harga = ?, stok = ?, deskripsi = ? WHERE id = ?';
        params = [nama, harga, stok, deskripsi, id];
    }

    db.query(sql, params, (err) => {
        if (err) {
            console.error('Error updating product:', err);
            return res.status(500).json({ error: 'Gagal mengubah produk' });
        }
        res.json({ 
            success: true, 
            message: 'Produk berhasil diubah' 
        });
    });
};

// DELETE: Hapus Produk (Admin Only)
exports.deleteProduct = (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Bukan Admin' });
    }
    
    const { id } = req.params;
    
    db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).json({ error: 'Gagal menghapus produk' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Produk tidak ditemukan' });
        }
        
        res.json({ 
            success: true, 
            message: 'Produk berhasil dihapus' 
        });
    });
};

// BELI PRODUK: Kurangi Stok (User)
exports.buyProduct = (req, res) => {
    const { id } = req.params;
    
    db.query('UPDATE products SET stok = stok - 1 WHERE id = ? AND stok > 0', [id], (err, result) => {
        if (err) {
            console.error('Error buying product:', err);
            return res.status(500).json({ error: 'Error pada server' });
        }
        
        if (result.changedRows > 0) {
            res.json({ success: true, message: 'Pembelian Berhasil!' });
        } else {
            res.json({ success: false, message: 'Stok Habis' });
        }
    });
};
