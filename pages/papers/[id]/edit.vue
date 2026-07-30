<script setup lang="ts">
definePageMeta({
  title: '编辑试卷信息',
})

type ExamPaper = {
  id: string
  title: string
  school_name: string
  academic_year: string
  semester: string
  exam_type: string
  paper_variant: string
  exam_mode: string
  duration_minutes: number
  total_score: string
  issuing_department: string | null
  issue_date: string | null
  exam_date: string | null
  approver: string | null
  print_count: number | null
  instructions: string | null
}

const route = useRoute()
const config = useRuntimeConfig()

const paperId = String(route.params.id)

const loading = ref(true)
const saving = ref(false)
const message = ref('')
const errorMessage = ref('')

const form = reactive({
  title: '',
  school_name: '西北大学',
  academic_year: '',
  semester: '',
  exam_type: '',
  paper_variant: 'A',
  exam_mode: '闭卷',
  duration_minutes: 120,
  total_score: 100,
  issuing_department: '',
  issue_date: '',
  exam_date: '',
  approver: '',
  print_count: 0,
  instructions: '',
})

async function loadPaper() {
  loading.value = true
  errorMessage.value = ''

  try {
    const paper = await $fetch<ExamPaper>(
      `${config.public.apiBase}/api/v1/exam-papers/${paperId}`,
    )

    form.title = paper.title || ''
    form.school_name = paper.school_name || '西北大学'
    form.academic_year = paper.academic_year || ''
    form.semester = paper.semester || ''
    form.exam_type = paper.exam_type || ''
    form.paper_variant = paper.paper_variant || 'A'
    form.exam_mode = paper.exam_mode || '闭卷'
    form.duration_minutes = paper.duration_minutes || 120
    form.total_score = Number(paper.total_score || 100)
    form.issuing_department =
      paper.issuing_department || ''
    form.issue_date = paper.issue_date || ''
    form.exam_date = paper.exam_date || ''
    form.approver = paper.approver || ''
    form.print_count = paper.print_count || 0
    form.instructions = paper.instructions || ''
  } catch (error) {
    errorMessage.value = '试卷信息加载失败，请确认后端已启动。'
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function savePaper() {
  saving.value = true
  message.value = ''
  errorMessage.value = ''

  try {
    await $fetch(
      `${config.public.apiBase}/api/v1/exam-papers/${paperId}`,
      {
        method: 'PATCH',
        body: {
          ...form,
          issue_date: form.issue_date || null,
          exam_date: form.exam_date || null,
          approver: form.approver || null,
          issuing_department:
            form.issuing_department || null,
          instructions: form.instructions || null,
        },
      },
    )

    message.value = '试卷信息保存成功。'
  } catch (error) {
    errorMessage.value = '保存失败，请检查填写内容。'
    console.error(error)
  } finally {
    saving.value = false
  }
}

onMounted(loadPaper)
</script>

<template>
  <section class="paper-edit-page">
    <header class="page-header">
      <div>
        <NuxtLink
          class="back-link"
          :to="`/papers/${paperId}`"
        >
          ← 返回试卷
        </NuxtLink>

        <h2>编辑试卷信息</h2>
        <p>修改后重新导出 Word 即可生效。</p>
      </div>
    </header>

    <p v-if="loading" class="state-message">
      正在加载试卷信息……
    </p>

    <form
      v-else
      class="paper-form"
      @submit.prevent="savePaper"
    >
      <div class="form-grid">
        <label class="full-width">
          <span>试卷标题</span>
          <input
            v-model.trim="form.title"
            required
            type="text"
          >
        </label>

        <label>
          <span>学校名称</span>
          <input
            v-model.trim="form.school_name"
            required
            type="text"
          >
        </label>

        <label>
          <span>学年</span>
          <input
            v-model.trim="form.academic_year"
            required
            placeholder="例如：2026-2027"
            type="text"
          >
        </label>

        <label>
          <span>学期</span>
          <select v-model="form.semester" required>
            <option value="">请选择</option>
            <option value="第一学期">第一学期</option>
            <option value="第二学期">第二学期</option>
            <option value="暑期学期">暑期学期</option>
          </select>
        </label>

        <label>
          <span>考试类型</span>
          <select v-model="form.exam_type" required>
            <option value="">请选择</option>
            <option value="期中考试">期中考试</option>
            <option value="期末考试">期末考试</option>
            <option value="补考">补考</option>
            <option value="重修考试">重修考试</option>
            <option value="模拟考试">模拟考试</option>
          </select>
        </label>

        <label>
          <span>试卷类型</span>
          <select v-model="form.paper_variant">
            <option value="A">A卷</option>
            <option value="B">B卷</option>
            <option value="C">C卷</option>
          </select>
        </label>

        <label>
          <span>考试方式</span>
          <select v-model="form.exam_mode">
            <option value="闭卷">闭卷</option>
            <option value="开卷">开卷</option>
            <option value="机考">机考</option>
          </select>
        </label>

        <label>
          <span>考试时长（分钟）</span>
          <input
            v-model.number="form.duration_minutes"
            min="1"
            max="1440"
            required
            type="number"
          >
        </label>

        <label>
          <span>试卷总分</span>
          <input
            v-model.number="form.total_score"
            min="1"
            step="0.01"
            required
            type="number"
          >
        </label>

        <label>
          <span>开课单位</span>
          <input
            v-model.trim="form.issuing_department"
            placeholder="例如：西北大学数学学院"
            type="text"
          >
        </label>

        <label>
          <span>印刷份数</span>
          <input
            v-model.number="form.print_count"
            min="0"
            type="number"
          >
        </label>

        <label>
          <span>出题日期</span>
          <input
            v-model="form.issue_date"
            type="date"
          >
        </label>

        <label>
          <span>考试日期</span>
          <input
            v-model="form.exam_date"
            type="date"
          >
        </label>

        <label>
          <span>审批人</span>
          <input
            v-model.trim="form.approver"
            type="text"
          >
        </label>

        <label class="full-width">
          <span>考试说明</span>
          <textarea
            v-model.trim="form.instructions"
            rows="4"
            placeholder="填写考生须知、允许使用的工具等"
          />
        </label>
      </div>

      <p v-if="message" class="success-message">
        {{ message }}
      </p>

      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </p>

      <div class="form-actions">
        <NuxtLink
          class="cancel-button"
          :to="`/papers/${paperId}`"
        >
          取消
        </NuxtLink>

        <button
          class="save-button"
          type="submit"
          :disabled="saving"
        >
          {{ saving ? '正在保存……' : '保存试卷信息' }}
        </button>
      </div>
    </form>
  </section>
</template>
<style scoped>
.paper-edit-page {
  max-width: 1050px;
  margin: 0 auto;
}

.page-header,
.paper-form {
  padding: 24px;
  border: 1px solid #dce5f2;
  border-radius: 16px;
  background: #fff;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 12px 0 6px;
}

.page-header p {
  margin: 0;
  color: #64748b;
}

.back-link {
  color: #2563eb;
  text-decoration: none;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-grid label {
  display: grid;
  gap: 8px;
}

.form-grid label span {
  color: #334155;
  font-weight: 600;
}

.full-width {
  grid-column: 1 / -1;
}

input,
select,
textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  color: #17233c;
  background: #fff;
  font: inherit;
}

textarea {
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #2563eb;
  outline: 2px solid #dbeafe;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cancel-button,
.save-button {
  padding: 11px 20px;
  border-radius: 9px;
  text-decoration: none;
}

.cancel-button {
  border: 1px solid #cbd5e1;
  color: #334155;
}

.save-button {
  border: 0;
  color: #fff;
  background: #2563eb;
  cursor: pointer;
}

.save-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.success-message {
  color: #15803d;
}

.error-message {
  color: #dc2626;
}

.state-message {
  padding: 24px;
  border-radius: 12px;
  background: #fff;
}

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }
}
</style>