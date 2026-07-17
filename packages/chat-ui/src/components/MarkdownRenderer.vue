<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'

const { t } = useI18n()
const props = defineProps<{ content: string }>()

const markdownRef = ref<HTMLElement | null>(null)

marked.setOptions({ gfm: true, breaks: true })

const outputHtml = computed(() => marked.parse(props.content))

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(t('ai_markdown_link_copied'))
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      ElMessage.success(t('ai_markdown_link_copied'))
    } catch {
      ElMessage.error(t('ai_markdown_link_copyFailed'))
    }
    document.body.removeChild(textarea)
  }
}

function handleLinkClick(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest('a')
  if (target?.href) {
    e.preventDefault()
    copyToClipboard(target.href)
  }
}

function bindLinkListeners() {
  markdownRef.value?.addEventListener('click', handleLinkClick)
}
function unbindLinkListeners() {
  markdownRef.value?.removeEventListener('click', handleLinkClick)
}

onMounted(bindLinkListeners)
onUpdated(() => { unbindLinkListeners(); bindLinkListeners() })
onBeforeUnmount(unbindLinkListeners)
</script>

<template>
  <div ref="markdownRef" class="markdown-body" v-html="outputHtml" />
</template>

<style scoped>
.markdown-body { line-height: 1.5; word-break: break-word; font-size: 14px; color: var(--text-primary); }
.markdown-body :deep(p) { margin: 0 0 0.35em 0; }
.markdown-body :deep(p:last-child) { margin-bottom: 0; }
.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3), .markdown-body :deep(h4) { margin: 0.5em 0 0.2em 0; line-height: 1.3; font-weight: 600; }
.markdown-body :deep(h1) { font-size: 1.2em; }
.markdown-body :deep(h2) { font-size: 1.1em; }
.markdown-body :deep(h3) { font-size: 1em; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { margin: 0.2em 0; padding-left: 1.4em; }
.markdown-body :deep(li) { margin: 0.1em 0; }
.markdown-body :deep(li > ul), .markdown-body :deep(li > ol) { margin: 0; }
.markdown-body :deep(blockquote) { margin: 0.3em 0; padding: 0.2em 0.75em; border-left: 3px solid #aaa; color: #666; }
.markdown-body :deep(blockquote p) { margin: 0; }
.markdown-body :deep(pre) { margin: 0.3em 0; padding: 0.5em 0.75em; background: #f4f4f4; border-radius: 6px; overflow-x: auto; font-size: 0.88em; }
.markdown-body :deep(pre:last-child) { margin-bottom: 0; }
.markdown-body :deep(code) { font-family: monospace; background: #ebebeb; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.9em; }
.markdown-body :deep(pre code) { background: none; padding: 0; font-size: inherit; }
.markdown-body :deep(hr) { margin: 0.4em 0; border: none; border-top: 1px solid #ddd; }
.markdown-body :deep(table) { border-collapse: collapse; margin: 0.3em 0; font-size: 0.9em; }
.markdown-body :deep(th), .markdown-body :deep(td) { border: 1px solid #ddd; padding: 0.2em 0.5em; }
.markdown-body :deep(a) { color: var(--primary-color, #409eff); text-decoration: none; cursor: pointer; position: relative; transition: all 0.2s; }
.markdown-body :deep(a:hover) { text-decoration: underline; opacity: 0.8; }
.markdown-body :deep(a::after) { content: '📋'; font-size: 0.85em; margin-left: 0.2em; opacity: 0; transition: opacity 0.2s; }
.markdown-body :deep(a:hover::after) { opacity: 0.6; }
</style>
