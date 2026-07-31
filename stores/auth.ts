type AuthUser = {
  id: string
  username: string
  email: string
  full_name: string | null
  role: 'admin' | 'teacher' | 'user'
  is_active: boolean
  created_at: string
  updated_at: string
}

type LoginResponse = {
  access_token: string
  token_type: string
}

export const useAuthStore = defineStore(
  'auth',
  () => {
    const config = useRuntimeConfig()

    const token = useCookie<string | null>(
      'smart_exam_token',
      {
        default: () => null,
        sameSite: 'lax',
        maxAge: 60 * 60,
      },
    )

    const user = ref<AuthUser | null>(null)
    const pending = ref(false)
    const initialized = ref(false)

    const isAuthenticated = computed(
      () => Boolean(token.value && user.value),
    )

    const isAdmin = computed(
      () => user.value?.role === 'admin',
    )

    const canManageContent = computed(
      () =>
        user.value?.role === 'admin'
        || user.value?.role === 'teacher',
    )

    async function fetchCurrentUser() {
      if (!token.value) {
        user.value = null
        return
      }

      try {
        user.value = await $fetch<AuthUser>(
          `${config.public.apiBase}/api/v1/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token.value}`,
            },
          },
        )
      } catch {
        token.value = null
        user.value = null
        throw new Error('登录状态已经失效')
      }
    }

    async function login(
      account: string,
      password: string,
    ) {
      pending.value = true

      try {
        const response = await $fetch<LoginResponse>(
          `${config.public.apiBase}/api/v1/auth/login`,
          {
            method: 'POST',
            body: {
              account,
              password,
            },
          },
        )

        token.value = response.access_token

        await fetchCurrentUser()
      } finally {
        pending.value = false
      }
    }

    function logout() {
      token.value = null
      user.value = null
      initialized.value = true
    }

    async function initialize() {
      if (initialized.value) {
        return
      }

      try {
        if (token.value) {
          await fetchCurrentUser()
        }
      } catch {
        token.value = null
        user.value = null
      } finally {
        initialized.value = true
      }
    }

    return {
      token,
      user,
      pending,
      initialized,
      isAuthenticated,
      isAdmin,
      canManageContent,
      login,
      logout,
      initialize,
      fetchCurrentUser,
    }
  },
)