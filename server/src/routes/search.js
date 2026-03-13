import express from 'express';
import fileService from '../services/fileService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 搜索文件
router.get('/', async (req, res, next) => {
  try {
    const keyword = req.query.keyword;
    const searchPath = req.query.path || '/root/code';
    const searchContent = req.query.content === 'true';

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
    }

    const result = await fileService.searchFiles(keyword, searchPath, searchContent);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

export default router;
