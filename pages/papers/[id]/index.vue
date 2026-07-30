<script setup lang="ts">
definePageMeta({
  title: '试卷详情',
})
type QuestionSnapshot = {
  id: string
  question_type: string
  stem: string
  latex_source: string | null
  options: Array<{
    key?: string
    content?: string
  }>
  standard_answer?: Record<string, unknown>
  analysis?: string | null
  difficulty: string | null
  cognitive_level: string | null
}

type PaperQuestion = {
  id: string
  question_id: string
  question_version: number
  order_index: number
  score: string
  question_snapshot: QuestionSnapshot
}

type PaperSection = {
  id: string
  title: string
  question_type: string | null
  order_index: number
  question_count: number
  score_per_question: string
  subtotal: string
  layout_zone: string | null
  instructions: string | null
  questions: PaperQuestion[]
}

type ExamPaperPreview = {
  id: string
  course_id: string
  title: string
  school_name: string | null
  academic_year: string | null
  semester: string | null
  exam_type: string | null
  paper_variant: string | null
  exam_mode: string | null
  duration_minutes: number | null
  total_score: string
  status: string
  instructions: string | null
  sections: PaperSection[]
  issuing_department: string | null
}

type KnowledgePoint = {
  id: string
  chapter_id: string
  name: string
  description: string | null
}

type SectionAssemblyResult = {
  section_id: string
  section_title: string
  question_type: string | null
  required_count: number
  existing_count: number
  added_count: number
  final_count: number
}

type AssemblyResult = {
  paper_id: string
  total_required: number
  total_added: number
  total_selected: number
  requested_knowledge_point_count: number
  covered_knowledge_point_count: number
  knowledge_point_coverage_rate: string
  missing_knowledge_point_ids: string[]
  sections: SectionAssemblyResult[]
}

const route = useRoute()
const config = useRuntimeConfig()

const paperId = route.params.id as string
const paper = ref<ExamPaperPreview | null>(null)
const pending = ref(true)
const assembling = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const answerMode = ref<'none' | 'all'>('none')
const knowledgePoints = ref<KnowledgePoint[]>([])
const selectedKnowledgePointIds = ref<string[]>([])
const loadingKnowledgePoints = ref(false)
const showAssemblySettings = ref(false)
const assemblyResult =
  ref<AssemblyResult | null>(null)

const assemblySettings = reactive({
  require_full_knowledge_coverage: false,
  algorithm: 'genetic',
  replace_existing: true,
  use_difficulty_gradient: true,
  easy_ratio: 0.3,
  medium_ratio: 0.5,
  hard_ratio: 0.2,
  population_size: 50,
  generations: 100,
  mutation_rate: 0.1,
  crossover_rate: 0.8,
  knowledge_weight: 0.4,
  difficulty_weight: 0.4,
  cognitive_weight: 0.2,
})

const difficultyRatioTotal = computed(
  () =>
    assemblySettings.easy_ratio
    + assemblySettings.medium_ratio
    + assemblySettings.hard_ratio,
)

const fitnessWeightTotal = computed(
  () =>
    assemblySettings.knowledge_weight
    + assemblySettings.difficulty_weight
    + assemblySettings.cognitive_weight,
)

const leftSections = computed(() =>
  paper.value?.sections.filter(
    section =>
      section.layout_zone !== 'right',
  ) ?? [],
)

const rightSections = computed(() =>
  paper.value?.sections.filter(
    section =>
      section.layout_zone === 'right',
  ) ?? [],
)

async function loadKnowledgePoints(
  courseId: string,
) {
  loadingKnowledgePoints.value = true

  try {
    knowledgePoints.value =
      await $fetch<KnowledgePoint[]>(
        '/api/v1/knowledge-points',
        {
          baseURL: config.public.apiBase,
          query: {
            course_id: courseId,
          },
        },
      )
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : '知识点加载失败'
  } finally {
    loadingKnowledgePoints.value = false
  }
}

