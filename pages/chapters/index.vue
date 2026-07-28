<script setup lang="ts">
import type { Course } from '~/types/course'
import type { Chapter, ChapterForm } from '~/types/chapter'

const api = useApi()

const form = reactive<ChapterForm>({
  course_id: '',
  name: '',
  order_index: 1,
  description: '',
})

const editForm = reactive<ChapterForm>({
  course_id: '',
  name: '',
  order_index: 1,
  description: '',
})

const selectedCourseId = ref('')
const submitting = ref(false)
const updating = ref(false)
const editingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)

const message = ref('')
const formError = ref('')

const {
  data: courses,
  pending: coursesPending,
  refresh: refreshCourses,
} = await useAsyncData<Course[]>(
  'chapter-page-courses',
  () => api<Course[]>('/api/v1/courses'),
  {
    default: () => [],
  },
)

const {
  data: chapters,
  pending: chaptersPending,
  error: chaptersError,
  refresh: refreshChapters,
} = await useAsyncData<Chapter[]>(
  'chapters',
  () => api<Chapter[]>('/api/v1/chapters'),
  {
    default: () => [],
  },
)

const filteredChapters = computed(() => {
  if (!selectedCourseId.value) {
    return chapters.value
  }

  return chapters.value.filter(
    chapter => chapter.course_id === selectedCourseId.value,
  )
})

function getCourseName(courseId: string) {
  return courses.value.find(
    course => course.id === courseId,
  )?.name || '未知课程'
}

function clearMessages() {
  message.value = ''
  formError.value = ''
}

async function createChapter() {
  clearMessages()

  if (!form.course_id) {
    formError.value = '请选择所属课程'
    return
  }

  if (!form.name.trim()) {
    formError.value = '章节名称不能为空'
    return
  }

  submitting.value = true

  try {
    await api<Chapter>('/api/v1/chapters', {
      method: 'POST',
      body: {
        course_id: form.course_id,
        name: form.name.trim(),
        order_index: Number(form.order_index),
        description: form.description.trim() || null,
      },
    })

    const savedCourseId = form.course_id

    form.name = ''
    form.order_index += 1
    form.description = ''
    form.course_id = savedCourseId

    message.value = '章节创建成功'
    await refreshChapters()
  } catch (error: any) {
    formError.value =
      error?.data?.detail ||
      error?.response?._data?.detail ||
      '章节创建失败，请检查填写内容'
  } finally {
    submitting.value = false
  }
}

function startEditing(chapter: Chapter) {
  clearMessages()

  editingId.value = chapter.id
  editForm.course_id = chapter.course_id
  editForm.name = chapter.name
  editForm.order_index = chapter.order_index
  editForm.description = chapter.description || ''
}

function cancelEditing() {
  editingId.value = null
  editForm.course_id = ''
  editForm.name = ''
  editForm.order_index = 1
  editForm.description = ''
}

async function updateChapter(chapterId: string) {
  clearMessages()

  if (!editForm.name.trim()) {
    formError.value = '章节名称不能为空'
    return
  }

  if (editForm.order_index < 1) {
    formError.value = '章节序号不能小于1'
    return
  }

  updating.value = true

  try {
    await api<Chapter>(`/api/v1/chapters/${chapterId}`, {
      method: 'PATCH',
      body: {
        name: editForm.name.trim(),
        order_index: Number(editForm.order_index),
        description: editForm.description.trim() || null,
      },
    })

    cancelEditing()
    message.value = '章节修改成功'
    await refreshChapters()
  } catch (error: any) {
    formError.value =
      error?.data?.detail ||
      error?.response?._data?.detail ||
      '章节修改失败'
  } finally {
    updating.value = false
  }
}

async function deleteChapter(chapter: Chapter) {
  clearMessages()

  const confirmed = window.confirm(
    `确定要删除章节“${chapter.name}”吗？`,
  )

  if (!confirmed) {
    return
  }

  deletingId.value = chapter.id

  try {
    await api(`/api/v1/chapters/${chapter.id}`, {
      method: 'DELETE',
    })

    message.value = '章节删除成功'
    await refreshChapters()
  } catch (error: any) {
    formError.value =
      error?.data?.detail ||
      error?.response?._data?.detail ||
      '章节删除失败。章节下存在知识点时不能直接删除。'
  } finally {
    deletingId.value = null
  }
}

async function refreshAll() {
  await Promise.all([
    refreshCourses(),
    refreshChapters(),
  ])
}
</script>

