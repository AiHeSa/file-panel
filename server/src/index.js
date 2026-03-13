import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import dirRoutes from './routes/dirs.js';
import searchRoutes from './routes/search.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/dirs', dirRoutes);
app.use('/api/search', searchRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 启动服务
app.listen(config.port, () => {
  console.log(`🦐 文件管理面板后端服务已启动`);
  console.log(`   端口: ${config.port}`);
  console.log(`   时间: ${new Date().toLocaleString('zh-CN')}`);
});
