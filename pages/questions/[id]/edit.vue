<script setup lang="ts">
import type { Course } from '~/types/course'
import type { Chapter } from '~/types/chapter'
import type { KnowledgePoint } from '~/types/knowledge-point'
import type {
  Question,
  QuestionForm,
} from '~/types/question'

const api = useApi()
const route = useRoute()

const questionId = computed(() => {
  return String(route.params.id)
})

const selectedCourseId = ref('')
const selectedChapterId = ref('')
const initializingForm = ref(false)
const submitting = ref(false)
const formError = ref('')

const form = reactive<QuestionForm>({
  question_type: 'choice',
  stem: '',
  latex_source: '',
  options: [],
  answer: '',
  analysis: '',
  difficulty: 0.5,
  cognitive_level: 'apply',
  source: '',
  knowledge_point_ids: [],
})

const {
  data: courses,
} = await useAsyncData<Course[]>(
  'question-edit-courses',
  () => api<Course[]>('/api/v1/courses'),
  {
    default: () => [],
  },
)

const {
  data: chapters,
} = await useAsyncData<Chapter[]>(
  'question-edit-chapters',
  () => api<Chapter[]>('/api/v1/chapters'),
  {
    default: () => [],
  },
)

const {
  data: knowledgePoints,
} = await useAsyncData<KnowledgePoint[]>(
  'question-edit-knowledge-points',
  () => api<KnowledgePoint[]>('/api/v1/knowledge-points'),
  {
    default: () => [],
  },
)

const {
  data: question,
  pending,
  error: loadError,
} = await useAsyncData<Question>(
  `question-edit-${questionId.value}`,
  () => api<Question>(
    `/api/v1/questions/${questionId.value}`,
  ),
)

const filteredChapters = computed(() => {
  if (!selectedCourseId.value) {
    return []
  }

  return chapters.value.filter(
    chapter => chapter.course_id === selectedCourseId.value,
  )
})

const filteredKnowledgePoints = computed(() => {
  if (!selectedChapterId.value) {
    return []
  }

  return knowledgePoints.value.filter(
    point => point.chapter_id === selectedChapterId.value,
  )
})

const hasOptions = computed(() => {
  return [
    'choice',
    'multiple_choice',
  ].includes(form.question_type)
})

watch(
  question,
  async (value) => {
    if (!value) {
      return
    }

    initializingForm.value = true

    form.question_type = value.question_type
    form.stem = value.stem
    form.latex_source = value.latex_source || ''
    form.options = value.options.map(option => ({
      key: option.key,
      content: option.content,
    }))

    const answer = value.standard_answer?.value
    form.answer =
      typeof answer === 'string' ||
      typeof answer === 'number'
        ? String(answer)
        : JSON.stringify(value.standard_answer)

    form.analysis = value.analysis || ''
    form.difficulty = Number(value.difficulty ?? 0.5)
    form.cognitive_level =
      value.cognitive_level || 'apply'
    form.source = value.source || ''
    form.knowledge_point_ids = [
      ...value.knowledge_point_ids,
    ]

    const firstPoint = knowledgePoints.value.find(
      point => value.knowledge_point_ids.includes(point.id),
    )

    if (firstPoint) {
      selectedChapterId.value = firstPoint.chapter_id

      const chapter = chapters.value.find(
        item => item.id === firstPoint.chapter_id,
      )

      selectedCourseId.value = chapter?.course_id || ''
    }

    await nextTick()
    initializingForm.value = false
  },
  {
    immediate: true,
  },
)

watch(selectedCourseId, () => {
  if (initializingForm.value) {
    return
  }

  selectedChapterId.value = ''
  form.knowledge_point_ids = []
})

watch(selectedChapterId, () => {
  if (initializingForm.value) {
    return
  }

  form.knowledge_point_ids = []
})

function addOption() {
  const key = String.fromCharCode(
    65 + form.options.length,
  )

  form.options.push({
    key,
    content: '',
  })
}

function removeOption(index: number) {
  if (form.options.length <= 2) {
    return
  }

  form.options.splice(index, 1)

  form.options.forEach((option, optionIndex) => {
    option.key = String.fromCharCode(65 + optionIndex)
  })
}