<template>
  <div class="chapter-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">CHAPTER MANAGEMENT</p>
        <h1>章节管理</h1>
        <p class="subtitle">
          按照课程维护章节结构和排列顺序
        </p>
      </div>

      <button
        class="refresh-button"
        type="button"
        @click="refreshAll"
      >
        刷新数据
      </button>
    </header>

    <section class="panel">
      <h2>添加章节</h2>

      <form class="chapter-form" @submit.prevent="createChapter">
        <label>
          <span>所属课程</span>
          <select
            v-model="form.course_id"
            :disabled="coursesPending"
          >
            <option value="">
              请选择课程
            </option>

            <option
              v-for="course in courses"
              :key="course.id"
              :value="course.id"
            >
              {{ course.code }} - {{ course.name }}
            </option>
          </select>
        </label>

        <label>
          <span>章节名称</span>
          <input
            v-model="form.name"
            maxlength="100"
            placeholder="例如：第一章 函数与极限"
          >
        </label>

        <label>
          <span>章节序号</span>
          <input
            v-model.number="form.order_index"
            type="number"
            min="1"
          >
        </label>

        <label class="description-field">
          <span>章节描述</span>
          <textarea
            v-model="form.description"
            maxlength="1000"
            rows="3"
            placeholder="请输入章节简介（选填）"
          />
        </label>

        <div class="form-actions">
          <button
            class="primary-button"
            type="submit"
            :disabled="submitting"
          >
            {{ submitting ? '正在创建...' : '创建章节' }}
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
        <div>
          <h2>章节列表</h2>
          <span>共 {{ filteredChapters.length }} 个章节</span>
        </div>

        <select v-model="selectedCourseId" class="filter-select">
          <option value="">
            全部课程
          </option>

          <option
            v-for="course in courses"
            :key="course.id"
            :value="course.id"
          >
            {{ course.name }}
          </option>
        </select>
      </div>

      <p v-if="chaptersPending" class="status-text">
        正在加载章节……
      </p>

      <p v-else-if="chaptersError" class="error-message">
        章节加载失败，请确认后端服务已经启动。
      </p>

      <div
        v-else-if="filteredChapters.length === 0"
        class="empty-state"
      >
        暂无章节，请先创建章节。
      </div>

      <div v-else class="chapter-list">
        <article
  v-for="chapter in filteredChapters"
  :key="chapter.id"
  class="chapter-card"
>
  <div v-if="editingId === chapter.id" class="edit-form">
    <label>
      <span>章节名称</span>
      <input
        v-model="editForm.name"
        maxlength="100"
      >
    </label>

    <label>
      <span>章节序号</span>
      <input
        v-model.number="editForm.order_index"
        type="number"
        min="1"
      >
    </label>

    <label class="edit-description">
      <span>章节描述</span>
      <textarea
        v-model="editForm.description"
        maxlength="1000"
        rows="3"
      />
    </label>

    <div class="edit-actions">
      <button
        class="save-button"
        type="button"
        :disabled="updating"
        @click="updateChapter(chapter.id)"
      >
        {{ updating ? '保存中...' : '保存修改' }}
      </button>

      <button
        class="cancel-button"
        type="button"
        :disabled="updating"
        @click="cancelEditing()"
      >
        取消
      </button>
    </div>
  </div>

  <template v-else>
    <div class="order-badge">
      {{ chapter.order_index }}
    </div>

    <div class="chapter-content">
      <span class="course-name">
        {{ getCourseName(chapter.course_id) }}
      </span>

      <h3>{{ chapter.name }}</h3>

      <p>
        {{ chapter.description || '暂无章节描述' }}
      </p>
    </div>

    <div class="chapter-actions">
      <button
        class="edit-button"
        type="button"
        @click="startEditing(chapter)"
      >
        编辑
      </button>

      <button
        class="delete-button"
        type="button"
        :disabled="deletingId === chapter.id"
        @click="deleteChapter(chapter)"
      >
        {{
          deletingId === chapter.id
            ? '删除中...'
            : '删除'
        }}
      </button>
    </div>
  </template>
</article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.chapter-page {
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

.chapter-form {
  display: grid;
  grid-template-columns: 1fr 1fr 180px;
  gap: 18px;
}

.chapter-form label {
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
textarea,
select {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #d7dfeb;
  border-radius: 10px;
  background: white;
  font: inherit;
}

input:focus,
textarea:focus,
select:focus {
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

.list-header {
  margin-bottom: 20px;
}

.list-header h2 {
  margin-bottom: 4px;
}

.list-header span {
  color: #718096;
}

.filter-select {
  width: 240px;
}

.chapter-list {
  display: grid;
  gap: 14px;
}

.chapter-card {
  display: flex;
  gap: 18px;
  padding: 20px;
  border: 1px solid #e3e9f2;
  border-radius: 14px;
}

.order-badge {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  place-items: center;
  border-radius: 12px;
  color: #2563eb;
  background: #eaf2ff;
  font-size: 18px;
  font-weight: 800;
}

.chapter-content h3 {
  margin: 6px 0 8px;
  color: #17233c;
}

.chapter-content p {
  margin: 0;
  color: #718096;
}

.course-name {
  color: #2563eb;
  font-size: 13px;
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

.chapter-content {
  flex: 1;
}

.edit-form {
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 180px;
  gap: 14px;
}

.edit-form label {
  display: grid;
  gap: 7px;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
}

.edit-description,
.edit-actions {
  grid-column: 1 / -1;
}

.chapter-actions,
.edit-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chapter-actions {
  margin-left: auto;
}

.edit-button,
.delete-button,
.save-button,
.cancel-button {
  padding: 8px 14px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.edit-button {
  color: #2563eb;
  background: #eaf2ff;
}

.delete-button {
  color: #dc2626;
  background: #fee2e2;
}

.save-button {
  color: white;
  background: #2563eb;
}

.cancel-button {
  color: #475569;
  background: #e2e8f0;
}

.delete-button:disabled,
.save-button:disabled,
.cancel-button:disabled {
  cursor: wait;
  opacity: 0.6;
}

@media (max-width: 800px) {
  .chapter-form {
    grid-template-columns: 1fr;
  }

  .description-field,
  .form-actions {
    grid-column: auto;
  }

  .page-header,
  .list-header {
    align-items: stretch;
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }
}
</style>