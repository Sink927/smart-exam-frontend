<script setup lang="ts">
useHead({
  titleTemplate: (title) => {
    return title
      ? `${title} - 智能题库管理系统`
      : '智能题库管理系统'
  },
  htmlAttrs: {
    lang: 'zh-CN',
  },
  meta: [
    {
      name: 'description',
      content: '理工科智能题库管理与自动组卷系统',
    },
  ],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>