import request from '../utils/request'

export interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
  modified: string
  extension?: string
  isHidden?: boolean
}

export interface FileContent {
  content: string
  type: string
  size: number
  modified: string
}

export interface TreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

export interface SearchResult {
  name: string
  path: string
  type: 'file' | 'directory'
  matchedIn: 'name' | 'content'
  matches?: {
    line: number
    text: string
  }[]
}

// 获取目录列表
export function getDirList(path: string) {
  return request.get<any, { success: boolean; data: { path: string; items: FileItem[] } }>('/dirs/list', { params: { path } })
}

// 获取目录树
export function getDirTree(path: string, depth: number = 3) {
  return request.get<any, { success: boolean; data: TreeNode }>('/dirs/tree', { params: { path, depth } })
}

// 获取文件内容
export function getFileContent(path: string) {
  return request.get<any, { success: boolean; data: FileContent }>('/files/content', { params: { path } })
}

// 保存文件
export function saveFileContent(path: string, content: string) {
  return request.put<any, { success: boolean; message: string }>('/files/content', { path, content })
}

// 创建文件或文件夹
export function createItem(path: string, type: 'file' | 'directory' = 'file') {
  return request.post<any, { success: boolean; message: string; data: { path: string } }>('/files/create', { path, type })
}

// 删除文件或文件夹
export function deleteItem(path: string) {
  return request.delete<any, { success: boolean; message: string }>('/files', { params: { path } })
}

// 重命名
export function renameItem(oldPath: string, newPath: string) {
  return request.patch<any, { success: boolean; message: string }>('/files/rename', { oldPath, newPath })
}

// 搜索
export function searchFiles(keyword: string, path: string, searchContent: boolean = false) {
  return request.get<any, { success: boolean; data: { keyword: string; results: SearchResult[]; total: number } }>('/search', {
    params: { keyword, path, content: searchContent }
  })
}

// 上传文件
export function uploadFile(file: File, path: string) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<any, { success: boolean; message: string; data: { filename: string; size: number; path: string } }>('/files/upload', formData, {
    params: { path },
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