async function loadPaper() {
  pending.value = true
  errorMessage.value = ''

  try {
    const loadedPaper =
      await $fetch<ExamPaperPreview>(
        `/api/v1/exam-papers/${paperId}/preview-data`,
        {
          baseURL: config.public.apiBase,
          query: {
            answer_mode: answerMode.value,
            include_analysis:
              answerMode.value === 'all',
          },
        },
      )

    paper.value = loadedPaper

    if (
      knowledgePoints.value.length === 0
    ) {
      await loadKnowledgePoints(
        loadedPaper.course_id,
      )
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : '试卷加载失败'
  } finally {
    pending.value = false
  }
}

async function autoAssemble() {
  errorMessage.value = ''
  successMessage.value = ''
  assemblyResult.value = null

  if (
    assemblySettings.use_difficulty_gradient
    && Math.abs(
      difficultyRatioTotal.value - 1,
    ) > 0.0001
  ) {
    errorMessage.value =
      '简单、中等和较难题比例之和必须等于1'
    return
  }

  if (
    assemblySettings.algorithm === 'genetic'
    && Math.abs(
      fitnessWeightTotal.value - 1,
    ) > 0.0001
  ) {
    errorMessage.value =
      '知识点、难度和认知权重之和必须等于1'
    return
  }

  assembling.value = true

  try {
    const result =
      await $fetch<AssemblyResult>(
        `/api/v1/exam-papers/${paperId}/auto-assemble`,
        {
          baseURL: config.public.apiBase,
          method: 'POST',
          body: {
            difficulty_min: null,
            difficulty_max: null,

            knowledge_point_ids:
              selectedKnowledgePointIds.value,

            cognitive_levels: [],

            replace_existing:
              assemblySettings.replace_existing,

            difficulty_gradient:
              assemblySettings
                .use_difficulty_gradient
                ? {
                    easy_ratio:
                      assemblySettings.easy_ratio,
                    medium_ratio:
                      assemblySettings.medium_ratio,
                    hard_ratio:
                      assemblySettings.hard_ratio,
                  }
                : null,

            require_full_knowledge_coverage:
              assemblySettings
                .require_full_knowledge_coverage,

            algorithm:
              assemblySettings.algorithm,

            genetic_config:
              assemblySettings.algorithm
                === 'genetic'
                ? {
                    population_size:
                      assemblySettings
                        .population_size,
                    generations:
                      assemblySettings
                        .generations,
                    mutation_rate:
                      assemblySettings
                        .mutation_rate,
                    crossover_rate:
                      assemblySettings
                        .crossover_rate,
                    knowledge_weight:
                      assemblySettings
                        .knowledge_weight,
                    difficulty_weight:
                      assemblySettings
                        .difficulty_weight,
                    cognitive_weight:
                      assemblySettings
                        .cognitive_weight,
                  }
                : null,
          },
        },
      )

    assemblyResult.value = result
    successMessage.value = '智能组卷成功'
    showAssemblySettings.value = false

    await loadPaper()
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : '智能组卷失败'
  } finally {
    assembling.value = false
  }
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    choice: '选择题',
    fill_blank: '填空题',
    calculation: '计算题',
    short_answer: '简答题',
  }

  return labels[type] ?? type
}

function formatAnswer(
  answer: Record<string, unknown>,
) {
  if ('value' in answer) {
    return String(answer.value)
  }

  return JSON.stringify(answer)
}

async function printPaper(
  mode: 'none' | 'all',
) {
  answerMode.value = mode

  await loadPaper()
  await nextTick()

  window.print()
}

watch(answerMode, () => {
  loadPaper()
})

