<script setup lang="ts">
import type { KnowledgePoint } from '~/types/knowledge-point'

const api = useApi()

const importing = ref(false)
const importError = ref('')
const importResult = ref<unknown>(null)

const {
  data: knowledgePoints,
} = await useAsyncData<KnowledgePoint[]>(
  'batch-import-knowledge-points',
  () => api<KnowledgePoint[]>('/api/v1/knowledge-points'),
  {
    default: () => [],
  },
)

const sampleData = {
  questions: [
    {
      question_type: 'choice',
      stem: '函数 f(x)=x² 在 x=2 处的导数值是多少？',
      latex_source: "f(x)=x^2,\\quad f'(2)=?",
      options: [
        {
          key: 'A',
          content: '2',
        },
        {
          key: 'B',
          content: '4',
        },
        {
          key: 'C',
          content: '6',
        },
        {
          key: 'D',
          content: '8',
        },
      ],
      standard_answer: {
        value: 'B',
      },
      analysis: "因为 f'(x)=2x，所以 f'(2)=4。",
      difficulty: 0.3,
      cognitive_level: 'apply',
      source: '批量导入测试题',
      metadata: {
        language: 'zh-CN',
        import_method: 'batch-web',
      },
      knowledge_point_ids: [],
    },
  ],
}

const jsonText = ref(
  JSON.stringify(sampleData, null, 2),
)

const importedResultText = computed(() => {
  if (importResult.value === null) {
    return ''
  }

  return JSON.stringify(
    importResult.value,
    null,
    2,
  )
})

function formatJson() {
  importError.value = ''

  try {
    const parsed = JSON.parse(jsonText.value)
    jsonText.value = JSON.stringify(parsed, null, 2)
  } catch (error) {
    importError.value =
      error instanceof Error
        ? `JSON 格式错误：${error.message}`
        : 'JSON 格式错误'
  }
}

function loadSample() {
  importError.value = ''
  importResult.value = null
  jsonText.value = JSON.stringify(sampleData, null, 2)
}

async function handleFile(event: Event) {
  importError.value = ''
  importResult.value = null

  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  if (
    !file.name.toLowerCase().endsWith('.json')
  ) {
    importError.value = '目前仅支持上传 .json 文件'
    input.value = ''
    return
  }

  try {
    jsonText.value = await file.text()
    formatJson()
  } catch {
    importError.value = '无法读取所选文件'
  } finally {
    input.value = ''
  }
}

