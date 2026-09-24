const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Data dummy
let accounts = [
  { id: 1, uid: '1001', account_id: '88812345', region: 'ID', rarity: 'MYTHIC' },
  { id: 2, uid: '1002', account_id: '12345678', region: 'ME', rarity: 'RARE' }
];

// GET /api/accounts
router.get('/', auth, (req, res) => {
  res.json({ success: true, count: accounts.length, data: accounts });
});

// GET /api/accounts/:id
router.get('/:id', auth, (req, res) => {
  const acc = accounts.find(a => a.id === Number(req.params.id));
  if (!acc) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
  res.json({ success: true, data: acc });
});

// POST /api/accounts (admin only)
router.post('/', auth, adminOnly, (req, res) => {
  const { uid, account_id, region, rarity } = req.body;
  if (!uid || !account_id)
    return res.status(400).json({ success: false, message: 'uid & account_id wajib' });

  const newAcc = { id: accounts.length + 1, uid, account_id, region, rarity };
  accounts.push(newAcc);
  res.status(201).json({ success: true, data: newAcc });
});

// DELETE /api/accounts/:id (admin only)
router.delete('/:id', auth, adminOnly, (req, res) => {
  const idx = accounts.findIndex(a => a.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
  accounts.splice(idx, 1);
  res.json({ success: true, message: 'Terhapus' });
});

module.exports = router;
