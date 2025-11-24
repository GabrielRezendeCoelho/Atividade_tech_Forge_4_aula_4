const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'uma_chave_secreta_local';

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token inválido ou ausente' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.userRole = payload.userRole;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function verificarAdmin(req, res, next) {
  if (req.userRole === 'admin') return next();
  return res.status(403).json({ error: 'Ação permitida apenas para administradores' });
}

module.exports = { verificarToken, verificarAdmin };
