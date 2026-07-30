<script setup lang="ts">
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

defineProps<{
  section: PaperSection
}>()

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    choice: '选择题',
    fill_blank: '填空题',
    calculation: '计算题',
    short_answer: '简答与证明题',
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
function hasInlineFormula(
  snapshot: QuestionSnapshot,
) {
  return Boolean(
    snapshot.latex_source
    && snapshot.stem.includes('{{formula}}'),
  )
}

function getStemParts(
  snapshot: QuestionSnapshot,
) {
  const [before = '', after = ''] =
    snapshot.stem.split('{{formula}}', 2)

  return {
    before,
    after,
  }
}

function getInlineFormulaSource(
  snapshot: QuestionSnapshot,
) {
  if (!snapshot.latex_source) {
    return ''
  }

  return String.raw`\displaystyle ${snapshot.latex_source}`
}
</script>
<template>
  <section class="question-section">
    <header class="section-heading">
      <div>
        <h3>{{ section.title }}</h3>
        <p v-if="section.instructions">
          {{ section.instructions }}
        </p>
      </div>

      <span>
        共{{ section.question_count }}题，
        每题{{ section.score_per_question }}分，
        共{{ section.subtotal }}分
      </span>
    </header>

    <div
      v-if="section.questions.length === 0"
      class="empty-questions"
    >
      该大题暂未选择试题
    </div>

    <article
      v-for="paperQuestion in section.questions"
      :key="paperQuestion.id"
      class="question-card"
    >
      <div class="question-number">
        {{ paperQuestion.order_index }}.
      </div>

      <div class="question-content">
        <div class="question-meta">
          <span>
            {{
              getTypeLabel(
                paperQuestion
                  .question_snapshot
                  .question_type,
              )
            }}
          </span>
          <span>
            {{ paperQuestion.score }}分
          </span>
          <span>
            难度：
            {{
              paperQuestion
                .question_snapshot
                .difficulty
                || '--'
            }}
          </span>
        </div>

        <div class="question-stem">
  <template
    v-if="
      hasInlineFormula(
        paperQuestion.question_snapshot,
      )
    "
  >
    <span>
      {{
        getStemParts(
          paperQuestion.question_snapshot,
        ).before
      }}
    </span>

    <LatexRenderer
      class="question-inline-formula"
      :source="
        getInlineFormulaSource(
          paperQuestion.question_snapshot,
        )
      "
      :display-mode="false"
    />

    <span>
      {{
        getStemParts(
          paperQuestion.question_snapshot,
        ).after
      }}
    </span>
  </template>

  <template v-else>
    {{
      paperQuestion
        .question_snapshot
        .stem
    }}
  </template>
</div>

<LatexRenderer
  v-if="
    paperQuestion
      .question_snapshot
      .latex_source
    && !hasInlineFormula(
      paperQuestion.question_snapshot,
    )
  "
  class="question-formula"
  :source="
    paperQuestion
      .question_snapshot
      .latex_source
  "
  :display-mode="true"
/>

        <ol
          v-if="
            paperQuestion
              .question_snapshot
              .options?.length
          "
          class="option-list"
        >
          <li
            v-for="(
              option,
              optionIndex
            ) in paperQuestion
              .question_snapshot.options"
            :key="
              option.key || optionIndex
            "
          >
            <b>
              {{
                option.key
                  || String.fromCharCode(
                    65 + optionIndex,
                  )
              }}.
            </b>
            {{ option.content }}
          </li>
        </ol>

        <div
          v-if="
            paperQuestion
              .question_snapshot
              .standard_answer
          "
          class="answer-box"
        >
          <strong>标准答案：</strong>
          {{
            formatAnswer(
              paperQuestion
                .question_snapshot
                .standard_answer,
            )
          }}
        </div>

        <div
          v-if="
            paperQuestion
              .question_snapshot
              .analysis
          "
          class="analysis-box"
        >
          <strong>解析：</strong>
          {{
            paperQuestion
              .question_snapshot
              .analysis
          }}
        </div>
      </div>
    </article>
  </section>
</template>
<style scoped>
.question-section {
  min-width: 0;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #94a3b8;
}

.section-heading h3 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
}

.section-heading p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 12px;
}

.section-heading > span {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 12px;
}

.question-card {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 6px;
  padding: 18px 0;
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
  gap: 6px;
  margin-bottom: 8px;
}

.question-meta span {
  padding: 2px 7px;
  border-radius: 999px;
  color: #1d4ed8;
  background: #dbeafe;
  font-size: 11px;
}

.question-stem {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  line-height: 1.75;
}

.question-inline-formula {
  display: inline-flex;
  align-items: center;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow: visible;
  border: 0;
  background: transparent;
}

.question-formula {
  margin-top: 10px;
}

.option-list {
  display: grid;
  gap: 7px;
  margin: 14px 0 0;
  padding-left: 20px;
  color: #334155;
}

.answer-box,
.analysis-box {
  margin-top: 13px;
  padding: 10px 12px;
  border-radius: 9px;
  font-size: 14px;
  line-height: 1.65;
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
  margin-top: 14px;
  padding: 20px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  color: #94a3b8;
  text-align: center;
}

@media print {
  .question-section,
  .question-card,
  .answer-box,
  .analysis-box {
    break-inside: avoid;
  }

  .question-meta {
    display: none;
  }
}
</style>