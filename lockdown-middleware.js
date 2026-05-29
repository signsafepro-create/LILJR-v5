require('dotenv').config();
const SECRET = process.env.SECRET_UNLOCK_KEY || 'LILJR_EMPEROR_2026_UNBREAKABLE';
const PUBLIC = ['/health','/api/test','/api/test/run','/build.html','/favicon.ico','/public/','/api/orders','/api/orders/'];
function lockdown(req, res, next) {
  if (PUBLIC.some(p => req.path === p || req.path.startsWith(p))) return next();
  const key = req.headers['x-liljr-key'] || req.query.key || req.body?._unlock;
  if (!key || key !== SECRET) return res.status(403).json({ locked: true, code: 'LILJR_EMPEROR_LOCK', message: 'LIL.JR 2.0 LOCKED. UNAUTHORIZED ACCESS DETECTED.' });
  next();
}
module.exports = lockdown;
