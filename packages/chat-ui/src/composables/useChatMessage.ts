/**
 * Chat-specific message utility.
 * Simple wrapper around console for now.
 */
const chatMessage = {
  success: (msg: string) => console.log('[Chat Success]', msg),
  warning: (msg: string) => console.warn('[Chat Warning]', msg),
  error: (msg: string) => console.error('[Chat Error]', msg),
  info: (msg: string) => console.info('[Chat Info]', msg),
}

export function useChatMessage() {
  return chatMessage
}
