<script setup lang="ts">
definePageMeta({
  title: '用户管理',
})

type UserRole = 'admin' | 'teacher' | 'user'

type SystemUser = {
  id: string
  username: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

type UserPage = {
  items: SystemUser[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

const api = useApi()
const authStore = useAuthStore()

const filters = reactive({
  keyword: '',
  role: '',
  isActive: '',
})

const page = ref(1)
const pageSize = 20
const updatingId = ref<string | null>(null)
const message = ref('')
const errorMessage = ref('')

const {
  data: userPage,
  pending,
  refresh,
} = await useAsyncData<UserPage>(
  'admin-user-list',
  () =>
    api<UserPage>('/api/v1/users', {
      query: {
        keyword:
          filters.keyword.trim()
          || undefined,
        role:
          filters.role
          || undefined,
        is_active:
          filters.isActive === ''
            ? undefined
            : filters.isActive === 'true',
        page: page.value,
        page_size: pageSize,
      },
    }),
  {
    default: () => ({
      items: [],
      total: 0,
      page: 1,
      page_size: pageSize,
      total_pages: 0,
    }),
  },
)

const users = computed(
  () => userPage.value?.items || [],
)

function getRoleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    admin: '管理员',
    teacher: '教师',
    user: '普通用户',
  }

  return labels[role]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(new Date(value))
}

function getErrorMessage(error: unknown) {
  const apiError = error as {
    data?: {
      detail?: string
    }
    message?: string
  }

  return (
    apiError.data?.detail
    || apiError.message
    || '操作失败，请稍后重试'
  )
}

async function searchUsers() {
  page.value = 1
  message.value = ''
  errorMessage.value = ''
  await refresh()
}

async function resetFilters() {
  filters.keyword = ''
  filters.role = ''
  filters.isActive = ''
  page.value = 1
  message.value = ''
  errorMessage.value = ''
  await refresh()
}

async function changePage(newPage: number) {
  if (
    newPage < 1
    || newPage > (userPage.value?.total_pages || 1)
  ) {
    return
  }

  page.value = newPage
  await refresh()
}

async function updateUser(
  user: SystemUser,
  changes: Record<string, unknown>,
) {
  updatingId.value = user.id
  message.value = ''
  errorMessage.value = ''

  try {
    await api<SystemUser>(
      `/api/v1/users/${user.id}`,
      {
        method: 'PATCH',
        body: changes,
      },
    )

    message.value = '用户信息更新成功'
    await refresh()
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    updatingId.value = null
  }
}

async function handleRoleChange(
  user: SystemUser,
  event: Event,
) {
  const target = event.target as HTMLSelectElement
  const role = target.value as UserRole

  await updateUser(user, {
    role,
  })
}

async function toggleUserStatus(
  user: SystemUser,
) {
  await updateUser(user, {
    is_active: !user.is_active,
  })
}
</script>

<template>
  <main class="users-page">
    <header class="page-header">
      <div>
        <p>USER MANAGEMENT</p>
        <h2>用户管理</h2>
        <span>
          管理系统用户、角色和账号状态
        </span>
      </div>

      <div class="user-total">
        <strong>{{ userPage.total }}</strong>
        <span>用户总数</span>
      </div>
    </header>

    <section class="filter-panel">
      <label>
        <span>搜索用户</span>
        <input
          v-model="filters.keyword"
          type="search"
          placeholder="用户名、姓名或邮箱"
          @keyup.enter="searchUsers"
        >
      </label>

      <label>
        <span>用户角色</span>
        <select v-model="filters.role">
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="teacher">教师</option>
          <option value="user">普通用户</option>
        </select>
      </label>

      <label>
        <span>账号状态</span>
        <select v-model="filters.isActive">
          <option value="">全部状态</option>
          <option value="true">正常</option>
          <option value="false">已停用</option>
        </select>
      </label>

      <div class="filter-actions">
        <button
          class="primary-button"
          type="button"
          @click="searchUsers"
        >
          搜索
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
      v-if="message"
      class="success-message"
    >
      {{ message }}
    </p>

    <p
      v-if="errorMessage"
      class="error-message"
    >
      {{ errorMessage }}
    </p>

    <section class="table-card">
      <div v-if="pending" class="page-state">
        正在加载用户数据……
      </div>

      <div
        v-else-if="users.length === 0"
        class="page-state"
      >
        暂无符合条件的用户
      </div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>用户</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>状态</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="user in users"
              :key="user.id"
            >
              <td>
                <div class="user-identity">
                  <div class="table-avatar">
                    {{
                      (
                        user.full_name
                        || user.username
                      ).slice(0, 1)
                    }}
                  </div>

                  <div>
                    <strong>
                      {{
                        user.full_name
                        || user.username
                      }}
                    </strong>
                    <span>@{{ user.username }}</span>
                  </div>
                </div>
              </td>

              <td>{{ user.email }}</td>

              <td>
                <select
                  class="role-select"
                  :value="user.role"
                  :disabled="
                    user.id === authStore.user?.id
                    || updatingId === user.id
                  "
                  @change="
                    handleRoleChange(user, $event)
                  "
                >
                  <option value="admin">
                    管理员
                  </option>
                  <option value="teacher">
                    教师
                  </option>
                  <option value="user">
                    普通用户
                  </option>
                </select>

                <small class="role-label">
                  {{ getRoleLabel(user.role) }}
                </small>
              </td>

              <td>
                <span
                  class="status-label"
                  :class="{
                    inactive: !user.is_active,
                  }"
                >
                  {{
                    user.is_active
                      ? '正常'
                      : '已停用'
                  }}
                </span>
              </td>

              <td>
                {{ formatDate(user.created_at) }}
              </td>

              <td>
                <button
                  class="status-button"
                  type="button"
                  :class="{
                    activate: !user.is_active,
                  }"
                  :disabled="
                    user.id === authStore.user?.id
                    || updatingId === user.id
                  "
                  @click="toggleUserStatus(user)"
                >
                  {{
                    updatingId === user.id
                      ? '处理中'
                      : user.is_active
                        ? '停用'
                        : '启用'
                  }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer
        v-if="userPage.total_pages > 1"
        class="pagination"
      >
        <button
          type="button"
          :disabled="page <= 1"
          @click="changePage(page - 1)"
        >
          上一页
        </button>

        <span>
          第 {{ page }} 页，
          共 {{ userPage.total_pages }} 页
        </span>

        <button
          type="button"
          :disabled="
            page >= userPage.total_pages
          "
          @click="changePage(page + 1)"
        >
          下一页
        </button>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.users-page {
  display: grid;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.page-header p {
  margin: 0 0 6px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.page-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
}

.page-header > div > span {
  display: block;
  margin-top: 8px;
  color: #64748b;
}

.user-total {
  display: grid;
  min-width: 110px;
  padding: 15px 20px;
  border-radius: 15px;
  color: #1d4ed8;
  background: #dbeafe;
  text-align: center;
}

.user-total strong {
  font-size: 25px;
}

.user-total span {
  margin-top: 2px;
  font-size: 12px;
}

.filter-panel {
  display: grid;
  grid-template-columns:
    minmax(220px, 1fr)
    170px
    170px
    auto;
  align-items: end;
  gap: 14px;
  padding: 20px;
  border: 1px solid #dbe5f3;
  border-radius: 16px;
  background: #fff;
}

.filter-panel label {
  display: grid;
  gap: 7px;
}

.filter-panel label > span {
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.filter-panel input,
.filter-panel select,
.role-select {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 11px;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  color: #0f172a;
  background: #fff;
  font: inherit;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.primary-button,
.secondary-button,
.status-button {
  padding: 10px 14px;
  border-radius: 9px;
  font: inherit;
  cursor: pointer;
}

.primary-button {
  border: 0;
  color: #fff;
  background: #2563eb;
}

.secondary-button {
  border: 1px solid #cbd5e1;
  color: #475569;
  background: #fff;
}

.success-message,
.error-message {
  margin: 0;
  padding: 11px 14px;
  border-radius: 10px;
}

.success-message {
  color: #166534;
  background: #dcfce7;
}

.error-message {
  color: #b91c1c;
  background: #fee2e2;
}

.table-card {
  overflow: hidden;
  border: 1px solid #dbe5f3;
  border-radius: 17px;
  background: #fff;
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
  padding: 15px 17px;
  border-bottom: 1px solid #e5eaf2;
  text-align: left;
  white-space: nowrap;
}

th {
  color: #64748b;
  background: #f8fafc;
  font-size: 12px;
}

td {
  color: #334155;
  font-size: 13px;
}

.user-identity {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-avatar {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: #1d4ed8;
  background: #dbeafe;
  font-weight: 800;
}

.user-identity > div:last-child {
  display: grid;
  gap: 3px;
}

.user-identity strong {
  color: #0f172a;
}

.user-identity span {
  color: #94a3b8;
  font-size: 11px;
}

.role-select {
  width: 110px;
  padding: 7px 8px;
}

.role-label {
  display: none;
}

.status-label {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 999px;
  color: #166534;
  background: #dcfce7;
  font-size: 12px;
}

.status-label.inactive {
  color: #991b1b;
  background: #fee2e2;
}

.status-button {
  border: 1px solid #fecaca;
  color: #b91c1c;
  background: #fff;
}

.status-button.activate {
  border-color: #bbf7d0;
  color: #15803d;
}

.status-button:disabled,
.role-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-state {
  padding: 70px 20px;
  color: #94a3b8;
  text-align: center;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
}

.pagination button {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination span {
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 1000px) {
  .filter-panel {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 650px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .filter-panel {
    grid-template-columns: 1fr;
  }

  .filter-actions button {
    flex: 1;
  }
}
</style>