export default defineNuxtRouteMiddleware(
  async (to) => {
    if (to.path === '/login') {
      return
    }

    const authStore = useAuthStore()

    await authStore.initialize()

    if (!authStore.isAuthenticated) {
      return navigateTo({
        path: '/login',
        query: {
          redirect: to.fullPath,
        },
      })
    }

    if (
  (
    to.path.startsWith('/users')
    || to.path.startsWith('/audit-logs')
  )
  && !authStore.isAdmin
) {
  return navigateTo('/forbidden')
}

    if (
      to.path.startsWith('/papers')
      && !authStore.canManageContent
    ) {
      return navigateTo('/forbidden')
    }
  },
)