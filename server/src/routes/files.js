import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import config from '../config/index.js';
import fileService from '../services/fileService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = req.query.path || '/root/code';
    await fs.ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 保持原文件名
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSize
  }
});

// 所有路由都需要认证
router.use(authMiddleware);

// 获取文件内容
router.get('/content', async (req, res, next) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: '文件路径不能为空'
      });
    }

    const result = await fileService.readFileContent(filePath);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// 保存文件
router.put('/content', async (req, res, next) => {
  try {
    const { path: filePath, content } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: '文件路径不能为空'
      });
    }

    const result = await fileService.saveFileContent(filePath, content);
    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
});

// 创建文件或文件夹
router.post('/create', async (req, res, next) => {
  try {
    const { path: itemPath, type } = req.body;

    if (!itemPath) {
      return res.status(400).json({
        success: false,
        message: '路径不能为空'
      });
    }

    const result = await fileService.createItem(itemPath, type || 'file');
    res.json({
      success: true,
      message: result.message,
      data: { path: result.path }
    });
  } catch (err) {
    next(err);
  }
});

// 删除文件或文件夹
router.delete('/', async (req, res, next) => {
  try {
    const filePath = req.query.path;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: '文件路径不能为空'
      });
    }

    const result = await fileService.deleteItem(filePath);
    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
});

// 重命名
router.patch('/rename', async (req, res, next) => {
  try {
    const { oldPath, newPath } = req.body;

    if (!oldPath || !newPath) {
      return res.status(400).json({
        success: false,
        message: '原路径和新路径不能为空'
      });
    }

    const result = await fileService.renameItem(oldPath, newPath);
    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
});

// 上传文件
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    res.json({
      success: true,
      message: '上传成功',
      data: {
        filename: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
