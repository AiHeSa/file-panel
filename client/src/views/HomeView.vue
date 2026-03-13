<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Folder, Document, Search } from '@element-plus/icons-vue'
import {
  getDirTree, getDirList, getFileContent, saveFileContent,
  createItem, deleteItem, renameItem, searchFiles
} from '../api/file'
import type { TreeNode, FileItem, SearchResult } from '../api/file'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import { changePassword } from '../api/auth'

const router = useRouter()
const userStore = useUserStore()

// 状态
const treeData = ref<TreeNode[]>([])
const currentPath = ref('/root')
const fileList = ref<FileItem[]>([])
const currentFile = ref<string>('')
const fileContent = ref<string>('')
const fileType = ref<string>('plaintext')
const isModified = ref(false)
const loading = ref(false)

// 搜索
const searchKeyword = ref('')
const searchResults = ref<SearchResult[]>([])
const showSearch = ref(false)

// 新建对话框
const createDialogVisible = ref(false)
const createForm = ref({ name: '', type: 'file' as 'file' | 'directory' })
const createLoading = ref(false)

// 重命名对话框
const renameDialogVisible = ref(false)
const renameForm = ref({ oldName: '', newName: '' })
const renameLoading = ref(false)

// 修改密码对话框
const passwordDialogVisible = ref(false)
const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const passwordLoading = ref(false)

// 允许的根目录
const allowedRoots = ['/root']

// 加载目录树
async function loadTree() {
  try {
    const promises = allowedRoots.map(root => getDirTree(root, 2))
    const results = await Promise.all(promises)
    treeData.value = results.map(r => r.data)
  } catch (error) {
    console.error('加载目录树失败', error)
  }
}

// 加载目录列表
async function loadFileList(path: string) {
  loading.value = true
  try {
    const res = await getDirList(path)
    fileList.value = res.data.items
    currentPath.value = path
  } catch (error) {
    console.error('加载目录列表失败', error)
  } finally {
    loading.value = false
  }
}

