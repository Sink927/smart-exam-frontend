<script setup lang="ts">
type Course = {
  id: string
  code: string
  name: string
}

type ExamTemplate = {
  id: string
  key: string
  name: string
}

type SectionForm = {
  title: string
  question_type: string
  question_count: number
  score_per_question: number
  layout_zone: string
  instructions: string
}

type CreatedPaper = {
  id: string
}

const { $api } = useNuxtApp()

const config = useRuntimeConfig()

const courses = ref<Course[]>([])
const templates = ref<ExamTemplate[]>([])
const loadingOptions = ref(true)
const submitting = ref(false)
const errorMessage = ref('')

const questionTypes = [
  {
    value: 'choice',
    label: '单项选择题',
  },
  {
    value: 'fill_blank',
    label: '填空题',
  },
  {
    value: 'calculation',
    label: '计算题',
  },
  {
    value: 'short_answer',
    label: '简答与证明题',
  },
]

const form = reactive({
  course_id: '',
  template_id: '',
  title: '',
  school_name: '大学',
  academic_year: '2026-2027',
  semester: '第一学期',
  exam_type: '期末考试',
  paper_variant: 'A',
  exam_mode: '闭卷',
  duration_minutes: 120,
  issuing_department: '数学学院',
  instructions:
    '考试期间不得使用手机，请将答案填写在答题区域。',
})

const sections = ref<SectionForm[]>([
  {
    title: '一、单项选择题',
    question_type: 'choice',
    question_count: 5,
    score_per_question: 4,
    layout_zone: 'left',
    instructions: '每小题只有一个正确答案。',
  },
  {
    title: '二、填空题',
    question_type: 'fill_blank',
    question_count: 5,
    score_per_question: 4,
    layout_zone: 'left',
    instructions: '请将答案填写在横线上。',
  },
  {
    title: '三、计算题',
    question_type: 'calculation',
    question_count: 6,
    score_per_question: 10,
    layout_zone: 'right',
    instructions: '请写出必要的计算过程。',
  },
])

const totalScore = computed(() =>
  sections.value.reduce(
    (total, section) =>
      total
      + section.question_count
      * section.score_per_question,
    0,
  ),
)

function addSection() {
  sections.value.push({
    title: `${sections.value.length + 1}、新题型`,
    question_type: 'short_answer',
    question_count: 1,
    score_per_question: 10,
    layout_zone: 'right',
    instructions: '',
  })
}

function removeSection(index: number) {
  if (sections.value.length <= 1) {
    errorMessage.value =
      '试卷至少需要保留一个大题'
    return
  }

  sections.value.splice(index, 1)
}

async function loadOptions() {
  loadingOptions.value = true

  try {
    const [courseData, templateData] =
      await Promise.all([
        $api<Course[]>(
          '/api/v1/courses',
          {
            baseURL: config.public.apiBase,
          },
        ),
        $api<ExamTemplate[]>(
          '/api/v1/exam-templates',
          {
            baseURL: config.public.apiBase,
          },
        ),
      ])

    courses.value = courseData
    templates.value = templateData

    form.course_id =
      courseData[0]?.id || ''
    form.template_id =
      templateData[0]?.id || ''
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : '课程和模板加载失败'
  } finally {
    loadingOptions.value = false
  }
}

