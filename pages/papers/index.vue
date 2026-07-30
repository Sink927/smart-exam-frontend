<script setup lang="ts">
definePageMeta({
  title: '创建试卷',
})
type PaperSection = {
  id: string
  title: string
  question_type: string | null
  question_count: number
  score_per_question: string
  subtotal: string
}

type ExamPaper = {
  id: string
  course_id: string
  template_id: string | null
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
  created_at: string
  sections: PaperSection[]
}

const config = useRuntimeConfig()

const {
  data: papers,
  pending,
  error,
  refresh,
} = await useFetch<ExamPaper[]>(
  '/api/v1/exam-papers',
  {
    baseURL: config.public.apiBase,
    default: () => [],
  },
)

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  ).format(new Date(value))
}

function getQuestionCount(
  sections: PaperSection[],
) {
  return sections.reduce(
    (total, section) =>
      total + section.question_count,
    0,
  )
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: '草稿',
    assembled: '已组卷',
    published: '已发布',
    archived: '已归档',
  }

  return labels[status] ?? status
}

function openPaper(paperId: string) {
  return navigateTo(
    `/papers/${paperId}`,
  )
}

function createPaper() {
  return navigateTo('/papers/create')
}
</script>
<template>
  <div class="papers-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">
          EXAM PAPER MANAGEMENT
        </p>
        <h1>智能组卷</h1>
        <p class="subtitle">
          创建、自动组卷并预览试卷
        </p>
      </div>

      <div class="header-actions">
        <button
          class="secondary-button"
          type="button"
          @click="refresh()"
        >
          刷新列表
        </button>

        <button
          class="primary-button"
          type="button"
          @click="createPaper"
        >
          ＋ 创建试卷
        </button>
      </div>
    </header>

    <section class="summary-grid">
      <article class="summary-card">
        <span>试卷数量</span>
        <strong>{{ papers.length }}</strong>
        <small>系统中的全部试卷</small>
      </article>

      <article class="summary-card">
        <span>草稿试卷</span>
        <strong>
          {{
            papers.filter(
              paper => paper.status === 'draft',
            ).length
          }}
        </strong>
        <small>可以继续组卷和编辑</small>
      </article>

      <article class="summary-card">
        <span>已组卷试卷</span>
        <strong>
          {{
            papers.filter(
              paper =>
                paper.status === 'assembled',
            ).length
          }}
        </strong>
        <small>可以预览和导出</small>
      </article>
    </section>

    <section class="papers-panel">
      <div class="panel-heading">
        <div>
          <h2>试卷列表</h2>
          <p>查看试卷结构和组卷状态</p>
        </div>
      </div>

      <div
        v-if="pending"
        class="state-box"
      >
        正在加载试卷……
      </div>

      <div
        v-else-if="error"
        class="state-box error-state"
      >
        <strong>试卷加载失败</strong>
        <span>{{ error.message }}</span>
        <button
          type="button"
          @click="refresh()"
        >
          重新加载
        </button>
      </div>

      <div
        v-else-if="papers.length === 0"
        class="state-box empty-state"
      >
        <strong>还没有试卷</strong>
        <span>
          点击“创建试卷”建立第一张试卷
        </span>
      </div>

      <div
        v-else
        class="paper-list"
      >
        <article
          v-for="paper in papers"
          :key="paper.id"
          class="paper-card"
        >
          <div class="paper-main">
            <div class="paper-title-row">
              <span
                class="status-badge"
                :class="`status-${paper.status}`"
              >
                {{ getStatusLabel(paper.status) }}
              </span>

              <span class="variant-badge">
                {{ paper.paper_variant || 'A' }}卷
              </span>
            </div>

            <h3>{{ paper.title }}</h3>

            <p class="paper-meta">
              {{
                paper.academic_year
                  || '未设置学年'
              }}
              ·
              {{
                paper.semester
                  || '未设置学期'
              }}
              ·
              {{
                paper.exam_mode
                  || '未设置考试方式'
              }}
            </p>

            <div class="paper-stat-row">
              <span>
                <b>
                  {{
                    getQuestionCount(
                      paper.sections,
                    )
                  }}
                </b>
                道题
              </span>

              <span>
                <b>{{ paper.total_score }}</b>
                分
              </span>

              <span>
                <b>
                  {{
                    paper.duration_minutes
                      || '--'
                  }}
                </b>
                分钟
              </span>

              <span>
                {{ formatDate(paper.created_at) }}
              </span>
            </div>
          </div>

          <button
            class="detail-button"
            type="button"
            @click="openPaper(paper.id)"
          >
            查看与组卷
            <span>→</span>
          </button>
        </article>
      </div>
    </section>
  </div>