onMounted(() => {
  loadPaper()
})
</script>
<template>
  <div class="paper-detail-page">
    <header class="page-toolbar">
      <div>
        <NuxtLink
          to="/papers"
          class="back-link"
        >
          ← 返回试卷列表
        </NuxtLink>

        <h1>
          {{ paper?.title || '试卷详情' }}
        </h1>
      </div>

      <div class="toolbar-actions">
  <label class="answer-switch">
    <input
      v-model="answerMode"
      type="checkbox"
      true-value="all"
      false-value="none"
    >
    显示答案与解析
  </label>

  <button
    class="print-button"
    type="button"
    @click="printPaper('none')"
  >
    打印学生卷
  </button>

  <button
    class="print-button"
    type="button"
    @click="printPaper('all')"
  >
    打印答案卷
  </button>

  <NuxtLink
  class="edit-paper-button"
  :to="`/papers/${paperId}/edit`"
>
  编辑试卷信息
</NuxtLink>

  <button
    class="assemble-button"
    type="button"
    @click="
      showAssemblySettings =
        !showAssemblySettings
    "
  >
    {{
      showAssemblySettings
        ? '收起组卷设置'
        : '智能组卷设置'
    }}
  </button>
</div>
    </header>
    <section
  v-if="showAssemblySettings"
  class="assembly-settings"
>
  <header>
    <div>
      <h2>智能组卷参数</h2>
      <p>
        设置选题算法、难度梯度和适应度权重
      </p>
    </div>
  </header>

  <div class="settings-grid">
    <label class="setting-field">
      <span>组卷算法</span>
      <select
        v-model="assemblySettings.algorithm"
      >
        <option value="weighted_random">
          加权随机算法
        </option>
        <option value="genetic">
          遗传算法
        </option>
      </select>
    </label>

    <label class="checkbox-field">
      <input
        v-model="
          assemblySettings.replace_existing
        "
        type="checkbox"
      >
      <span>清空已有题目后重新组卷</span>
    </label>

    <label class="checkbox-field">
      <input
        v-model="
          assemblySettings
            .use_difficulty_gradient
        "
        type="checkbox"
      >
      <span>启用难度梯度</span>
    </label>
  </div>

  <div class="settings-group">
  <h3>
    知识点覆盖
    <small>
      已选择
      {{ selectedKnowledgePointIds.length }}
      项
    </small>
  </h3>

  <p
    v-if="loadingKnowledgePoints"
    class="knowledge-state"
  >
    正在加载知识点……
  </p>

  <p
    v-else-if="knowledgePoints.length === 0"
    class="knowledge-state"
  >
    当前课程还没有知识点
  </p>

  <div
    v-else
    class="knowledge-point-grid"
  >
    <label
      v-for="point in knowledgePoints"
      :key="point.id"
      class="knowledge-point-option"
    >
      <input
        v-model="
          selectedKnowledgePointIds
        "
        type="checkbox"
        :value="point.id"
      >
      <span>{{ point.name }}</span>
    </label>
  </div>

  <label class="checkbox-field">
    <input
      v-model="
        assemblySettings
          .require_full_knowledge_coverage
      "
      type="checkbox"
      :disabled="
        selectedKnowledgePointIds.length === 0
      "
    >
    <span>
      要求试卷必须覆盖全部已选知识点
    </span>
  </label>