async function submitPaper() {
  errorMessage.value = ''

  if (!form.course_id) {
    errorMessage.value = '请选择课程'
    return
  }

  if (!form.template_id) {
    errorMessage.value = '请选择试卷模板'
    return
  }

  if (!form.title.trim()) {
    errorMessage.value = '请输入试卷名称'
    return
  }

  submitting.value = true

  try {
    const createdPaper =
      await $api<CreatedPaper>(
        '/api/v1/exam-papers',
        {
          baseURL: config.public.apiBase,
          method: 'POST',
          body: {
            ...form,
            total_score: totalScore.value,
            layout_settings: {
              show_answer: false,
              show_analysis: false,
            },
            sections: sections.value,
          },
        },
      )

    await navigateTo(
      `/papers/${createdPaper.id}`,
    )
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : '试卷创建失败'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadOptions()
})
</script>
<template>
  <div class="create-paper-page">
    <header class="page-header">
      <div>
        <NuxtLink
          to="/papers"
          class="back-link"
        >
          ← 返回试卷列表
        </NuxtLink>
        <h1>创建试卷</h1>
        <p>设置试卷信息和大题结构</p>
      </div>

      <div class="score-card">
        <span>试卷总分</span>
        <strong>{{ totalScore }}</strong>
        <small>分</small>
      </div>
    </header>

    <p
      v-if="errorMessage"
      class="error-message"
    >
      {{ errorMessage }}
    </p>

    <form
      class="paper-form"
      @submit.prevent="submitPaper"
    >
      <section class="form-panel">
        <div class="panel-heading">
          <div>
            <h2>基本信息</h2>
            <p>填写试卷名称、课程和考试信息</p>
          </div>
        </div>

        <div
          v-if="loadingOptions"
          class="loading-box"
        >
          正在加载课程和模板……
        </div>

        <div
          v-else
          class="form-grid"
        >
          <label class="field full-width">
            <span>试卷名称 *</span>
            <input
              v-model="form.title"
              type="text"
              placeholder="例如：高等数学期末考试试卷"
              required
            >
          </label>

          <label class="field">
            <span>所属课程 *</span>
            <select
              v-model="form.course_id"
              required
            >
              <option
                value=""
                disabled
              >
                请选择课程
              </option>
              <option
                v-for="course in courses"
                :key="course.id"
                :value="course.id"
              >
                {{ course.code }} -
                {{ course.name }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>试卷模板 *</span>
            <select
              v-model="form.template_id"
              required
            >
              <option
                value=""
                disabled
              >
                请选择模板
              </option>
              <option
                v-for="template in templates"
                :key="template.id"
                :value="template.id"
              >
                {{ template.name }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>学校名称</span>
            <input
              v-model="form.school_name"
              type="text"
            >
          </label>

          <label class="field">
            <span>命题单位</span>
            <input
              v-model="
                form.issuing_department
              "
              type="text"
            >
          </label>

          <label class="field">
            <span>学年</span>
            <input
              v-model="form.academic_year"
              type="text"
            >
          </label>

          <label class="field">
            <span>学期</span>
            <input
              v-model="form.semester"
              type="text"
            >
          </label>

          <label class="field">
            <span>考试类型</span>
            <input
              v-model="form.exam_type"
              type="text"
            >
          </label>

          <label class="field">
            <span>试卷编号</span>
            <select
              v-model="form.paper_variant"
            >
              <option value="A">A卷</option>
              <option value="B">B卷</option>
              <option value="T">测试卷</option>
            </select>
          </label>

          <label class="field">
            <span>考试方式</span>
            <select
              v-model="form.exam_mode"
            >
              <option value="闭卷">闭卷</option>
              <option value="开卷">开卷</option>
            </select>
          </label>

          <label class="field">
            <span>考试时长（分钟）</span>
            <input
              v-model.number="
                form.duration_minutes
              "
              type="number"
              min="1"
              max="600"
            >
          </label>

          <label class="field full-width">
            <span>考试说明</span>
            <textarea
              v-model="form.instructions"
              rows="3"
            />
          </label>
        </div>
      </section>

      <section class="form-panel">
        <div class="panel-heading">
          <div>
            <h2>大题结构</h2>
            <p>
              相同题型归入同一个大题，
              每个大题可以包含多道小题
            </p>
          </div>

          <button
            class="add-button"
            type="button"
            @click="addSection"
          >
            ＋ 添加大题
          </button>
        </div>

        <div class="section-list">
          <article
            v-for="(
              section,
              index
            ) in sections"
            :key="index"
            class="section-card"
          >
            <header>
              <strong>
                第{{ index + 1 }}大题
              </strong>

              <button
                type="button"
                class="remove-button"
                @click="removeSection(index)"
              >
                删除
              </button>
            </header>

            <div class="section-grid">
              <label class="field title-field">
                <span>大题标题</span>
                <input
                  v-model="section.title"
                  type="text"
                  required
                >
              </label>

              <label class="field">
                <span>题目类型</span>
                <select
                  v-model="
                    section.question_type
                  "
                >
                  <option
                    v-for="type in questionTypes"
                    :key="type.value"
                    :value="type.value"
                  >
                    {{ type.label }}
                  </option>
                </select>
              </label>

              <label class="field">
                <span>题目数量</span>
                <input
                  v-model.number="
                    section.question_count
                  "
                  type="number"
                  min="1"
                  max="100"
                >
              </label>

              <label class="field">
                <span>每题分值</span>
                <input
                  v-model.number="
                    section.score_per_question
                  "
                  type="number"
                  min="0.5"
                  step="0.5"
                >
              </label>

              <label class="field">
                <span>排版区域</span>
                <select
                  v-model="
                    section.layout_zone
                  "
                >
                  <option value="left">左栏</option>
                  <option value="right">右栏</option>
                </select>
              </label>

              <label class="field full-width">
                <span>大题说明</span>
                <input
                  v-model="
                    section.instructions
                  "
                  type="text"
                >
              </label>
            </div>

            <footer>
              本大题小计：
              <strong>
                {{
                  section.question_count
                  * section.score_per_question
                }}
              </strong>
              分
            </footer>
          </article>
        </div>
      </section>

      <footer class="form-actions">
        <NuxtLink
          to="/papers"
          class="cancel-button"
        >
          取消
        </NuxtLink>

        <button
          class="submit-button"
          type="submit"
          :disabled="
            submitting || loadingOptions
          "
        >
          {{
            submitting
              ? '正在创建……'
              : '创建试卷'
          }}
        </button>
      </footer>
    </form>
  </div>
</template>
<style scoped>
.create-paper-page {
  display: grid;
  gap: 22px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.back-link {
  display: inline-block;
  margin-bottom: 10px;
  color: #2563eb;
  text-decoration: none;
}

.page-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 32px;
}

.page-header p {
  margin: 8px 0 0;
  color: #64748b;
}

.score-card {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 15px 20px;
  border-radius: 16px;
  color: #1d4ed8;
  background: #dbeafe;
}

.score-card span {
  font-size: 13px;
}

.score-card strong {
  font-size: 30px;
}

.paper-form {
  display: grid;
  gap: 22px;
}

.form-panel {
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #fff;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.panel-heading h2 {
  margin: 0;
  color: #0f172a;
}

.panel-heading p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.form-grid,
.section-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.field {
  display: grid;
  gap: 7px;
}

.field span {
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 11px;
  outline: none;
  color: #0f172a;
  background: #fff;
  font: inherit;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgb(59 130 246 / 12%);
}

.field textarea {
  resize: vertical;
}

.full-width {
  grid-column: 1 / -1;
}

.add-button,
.remove-button,
.submit-button {
  border: 0;
  border-radius: 11px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.add-button {
  padding: 10px 14px;
  color: #1d4ed8;
  background: #dbeafe;
}

.section-list {
  display: grid;
  gap: 16px;
}

.section-card {
  overflow: hidden;
  border: 1px solid #dbe3ee;
  border-radius: 16px;
  background: #f8fafc;
}

.section-card > header,
.section-card > footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
}

.section-card > header {
  color: #0f172a;
  background: #eef4ff;
}

.section-card > footer {
  justify-content: flex-end;
  gap: 6px;
  color: #475569;
  background: #f1f5f9;
}

.remove-button {
  padding: 7px 10px;
  color: #b91c1c;
  background: #fee2e2;
}

.section-grid {
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  padding: 18px;
}

.title-field {
  min-width: 200px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-bottom: 30px;
}

.cancel-button,
.submit-button {
  padding: 12px 20px;
  border-radius: 12px;
  text-decoration: none;
}

.cancel-button {
  color: #475569;
  background: #e2e8f0;
}

.submit-button {
  color: #fff;
  background: #2563eb;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.error-message {
  margin: 0;
  padding: 12px 16px;
  border-radius: 12px;
  color: #b91c1c;
  background: #fee2e2;
}

.loading-box {
  padding: 30px;
  color: #64748b;
  text-align: center;
}

@media (max-width: 1100px) {
  .section-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 700px) {
  .page-header,
  .panel-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .form-grid,
  .section-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }

  .score-card {
    justify-content: center;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-button,
  .submit-button {
    box-sizing: border-box;
    width: 100%;
    text-align: center;
  }
}
</style>