<script setup lang="ts">
import type { Course } from '~/types/course'
import type { Chapter } from '~/types/chapter'
import type {
  KnowledgePoint,
  KnowledgePointForm,
} from '~/types/knowledge-point'

const api = useApi()

const form = reactive<KnowledgePointForm>({
  chapter_id: '',
  name: '',
  description: '',
})

const editForm = reactive({
  name: '',
  description: '',
})

const formCourseId = ref('')
const selectedCourseId = ref('')
const selectedChapterId = ref('')

const submitting = ref(false)
const updating = ref(false)
const editingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)

const message = ref('')
const formError = ref('')

const {
  data: courses,
  refresh: refreshCourses,
} = await useAsyncData<Course[]>(
  'knowledge-point-page-courses',
  () => api<Course[]>('/api/v1/courses'),
  {
    default: () => [],
  },
)

const {
  data: chapters,
  refresh: refreshChapters,
} = await useAsyncData<Chapter[]>(
  'knowledge-point-page-chapters',
  () => api<Chapter[]>('/api/v1/chapters'),
  {
    default: () => [],
  },
)

const {
  data: knowledgePoints,
  pending,
  error: loadError,
  refresh: refreshKnowledgePoints,
} = await useAsyncData<KnowledgePoint[]>(
  'knowledge-points',
  () => api<KnowledgePoint[]>('/api/v1/knowledge-points'),
  {
    default: () => [],
  },
)

const formChapters = computed(() => {
  if (!formCourseId.value) {
    return []
  }

  return chapters.value.filter(
    chapter => chapter.course_id === formCourseId.value,
  )
})

const filterChapters = computed(() => {
  if (!selectedCourseId.value) {
    return chapters.value
  }

  return chapters.value.filter(
    chapter => chapter.course_id === selectedCourseId.value,
  )
})

const filteredKnowledgePoints = computed(() => {
  if (selectedChapterId.value) {
    return knowledgePoints.value.filter(
      point => point.chapter_id === selectedChapterId.value,
    )
  }

  if (selectedCourseId.value) {
    const chapterIds = new Set(
      filterChapters.value.map(chapter => chapter.id),
    )

    return knowledgePoints.value.filter(
      point => chapterIds.has(point.chapter_id),
    )
  }

  return knowledgePoints.value
})

watch(formCourseId, () => {
  form.chapter_id = ''
})

watch(selectedCourseId, () => {
  selectedChapterId.value = ''
})

function getChapterName(chapterId: string) {
  return chapters.value.find(
    chapter => chapter.id === chapterId,
  )?.name || '未知章节'
}

function getCourseName(chapterId: string) {
  const chapter = chapters.value.find(
    item => item.id === chapterId,
  )

  if (!chapter) {
    return '未知课程'
  }

  return courses.value.find(
    course => course.id === chapter.course_id,
  )?.name || '未知课程'
}

function clearMessages() {
  message.value = ''
  formError.value = ''
}

async function createKnowledgePoint() {
  clearMessages()

  if (!formCourseId.value) {
    formError.value = '请选择所属课程'
    return
  }

  if (!form.chapter_id) {
    formError.value = '请选择所属章节'
    return
  }

  if (!form.name.trim()) {
    formError.value = '知识点名称不能为空'
    return
  }

  submitting.value = true

  try {
    await api<KnowledgePoint>('/api/v1/knowledge-points', {
      method: 'POST',
      body: {
        chapter_id: form.chapter_id,
        name: form.name.trim(),
        description: form.description.trim() || null,
      },
    })

    const savedChapterId = form.chapter_id

    form.name = ''
    form.description = ''
    form.chapter_id = savedChapterId

    message.value = '知识点创建成功'
    await refreshKnowledgePoints()
  } catch (error: any) {
    formError.value =
      error?.data?.detail ||
      error?.response?._data?.detail ||
      '知识点创建失败，请检查填写内容'
  } finally {
    submitting.value = false
  }
}

function startEditing(point: KnowledgePoint) {
  clearMessages()

  editingId.value = point.id
  editForm.name = point.name
  editForm.description = point.description || ''
}

function cancelEditing() {
  editingId.value = null
  editForm.name = ''
  editForm.description = ''
}

async function updateKnowledgePoint(pointId: string) {
  clearMessages()

  if (!editForm.name.trim()) {
    formError.value = '知识点名称不能为空'
    return
  }

  updating.value = true

  try {
    await api<KnowledgePoint>(
      `/api/v1/knowledge-points/${pointId}`,
      {
        method: 'PATCH',
        body: {
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
        },
      },
    )

    cancelEditing()
    message.value = '知识点修改成功'
    await refreshKnowledgePoints()
  } catch (error: any) {
    formError.value =
      error?.data?.detail ||
      error?.response?._data?.detail ||
      '知识点修改失败'
  } finally {
    updating.value = false
  }
}

async function deleteKnowledgePoint(point: KnowledgePoint) {
  clearMessages()

  const confirmed = window.confirm(
    `确定要删除知识点“${point.name}”吗？`,
  )

  if (!confirmed) {
    return
  }

  deletingId.value = point.id

  try {
    await api(`/api/v1/knowledge-points/${point.id}`, {
      method: 'DELETE',
    })

    message.value = '知识点删除成功'
    await refreshKnowledgePoints()
  } catch (error: any) {
    formError.value =
      error?.data?.detail ||
      error?.response?._data?.detail ||
      '知识点已关联试题，不能直接删除'
  } finally {
    deletingId.value = null
  }
}

