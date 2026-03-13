import { verifyToken } from '../services/authService.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌'
    });
  }

  const token = authHeader.substring(7);
  const result = verifyToken(token);

  if (!result.valid) {
    return res.status(401).json({
      success: false,
      message: '令牌无效或已过期'
    });
  }

  req.user = result.data;
  next();
}

export default authMiddleware;
