const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'uma_chave_secreta_local';

function verificarToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token inválido ou ausente' });
  }
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // attach userId and userRole
    req.userId = payload.userId;
    req.userRole = payload.userRole;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function verificarAdmin(req, res, next) {
  if (req.userRole && req.userRole === 'admin') return next();
  return res.status(403).json({ error: 'Ação permitida apenas para administradores' });
}

module.exports = {
  verificarToken,
  verificarAdmin,
};
