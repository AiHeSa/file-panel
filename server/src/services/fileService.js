import fs from 'fs-extra';
import path from 'path';
import config from '../config/index.js';

// 检查路径是否在允许的根目录内
export function isPathAllowed(targetPath) {
  const resolved = path.resolve(targetPath);
  return config.allowedRoots.some(root => resolved.startsWith(root));
}

// 获取文件类型（用于语法高亮）
export function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const typeMap = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.jsx': 'javascript',
    '.vue': 'vue',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.json': 'json',
    '.md': 'markdown',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.sh': 'shell',
    '.bash': 'shell',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.xml': 'xml',
    '.sql': 'sql',
    '.txt': 'plaintext',
    '.log': 'plaintext',
    '.env': 'plaintext'
  };
  return typeMap[ext] || 'plaintext';
}

// 获取目录列表
export async function listDirectory(dirPath) {
  if (!isPathAllowed(dirPath)) {
    throw new Error('无权访问该目录');
  }

  const exists = await fs.pathExists(dirPath);
  if (!exists) {
    throw new Error('目录不存在');
  }

  const stats = await fs.stat(dirPath);
  if (!stats.isDirectory()) {
    throw new Error('不是有效的目录');
  }

  const items = await fs.readdir(dirPath);
  const result = [];

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const itemStats = await fs.stat(itemPath);

    result.push({
      name: item,
      path: itemPath,
      type: itemStats.isDirectory() ? 'directory' : 'file',
      size: itemStats.size,
      modified: itemStats.mtime.toISOString(),
      extension: itemStats.isFile() ? path.extname(item) : undefined,
      isHidden: item.startsWith('.')
    });
  }

  // 排序：文件夹在前，然后按名称排序
  result.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === 'directory' ? -1 : 1;
  });

  return { path: dirPath, items: result };
}

// 获取目录树
export async function getDirectoryTree(dirPath, depth = 3, currentDepth = 0) {
  if (!isPathAllowed(dirPath)) {
    throw new Error('无权访问该目录');
  }

  const exists = await fs.pathExists(dirPath);
  if (!exists) {
    throw new Error('目录不存在');
  }

  const stats = await fs.stat(dirPath);
  const name = path.basename(dirPath);

  const node = {
    name,
    path: dirPath,
    type: stats.isDirectory() ? 'directory' : 'file'
  };

  if (stats.isDirectory() && currentDepth < depth) {
    const items = await fs.readdir(dirPath);
    node.children = [];

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      try {
        const childNode = await getDirectoryTree(itemPath, depth, currentDepth + 1);
        node.children.push(childNode);
      } catch {
        // 跳过无权限访问的文件
      }
    }

    // 排序
    node.children.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });
  }

  return node;
}

// 读取文件内容
export async function readFileContent(filePath) {
  if (!isPathAllowed(filePath)) {
    throw new Error('无权访问该文件');
  }

  const exists = await fs.pathExists(filePath);
  if (!exists) {
    throw new Error('文件不存在');
  }

  const stats = await fs.stat(filePath);
  if (stats.isDirectory()) {
    throw new Error('不能读取目录内容');
  }

  const content = await fs.readFile(filePath, 'utf-8');
  const ext = path.extname(filePath);

  return {
    content,
    type: getFileType(filePath),
    size: stats.size,
    modified: stats.mtime.toISOString()
  };
}

// 保存文件
export async function saveFileContent(filePath, content) {
  if (!isPathAllowed(filePath)) {
    throw new Error('无权访问该文件');
  }

  const dir = path.dirname(filePath);
  await fs.ensureDir(dir);
  await fs.writeFile(filePath, content, 'utf-8');

  return { message: '文件保存成功' };
}

// 创建文件或文件夹
export async function createItem(itemPath, type = 'file') {
  if (!isPathAllowed(itemPath)) {
    throw new Error('无权在该位置创建');
  }

  const exists = await fs.pathExists(itemPath);
  if (exists) {
    throw new Error('文件或文件夹已存在');
  }

  if (type === 'directory') {
    await fs.ensureDir(itemPath);
  } else {
    const dir = path.dirname(itemPath);
    await fs.ensureDir(dir);
    await fs.writeFile(itemPath, '', 'utf-8');
  }

  return { message: '创建成功', path: itemPath };
}

// 删除文件或文件夹
export async function deleteItem(itemPath) {
  if (!isPathAllowed(itemPath)) {
    throw new Error('无权删除该文件');
  }

  const exists = await fs.pathExists(itemPath);
  if (!exists) {
    throw new Error('文件或文件夹不存在');
  }

  await fs.remove(itemPath);
  return { message: '删除成功' };
}

// 重命名
export async function renameItem(oldPath, newPath) {
  if (!isPathAllowed(oldPath) || !isPathAllowed(newPath)) {
    throw new Error('无权操作');
  }

  const exists = await fs.pathExists(oldPath);
  if (!exists) {
    throw new Error('文件或文件夹不存在');
  }

  const newExists = await fs.pathExists(newPath);
  if (newExists) {
    throw new Error('目标名称已存在');
  }

  await fs.move(oldPath, newPath);
  return { message: '重命名成功' };
}

// 搜索文件
export async function searchFiles(keyword, searchPath, searchContent = false) {
  if (!isPathAllowed(searchPath)) {
    throw new Error('无权访问该目录');
  }

  const results = [];
  const lowerKeyword = keyword.toLowerCase();

  async function search(dirPath) {
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      try {
        const stats = await fs.stat(itemPath);

        // 检查文件名匹配
        if (item.toLowerCase().includes(lowerKeyword)) {
          results.push({
            name: item,
            path: itemPath,
            type: stats.isDirectory() ? 'directory' : 'file',
            matchedIn: 'name'
          });
        }

        // 如果是目录，递归搜索
        if (stats.isDirectory()) {
          await search(itemPath);
        } else if (searchContent && config.editableExtensions.includes(path.extname(item).toLowerCase())) {
          // 搜索文件内容（仅文本文件）
          try {
            const content = await fs.readFile(itemPath, 'utf-8');
            const lines = content.split('\n');
            const matches = [];

            lines.forEach((line, index) => {
              if (line.toLowerCase().includes(lowerKeyword)) {
                matches.push({
                  line: index + 1,
                  text: line.trim().substring(0, 100)
                });
              }
            });

            if (matches.length > 0) {
              // 避免重复添加
              if (!results.find(r => r.path === itemPath)) {
                results.push({
                  name: item,
                  path: itemPath,
                  type: 'file',
                  matchedIn: 'content',
                  matches: matches.slice(0, 10) // 最多返回10个匹配
                });
              }
            }
          } catch {
            // 跳过无法读取的文件
          }
        }
      } catch {
        // 跳过无权限的文件
      }
    }
  }

  await search(searchPath);

  return {
    keyword,
    results: results.slice(0, 100), // 最多返回100个结果
    total: results.length
  };
}

export default {
  listDirectory,
  getDirectoryTree,
  readFileContent,
  saveFileContent,
  createItem,
  deleteItem,
  renameItem,
  searchFiles,
  isPathAllowed,
  getFileType
};
