<script setup lang="ts">
const route = useRoute()

const navigationItems = [
  { name: '系统概览', path: '/', icon: '⌂' },
  { name: '课程管理', path: '/courses', icon: '▤' },
  { name: '章节管理', path: '/chapters', icon: '☷' },
  { name: '知识点管理', path: '/knowledge-points', icon: '◇' },
  { name: '试题管理', path: '/questions', icon: '✎' },
  { name: '智能组卷', path: '/papers', icon: '▦' },
  { name: '用户管理', path: '/users', icon: '♙' },
]

const pageTitle = computed(() => {
  return String(route.meta.title || '系统概览')
})

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/'
  }

  return route.path.startsWith(path)
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">Σ</div>

        <div>
          <strong>智能题库</strong>
          <span>Smart Exam</span>
        </div>
      </div>

      <nav class="navigation">
        <NuxtLink
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          class="navigation-item"
          :class="{ active: isActive(item.path) }"
        >
          <span class="navigation-icon">{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-help">
          <strong>系统状态</strong>
          <span>后端服务连接正常</span>
        </div>
      </div>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div>
          <p class="topbar-caption">高校理工科智能教学平台</p>
          <h1>{{ pageTitle }}</h1>
        </div>

        <div class="topbar-actions">
          <span class="status-badge">
            <span class="status-dot" />
            系统运行中
          </span>

          <button class="user-avatar" type="button" title="管理员">
            管
          </button>
        </div>
      </header>

      <main class="page-content">
        <slot />
      </main>
    </section>
  </div>
</template>

<style>
:root {
  color: #1f2937;
  font-family:
    Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
  background: #f4f7fb;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f4f7fb;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-shell {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 24px 16px;
  color: #dbeafe;
  background:
    linear-gradient(180deg, #14213d 0%, #1d3557 100%);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px 26px;
}

.brand-logo {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  color: white;
  font-size: 24px;
  font-weight: 700;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  box-shadow: 0 8px 24px rgb(37 99 235 / 35%);
}

.brand strong,
.brand span {
  display: block;
}

.brand strong {
  color: white;
  font-size: 17px;
}

.brand span {
  margin-top: 3px;
  color: #93c5fd;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.navigation {
  display: grid;
  gap: 6px;
}

.navigation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  color: #bfdbfe;
  text-decoration: none;
  border-radius: 10px;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.navigation-item:hover {
  color: white;
  background: rgb(255 255 255 / 8%);
  transform: translateX(2px);
}

.navigation-item.active {
  color: white;
  background: linear-gradient(
    90deg,
    rgb(37 99 235 / 80%),
    rgb(56 189 248 / 30%)
  );
}

.navigation-icon {
  width: 22px;
  font-size: 19px;
  text-align: center;
}

.sidebar-footer {
  margin-top: auto;
}

.sidebar-help {
  display: grid;
  gap: 5px;
  padding: 14px;
  border: 1px solid rgb(147 197 253 / 18%);
  border-radius: 12px;
  background: rgb(255 255 255 / 6%);
}

.sidebar-help strong {
  color: white;
  font-size: 13px;
}

.sidebar-help span {
  color: #93c5fd;
  font-size: 12px;
}

.workspace {
  min-width: 0;
}

.topbar {
  position: sticky;
  z-index: 10;
  top: 0;
  display: flex;
  min-height: 88px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  border-bottom: 1px solid #e5e7eb;
  background: rgb(255 255 255 / 92%);
  backdrop-filter: blur(12px);
}

.topbar-caption {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 12px;
}

.topbar h1 {
  margin: 0;
  color: #172033;
  font-size: 24px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: #166534;
  font-size: 13px;
  border-radius: 999px;
  background: #dcfce7;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgb(34 197 94 / 15%);
}

.user-avatar {
  width: 40px;
  height: 40px;
  color: white;
  font-weight: 700;
  border: 0;
  border-radius: 12px;
  background: #2563eb;
  cursor: pointer;
}

.page-content {
  padding: 30px 32px 48px;
}

@media (max-width: 900px) {
  .app-shell {
    display: block;
  }

  .sidebar {
    position: static;
    height: auto;
  }

  .navigation {
    display: flex;
    overflow-x: auto;
  }

  .navigation-item {
    flex: 0 0 auto;
  }

  .sidebar-footer {
    display: none;
  }

  .topbar,
  .page-content {
    padding-right: 18px;
    padding-left: 18px;
  }

  .status-badge {
    display: none;
  }
}
</style>