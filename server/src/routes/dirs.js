import express from 'express';
import fileService from '../services/fileService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取目录列表
router.get('/list', async (req, res, next) => {
  try {
    const dirPath = req.query.path || '/root/code';
    const result = await fileService.listDirectory(dirPath);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// 获取目录树
router.get('/tree', async (req, res, next) => {
  try {
    const dirPath = req.query.path || '/root/code';
    const depth = parseInt(req.query.depth) || 3;
    const result = await fileService.getDirectoryTree(dirPath, depth);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

export default router;
