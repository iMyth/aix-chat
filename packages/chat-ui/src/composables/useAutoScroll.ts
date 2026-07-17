import type { Ref } from 'vue'
import { onBeforeUnmount, ref } from 'vue'
import { sleep } from '../utils/sleep'

/**
 * Auto-scroll logic extracted from ChatMessageList.
 * RAF-throttled, respects user scroll-up.
 */
export function useAutoScroll(containerRef: Ref<HTMLElement | null>) {
  const userScrolledUp = ref(false)
  let scrollRafId: number | null = null

  const SCROLL_THRESHOLD = 80

  const scrollToBottom = () => {
    if (userScrolledUp.value) return
    if (scrollRafId) return
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = null
      if (containerRef.value) {
        containerRef.value.scrollTop = containerRef.value.scrollHeight
      }
    })
  }

  const delayScrollToBottom = async (delay = 50) => {
    await sleep(delay)
    scrollToBottom()
  }

  const handleScroll = () => {
    if (!containerRef.value) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.value
    userScrolledUp.value = scrollHeight - scrollTop - clientHeight > SCROLL_THRESHOLD
  }

  onBeforeUnmount(() => {
    if (scrollRafId) cancelAnimationFrame(scrollRafId)
  })

  return { userScrolledUp, scrollToBottom, delayScrollToBottom, handleScroll }
}
