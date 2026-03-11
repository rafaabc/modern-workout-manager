import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token is required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(401).json({ error: 'Authentication is not configured' });
    }

    const decoded = jwt.verify(token, secret);
    req.user = { userId: decoded.userId, username: decoded.username };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