async function updateQuestion() {
  formError.value = ''

  if (!form.stem.trim()) {
    formError.value = '题干不能为空'
    return
  }

  if (!form.answer.trim()) {
    formError.value = '标准答案不能为空'
    return
  }

  if (form.knowledge_point_ids.length === 0) {
    formError.value = '请至少选择一个知识点'
    return
  }

  if (
    hasOptions.value &&
    form.options.some(option => !option.content.trim())
  ) {
    formError.value = '选择题的选项不能为空'
    return
  }

  submitting.value = true

  try {
    await api<Question>(
      `/api/v1/questions/${questionId.value}`,
      {
        method: 'PATCH',
        body: {
          question_type: form.question_type,
          stem: form.stem.trim(),
          latex_source:
            form.latex_source.trim() || null,
          options: hasOptions.value
            ? form.options.map(option => ({
                key: option.key,
                content: option.content.trim(),
              }))
            : [],
          standard_answer: {
            value: form.answer.trim(),
          },
          analysis: form.analysis.trim() || null,
          difficulty: Number(form.difficulty),
          cognitive_level:
            form.cognitive_level || null,
          source: form.source.trim() || null,
          metadata: question.value?.metadata || {},
          knowledge_point_ids:
            form.knowledge_point_ids,
        },
      },
    )

    await navigateTo(
      `/questions/${questionId.value}/versions`,
    )
  } catch (error: any) {
    formError.value =
      error?.data?.detail ||
      error?.response?._data?.detail ||
      '试题修改失败，请检查填写内容'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="edit-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">QUESTION EDITOR</p>
        <h1>编辑试题</h1>
        <p class="subtitle">
          修改后会自动生成一条新的版本记录
        </p>
      </div>

      <NuxtLink class="back-link" to="/questions">
        返回试题列表
      </NuxtLink>
    </header>

    <section v-if="pending" class="panel status-panel">
      正在加载试题……
    </section>

    <section v-else-if="loadError" class="panel error-message">
      试题加载失败，请检查试题是否存在。
    </section>

    <form
      v-else-if="question"
      class="question-form"
      @submit.prevent="updateQuestion"
    >
      <section class="panel">
        <h2>基本信息</h2>

        <div class="form-grid">
          <label>
            <span>题型</span>
            <select v-model="form.question_type">
              <option value="choice">选择题</option>
              <option value="multiple_choice">多选题</option>
              <option value="calculation">计算题</option>
              <option value="fill_blank">填空题</option>
              <option value="judgment">判断题</option>
              <option value="short_answer">简答题</option>
            </select>
          </label>

          <label>
            <span>难度系数：{{ form.difficulty }}</span>
            <input
              v-model.number="form.difficulty"
              type="range"
              min="0"
              max="1"
              step="0.1"
            >
          </label>

          <label>
            <span>认知维度</span>
            <select v-model="form.cognitive_level">
              <option value="remember">记忆</option>
              <option value="understand">理解</option>
              <option value="apply">应用</option>
              <option value="analyze">分析</option>
              <option value="evaluate">评价</option>
              <option value="create">创造</option>
            </select>
          </label>

          <label>
            <span>命题来源</span>
            <input
              v-model="form.source"
              maxlength="255"
            >
          </label>
        </div>
      </section>

      <section class="panel">
        <h2>题干与 LaTeX</h2>

        <div class="text-fields">
          <label>
            <span>题干</span>
            <textarea
              v-model="form.stem"
              rows="5"
            />
          </label>

          <label>
            <span>LaTeX 源码</span>
            <textarea
              v-model="form.latex_source"
              rows="5"
              spellcheck="false"
            />
          </label>
        </div>
        <div class="latex-preview">
  <div class="preview-header">
    <h3>公式实时预览</h3>
    <span>修改 LaTeX 源码后会自动更新</span>
  </div>

  <LatexRenderer
    :source="form.latex_source"
    :display-mode="true"
  />
</div>
      </section>

      <section v-if="hasOptions" class="panel">
        <div class="section-header">
          <div>
            <h2>试题选项</h2>
            <p>可修改、添加或删除选项</p>
          </div>

          <button
            class="secondary-button"
            type="button"
            @click="addOption"
          >
            添加选项
          </button>
        </div>

        <div class="option-editor">
          <div
            v-for="(option, index) in form.options"
            :key="option.key"
            class="option-row"
          >
            <div class="option-key">
              {{ option.key }}
            </div>

            <input
              v-model="option.content"
              :placeholder="`选项 ${option.key}`"
            >

            <button
              class="remove-button"
              type="button"
              :disabled="form.options.length <= 2"
              @click="removeOption(index)"
            >
              删除
            </button>
          </div>
        </div>
      </section>

      <section class="panel">
        <h2>答案与解析</h2>

        <div class="text-fields">
          <label>
            <span>标准答案</span>
            <textarea
              v-model="form.answer"
              rows="4"
            />
          </label>

          <label>
            <span>详细解析</span>
            <textarea
              v-model="form.analysis"
              rows="4"
            />
          </label>
        </div>
      </section>

      <section class="panel">
        <h2>知识点关联</h2>

        <div class="hierarchy-selectors">
          <label>
            <span>课程</span>
            <select v-model="selectedCourseId">
              <option value="">请选择课程</option>

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
            <span>章节</span>
            <select
              v-model="selectedChapterId"
              :disabled="!selectedCourseId"
            >
              <option value="">请选择章节</option>

              <option
                v-for="chapter in filteredChapters"
                :key="chapter.id"
                :value="chapter.id"
              >
                第{{ chapter.order_index }}章 -
                {{ chapter.name }}
              </option>
            </select>
          </label>
        </div>

        <p
          v-if="
            selectedChapterId &&
            filteredKnowledgePoints.length === 0
          "
          class="empty-hint"
        >
          当前章节没有知识点。
        </p>

        <div
          v-if="filteredKnowledgePoints.length > 0"
          class="knowledge-options"
        >
          <label
            v-for="point in filteredKnowledgePoints"
            :key="point.id"
            class="knowledge-checkbox"
          >
            <input
              v-model="form.knowledge_point_ids"
              type="checkbox"
              :value="point.id"
            >

            <span>
              <strong>{{ point.name }}</strong>
              <small>
                {{ point.description || '暂无说明' }}
              </small>
            </span>
          </label>
        </div>
      </section>

      <section class="submit-panel">
        <p v-if="formError" class="error-message">
          {{ formError }}
        </p>

        <div class="submit-actions">
          <NuxtLink class="cancel-link" to="/questions">
            取消
          </NuxtLink>

          <button
            class="submit-button"
            type="submit"
            :disabled="submitting"
          >
            {{
              submitting
                ? '正在保存...'
                : '保存修改'
            }}
          </button>
        </div>
      </section>
    </form>
  </div>
</template>

<style scoped>
.edit-page {
  display: grid;
  gap: 24px;
}

.status-panel {
  color: #718096;
  text-align: center;
}

.page-header,
.section-header,
.submit-actions {
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

.subtitle {
  margin: 0;
  color: #718096;
}

.back-link,
.cancel-link {
  padding: 10px 16px;
  border-radius: 9px;
  color: #2563eb;
  background: #eaf2ff;
  font-weight: 700;
  text-decoration: none;
}

.question-form {
  display: grid;
  gap: 20px;
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

.section-header {
  margin-bottom: 20px;
}

.section-header h2 {
  margin-bottom: 5px;
}

.section-header p {
  margin: 0;
  color: #718096;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.form-grid label,
.text-fields label,
.hierarchy-selectors label {
  display: grid;
  gap: 8px;
  color: #334155;
  font-weight: 600;
}

.text-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
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

textarea {
  line-height: 1.6;
  resize: vertical;
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

input[type='range'] {
  padding: 8px 0;
  accent-color: #2563eb;
}

.secondary-button,
.remove-button,
.submit-button {
  padding: 10px 16px;
  border: 0;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 700;
}

.secondary-button {
  color: #2563eb;
  background: #eaf2ff;
}

.option-editor {
  display: grid;
  gap: 12px;
}

.option-row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 12px;
}

.option-key {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 10px;
  color: white;
  background: #2563eb;
  font-weight: 800;
}

.remove-button {
  color: #dc2626;
  background: #fee2e2;
}

.remove-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.hierarchy-selectors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.knowledge-options {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(260px, 1fr)
  );
  gap: 12px;
  margin-top: 20px;
}

.knowledge-checkbox {
  display: flex;
  gap: 12px;
  padding: 14px;
  border: 1px solid #e3e9f2;
  border-radius: 11px;
  cursor: pointer;
}

.knowledge-checkbox:has(input:checked) {
  border-color: #2563eb;
  background: #eff6ff;
}

.knowledge-checkbox input {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  margin-top: 2px;
  accent-color: #2563eb;
}

.knowledge-checkbox span {
  display: grid;
  gap: 4px;
  color: #334155;
}

.knowledge-checkbox small {
  color: #718096;
  line-height: 1.5;
}

.empty-hint {
  margin: 20px 0 0;
  padding: 14px;
  border-radius: 9px;
  color: #b45309;
  background: #fef3c7;
}

.submit-panel {
  position: sticky;
  bottom: 12px;
  padding: 18px 22px;
  border: 1px solid #dbe5f3;
  border-radius: 15px;
  background: rgb(255 255 255 / 95%);
  box-shadow: 0 10px 30px rgb(15 23 42 / 12%);
  backdrop-filter: blur(10px);
}

.submit-actions {
  justify-content: flex-end;
}

.submit-button {
  min-width: 130px;
  color: white;
  background: #2563eb;
}

.submit-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.error-message {
  margin: 0 0 12px;
  color: #dc2626;
}

.latex-preview {
  margin-top: 20px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.preview-header h3 {
  margin: 0;
  color: #334155;
  font-size: 16px;
}

.preview-header span {
  color: #718096;
  font-size: 13px;
}

@media (max-width: 1000px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 700px) {
  .page-header,
  .section-header {
    align-items: stretch;
    flex-direction: column;
  }

  .form-grid,
  .text-fields,
  .hierarchy-selectors {
    grid-template-columns: 1fr;
  }

  .option-row {
    grid-template-columns: 40px 1fr;
  }

  .remove-button {
    grid-column: 2;
  }

  .knowledge-options {
    grid-template-columns: 1fr;
  }
}
</style>