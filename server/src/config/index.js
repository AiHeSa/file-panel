// 服务配置
export const config = {
  // 服务端口
  port: process.env.PORT || 7001,

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'file-panel-secret-key-change-in-production',
    expiresIn: '24h'
  },

  // 允许访问的根目录
  allowedRoots: [
    '/root',
    '/root/code',
    '/root/webapps'
  ],

  // 文件上传配置
  upload: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedExtensions: [
      '.txt', '.js', '.ts', '.vue', '.jsx', '.tsx',
      '.json', '.md', '.css', '.scss', '.less',
      '.html', '.xml', '.yaml', '.yml',
      '.sh', '.bash', '.zsh',
      '.py', '.java', '.go', '.rs', '.c', '.cpp', '.h',
      '.sql', '.env', '.conf', '.cfg', '.ini',
      '.log', '.gitignore', '.dockerignore',
      '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp'
    ]
  },

  // 可编辑的文本文件扩展名
  editableExtensions: [
    '.txt', '.js', '.ts', '.vue', '.jsx', '.tsx',
    '.json', '.md', '.css', '.scss', '.less',
    '.html', '.xml', '.yaml', '.yml',
    '.sh', '.bash', '.zsh',
    '.py', '.java', '.go', '.rs', '.c', '.cpp', '.h',
    '.sql', '.env', '.conf', '.cfg', '.ini',
    '.log', '.gitignore', '.dockerignore'
  ]
};

export default config;
