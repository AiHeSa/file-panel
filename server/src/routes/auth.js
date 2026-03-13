import express from 'express';
import { login, changePassword } from '../services/authService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// 登录
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    const result = await login(username, password);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// 验证 Token
router.get('/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      username: req.user.username
    }
  });
});

// 修改密码
router.put('/password', authMiddleware, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '原密码和新密码不能为空'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度不能少于6位'
      });
    }

    await changePassword(req.user.id, oldPassword, newPassword);
    res.json({
      success: true,
      message: '密码修改成功，请重新登录'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