async function refreshAll() {
  await Promise.all([
    refreshCourses(),
    refreshChapters(),
    refreshKnowledgePoints(),
  ])
}
</script>

<template>
  <div class="knowledge-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">KNOWLEDGE POINT MANAGEMENT</p>
        <h1>知识点管理</h1>
        <p class="subtitle">
          按照课程和章节维护知识点体系
        </p>
      </div>

      <button
        class="refresh-button"
        type="button"
        @click="refreshAll()"
      >
        刷新数据
      </button>
    </header>

    <section class="panel">
      <h2>添加知识点</h2>

      <form
        class="knowledge-form"
        @submit.prevent="createKnowledgePoint"
      >
        <label>
          <span>所属课程</span>
          <select v-model="formCourseId">
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
          <span>所属章节</span>
          <select
            v-model="form.chapter_id"
            :disabled="!formCourseId"
          >
            <option value="">
              请选择章节
            </option>

            <option
              v-for="chapter in formChapters"
              :key="chapter.id"
              :value="chapter.id"
            >
              第{{ chapter.order_index }}章 -
              {{ chapter.name }}
            </option>
          </select>
        </label>

        <label>
          <span>知识点名称</span>
          <input
            v-model="form.name"
            maxlength="100"
            placeholder="例如：函数极限"
          >
        </label>

        <label class="description-field">
          <span>知识点描述</span>
          <textarea
            v-model="form.description"
            maxlength="1000"
            rows="3"
            placeholder="请输入知识点说明（选填）"
          />
        </label>

        <div class="form-actions">
          <button
            class="primary-button"
            type="submit"
            :disabled="submitting"
          >
            {{
              submitting
                ? '正在创建...'
                : '创建知识点'
            }}
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
          <h2>知识点列表</h2>
          <span>
            共 {{ filteredKnowledgePoints.length }} 个知识点
          </span>
        </div>

        <div class="filters">
          <select v-model="selectedCourseId">
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

          <select
            v-model="selectedChapterId"
            :disabled="!selectedCourseId"
          >
            <option value="">
              全部章节
            </option>

            <option
              v-for="chapter in filterChapters"
              :key="chapter.id"
              :value="chapter.id"
            >
              {{ chapter.name }}
            </option>
          </select>
        </div>
      </div>

      <p v-if="pending" class="status-text">
        正在加载知识点……
      </p>

      <p v-else-if="loadError" class="error-message">
        知识点加载失败，请确认后端服务已经启动。
      </p>

      <div
        v-else-if="filteredKnowledgePoints.length === 0"
        class="empty-state"
      >
        暂无知识点，请先创建知识点。
      </div>

      <div v-else class="knowledge-list">
        <article
  v-for="point in filteredKnowledgePoints"
  :key="point.id"
  class="knowledge-card"
>
  <div v-if="editingId === point.id" class="edit-form">
    <label>
      <span>知识点名称</span>
      <input
        v-model="editForm.name"
        maxlength="100"
      >
    </label>

    <label>
      <span>知识点描述</span>
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
        @click="updateKnowledgePoint(point.id)"
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
    <div class="point-icon">
      ◇
    </div>

    <div class="point-content">
      <div class="location">
        <span>{{ getCourseName(point.chapter_id) }}</span>
        <span>·</span>
        <span>{{ getChapterName(point.chapter_id) }}</span>
      </div>

      <h3>{{ point.name }}</h3>

      <p>
        {{ point.description || '暂无知识点描述' }}
      </p>

      <div class="point-actions">
        <button
          class="edit-button"
          type="button"
          @click="startEditing(point)"
        >
          编辑
        </button>

        <button
          class="delete-button"
          type="button"
          :disabled="deletingId === point.id"
          @click="deleteKnowledgePoint(point)"
        >
          {{
            deletingId === point.id
              ? '删除中...'
              : '删除'
          }}
        </button>
      </div>
    </div>
  </template>
</article>
      </div>
    </section>
  </div>
</template>
<style scoped>
.knowledge-page {
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

.knowledge-form {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 18px;
}

.knowledge-form label {
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

select:disabled {
  cursor: not-allowed;
  background: #f1f5f9;
  color: #94a3b8;
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

.filters {
  display: flex;
  width: min(100%, 520px);
  gap: 12px;
}

.knowledge-list {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(300px, 1fr)
  );
  gap: 16px;
}

.knowledge-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e3e9f2;
  border-radius: 14px;
  background: #ffffff;
  transition:
    border-color 0.2s,
    transform 0.2s;
}

.knowledge-card:hover {
  border-color: #93c5fd;
  transform: translateY(-2px);
}

.point-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border-radius: 12px;
  color: #7c3aed;
  background: #ede9fe;
  font-size: 24px;
  font-weight: 800;
}

.point-content {
  min-width: 0;
  flex: 1;
}

.location {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
}

.point-content h3 {
  margin: 8px 0;
  color: #17233c;
}

.point-content p {
  margin: 0;
  color: #718096;
  line-height: 1.6;
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

.edit-form {
  display: grid;
  width: 100%;
  gap: 14px;
}

.edit-form label {
  display: grid;
  gap: 7px;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
}

.point-actions,
.edit-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
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

@media (max-width: 900px) {
  .knowledge-form {
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

  .filters {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .filters {
    flex-direction: column;
  }

  .knowledge-list {
    grid-template-columns: 1fr;
  }
}
</style>