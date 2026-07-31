export function useApi() {
  const config = useRuntimeConfig()

  const token = useCookie<string | null>(
    'smart_exam_token',
  )

  return $fetch.create({
    baseURL: config.public.apiBase,
    credentials: 'include',
    retry: 0,
    timeout: 10000,

    onRequest({ options }) {
      if (!token.value) {
        return
      }

      const headers = new Headers(
        options.headers,
      )

      headers.set(
        'Authorization',
        `Bearer ${token.value}`,
      )

      options.headers = headers
    },

    async onResponseError({ response }) {
      if (response.status !== 401) {
        return
      }

      token.value = null

      const authStore = useAuthStore()
      authStore.logout()

      if (import.meta.client) {
        await navigateTo('/login')
      }
    },
  })
}