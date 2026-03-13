import request from '../utils/request'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresIn: number
}

// 登录
export function login(data: LoginRequest) {
  return request.post<any, { success: boolean; data: LoginResponse }>('/auth/login', data)
}

// 验证 Token
export function verifyToken() {
  return request.get<any, { success: boolean; data: { username: string } }>('/auth/verify')
}

// 修改密码
export function changePassword(data: { oldPassword: string; newPassword: string }) {
  return request.put<any, { success: boolean; message: string }>('/auth/password', data)
}
