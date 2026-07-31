<script setup lang="ts">
definePageMeta({
  title: '操作日志',
})

type AuditLog = {
  id: string
  user_id: string | null
  username: string | null
  action: string
  resource_type: string
  resource_id: string | null
  request_method: string | null
  request_path: string | null
  ip_address: string | null
  details: Record<string, unknown>
  created_at: string
}

type AuditLogPage = {
  items: AuditLog[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

const api = useApi()

const filters = reactive({
  username: '',
  action: '',
  resourceType: '',
})

const logs = ref<AuditLog[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = ref(0)

const pending = ref(false)
const errorMessage = ref('')

const actionOptions = [
  { value: '', label: '全部操作' },
  { value: 'create', label: '创建' },
  { value: 'update', label: '修改' },
  { value: 'delete', label: '删除' },
]

const resourceOptions = [
  { value: '', label: '全部资源' },
  { value: 'course', label: '课程' },
  { value: 'chapter', label: '章节' },
  {
    value: 'knowledge_point',
    label: '知识点',
  },
  { value: 'question', label: '试题' },
  { value: 'exam_paper', label: '试卷' },
  { value: 'user', label: '用户' },
]

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    create: '创建',
    update: '修改',
    delete: '删除',
    restore: '恢复',
    login: '登录',
  }

  return labels[action] || action
}

function getResourceLabel(resourceType: string) {
  const labels: Record<string, string> = {
    course: '课程',
    chapter: '章节',
    knowledge_point: '知识点',
    question: '试题',
    exam_paper: '试卷',
    user: '用户',
  }

  return labels[resourceType] || resourceType
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(
    'zh-CN',
    {
      hour12: false,
    },
  )
}

function formatDetails(
  details: Record<string, unknown>,
) {
  return JSON.stringify(details, null, 2)
}

async function loadAuditLogs() {
  pending.value = true
  errorMessage.value = ''

  const query: Record<string, string | number> = {
    page: page.value,
    page_size: pageSize.value,
  }

  if (filters.username.trim()) {
    query.username = filters.username.trim()
  }

  if (filters.action) {
    query.action = filters.action
  }

  if (filters.resourceType) {
    query.resource_type = filters.resourceType
  }

  try {
    const response = await api<AuditLogPage>(
      '/api/v1/audit-logs',
      {
        query,
      },
    )

    logs.value = response.items
    total.value = response.total
    totalPages.value = response.total_pages
  } catch (error: any) {
    errorMessage.value =
      error?.data?.detail
      || error?.response?._data?.detail
      || '操作日志加载失败'
  } finally {
    pending.value = false
  }
}

async function searchLogs() {
  page.value = 1
  await loadAuditLogs()
}

async function resetFilters() {
  filters.username = ''
  filters.action = ''
  filters.resourceType = ''
  page.value = 1

  await loadAuditLogs()
}

async function changePage(newPage: number) {
  if (
    newPage < 1
    || newPage > totalPages.value
    || newPage === page.value
  ) {
    return
  }

  page.value = newPage
  await loadAuditLogs()
}

onMounted(loadAuditLogs)
</script>

<template>
  <div class="audit-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">AUDIT LOGS</p>
        <h2>操作日志审计</h2>
        <p>
          查看管理员和教师对系统数据的操作记录。
        </p>
      </div>

      <button
        class="refresh-button"
        type="button"
        :disabled="pending"
        @click="loadAuditLogs"
      >
        刷新日志
      </button>
    </header>

    <section class="filter-card">
      <label>
        <span>操作用户</span>
        <input
          v-model="filters.username"
          type="text"
          placeholder="输入用户名"
          @keyup.enter="searchLogs"
        >
      </label>

      <label>
        <span>操作类型</span>
        <select v-model="filters.action">
          <option
            v-for="option in actionOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>

      <label>
        <span>资源类型</span>
        <select v-model="filters.resourceType">
          <option
            v-for="option in resourceOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>

      <div class="filter-actions">
        <button
          class="primary-button"
          type="button"
          @click="searchLogs"
        >
          查询
        </button>

        <button
          class="secondary-button"
          type="button"
          @click="resetFilters"
        >
          重置
        </button>
      </div>
    </section>

    <p
      v-if="errorMessage"
      class="error-message"
    >
      {{ errorMessage }}
    </p>

    <section class="log-card">
      <header class="table-header">
        <div>
          <h3>日志记录</h3>
          <p>共 {{ total }} 条记录</p>
        </div>
      </header>

      <div v-if="pending" class="state-box">
        正在加载操作日志……
      </div>

      <div
        v-else-if="logs.length === 0"
        class="state-box"
      >
        暂无符合条件的操作日志
      </div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>用户</th>
              <th>操作</th>
              <th>资源</th>
              <th>请求</th>
              <th>IP 地址</th>
              <th>详细内容</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="log in logs"
              :key="log.id"
            >
              <td class="time-cell">
                {{ formatDate(log.created_at) }}
              </td>

              <td>
                {{ log.username || '未知用户' }}
              </td>

              <td>
                <span
                  class="action-badge"
                  :class="`action-${log.action}`"
                >
                  {{ getActionLabel(log.action) }}
                </span>
              </td>

              <td>
                <strong>
                  {{
                    getResourceLabel(
                      log.resource_type,
                    )
                  }}
                </strong>

                <small v-if="log.resource_id">
                  {{ log.resource_id }}
                </small>
              </td>

              <td>
                <strong>
                  {{ log.request_method || '--' }}
                </strong>

                <small>
                  {{ log.request_path || '--' }}
                </small>
              </td>

              <td>
                {{ log.ip_address || '--' }}
              </td>

              <td>
                <details>
                  <summary>查看详情</summary>
                  <pre>{{
                    formatDetails(log.details)
                  }}</pre>
                </details>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer
        v-if="totalPages > 0"
        class="pagination"
      >
        <button
          type="button"
          :disabled="page <= 1 || pending"
          @click="changePage(page - 1)"
        >
          上一页
        </button>

        <span>
          第 {{ page }} / {{ totalPages }} 页
        </span>

        <button
          type="button"
          :disabled="
            page >= totalPages || pending
          "
          @click="changePage(page + 1)"
        >
          下一页
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.audit-page {
  display: grid;
  gap: 20px;
}

.page-header,
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.page-header h2,
.table-header h3 {
  margin: 0;
  color: #0f172a;
}

.page-header p,
.table-header p {
  margin: 6px 0 0;
  color: #64748b;
}

.refresh-button,
.primary-button,
.secondary-button,
.pagination button {
  padding: 10px 16px;
  border-radius: 10px;
  font: inherit;
  cursor: pointer;
}

.refresh-button,
.primary-button {
  border: 0;
  color: white;
  background: #2563eb;
}

.secondary-button,
.pagination button {
  border: 1px solid #cbd5e1;
  color: #334155;
  background: white;
}

.filter-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr) auto;
  gap: 16px;
  padding: 20px;
  border: 1px solid #dbe5f3;
  border-radius: 16px;
  background: white;
}