</div>
  <div
    v-if="
      assemblySettings
        .use_difficulty_gradient
    "
    class="settings-group"
  >
    <h3>
      难度比例
      <small>
        当前合计：
        {{
          difficultyRatioTotal.toFixed(2)
        }}
      </small>
    </h3>

    <div class="settings-grid three-columns">
      <label class="setting-field">
        <span>简单题比例（0～0.3）</span>
        <input
          v-model.number="
            assemblySettings.easy_ratio
          "
          type="number"
          min="0"
          max="1"
          step="0.05"
        >
      </label>

      <label class="setting-field">
        <span>中等题比例（0.3～0.7）</span>
        <input
          v-model.number="
            assemblySettings.medium_ratio
          "
          type="number"
          min="0"
          max="1"
          step="0.05"
        >
      </label>

      <label class="setting-field">
        <span>较难题比例（0.7～1）</span>
        <input
          v-model.number="
            assemblySettings.hard_ratio
          "
          type="number"
          min="0"
          max="1"
          step="0.05"
        >
      </label>
    </div>
  </div>

  <div
    v-if="
      assemblySettings.algorithm === 'genetic'
    "
    class="settings-group"
  >
    <h3>遗传算法参数</h3>

    <div class="settings-grid">
      <label class="setting-field">
        <span>种群规模</span>
        <input
          v-model.number="
            assemblySettings.population_size
          "
          type="number"
          min="10"
          max="500"
        >
      </label>

      <label class="setting-field">
        <span>迭代代数</span>
        <input
          v-model.number="
            assemblySettings.generations
          "
          type="number"
          min="10"
          max="1000"
        >
      </label>

      <label class="setting-field">
        <span>变异概率</span>
        <input
          v-model.number="
            assemblySettings.mutation_rate
          "
          type="number"
          min="0"
          max="1"
          step="0.05"
        >
      </label>

      <label class="setting-field">
        <span>交叉概率</span>
        <input
          v-model.number="
            assemblySettings.crossover_rate
          "
          type="number"
          min="0"
          max="1"
          step="0.05"
        >
      </label>
    </div>

    <h3>
      适应度权重
      <small>
        当前合计：
        {{
          fitnessWeightTotal.toFixed(2)
        }}
      </small>
    </h3>

    <div class="settings-grid three-columns">
      <label class="setting-field">
        <span>知识点覆盖权重</span>
        <input
          v-model.number="
            assemblySettings.knowledge_weight
          "
          type="number"
          min="0"
          max="1"
          step="0.05"
        >
      </label>

      <label class="setting-field">
        <span>难度匹配权重</span>
        <input
          v-model.number="
            assemblySettings.difficulty_weight
          "
          type="number"
          min="0"
          max="1"
          step="0.05"
        >
      </label>

      <label class="setting-field">
        <span>认知维度权重</span>
        <input
          v-model.number="
            assemblySettings.cognitive_weight
          "
          type="number"
          min="0"
          max="1"
          step="0.05"
        >
      </label>
    </div>
  </div>

  <footer class="settings-actions">
    <button
      class="cancel-settings-button"
      type="button"
      @click="showAssemblySettings = false"
    >
      取消
    </button>

    <button
      class="run-assembly-button"
      type="button"
      :disabled="assembling"
      @click="autoAssemble"
    >
      {{
        assembling
          ? '正在组卷……'
          : '开始智能组卷'
      }}
    </button>
  </footer>
</section>

    <p
      v-if="successMessage"
      class="message success-message"
    >
      {{ successMessage }}
    </p>

    <p
      v-if="errorMessage"
      class="message error-message"
    >
      {{ errorMessage }}
    </p>

    <section
  v-if="assemblyResult"
  class="assembly-result"
>
  <header>
    <div>
      <h2>组卷结果</h2>
      <p>
        本次自动组卷已完成
      </p>
    </div>

    <strong class="coverage-rate">
      {{
        (
          Number(
            assemblyResult
              .knowledge_point_coverage_rate,
          ) * 100
        ).toFixed(0)
      }}%
      <small>知识点覆盖率</small>
    </strong>
  </header>

  <div class="result-summary">
    <div>
      <span>需要题目</span>
      <strong>
        {{ assemblyResult.total_required }}
      </strong>
    </div>

    <div>
      <span>本次新增</span>
      <strong>
        {{ assemblyResult.total_added }}
      </strong>
    </div>

    <div>
      <span>最终选入</span>
      <strong>
        {{ assemblyResult.total_selected }}
      </strong>
    </div>

    <div>
      <span>覆盖知识点</span>
      <strong>
        {{
          assemblyResult
            .covered_knowledge_point_count
        }}
        /
        {{
          assemblyResult
            .requested_knowledge_point_count
        }}
      </strong>
    </div>
  </div>

  <div class="section-result-list">
    <article
      v-for="
        section in assemblyResult.sections
      "
      :key="section.section_id"
    >
      <div>
        <strong>
          {{ section.section_title }}
        </strong>
        <span>
          {{ section.question_type || '综合题型' }}
        </span>
      </div>

      <p>
        需要 {{ section.required_count }} 题，
        已有 {{ section.existing_count }} 题，
        新增 {{ section.added_count }} 题，
        最终 {{ section.final_count }} 题
      </p>
    </article>
  </div>
