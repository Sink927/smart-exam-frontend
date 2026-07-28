<script setup lang="ts">
import type { KnowledgePoint } from '~/types/knowledge-point'
import type {
  Question,
  QuestionPage,
} from '~/types/question'

const api = useApi()

const keywordInput = ref('')
const keyword = ref('')
const questionType = ref('')
const difficultyMin = ref('')
const difficultyMax = ref('')

const page = ref(1)
const pageSize = ref(10)
const deletingId = ref<string | null>(null)
const actionMessage = ref('')
const actionError = ref('')

const {
  data: knowledgePoints,
} = await useAsyncData<KnowledgePoint[]>(
  'question-page-knowledge-points',
  () => api<KnowledgePoint[]>('/api/v1/knowledge-points'),
  {
    default: () => [],
  },
)

const {
  data: questionPage,
  pending,
  error: loadError,
  refresh: refreshQuestions,
} = await useAsyncData<QuestionPage>(
  'question-list',
  () => api<QuestionPage>('/api/v1/questions', {
    query: {
      keyword: keyword.value || undefined,
      question_type: questionType.value || undefined,
      difficulty_min: difficultyMin.value || undefined,
      difficulty_max: difficultyMax.value || undefined,
      page: page.value,
      page_size: pageSize.value,
    },
  }),
  {
    default: () => ({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 0,
    }),
    watch: [
      page,
      pageSize,
      questionType,
      difficultyMin,
      difficultyMax,
    ],
  },
)

const questions = computed<Question[]>(() => {
  return questionPage.value.items
})

const totalPages = computed(() => {
  return questionPage.value.total_pages
})

function getKnowledgePointNames(ids: string[]) {
  const names = ids
    .map((id) => {
      return knowledgePoints.value.find(
        point => point.id === id,
      )?.name
    })
    .filter((name): name is string => Boolean(name))

  return names.length > 0
    ? names
    : ['未匹配知识点']
}

function getQuestionTypeName(type: string) {
  const names: Record<string, string> = {
    choice: '选择题',
    multiple_choice: '多选题',
    calculation: '计算题',
    fill_blank: '填空题',
    judgment: '判断题',
    short_answer: '简答题',
  }

  return names[type] || type
}

function getAnswerText(question: Question) {
  const value = question.standard_answer?.value

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  return JSON.stringify(question.standard_answer)
}

async function searchQuestions() {
  keyword.value = keywordInput.value.trim()

  if (page.value !== 1) {
    page.value = 1
    return
  }

  await refreshQuestions()
}

async function resetFilters() {
  keywordInput.value = ''
  keyword.value = ''
  questionType.value = ''
  difficultyMin.value = ''
  difficultyMax.value = ''
  page.value = 1

  await refreshQuestions()
}

async function deleteQuestion(question: Question) {
  actionMessage.value = ''
  actionError.value = ''

  const confirmed = window.confirm(
    `确定要删除试题“${question.stem}”吗？`,
  )

  if (!confirmed) {
    return
  }

  deletingId.value = question.id

  try {
    await api(`/api/v1/questions/${question.id}`, {
      method: 'DELETE',
    })

    actionMessage.value = '试题删除成功'

    if (questions.value.length === 1 && page.value > 1) {
      page.value -= 1
    } else {
      await refreshQuestions()
    }
  } catch (error: any) {
    actionError.value =
      error?.data?.detail ||
      error?.response?._data?.detail ||
      '试题删除失败'
  } finally {
    deletingId.value = null
  }
}

function previousPage() {
  if (page.value > 1) {
    page.value -= 1
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value += 1
  }
}
</script>

<template>
  <div class="question-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">QUESTION MANAGEMENT</p>
        <h1>试题管理</h1>
        <p class="subtitle">
          检索、筛选和管理题库中的标准化试题
        </p>
      </div>

      <div class="header-actions">
  <NuxtLink
    class="create-link"
    to="/questions/create"
  >
    + 录入新试题
  </NuxtLink>

  <NuxtLink
  class="batch-link"
  to="/questions/batch"
>
  批量导入
</NuxtLink>

  <button
    class="refresh-button"
    type="button"
    @click="refreshQuestions()"
  >
    刷新试题
  </button>
