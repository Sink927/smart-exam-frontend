<script setup lang="ts">
import type {
  QuestionVersion,
} from '~/types/question'

const api = useApi()
const route = useRoute()

const questionId = computed(() => {
  return String(route.params.id)
})

const restoringVersion = ref<number | null>(null)
const actionMessage = ref('')
const actionError = ref('')

const {
  data: versions,
  pending,
  error: loadError,
  refresh: refreshVersions,
} = await useAsyncData<QuestionVersion[]>(
  `question-versions-${questionId.value}`,
  () => api<QuestionVersion[]>(
    `/api/v1/questions/${questionId.value}/versions`,
  ),
  {
    default: () => [],
  },
)

const latestSnapshot = computed(() => {
  return versions.value[0]?.snapshot || null
})

function getChangeTypeName(changeType: string) {
  const names: Record<string, string> = {
    created: '创建试题',
    updated: '修改试题',
    deleted: '删除试题',
    restored: '恢复版本',
  }

  return names[changeType] || changeType
}

function getAnswerText(version: QuestionVersion) {
  const value = version.snapshot.standard_answer?.value

  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return String(value)
  }

  return JSON.stringify(
    version.snapshot.standard_answer,
  )
}

async function restoreVersion(versionNumber: number) {
  actionMessage.value = ''
  actionError.value = ''

  const confirmed = window.confirm(
    `确定要将试题恢复到版本 V${versionNumber} 吗？`,
  )

  if (!confirmed) {
    return
  }

  restoringVersion.value = versionNumber

  try {
    await api(
      `/api/v1/questions/${questionId.value}/restore`,
      {
        method: 'POST',
        body: {
          version: versionNumber,
        },
      },
    )

    actionMessage.value =
      `已成功恢复到版本 V${versionNumber}`

    await refreshVersions()
  } catch (error: any) {
    actionError.value =
      error?.data?.detail ||
      error?.response?._data?.detail ||
      '恢复历史版本失败'
  } finally {
    restoringVersion.value = null
  }
}
</script>

<template>
  <div class="version-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">VERSION HISTORY</p>
        <h1>试题版本历史</h1>

        <p v-if="latestSnapshot" class="subtitle">
          {{ latestSnapshot.stem }}
        </p>
      </div>

      <NuxtLink class="back-link" to="/questions">
        返回试题列表
      </NuxtLink>
    </header>

    <p v-if="actionMessage" class="success-message">
      {{ actionMessage }}
    </p>

    <p v-if="actionError" class="error-message">
      {{ actionError }}
    </p>

    <section v-if="pending" class="panel status-panel">
      正在加载版本记录……
    </section>

    <section v-else-if="loadError" class="panel error-message">
      版本记录加载失败，请检查后端接口。
    </section>

    <section
      v-else-if="versions.length === 0"
      class="panel empty-state"
    >
      当前试题没有版本记录。
    </section>

    <div v-else class="timeline">
      <article
        v-for="version in versions"
        :key="version.id"
        class="version-card"
      >
        <div class="timeline-marker">
          V{{ version.version }}
        </div>

        <div class="version-content">
          <div class="version-header">
            <div>
              <span class="change-tag">
                {{ getChangeTypeName(version.change_type) }}
              </span>

              <span class="version-time">
                {{
                  new Date(
                    version.created_at,
                  ).toLocaleString('zh-CN')
                }}
              </span>
            </div>

            <button
              v-if="
                version.version !==
                  latestSnapshot?.version
              "
              class="restore-button"
              type="button"
              :disabled="
                restoringVersion === version.version
              "
              @click="restoreVersion(version.version)"
            >
              {{
                restoringVersion === version.version
                  ? '恢复中...'
                  : `恢复到 V${version.version}`
              }}
            </button>
          </div>

          <h2>{{ version.snapshot.stem }}</h2>

          <div
  v-if="version.snapshot.latex_source"
  class="formula-block"
>
  <LatexRenderer
    :source="version.snapshot.latex_source"
    :display-mode="true"
  />

  <details class="source-details">
    <summary>查看该版本的 LaTeX 源码</summary>

    <pre class="latex-source">{{
      version.snapshot.latex_source
    }}</pre>
  </details>