</section>

    <div
      v-if="pending"
      class="state-box"
    >
      正在加载试卷……
    </div>

    <div
      v-else-if="!paper"
      class="state-box"
    >
      无法读取试卷
    </div>

    <main
      v-else
      class="paper-sheet"
    >
      <section class="paper-heading">
        <p class="school-name">
          {{ paper.school_name || '大学' }}
        </p>

        <h2>{{ paper.title }}</h2>

        <p class="paper-subtitle">
          {{ paper.academic_year || '--' }}
          学年
          {{ paper.semester || '--' }}
          ·
          {{ paper.exam_type || '考试' }}
        </p>

        <div class="paper-info-grid">
          <span>
            试卷类型：
            {{ paper.paper_variant || 'A' }}卷
          </span>
          <span>
            考试方式：
            {{ paper.exam_mode || '--' }}
          </span>
          <span>
            考试时间：
            {{ paper.duration_minutes || '--' }}
            分钟
          </span>
          <span>
            试卷总分：
            {{ paper.total_score }}分
          </span>
        </div>
      </section>

      <section
        v-if="paper.instructions"
        class="instructions-box"
      >
        <strong>考试说明：</strong>
        {{ paper.instructions }}
      </section>

<div class="paper-columns">
  <div class="paper-column left-column">
    <PaperSectionPreview
      v-for="section in leftSections"
      :key="section.id"
      :section="section"
    />

    <div
      v-if="leftSections.length === 0"
      class="empty-column"
    >
      左栏暂未配置大题
    </div>
  </div>

  <div class="paper-column right-column">
    <PaperSectionPreview
      v-for="section in rightSections"
      :key="section.id"
      :section="section"
    />

    <div
      v-if="rightSections.length === 0"
      class="empty-column"
    >
      右栏暂未配置大题
    </div>
  </div>
</div>
    </main>
  </div>
</template>
<style scoped>
.paper-detail-page {
  display: grid;
  gap: 20px;
}

.page-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.back-link {
  display: inline-block;
  margin-bottom: 10px;
  color: #2563eb;
  font-size: 14px;
  text-decoration: none;
}

.page-toolbar h1 {
  margin: 0;
  color: #0f172a;
  font-size: 30px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.answer-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  cursor: pointer;
}

.answer-switch input {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
}

.assemble-button {
  padding: 11px 17px;
  border: 0;
  border-radius: 12px;
  color: #fff;
  font: inherit;
  font-weight: 700;
  background: #2563eb;
  cursor: pointer;
}

.assemble-button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.assembly-settings {
  display: grid;
  gap: 22px;
  padding: 24px;
  border: 1px solid #bfdbfe;
  border-radius: 18px;
  background: #f8fbff;
  box-shadow: 0 14px 35px rgb(37 99 235 / 8%);
}

.assembly-settings > header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 21px;
}

.assembly-settings > header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.settings-group {
  display: grid;
  gap: 15px;
  padding-top: 18px;
  border-top: 1px solid #dbeafe;
}

.settings-group h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
  color: #1e293b;
  font-size: 16px;
}