async function importQuestions() {
  importError.value = ''
  importResult.value = null

  let payload: unknown

  try {
    payload = JSON.parse(jsonText.value)
  } catch (error) {
    importError.value =
      error instanceof Error
        ? `JSON 格式错误：${error.message}`
        : 'JSON 格式错误'
    return
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('questions' in payload) ||
    !Array.isArray(payload.questions) ||
    payload.questions.length === 0
  ) {
    importError.value =
      'JSON 必须包含非空的 questions 数组'
    return
  }

  importing.value = true

  try {
    importResult.value = await api<unknown>(
      '/api/v1/questions/batch',
      {
        method: 'POST',
        body: payload,
      },
    )
  } catch (error: any) {
    importError.value =
      error?.data?.detail
        ? JSON.stringify(error.data.detail, null, 2)
        : error?.response?._data?.detail
          ? JSON.stringify(
              error.response._data.detail,
              null,
              2,
            )
          : '批量导入失败，请检查试题字段和知识点ID'
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div class="batch-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">BATCH IMPORT</p>
        <h1>批量导入试题</h1>
        <p class="subtitle">
          粘贴标准 JSON 或上传 JSON 文件批量创建试题
        </p>
      </div>

      <NuxtLink class="back-link" to="/questions">
        返回试题列表
      </NuxtLink>
    </header>

    <section class="notice-panel">
      <strong>导入说明</strong>

      <ul>
        <li>
          JSON 最外层必须包含 questions 数组。
        </li>
        <li>
          每道试题必须至少关联一个有效知识点 ID。
        </li>
        <li>
          LaTeX 中的反斜杠需要写成两个反斜杠。
        </li>
        <li>
          建议先导入少量试题，确认无误后再批量操作。
        </li>
      </ul>
    </section>

    <div class="workspace">
      <section class="panel editor-panel">
        <div class="section-header">
          <div>
            <h2>JSON 数据</h2>
            <p>可以直接编辑或粘贴试题数据</p>
          </div>

          <div class="editor-actions">
            <label class="file-button">
              上传 JSON

              <input
                type="file"
                accept=".json,application/json"
                @change="handleFile"
              >
            </label>

            <button
              class="secondary-button"
              type="button"
              @click="formatJson"
            >
              格式化
            </button>

            <button
              class="secondary-button"
              type="button"
              @click="loadSample"
            >
              加载示例
            </button>
          </div>
        </div>

        <textarea
          v-model="jsonText"
          class="json-editor"
          spellcheck="false"
          aria-label="批量导入 JSON"
        />

        <p v-if="importError" class="error-message">
          {{ importError }}
        </p>

        <button
          class="import-button"
          type="button"
          :disabled="importing"
          @click="importQuestions"
        >
          {{
            importing
              ? '正在导入...'
              : '开始批量导入'
          }}
        </button>
      </section>

      <aside class="panel reference-panel">
        <h2>知识点 ID 参考</h2>

        <p class="reference-tip">
          将对应 ID 填入每道试题的
          knowledge_point_ids 数组。
        </p>

        <div
          v-if="knowledgePoints.length === 0"
          class="empty-reference"
        >
          暂无知识点。
        </div>

        <div v-else class="point-list">
          <article
            v-for="point in knowledgePoints"
            :key="point.id"
            class="point-item"
          >
            <strong>{{ point.name }}</strong>

            <code>{{ point.id }}</code>

            <small>
              {{ point.description || '暂无说明' }}
            </small>
          </article>
        </div>
      </aside>
    </div>

    <section
      v-if="importResult !== null"
      class="panel result-panel"
    >
      <div class="result-header">
        <div>
          <h2>导入成功</h2>
          <p>服务器已返回以下结果</p>
        </div>

        <NuxtLink class="view-link" to="/questions">
          查看试题列表
        </NuxtLink>
      </div>

      <pre class="result-json">{{
        importedResultText
      }}</pre>
    </section>
  </div>
</template>
<style scoped>
.batch-page {
  display: grid;
  gap: 24px;
}

.page-header,
.section-header,
.result-header {
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
.view-link {
  padding: 10px 16px;
  border-radius: 9px;
  color: #2563eb;
  background: #eaf2ff;
  font-weight: 700;
  text-decoration: none;
}

.notice-panel {
  padding: 18px 22px;
  border: 1px solid #fde68a;
  border-radius: 14px;
  color: #92400e;
  background: #fffbeb;
}

.notice-panel ul {
  margin: 10px 0 0;
  padding-left: 20px;
  line-height: 1.8;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 20px;
  align-items: start;
}

.panel {
  padding: 24px;
  border: 1px solid #e3e9f2;
  border-radius: 18px;
  background: white;
}

.panel h2 {
  margin: 0 0 5px;
  color: #17233c;
}

.section-header {
  margin-bottom: 16px;
}

.section-header p,
.result-header p,
.reference-tip {
  margin: 0;
  color: #718096;
}

.editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-button,
.secondary-button,
.import-button {
  padding: 9px 14px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.file-button,
.secondary-button {
  color: #2563eb;
  background: #eaf2ff;
}

.file-button input {
  display: none;
}

.json-editor {
  width: 100%;
  min-height: 570px;
  box-sizing: border-box;
  padding: 16px;
  border: 1px solid #cbd5e1;
  border-radius: 11px;
  color: #dbeafe;
  background: #0f172a;
  font-family: Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  tab-size: 2;
}

.json-editor:focus {
  border-color: #3b82f6;
  outline: none;
}

.import-button {
  width: 100%;
  margin-top: 14px;
  padding: 13px 18px;
  color: white;
  background: #2563eb;
}

.import-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.reference-panel {
  position: sticky;
  top: 20px;
}

.reference-tip {
  margin-bottom: 16px;
  line-height: 1.6;
}

.point-list {
  display: grid;
  max-height: 610px;
  gap: 10px;
  overflow-y: auto;
}

.point-item {
  display: grid;
  gap: 7px;
  padding: 13px;
  border: 1px solid #e3e9f2;
  border-radius: 10px;
}

.point-item strong {
  color: #334155;
}

.point-item code {
  overflow-wrap: anywhere;
  color: #7c3aed;
  font-size: 12px;
}

.point-item small {
  color: #718096;
  line-height: 1.5;
}

.empty-reference {
  padding: 25px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  color: #718096;
  text-align: center;
}

.error-message {
  padding: 12px 14px;
  border-radius: 9px;
  color: #dc2626;
  background: #fee2e2;
  white-space: pre-wrap;
}

.result-panel {
  border-color: #86efac;
}

.result-header {
  margin-bottom: 16px;
}

.result-header h2 {
  color: #15803d;
}

.result-json {
  overflow: auto;
  max-height: 500px;
  padding: 16px;
  border-radius: 10px;
  color: #dcfce7;
  background: #052e16;
  font-family: Consolas, monospace;
  line-height: 1.6;
  white-space: pre-wrap;
}

@media (max-width: 1000px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .reference-panel {
    position: static;
  }

  .point-list {
    max-height: 350px;
  }
}

@media (max-width: 700px) {
  .page-header,
  .section-header,
  .result-header {
    align-items: stretch;
    flex-direction: column;
  }

  .editor-actions {
    flex-direction: column;
  }

  .file-button,
  .secondary-button {
    text-align: center;
  }
}
</style>