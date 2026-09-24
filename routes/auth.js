const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

function signAccess(user) {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );
}
function signRefresh(user) {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_EXPIRES }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'Field wajib diisi' });

    const exist = await User.findOne({ $or: [{ email }, { username }] });
    if (exist) return res.status(409).json({ success: false, message: 'User sudah ada' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hash });

    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      data: { id: user._id, username: user.username, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Kredensial salah' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, message: 'Kredensial salah' });

    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ success: true, accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ success: false, message: 'Refresh token tidak ada' });

    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await User.findById(payload.id);
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ success: false, message: 'Refresh token invalid' });

    const newAccess = signAccess(user);
    res.json({ success: true, accessToken: newAccess });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Refresh token expired/invalid' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
      await User.findByIdAndUpdate(payload.id, { refreshToken: null });
    }
    res.json({ success: true, message: 'Logout berhasil' });
  } catch {
    res.json({ success: true, message: 'Logout berhasil' });
  }
});

module.exports = router;