</div>

          <div
            v-if="version.snapshot.options.length > 0"
            class="option-list"
          >
            <div
              v-for="option in version.snapshot.options"
              :key="option.key"
              class="option-item"
            >
              <strong>{{ option.key }}.</strong>
              <span>{{ option.content }}</span>
            </div>
          </div>

          <details class="version-details">
            <summary>查看该版本的完整信息</summary>

            <div class="details-content">
              <p>
                <strong>标准答案：</strong>
                {{ getAnswerText(version) }}
              </p>

              <p>
                <strong>详细解析：</strong>
                {{
                  version.snapshot.analysis ||
                  '暂无解析'
                }}
              </p>

              <p>
                <strong>题型：</strong>
                {{ version.snapshot.question_type }}
              </p>

              <p>
                <strong>难度：</strong>
                {{
                  version.snapshot.difficulty ??
                  '未设置'
                }}
              </p>

              <p>
                <strong>认知维度：</strong>
                {{
                  version.snapshot.cognitive_level ||
                  '未设置'
                }}
              </p>

              <p>
                <strong>命题来源：</strong>
                {{
                  version.snapshot.source ||
                  '未设置'
                }}
              </p>

              <p>
                <strong>状态：</strong>
                {{ version.snapshot.status }}
              </p>
            </div>
          </details>
        </div>
      </article>
    </div>
  </div>
</template>
<style scoped>
.version-page {
  display: grid;
  gap: 24px;
}

.page-header,
.version-header {
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
  max-width: 900px;
  margin: 0;
  color: #718096;
  line-height: 1.6;
}

.back-link {
  flex: 0 0 auto;
  padding: 10px 16px;
  border-radius: 9px;
  color: #2563eb;
  background: #eaf2ff;
  font-weight: 700;
  text-decoration: none;
}

.panel {
  padding: 24px;
  border: 1px solid #e3e9f2;
  border-radius: 16px;
  background: white;
}

.status-panel,
.empty-state {
  color: #718096;
  text-align: center;
}

.timeline {
  position: relative;
  display: grid;
  gap: 20px;
}

.timeline::before {
  position: absolute;
  top: 28px;
  bottom: 28px;
  left: 34px;
  width: 2px;
  background: #dbeafe;
  content: '';
}

.version-card {
  position: relative;
  display: grid;
  grid-template-columns: 70px 1fr;
  gap: 18px;
}

.timeline-marker {
  z-index: 1;
  display: grid;
  width: 68px;
  height: 68px;
  place-items: center;
  border: 5px solid #eff6ff;
  border-radius: 50%;
  color: white;
  background: #2563eb;
  font-weight: 800;
  box-sizing: border-box;
}

.version-content {
  min-width: 0;
  padding: 22px;
  border: 1px solid #e3e9f2;
  border-radius: 15px;
  background: white;
}

.version-header > div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.change-tag {
  padding: 5px 10px;
  border-radius: 7px;
  color: #7c3aed;
  background: #ede9fe;
  font-size: 13px;
  font-weight: 700;
}

.version-time {
  color: #718096;
  font-size: 14px;
}

.restore-button {
  padding: 9px 14px;
  border: 0;
  border-radius: 8px;
  color: #2563eb;
  background: #dbeafe;
  cursor: pointer;
  font-weight: 700;
}

.restore-button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.version-content h2 {
  margin: 18px 0 12px;
  color: #17233c;
  font-size: 18px;
  line-height: 1.7;
}

.formula-block {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.source-details summary {
  color: #2563eb;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
}

.latex-source {
  overflow-x: auto;
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
    minmax(190px, 1fr)
  );
  gap: 10px;
  margin-top: 15px;
}

.option-item {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #e3e9f2;
  border-radius: 9px;
  color: #475569;
}

.version-details {
  margin-top: 18px;
  border-top: 1px solid #e3e9f2;
}

.version-details summary {
  padding-top: 15px;
  color: #2563eb;
  cursor: pointer;
  font-weight: 700;
}

.details-content {
  margin-top: 14px;
  padding: 15px;
  border-radius: 10px;
  color: #475569;
  background: #f8fafc;
  line-height: 1.7;
}

.details-content p {
  margin: 6px 0;
}

.success-message,
.error-message {
  margin: 0;
  padding: 13px 15px;
  border-radius: 9px;
}

.success-message {
  color: #15803d;
  background: #dcfce7;
}

.error-message {
  color: #dc2626;
  background: #fee2e2;
}

@media (max-width: 700px) {
  .page-header,
  .version-header {
    align-items: stretch;
    flex-direction: column;
  }

  .timeline::before {
    display: none;
  }

  .version-card {
    grid-template-columns: 1fr;
  }

  .timeline-marker {
    width: 58px;
    height: 58px;
  }

  .option-list {
    grid-template-columns: 1fr;
  }
}
</style>