</div>
    </header>

    <section class="panel">
      <form
        class="search-form"
        @submit.prevent="searchQuestions"
      >
        <label class="keyword-field">
          <span>关键词</span>
          <input
            v-model="keywordInput"
            maxlength="100"
            placeholder="搜索题干、解析、LaTeX 或来源"
          >
        </label>

        <label>
          <span>题型</span>
          <select v-model="questionType">
            <option value="">全部题型</option>
            <option value="choice">选择题</option>
            <option value="multiple_choice">多选题</option>
            <option value="calculation">计算题</option>
            <option value="fill_blank">填空题</option>
            <option value="judgment">判断题</option>
            <option value="short_answer">简答题</option>
          </select>
        </label>

        <label>
          <span>最低难度</span>
          <input
            v-model="difficultyMin"
            type="number"
            min="0"
            max="1"
            step="0.1"
            placeholder="0"
          >
        </label>

        <label>
          <span>最高难度</span>
          <input
            v-model="difficultyMax"
            type="number"
            min="0"
            max="1"
            step="0.1"
            placeholder="1"
          >
        </label>

        <div class="search-actions">
          <button class="primary-button" type="submit">
            搜索
          </button>

          <button
            class="reset-button"
            type="button"
            @click="resetFilters()"
          >
            重置
          </button>
        </div>
      </form>
    </section>

    <section class="panel">
      <div class="list-header">
        <div>
          <h2>试题列表</h2>
          <span>共 {{ questionPage.total }} 道试题</span>
        </div>

        <label class="page-size">
          <span>每页显示</span>
          <select v-model.number="pageSize">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </label>
      </div>

      <p v-if="pending" class="status-text">
        正在加载试题……
      </p>

      <p v-else-if="loadError" class="error-message">
        试题加载失败，请确认后端服务和数据库已经启动。
      </p>

      <div v-else-if="questions.length === 0" class="empty-state">
        没有找到符合条件的试题。
      </div>
      <p v-if="actionMessage" class="success-message">
  {{ actionMessage }}
</p>

<p v-if="actionError" class="error-message">
  {{ actionError }}
</p>
      <div v-else class="question-list">
        <article
          v-for="(question, index) in questions"
          :key="question.id"
          class="question-card"
        >
          <div class="question-top">
            <div class="question-number">
              {{ (page - 1) * pageSize + index + 1 }}
            </div>

            <div class="question-tags">
              <span class="type-tag">
                {{ getQuestionTypeName(question.question_type) }}
              </span>

              <span class="difficulty-tag">
                难度 {{ question.difficulty ?? '--' }}
              </span>

              <span class="version-tag">
                V{{ question.version }}
              </span>

              <span class="status-tag">
                {{ question.status }}
              </span>
            </div>
          </div>

          <h3 class="question-stem">
            {{ question.stem }}
          </h3>

          <div
  v-if="question.latex_source"
  class="formula-block"
>
  <LatexRenderer
    :source="question.latex_source"
    :display-mode="true"
  />

  <details class="source-details">
    <summary>查看 LaTeX 源码</summary>

    <pre class="latex-source">{{
      question.latex_source
    }}</pre>
  </details>
</div>
          <div
            v-if="question.options.length > 0"
            class="option-list"
          >
            <div
              v-for="option in question.options"
              :key="option.key"
              class="option-item"
            >
              <strong>{{ option.key }}.</strong>
              <span>{{ option.content }}</span>
            </div>
          </div>

          <div class="knowledge-tags">
            <span
              v-for="name in getKnowledgePointNames(
                question.knowledge_point_ids,
              )"
              :key="name"
            >
              {{ name }}
            </span>
          </div>

          <details class="answer-panel">
            <summary>查看答案与解析</summary>

            <div class="answer-content">
              <p>
                <strong>标准答案：</strong>
                {{ getAnswerText(question) }}
              </p>

              <p>
                <strong>详细解析：</strong>
                {{ question.analysis || '暂无解析' }}
              </p>

              <p>
                <strong>认知维度：</strong>
                {{ question.cognitive_level || '未设置' }}
              </p>

              <p>
                <strong>命题来源：</strong>
                {{ question.source || '未设置' }}
              </p>
            </div>
          </details>
          <div class="question-actions">
  <NuxtLink
    class="edit-link"
    :to="`/questions/${question.id}/edit`"
  >
    编辑试题
  </NuxtLink>

  <NuxtLink
    class="history-link"
    :to="`/questions/${question.id}/versions`"
  >
    版本历史
  </NuxtLink>

  <button
    class="delete-button"
    type="button"
    :disabled="deletingId === question.id"
    @click="deleteQuestion(question)"
  >
    {{
      deletingId === question.id
        ? '删除中...'
        : '删除试题'
    }}
  </button>
</div>
        </article>
      </div>

      <div v-if="questionPage.total > 0" class="pagination">
        <button
          type="button"
          :disabled="page <= 1 || pending"
          @click="previousPage()"
        >
          上一页
        </button>

        <span>
          第 {{ page }} 页 /
          共 {{ Math.max(totalPages, 1) }} 页
        </span>

        <button
          type="button"
          :disabled="page >= totalPages || pending"
          @click="nextPage()"
        >
          下一页
        </button>
      </div>
    </section>
  </div>
</template>
<style scoped>
.question-page {
  display: grid;
  gap: 24px;
}

.page-header,
.list-header,
.question-top,
.pagination {
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
  margin: 0 0 6px;
  color: #17233c;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.create-link {
  padding: 10px 16px;
  border-radius: 9px;
  color: white;
  background: #2563eb;
  font-weight: 700;
  text-decoration: none;
}