// 打开文件
async function openFile(path: string) {
  if (isModified.value) {
    try {
      await ElMessageBox.confirm('当前文件未保存，是否放弃修改？', '提示', {
        confirmButtonText: '放弃',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
  }

  loading.value = true
  try {
    const res = await getFileContent(path)
    currentFile.value = path
    fileContent.value = res.data.content
    fileType.value = res.data.type
    isModified.value = false
  } catch (error) {
    console.error('加载文件失败', error)
  } finally {
    loading.value = false
  }
}

// 保存文件
async function saveCurrentFile() {
  if (!currentFile.value) return

  loading.value = true
  try {
    await saveFileContent(currentFile.value, fileContent.value)
    ElMessage.success('保存成功')
    isModified.value = false
  } catch (error) {
    console.error('保存文件失败', error)
  } finally {
    loading.value = false
  }
}

// 新建文件/文件夹
async function handleCreate() {
  if (!createForm.value.name) {
    ElMessage.warning('请输入名称')
    return
  }

  createLoading.value = true
  try {
    const path = `${currentPath.value}/${createForm.value.name}`
    await createItem(path, createForm.value.type)
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    createForm.value = { name: '', type: 'file' }
    await loadTree()
    await loadFileList(currentPath.value)
  } catch (error) {
    console.error('创建失败', error)
  } finally {
    createLoading.value = false
  }
}

// 删除
async function handleDelete(item: FileItem) {
  try {
    await ElMessageBox.confirm(`确定要删除 "${item.name}" 吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteItem(item.path)
    ElMessage.success('删除成功')
    await loadTree()
    await loadFileList(currentPath.value)

    if (currentFile.value === item.path) {
      currentFile.value = ''
      fileContent.value = ''
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
    }
  }
}

// 重命名
async function handleRename() {
  if (!renameForm.value.newName) {
    ElMessage.warning('请输入新名称')
    return
  }

  renameLoading.value = true
  try {
    const oldPath = renameForm.value.oldName
    const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + renameForm.value.newName
    await renameItem(oldPath, newPath)
    ElMessage.success('重命名成功')
    renameDialogVisible.value = false
    await loadTree()
    await loadFileList(currentPath.value)
  } catch (error) {
    console.error('重命名失败', error)
  } finally {
    renameLoading.value = false
  }
}

// 搜索
async function handleSearch() {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  loading.value = true
  try {
    const res = await searchFiles(searchKeyword.value, currentPath.value)
    searchResults.value = res.data.results
    showSearch.value = true
  } catch (error) {
    console.error('搜索失败', error)
  } finally {
    loading.value = false
  }
}

// 退出登录
function handleLogout() {
  userStore.logout()
  router.push('/login')
}

// 修改密码
async function handleChangePassword() {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    ElMessage.warning('请填写完整')
    return
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }

  passwordLoading.value = true
  try {
    await changePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    passwordDialogVisible.value = false
    handleLogout()
  } catch (error) {
    console.error('修改密码失败', error)
  } finally {
    passwordLoading.value = false
  }
}

// 树节点点击
function handleNodeClick(data: TreeNode) {
  if (data.type === 'directory') {
    loadFileList(data.path)
  } else {
    openFile(data.path)
  }
}

// 文件列表双击
function handleFileDoubleClick(item: FileItem) {
  if (item.type === 'directory') {
    loadFileList(item.path)
  } else {
    openFile(item.path)
  }
}

// 初始化
onMounted(() => {
  loadTree()
  loadFileList(currentPath.value)
})
</script>

<template>
  <div class="home-container">
    <!-- 顶部栏 -->
    <header class="header">
      <div class="header-left">
        <span class="logo">🦐</span>
        <span class="title">文件管理面板</span>
      </div>
      <div class="header-center">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索文件..."
          style="width: 300px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
      <div class="header-right">
        <span class="username">欢迎, {{ userStore.username }}</span>
        <el-button link @click="passwordDialogVisible = true">修改密码</el-button>
        <el-button link type="danger" @click="handleLogout">退出</el-button>
      </div>
    </header>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧目录树 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <span>目录</span>
          <div>
            <el-button size="small" @click="createDialogVisible = true" :icon="Plus" circle />
            <el-button size="small" @click="loadTree" :icon="Refresh" circle />
          </div>
        </div>
        <el-tree
          :data="treeData"
          :props="{ label: 'name', children: 'children' }"
          node-key="path"
          highlight-current
          @node-click="handleNodeClick"
          class="file-tree"
        >
          <template #default="{ node, data }">
            <span class="tree-node">
              <el-icon v-if="data.type === 'directory'"><Folder /></el-icon>
              <el-icon v-else><Document /></el-icon>
              <span>{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
      </aside>

      <!-- 右侧内容 -->
      <main class="content">
        <!-- 搜索结果 -->
        <div v-if="showSearch" class="search-panel">
          <div class="search-header">
            <span>搜索结果 ({{ searchResults.length }})</span>
            <el-button size="small" @click="showSearch = false">关闭</el-button>
          </div>
          <div class="search-list">
            <div
              v-for="item in searchResults"
              :key="item.path"
              class="search-result"
              @click="item.type === 'file' ? openFile(item.path) : loadFileList(item.path); showSearch = false"
            >
              <div>
                <el-icon v-if="item.type === 'directory'"><Folder /></el-icon>
                <el-icon v-else><Document /></el-icon>
                {{ item.name }}
                <el-tag v-if="item.matchedIn === 'content'" size="small" type="info">内容匹配</el-tag>
              </div>
              <div class="path">{{ item.path }}</div>
            </div>
            <el-empty v-if="searchResults.length === 0" description="没有找到结果" />
          </div>
        </div>

        <!-- 文件编辑器 -->
        <div v-else class="editor-panel">
          <div class="editor-header">
            <span class="file-path">{{ currentFile || '未选择文件' }}</span>
            <div v-if="currentFile">
              <el-tag v-if="isModified" type="warning" size="small">未保存</el-tag>
              <el-button type="primary" size="small" @click="saveCurrentFile" :loading="loading">
                保存
              </el-button>
            </div>
          </div>
          <div class="editor-content">
            <el-input
              v-if="currentFile"
              v-model="fileContent"
              type="textarea"
              :rows="30"
              @input="isModified = true"
              style="font-family: 'Fira Code', monospace"
            />
            <el-empty v-else description="请选择一个文件" />
          </div>
        </div>
      </main>

      <!-- 文件列表 -->
      <aside class="file-list-panel">
        <div class="panel-header">
          <span>{{ currentPath }}</span>
          <el-button size="small" @click="loadFileList(currentPath)" :icon="Refresh" circle />
        </div>
        <div class="file-list">
          <div
            v-for="item in fileList"
            :key="item.path"
            class="file-item"
            @dblclick="handleFileDoubleClick(item)"
          >
            <div class="file-info">
              <el-icon v-if="item.type === 'directory'" size="20"><Folder /></el-icon>
              <el-icon v-else size="20"><Document /></el-icon>
              <span class="file-name">{{ item.name }}</span>
              <el-tag v-if="item.isHidden" size="small" type="info">隐藏</el-tag>
            </div>
            <div class="file-actions">
              <el-button
                size="small"
                link
                @click.stop="renameForm.oldName = item.path; renameForm.newName = item.name; renameDialogVisible = true"
              >
                重命名
              </el-button>
              <el-button
                size="small"
                link
                type="danger"
                @click.stop="handleDelete(item)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- 新建对话框 -->
    <el-dialog v-model="createDialogVisible" title="新建" width="400px">
      <el-form :model="createForm">
        <el-form-item label="类型">
          <el-radio-group v-model="createForm.type">
            <el-radio value="file">文件</el-radio>
            <el-radio value="directory">文件夹</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="createForm.name" placeholder="请输入名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 重命名对话框 -->
    <el-dialog v-model="renameDialogVisible" title="重命名" width="400px">
      <el-input v-model="renameForm.newName" placeholder="请输入新名称" />
      <template #footer>
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="renameLoading" @click="handleRename">确定</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form :model="passwordForm">
        <el-form-item label="原密码">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handleChangePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.home-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left .logo {
  font-size: 24px;
}

.header-left .title {
  font-size: 18px;
  font-weight: 500;
}

.header-center {
  display: flex;
  gap: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-right .username {
  color: #606266;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 12px 15px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.file-tree {
  flex: 1;
  overflow: auto;
  padding: 10px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 5px;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

.file-list-panel {
  width: 300px;
  background: #fff;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 15px;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-list {
  flex: 1;
  overflow: auto;
}

.file-item {
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.file-item:hover {
  background: #f5f7fa;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  font-size: 14px;
}

.file-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.file-item:hover .file-actions {
  opacity: 1;
}

.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  margin: 10px;
  border-radius: 4px;
  overflow: hidden;
}

.editor-header {
  padding: 12px 15px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
}

.file-path {
  color: #606266;
  font-size: 14px;
}

.editor-content {
  flex: 1;
  padding: 10px;
  overflow: auto;
}

.search-panel {
  flex: 1;
  background: #fff;
  margin: 10px;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-header {
  padding: 12px 15px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.search-list {
  flex: 1;
  overflow: auto;
}

.search-result {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.search-result:hover {
  background: #f5f7fa;
}

.search-result .path {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}
</style>