.settings-group h3 small {
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.settings-grid.three-columns {
  grid-template-columns: repeat(3, 1fr);
}

.setting-field {
  display: grid;
  gap: 7px;
}

.setting-field span {
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.setting-field input,
.setting-field select {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 11px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  outline: none;
  color: #0f172a;
  background: #fff;
  font: inherit;
}

.setting-field input:focus,
.setting-field select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgb(59 130 246 / 12%);
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid #dbe3ee;
  border-radius: 10px;
  color: #475569;
  background: #fff;
  cursor: pointer;
}

.checkbox-field input {
  width: 17px;
  height: 17px;
  accent-color: #2563eb;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-settings-button,
.run-assembly-button {
  padding: 11px 17px;
  border: 0;
  border-radius: 11px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.cancel-settings-button {
  color: #475569;
  background: #e2e8f0;
}

.run-assembly-button {
  color: #fff;
  background: #2563eb;
}

.run-assembly-button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.message {
  margin: 0;
  padding: 12px 16px;
  border-radius: 12px;
}

.success-message {
  color: #166534;
  background: #dcfce7;
}

.error-message {
  color: #b91c1c;
  background: #fee2e2;
}

.state-box {
  padding: 60px 20px;
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  color: #64748b;
  text-align: center;
  background: #fff;
}

.paper-sheet {
  padding: 42px;
  border: 1px solid #dbe3ee;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 18px 45px rgb(15 23 42 / 7%);
}

.paper-heading {
  padding-bottom: 24px;
  border-bottom: 2px solid #0f172a;
  text-align: center;
}

.school-name {
  margin: 0 0 8px;
  color: #475569;
  font-size: 18px;
}

.paper-heading h2 {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
}

.paper-subtitle {
  margin: 10px 0 18px;
  color: #64748b;
}

.paper-info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  color: #334155;
  background: #f1f5f9;
  font-size: 14px;
}

.instructions-box {
  margin-top: 24px;
  padding: 14px 16px;
  border-left: 4px solid #2563eb;
  color: #334155;
  background: #eff6ff;
}

.question-section {
  margin-top: 32px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #cbd5e1;
}

.section-heading h3 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
}

.section-heading p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.section-heading > span {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 13px;
}

.question-card {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 8px;
  padding: 22px 0;
  border-bottom: 1px dashed #dbe3ee;
}

.question-number {
  color: #0f172a;
  font-weight: 800;
}

.question-content {
  min-width: 0;
}

.question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.question-meta span {
  padding: 3px 8px;
  border-radius: 999px;
  color: #1d4ed8;
  background: #dbeafe;
  font-size: 12px;
}

.question-stem {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  line-height: 1.8;
}

.latex-source {
  display: block;
  margin-top: 12px;
  padding: 10px 12px;
  overflow-x: auto;
  border-radius: 10px;
  color: #334155;
  background: #f8fafc;
}

.option-list {
  display: grid;
  gap: 8px;
  margin: 16px 0 0;
  padding-left: 22px;
  color: #334155;
}

.answer-box,
.analysis-box {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  line-height: 1.7;
}

.answer-box {
  color: #166534;
  background: #dcfce7;
}

.analysis-box {
  color: #713f12;
  background: #fef3c7;
}

.empty-questions {
  margin-top: 16px;
  padding: 24px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #94a3b8;
  text-align: center;
}
.question-formula {
  margin-top: 12px;
}
.knowledge-point-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  max-height: 240px;
  padding: 4px;
  overflow-y: auto;
}

.knowledge-point-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 11px;
  border: 1px solid #dbe3ee;
  border-radius: 10px;
  color: #475569;
  background: #fff;
  cursor: pointer;
}

.knowledge-point-option:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.knowledge-point-option input {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
}

.knowledge-state {
  margin: 0;
  padding: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  color: #64748b;
  text-align: center;
}
.assembly-result {
  display: grid;
  gap: 18px;
  padding: 22px;
  border: 1px solid #bbf7d0;
  border-radius: 18px;
  background: #f0fdf4;
}

.assembly-result > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.assembly-result h2 {
  margin: 0;
  color: #14532d;
  font-size: 20px;
}

.assembly-result header p {
  margin: 5px 0 0;
  color: #4d7c5d;
  font-size: 13px;
}

.coverage-rate {
  display: grid;
  color: #15803d;
  font-size: 26px;
  text-align: right;
}

.coverage-rate small {
  color: #4d7c5d;
  font-size: 11px;
}