.batch-link {
  padding: 10px 16px;
  border-radius: 9px;
  color: #7c3aed;
  background: #ede9fe;
  font-weight: 700;
  text-decoration: none;
}

.refresh-button,
.primary-button,
.reset-button,
.pagination button {
  padding: 10px 16px;
  border: 0;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 700;
}

.refresh-button,
.reset-button {
  color: #2563eb;
  background: #eaf2ff;
}

.primary-button {
  color: white;
  background: #2563eb;
}

.search-form {
  display: grid;
  grid-template-columns:
    minmax(260px, 2fr)
    minmax(150px, 1fr)
    130px
    130px
    auto;
  align-items: end;
  gap: 14px;
}

.search-form label,
.page-size {
  display: grid;
  gap: 7px;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
}

input,
select {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 13px;
  border: 1px solid #d7dfeb;
  border-radius: 9px;
  background: white;
  font: inherit;
}

input:focus,
select:focus {
  border-color: #2563eb;
  outline: none;
}

.search-actions {
  display: flex;
  gap: 8px;
}

.list-header {
  margin-bottom: 20px;
}

.list-header span {
  color: #718096;
}

.page-size {
  display: flex;
  align-items: center;
  grid-auto-flow: column;
}

.page-size select {
  width: 90px;
}

.question-list {
  display: grid;
  gap: 18px;
}

.question-card {
  padding: 22px;
  border: 1px solid #e3e9f2;
  border-radius: 15px;
  background: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.question-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 8px 24px rgb(37 99 235 / 8%);
}

.question-top {
  justify-content: flex-start;
}

.question-number {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 10px;
  color: white;
  background: #2563eb;
  font-weight: 800;
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-tags span,
.knowledge-tags span {
  padding: 5px 9px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 700;
}

.type-tag {
  color: #2563eb;
  background: #dbeafe;
}

.difficulty-tag {
  color: #b45309;
  background: #fef3c7;
}

.version-tag {
  color: #7c3aed;
  background: #ede9fe;
}

.status-tag {
  color: #15803d;
  background: #dcfce7;
}

.question-stem {
  margin: 18px 0 12px;
  color: #17233c;
  font-size: 18px;
  line-height: 1.7;
}

.formula-block {
  display: grid;
  gap: 10px;
  margin: 14px 0;
}

.source-details summary {
  color: #2563eb;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
}

.latex-source {
  overflow-x: auto;
  margin: 12px 0;
  padding: 13px 15px;
  border-radius: 9px;
  color: #1d4ed8;
  background: #f1f5f9;
  font-family: Consolas, monospace;
  white-space: pre-wrap;
}

.option-list {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(200px, 1fr)
  );
  gap: 10px;
  margin: 16px 0;
}

.option-item {
  display: flex;
  gap: 8px;
  padding: 11px 13px;
  border: 1px solid #e3e9f2;
  border-radius: 9px;
  color: #475569;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.knowledge-tags span {
  color: #7c3aed;
  background: #ede9fe;
}

.answer-panel {
  margin-top: 18px;
  border-top: 1px solid #e3e9f2;
}

.answer-panel summary {
  padding-top: 16px;
  color: #2563eb;
  cursor: pointer;
  font-weight: 700;
}

.answer-content {
  margin-top: 14px;
  padding: 15px;
  border-radius: 10px;
  color: #475569;
  background: #f8fafc;
  line-height: 1.7;
}

.answer-content p {
  margin: 6px 0;
}

.pagination {
  justify-content: center;
  margin-top: 24px;
}

.pagination button {
  color: #2563eb;
  background: #eaf2ff;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.pagination span {
  color: #475569;
  font-weight: 600;
}

.error-message {
  color: #dc2626;
}

.empty-state {
  padding: 45px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #718096;
  text-align: center;
}

.question-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.edit-link {
  padding: 9px 14px;
  border-radius: 8px;
  color: #2563eb;
  background: #dbeafe;
  font-weight: 700;
  text-decoration: none;
}

.history-link {
  padding: 9px 14px;
  border-radius: 8px;
  color: #7c3aed;
  background: #ede9fe;
  font-weight: 700;
  text-decoration: none;
}

.delete-button {
  padding: 9px 14px;
  border: 0;
  border-radius: 8px;
  color: #dc2626;
  background: #fee2e2;
  cursor: pointer;
  font-weight: 700;
}

.delete-button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.success-message {
  margin: 0 0 16px;
  color: #15803d;
}

@media (max-width: 1100px) {
  .search-form {
    grid-template-columns: 1fr 1fr;
  }

  .search-actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 650px) {
  .search-form {
    grid-template-columns: 1fr;
  }

  .search-actions {
    grid-column: auto;
  }

  .page-header,
  .list-header {
    align-items: stretch;
    flex-direction: column;
  }

  .page-size {
    justify-content: space-between;
  }

  .option-list {
    grid-template-columns: 1fr;
  }

  .pagination {
    flex-wrap: wrap;
  }
}
</style>