.filter-card label {
  display: grid;
  gap: 7px;
}

.filter-card label span {
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.filter-card input,
.filter-card select {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  color: #0f172a;
  background: white;
  font: inherit;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.log-card {
  overflow: hidden;
  border: 1px solid #dbe5f3;
  border-radius: 16px;
  background: white;
}

.table-header {
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 13px 14px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: top;
}

th {
  color: #475569;
  background: #f8fafc;
  font-size: 13px;
}

td {
  color: #334155;
  font-size: 13px;
}

td small {
  display: block;
  max-width: 220px;
  margin-top: 4px;
  overflow: hidden;
  color: #64748b;
  text-overflow: ellipsis;
}

.time-cell {
  min-width: 150px;
}

.action-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.action-create {
  color: #166534;
  background: #dcfce7;
}

.action-update {
  color: #1d4ed8;
  background: #dbeafe;
}

.action-delete {
  color: #b91c1c;
  background: #fee2e2;
}

details summary {
  color: #2563eb;
  cursor: pointer;
}

pre {
  max-width: 420px;
  max-height: 260px;
  margin: 10px 0 0;
  padding: 10px;
  overflow: auto;
  border-radius: 8px;
  color: #e2e8f0;
  background: #0f172a;
  font-size: 12px;
  white-space: pre-wrap;
}

.state-box {
  padding: 50px 20px;
  color: #94a3b8;
  text-align: center;
}

.error-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 10px;
  color: #b91c1c;
  background: #fee2e2;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 1000px) {
  .filter-card {
    grid-template-columns: 1fr 1fr;
  }
}
</style>