</template>
<style scoped>
.papers-page {
  display: grid;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 30px;
  border-radius: 24px;
  color: #fff;
  background:
    linear-gradient(
      135deg,
      #173579,
      #2463e8
    );
}

.eyebrow {
  margin: 0 0 8px;
  color: #bfe0ff;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.page-header h1 {
  margin: 0;
  font-size: 34px;
}

.subtitle {
  margin: 10px 0 0;
  color: #dbeafe;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.primary-button,
.secondary-button,
.detail-button {
  border: 0;
  border-radius: 12px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.primary-button:hover,
.secondary-button:hover,
.detail-button:hover {
  transform: translateY(-2px);
}

.primary-button {
  padding: 12px 18px;
  color: #1851d8;
  background: #fff;
}

.secondary-button {
  padding: 12px 18px;
  color: #fff;
  background: rgb(255 255 255 / 14%);
  border: 1px solid rgb(255 255 255 / 30%);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.summary-card {
  display: grid;
  gap: 8px;
  padding: 22px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 12px 30px rgb(15 23 42 / 5%);
}

.summary-card span {
  color: #64748b;
  font-size: 14px;
}

.summary-card strong {
  color: #0f172a;
  font-size: 32px;
}

.summary-card small {
  color: #94a3b8;
}

.papers-panel {
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #fff;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.panel-heading h2 {
  margin: 0;
  color: #0f172a;
}

.panel-heading p {
  margin: 6px 0 0;
  color: #94a3b8;
}

.paper-list {
  display: grid;
  gap: 14px;
}

.paper-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
}

.paper-card:hover {
  border-color: #93c5fd;
  background: #fafdff;
}

.paper-main {
  min-width: 0;
}

.paper-title-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.status-badge,
.variant-badge {
  display: inline-flex;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-draft {
  color: #92400e;
  background: #fef3c7;
}

.status-assembled,
.status-published {
  color: #166534;
  background: #dcfce7;
}

.status-archived {
  color: #475569;
  background: #e2e8f0;
}

.variant-badge {
  color: #1d4ed8;
  background: #dbeafe;
}

.paper-card h3 {
  margin: 0;
  overflow: hidden;
  color: #0f172a;
  font-size: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paper-meta {
  margin: 8px 0 14px;
  color: #64748b;
  font-size: 14px;
}

.paper-stat-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  color: #64748b;
  font-size: 13px;
}

.paper-stat-row b {
  color: #0f172a;
  font-size: 15px;
}

.detail-button {
  flex: 0 0 auto;
  padding: 11px 15px;
  color: #1d4ed8;
  background: #dbeafe;
}

.detail-button span {
  margin-left: 8px;
}

.state-box {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 56px 20px;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  color: #64748b;
  text-align: center;
}

.error-state {
  color: #b91c1c;
  background: #fff7f7;
}

.state-box button {
  margin-top: 8px;
  padding: 9px 14px;
  border: 0;
  border-radius: 10px;
  color: #fff;
  background: #2563eb;
  cursor: pointer;
}

@media (max-width: 900px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .paper-card {
    align-items: stretch;
    flex-direction: column;
  }

  .detail-button {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .header-actions {
    flex-direction: column;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }

  .paper-stat-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>