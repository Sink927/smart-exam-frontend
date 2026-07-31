<script setup>
definePageMeta({
  title: '系统概览',
})

const { $api } = useNuxtApp()

const config = useRuntimeConfig()

const {
  data: dashboardData,
  pending,
  error,
  refresh,
} = await useAsyncData(
  'dashboard-statistics',
  async () => {
    const [
      courses,
      chapters,
      knowledgePoints,
      questions,
    ] = await Promise.all([
      $api(
        `${config.public.apiBase}/api/v1/courses`,
      ),
      $api(
        `${config.public.apiBase}/api/v1/chapters`,
      ),
      $api(
        `${config.public.apiBase}/api/v1/knowledge-points`,
      ),
      $api(
        `${config.public.apiBase}/api/v1/questions`,
        {
          params: {
            page: 1,
            page_size: 1,
          },
        },
      ),
    ])

    return {
      courseCount: courses.length,
      chapterCount: chapters.length,
      knowledgePointCount: knowledgePoints.length,
      questionCount: questions.total,
    }
  },
)

const statistics = computed(() => {
  const loadingValue = pending.value ? '…' : '--'

  return [
    {
      title: '课程数量',
      value:
        dashboardData.value?.courseCount
        ?? loadingValue,
      description: '已录入课程',
      icon: '▤',
      color: 'blue',
    },
    {
      title: '章节数量',
      value:
        dashboardData.value?.chapterCount
        ?? loadingValue,
      description: '课程章节',
      icon: '☷',
      color: 'cyan',
    },
    {
      title: '知识点数量',
      value:
        dashboardData.value?.knowledgePointCount
        ?? loadingValue,
      description: '知识体系节点',
      icon: '◇',
      color: 'violet',
    },
    {
      title: '试题数量',
      value:
        dashboardData.value?.questionCount
        ?? loadingValue,
      description: '题库有效试题',
      icon: '✎',
      color: 'orange',
    },
  ]
})

const quickActions = [
  {
    title: '录入新试题',
    description: '创建包含 LaTeX 公式的新试题',
    path: '/questions/create',
    icon: '＋',
  },
  {
    title: '管理课程',
    description: '维护课程、章节和知识点体系',
    path: '/courses',
    icon: '▤',
  },
  {
    title: '智能组卷',
    description: '按照知识点与难度条件生成试卷',
    path: '/papers',
    icon: '▦',
  },
]
</script>

<template>
  <div class="dashboard">
    <section class="welcome-panel">
      <div>
        <span class="welcome-label">SMART EXAM PLATFORM</span>
        <h2>欢迎使用智能题库管理系统</h2>
        <p>
          集中管理理工科试题、知识点、LaTeX 公式和试卷，
          提升试题录入、检索与组卷效率。
        </p>
      </div>

      <NuxtLink to="/questions" class="primary-action">
        进入试题库
        <span>→</span>
      </NuxtLink>
    </section>
    <div v-if="error" class="error-banner">
      <span>无法连接后端服务，请确认 FastAPI 已启动。</span>

      <button type="button" @click="refresh()">
        重新连接
      </button>
    </div>
    <section class="statistics-grid">
      <article
        v-for="item in statistics"
        :key="item.title"
        class="statistic-card"
      >
        <div
          class="statistic-icon"
          :class="`statistic-icon-${item.color}`"
        >
          {{ item.icon }}
        </div>

        <div>
          <span class="statistic-title">{{ item.title }}</span>
          <strong>{{ item.value }}</strong>
          <p>{{ item.description }}</p>
        </div>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="dashboard-card">
        <div class="card-heading">
          <div>
            <span>快捷入口</span>
            <h3>常用操作</h3>
          </div>

          <span class="card-label">3 项</span>
        </div>

        <div class="quick-action-list">
          <NuxtLink
            v-for="item in quickActions"
            :key="item.path"
            :to="item.path"
            class="quick-action"
          >
            <span class="quick-action-icon">{{ item.icon }}</span>

            <span class="quick-action-content">
              <strong>{{ item.title }}</strong>
              <small>{{ item.description }}</small>
            </span>

            <span class="quick-action-arrow">→</span>
          </NuxtLink>
        </div>
      </article>

      <article class="dashboard-card">
        <div class="card-heading">
          <div>
            <span>系统能力</span>
            <h3>建设进度</h3>
          </div>

          <span class="card-label card-label-green">运行中</span>
        </div>

        <div class="progress-list">
          <div class="progress-item">
            <div>
              <strong>题库数据模型</strong>
              <span>课程、章节、知识点和试题</span>
            </div>
            <span class="progress-value">100%</span>
          </div>

          <div class="progress-track">
            <span style="width: 100%" />
          </div>

          <div class="progress-item">
            <div>
              <strong>试题版本管理</strong>
              <span>创建、修改、恢复和历史记录</span>
            </div>
            <span class="progress-value">100%</span>
          </div>

          <div class="progress-track">
            <span style="width: 100%" />
          </div>

          <div class="progress-item">
            <div>
              <strong>前端管理平台</strong>
              <span>页面布局与接口连接</span>
            </div>
            <span class="progress-value">20%</span>
          </div>

          <div class="progress-track">
            <span style="width: 20%" />
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: 24px;
}