.result-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.result-summary > div {
  display: grid;
  gap: 5px;
  padding: 13px;
  border-radius: 11px;
  background: #fff;
}

.result-summary span {
  color: #64748b;
  font-size: 12px;
}

.result-summary strong {
  color: #166534;
  font-size: 20px;
}

.section-result-list {
  display: grid;
  gap: 9px;
}

.section-result-list article {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 11px 13px;
  border-radius: 10px;
  background: #fff;
}

.section-result-list article > div {
  display: grid;
  gap: 3px;
}

.section-result-list article span,
.section-result-list article p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.paper-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 34px;
  margin-top: 28px;
}

.paper-column {
  display: grid;
  align-content: start;
  gap: 30px;
  min-width: 0;
}

.right-column {
  padding-left: 34px;
  border-left: 1px solid #94a3b8;
}

.empty-column {
  padding: 30px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #94a3b8;
  text-align: center;
}

@media (max-width: 900px) {
  .paper-columns {
  grid-template-columns: 1fr;
}

.right-column {
  padding-top: 28px;
  padding-left: 0;
  border-top: 1px solid #94a3b8;
  border-left: 0;
}
  .result-summary {
  grid-template-columns: repeat(2, 1fr);
}

.section-result-list article {
  align-items: flex-start;
  flex-direction: column;
}
  .knowledge-point-grid {
  grid-template-columns: 1fr;
  }
  .page-toolbar,
  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .paper-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .paper-sheet {
    padding: 24px;
  }
  .settings-grid,
.settings-grid.three-columns {
  grid-template-columns: 1fr;
 }
}

@media (max-width: 600px) {
  .toolbar-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .paper-info-grid {
    grid-template-columns: 1fr;
  }

  .question-card {
    grid-template-columns: 26px 1fr;
  }
}

.exam-paper-header {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 2px solid #17233c;
  color: #111827;
  text-align: center;
}

.exam-school-name {
  margin: 0 0 6px;
  font-size: 18px;
  letter-spacing: 4px;
}

.exam-paper-title {
  margin: 0;
  font-family: "SimSun", "宋体", serif;
  font-size: 30px;
  line-height: 1.35;
}

.exam-paper-subtitle {
  margin: 8px 0 18px;
  font-size: 15px;
}

.exam-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid #64748b;
  font-size: 14px;
  text-align: left;
}

.student-info-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  margin-top: 14px;
  font-size: 14px;
  text-align: left;
}

.exam-instructions {
  margin: 16px 0 0;
  padding: 10px 14px;
  border-left: 4px solid #17233c;
  background: #f8fafc;
  font-size: 14px;
  line-height: 1.7;
  text-align: left;
}

.edit-paper-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border: 1px solid #2563eb;
  border-radius: 10px;
  color: #2563eb;
  background: #fff;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

.edit-paper-button:hover {
  color: #fff;
  background: #2563eb;
}

@page {
  size: 420mm 297mm;
  margin: 10mm;
}

@media print {
    :global(html),
  :global(body),
  :global(#__nuxt),
  :global(.app-shell) {
    display: block !important;
    width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  :global(.app-shell) {
    grid-template-columns: none !important;
  }

  :global(.workspace),
  :global(.page-content) {
    display: block !important;
    width: 100% !important;
    max-width: none !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .paper-detail-page,
  .paper-preview,
  .paper-sheet {
    width: 100% !important;
    max-width: none !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .back-link,
  .page-header,
  .preview-actions,
  .answer-controls,
  .assembly-settings,
  .assembly-result {
    display: none !important;
  }
  :global(.sidebar),
  :global(.topbar) {
    display: none !important;
  }

  :global(.workspace),
  :global(.page-content) {
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .paper-toolbar,
  .assembly-settings,
  .assembly-result,
  .error-message,
  .success-message,
  button {
    display: none !important;
  }

  .paper-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 12mm;
  }

  .right-column {
    padding-left: 12mm;
    border-left: 1px solid #000;
  }

  * {
    box-shadow: none !important;
  }
}
</style>