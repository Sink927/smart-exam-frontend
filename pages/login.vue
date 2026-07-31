<script setup lang="ts">
definePageMeta({
  layout: false,
  title: '用户登录',
})

const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  account: '',
  password: '',
})

const errorMessage = ref('')

function getErrorMessage(error: unknown) {
  const apiError = error as {
    data?: {
      detail?: string
    }
    message?: string
  }

  return (
    apiError.data?.detail
    || apiError.message
    || '登录失败，请稍后重试'
  )
}

async function submitLogin() {
  errorMessage.value = ''

  if (!form.account.trim()) {
    errorMessage.value = '请输入用户名或邮箱'
    return
  }

  if (!form.password) {
    errorMessage.value = '请输入密码'
    return
  }

  try {
    await authStore.login(
      form.account.trim(),
      form.password,
    )

    const redirect = String(
      route.query.redirect || '/',
    )

    await navigateTo(
      redirect.startsWith('/')
      && !redirect.startsWith('//')
        ? redirect
        : '/',
    )
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
}

onMounted(async () => {
  await authStore.initialize()

  if (authStore.isAuthenticated) {
    await navigateTo('/')
  }
})
</script>

<template>
  <main class="login-page">
    <section class="login-introduction">
      <div class="brand-mark">Σ</div>

      <p class="eyebrow">
        NORTHWEST UNIVERSITY
      </p>

      <h1>西北大学智能题库管理系统</h1>

      <p class="description">
        面向高校理工科课程的试题管理、知识点维护、
        智能组卷与试卷导出平台。
      </p>

      <div class="feature-list">
        <span>结构化试题管理</span>
        <span>LaTeX 公式支持</span>
        <span>多维度智能组卷</span>
      </div>
    </section>

    <section class="login-panel">
      <form
        class="login-card"
        @submit.prevent="submitLogin"
      >
        <header>
          <p>WELCOME BACK</p>
          <h2>登录系统</h2>
          <span>请输入账号信息以继续访问管理平台</span>
        </header>

        <label class="form-field">
          <span>用户名或邮箱</span>
          <input
            v-model="form.account"
            type="text"
            autocomplete="username"
            placeholder="请输入用户名或邮箱"
          >
        </label>

        <label class="form-field">
          <span>密码</span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
          >
        </label>

        <p
          v-if="errorMessage"
          class="error-message"
        >
          {{ errorMessage }}
        </p>

        <button
          class="login-button"
          type="submit"
          :disabled="authStore.pending"
        >
          {{
            authStore.pending
              ? '正在登录...'
              : '登录'
          }}
        </button>

        <p class="login-tip">
          测试阶段请使用系统管理员分配的账号登录
        </p>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(420px, 0.9fr);
  background:
    radial-gradient(
      circle at 15% 20%,
      rgb(56 189 248 / 22%),
      transparent 32%
    ),
    linear-gradient(135deg, #112957, #173f87 55%, #2563eb);
}

.login-introduction {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 680px;
  padding: 70px clamp(48px, 8vw, 130px);
  color: #fff;
}

.brand-mark {
  width: 70px;
  height: 70px;
  display: grid;
  place-items: center;
  margin-bottom: 38px;
  border: 1px solid rgb(255 255 255 / 35%);
  border-radius: 20px;
  font-size: 38px;
  font-weight: 800;
  background: rgb(255 255 255 / 12%);
  box-shadow: 0 18px 45px rgb(0 0 0 / 18%);
}

.eyebrow {
  margin: 0 0 14px;
  color: #7dd3fc;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.2em;
}

.login-introduction h1 {
  max-width: 620px;
  margin: 0;
  font-size: clamp(38px, 4vw, 62px);
  line-height: 1.15;
}

.description {
  max-width: 600px;
  margin: 28px 0 0;
  color: #dbeafe;
  font-size: 17px;
  line-height: 1.9;
}

.feature-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 34px;
}

.feature-list span {
  padding: 8px 13px;
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 999px;
  color: #e0f2fe;
  background: rgb(255 255 255 / 8%);
  font-size: 13px;
}

.login-panel {
  display: grid;
  place-items: center;
  padding: 42px;
  background: #f4f7fc;
  border-radius: 42px 0 0 42px;
}

.login-card {
  width: min(100%, 440px);
  display: grid;
  gap: 22px;
  padding: 42px;
  box-sizing: border-box;
  border: 1px solid #dbe5f3;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 24px 70px rgb(15 23 42 / 12%);
}

.login-card header {
  margin-bottom: 8px;
}

.login-card header p {
  margin: 0 0 8px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.login-card header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 30px;
}

.login-card header span {
  display: block;
  margin-top: 10px;
  color: #64748b;
  font-size: 14px;
}

.form-field {
  display: grid;
  gap: 8px;
}

.form-field span {
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}

.form-field input {
  width: 100%;
  box-sizing: border-box;
  padding: 13px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 11px;
  outline: none;
  color: #0f172a;
  background: #fff;
  font: inherit;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-field input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
}

.error-message {
  margin: -6px 0 0;
  padding: 10px 12px;
  border-radius: 9px;
  color: #b91c1c;
  background: #fee2e2;
  font-size: 13px;
}

.login-button {
  padding: 13px 18px;
  border: 0;
  border-radius: 11px;
  color: #fff;
  background: #2563eb;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.login-button:hover:not(:disabled) {
  background: #1d4ed8;
}

.login-button:disabled {
  opacity: 0.65;
  cursor: wait;
}

.login-tip {
  margin: 0;
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-introduction {
    display: none;
  }

  .login-panel {
    min-height: 100vh;
    padding: 24px;
    border-radius: 0;
  }

  .login-card {
    padding: 30px 24px;
  }
}
</style>