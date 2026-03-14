// backend/controllers/coworkingAuthController.js
const CoworkingUser = require('../models/CoworkingUser');
const bcrypt = require('bcryptjs');

// Registro
exports.register = async (req, res) => {
  const { name, username, email, password, pin, pattern, method } = req.body;
  let hash, methodField = {};
  if (method === 'password' && password) {
    hash = await bcrypt.hash(password, 10);
    methodField = { password: hash };
  } else if (method === 'pin' && pin) {
    hash = await bcrypt.hash(pin, 10);
    methodField = { pin: hash };
  } else if (method === 'pattern' && pattern) {
    hash = await bcrypt.hash(pattern, 10);
    methodField = { pattern: hash };
  } else {
    return res.status(400).json({ error: 'Método o credencial inválida' });
  }
  const user = new CoworkingUser({ name, username, email, ...methodField });
  await user.save();
  res.json({ success: true, user });
};

// Login
exports.login = async (req, res) => {
  const { identifier, password, pin, pattern, method } = req.body;
  const user = await CoworkingUser.findOne({ $or: [ { email: identifier }, { username: identifier } ] });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  let valid = false;
  if (method === 'password' && password && user.password) {
    valid = await bcrypt.compare(password, user.password);
  } else if (method === 'pin' && pin && user.pin) {
    valid = await bcrypt.compare(pin, user.pin);
  } else if (method === 'pattern' && pattern && user.pattern) {
    valid = await bcrypt.compare(pattern, user.pattern);
  }
  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });
  // ...generar token, etc.
  res.json({ success: true, user });
};

// routes/coworking.js (añadir)
// router.post('/register', authCtrl.register);
// router.post('/login', authCtrl.login);
