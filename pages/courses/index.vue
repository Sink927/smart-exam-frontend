<script setup lang="ts">
import type { Course, CourseForm } from '~/types/course'

const api = useApi()

const form = reactive<CourseForm>({
  code: '',
  name: '',
  description: '',
})

const submitting = ref(false)
const message = ref('')
const formError = ref('')

const {
  data: courses,
  pending,
  error: loadError,
  refresh,
} = await useAsyncData<Course[]>(
  'courses',
  () => api<Course[]>('/api/v1/courses'),
  {
    default: () => [],
  },
)

async function createCourse() {
  message.value = ''
  formError.value = ''

  if (!form.code.trim() || !form.name.trim()) {
    formError.value = '课程代码和课程名称不能为空'
    return
  }

  submitting.value = true

  try {
    await api<Course>('/api/v1/courses', {
      method: 'POST',
      body: {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
      },
    })

    form.code = ''
    form.name = ''
    form.description = ''

    message.value = '课程创建成功'
    await refresh()
  } catch (error: any) {
    formError.value =
      error?.data?.detail ||
      error?.response?._data?.detail ||
      '课程创建失败，请检查后端服务'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="course-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">COURSE MANAGEMENT</p>
        <h1>课程管理</h1>
        <p class="subtitle">创建和维护题库中的课程信息</p>
      </div>

      <button class="refresh-button" type="button" @click="refresh()">
        刷新列表
      </button>
    </header>

    <section class="panel">
      <h2>添加课程</h2>

      <form class="course-form" @submit.prevent="createCourse">
        <label>
          <span>课程代码</span>
          <input
            v-model="form.code"
            maxlength="50"
            placeholder="例如：MATH001"
          >
        </label>

        <label>
          <span>课程名称</span>
          <input
            v-model="form.name"
            maxlength="100"
            placeholder="例如：高等数学"
          >
        </label>

        <label class="description-field">
          <span>课程描述</span>
          <textarea
            v-model="form.description"
            maxlength="1000"
            rows="3"
            placeholder="请输入课程简介（选填）"
          />
        </label>

        <div class="form-actions">
          <button
            class="primary-button"
            type="submit"
            :disabled="submitting"
          >
            {{ submitting ? '正在创建...' : '创建课程' }}
          </button>

          <span v-if="message" class="success-message">
            {{ message }}
          </span>

          <span v-if="formError" class="error-message">
            {{ formError }}
          </span>
        </div>
      </form>
    </section>

    <section class="panel">
      <div class="list-header">
        <h2>课程列表</h2>
        <span>共 {{ courses.length }} 门课程</span>
      </div>

      <p v-if="pending" class="status-text">
        正在加载课程……
      </p>

      <p v-else-if="loadError" class="error-message">
        课程加载失败，请确认 FastAPI 后端已经启动。
      </p>

      <div v-else-if="courses.length === 0" class="empty-state">
        暂无课程，请先创建一门课程。
      </div>

      <div v-else class="course-grid">
        <article
          v-for="course in courses"
          :key="course.id"
          class="course-card"
        >
          <div class="course-code">
            {{ course.code }}
          </div>

          <h3>{{ course.name }}</h3>

          <p>
            {{ course.description || '暂无课程描述' }}
          </p>

          <small>
            创建时间：
            {{ new Date(course.created_at).toLocaleString('zh-CN') }}
          </small>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.course-page {
  display: grid;
  gap: 24px;
}

.page-header,
.list-header,
.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-header h1 {
  margin: 4px 0;
  color: #14213d;
  font-size: 32px;
}

.eyebrow {
  margin: 0;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.subtitle,
.status-text {
  margin: 0;
  color: #718096;
}

.panel {
  padding: 24px;
  border: 1px solid #e3e9f2;
  border-radius: 18px;
  background: white;
}

.panel h2 {
  margin: 0 0 20px;
  color: #17233c;
}

.course-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.course-form label {
  display: grid;
  gap: 8px;
  color: #334155;
  font-weight: 600;
}

.description-field,
.form-actions {
  grid-column: 1 / -1;
}

input,
textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #d7dfeb;
  border-radius: 10px;
  font: inherit;
}

input:focus,
textarea:focus {
  border-color: #2563eb;
  outline: none;
}

.primary-button,
.refresh-button {
  padding: 11px 18px;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.primary-button {
  color: white;
  background: #2563eb;
}

.refresh-button {
  color: #2563eb;
  background: #eaf2ff;
}

.primary-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.course-card {
  padding: 20px;
  border: 1px solid #e3e9f2;
  border-radius: 14px;
}

.course-card h3 {
  margin: 12px 0 8px;
  color: #17233c;
}

.course-card p,
.course-card small {
  color: #718096;
}

.course-code {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 7px;
  color: #2563eb;
  background: #eaf2ff;
  font-weight: 700;
}

.success-message {
  color: #15803d;
}

.error-message {
  color: #dc2626;
}

.empty-state {
  padding: 40px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #718096;
  text-align: center;
}

@media (max-width: 700px) {
  .course-form {
    grid-template-columns: 1fr;
  }

  .description-field,
  .form-actions {
    grid-column: auto;
  }
}
</style>