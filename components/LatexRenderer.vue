<script setup lang="ts">
import katex from 'katex'
import 'katex/dist/katex.min.css'

const props = withDefaults(
  defineProps<{
    source: string
    displayMode?: boolean
  }>(),
  {
    displayMode: true,
  },
)

const renderError = ref('')

const renderedFormula = computed(() => {
  renderError.value = ''

  if (!props.source.trim()) {
    return ''
  }

  try {
    return katex.renderToString(props.source, {
      displayMode: props.displayMode,
      throwOnError: false,
      strict: 'warn',
      trust: false,
      output: 'htmlAndMathml',
    })
  } catch (error) {
    renderError.value =
      error instanceof Error
        ? error.message
        : 'LaTeX 公式解析失败'

    return ''
  }
})
</script>

<template>
  <div class="latex-renderer">
    <div
      v-if="renderedFormula"
      class="formula-content"
      v-html="renderedFormula"
    />

    <p v-else-if="renderError" class="formula-error">
      {{ renderError }}
    </p>

    <p v-else class="formula-empty">
      暂无公式内容
    </p>
  </div>
</template>

<style scoped>
.latex-renderer {
  overflow-x: auto;
  min-height: 56px;
  padding: 16px;
  border: 1px solid #dbe5f3;
  border-radius: 10px;
  background: #f8fafc;
}

.formula-content {
  min-width: max-content;
  color: #17233c;
  text-align: center;
}

.formula-error {
  margin: 0;
  color: #dc2626;
}

.formula-empty {
  margin: 0;
  color: #94a3b8;
  text-align: center;
}
</style>