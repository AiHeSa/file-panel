import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const USERS_FILE = join(__dirname, '../../../data/users.json');

// 初始化用户数据文件
async function initUsersFile() {
  try {
    await fs.readFile(USERS_FILE);
  } catch {
    // 文件不存在，创建默认用户
    const defaultPassword = await bcrypt.hash('admin123', 10);
    const defaultUsers = [
      {
        id: 1,
        username: 'admin',
        password: defaultPassword,
        createdAt: new Date().toISOString()
      }
    ];
    await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }
}

// 获取所有用户
async function getUsers() {
  await initUsersFile();
  const data = await fs.readFile(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

// 保存用户
async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// 登录验证
export async function login(username, password) {
  const users = await getUsers();
  const user = users.find(u => u.username === username);

  if (!user) {
    throw new Error('用户名或密码错误');
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error('用户名或密码错误');
  }

  // 生成 JWT
  const token = jwt.sign(
    { id: user.id, username: user.username },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return {
    token,
    expiresIn: 24 * 60 * 60 // 24小时，单位秒
  };
}

// 验证 Token
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return { valid: true, data: decoded };
  } catch {
    return { valid: false, data: null };
  }
}

// 修改密码
export async function changePassword(userId, oldPassword, newPassword) {
  const users = await getUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    throw new Error('用户不存在');
  }

  const user = users[userIndex];
  const isValid = await bcrypt.compare(oldPassword, user.password);

  if (!isValid) {
    throw new Error('原密码错误');
  }

  users[userIndex].password = await bcrypt.hash(newPassword, 10);
  users[userIndex].updatedAt = new Date().toISOString();

  await saveUsers(users);
  return true;
}

export default { login, verifyToken, changePassword };