.welcome-panel {
  display: flex;
  min-height: 210px;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 36px 40px;
  color: white;
  border-radius: 22px;
  background:
    radial-gradient(
      circle at 80% 20%,
      rgb(56 189 248 / 35%),
      transparent 30%
    ),
    linear-gradient(135deg, #172554, #1d4ed8);
  box-shadow: 0 18px 45px rgb(30 64 175 / 20%);
}

.welcome-label {
  color: #bae6fd;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.welcome-panel h2 {
  margin: 14px 0 12px;
  font-size: clamp(25px, 3vw, 36px);
}

.welcome-panel p {
  max-width: 680px;
  margin: 0;
  color: #dbeafe;
  line-height: 1.8;
}

.primary-action {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
  padding: 13px 19px;
  color: #1d4ed8;
  font-weight: 700;
  text-decoration: none;
  border-radius: 12px;
  background: white;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.statistic-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 24px rgb(15 23 42 / 4%);
}

.statistic-icon {
  display: grid;
  width: 50px;
  height: 50px;
  flex: 0 0 auto;
  place-items: center;
  font-size: 23px;
  border-radius: 14px;
}

.statistic-icon-blue {
  color: #1d4ed8;
  background: #dbeafe;
}

.statistic-icon-cyan {
  color: #0e7490;
  background: #cffafe;
}

.statistic-icon-violet {
  color: #6d28d9;
  background: #ede9fe;
}

.statistic-icon-orange {
  color: #c2410c;
  background: #ffedd5;
}

.statistic-title {
  color: #64748b;
  font-size: 13px;
}

.statistic-card strong {
  display: block;
  margin-top: 4px;
  color: #172033;
  font-size: 27px;
}

.statistic-card p {
  margin: 3px 0 0;
  color: #94a3b8;
  font-size: 12px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.dashboard-card {
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: white;
}

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-heading span {
  color: #94a3b8;
  font-size: 12px;
}

.card-heading h3 {
  margin: 4px 0 0;
  color: #172033;
}

.card-label {
  padding: 6px 10px;
  color: #1d4ed8 !important;
  border-radius: 999px;
  background: #dbeafe;
}

.card-label-green {
  color: #166534 !important;
  background: #dcfce7;
}

.quick-action-list,
.progress-list {
  display: grid;
  gap: 12px;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  color: inherit;
  text-decoration: none;
  border: 1px solid #eef2f7;
  border-radius: 13px;
  transition: 0.2s ease;
}

.quick-action:hover {
  border-color: #bfdbfe;
  background: #eff6ff;
  transform: translateY(-1px);
}

.quick-action-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  color: #2563eb;
  font-size: 20px;
  border-radius: 10px;
  background: #dbeafe;
}

.quick-action-content {
  display: grid;
  flex: 1;
  gap: 4px;
}

.quick-action-content small {
  color: #64748b;
}

.quick-action-arrow {
  color: #2563eb;
}

.progress-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-item div {
  display: grid;
  gap: 4px;
}

.progress-item span {
  color: #64748b;
  font-size: 12px;
}

.progress-value {
  color: #2563eb !important;
  font-weight: 700;
}

.progress-track {
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #e5e7eb;
}

.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #38bdf8);
}

@media (max-width: 1100px) {
  .statistics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .welcome-panel {
    align-items: flex-start;
    flex-direction: column;
    padding: 28px;
  }

  .statistics-grid,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}


.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fef2f2;
}

.error-banner button {
  padding: 7px 12px;
  color: white;
  border: 0;
  border-radius: 8px;
  background: #dc2626;
  cursor: pointer;
}
</style>