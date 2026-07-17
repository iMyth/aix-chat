import type { Ref } from 'vue'
import { ref } from 'vue'

/**
 * Manages pending tool call state.
 *
 * When a tool needs user interaction, call setPending() to suspend;
 * when the user completes the interaction, call resolve() to submit the result.
 */
export function usePendingToolCall(chat: { addToolOutput: (output: unknown) => void }) {
  const pendingToolCall = ref<{
    toolCall: { toolName: string; toolCallId: string }
    result: Record<string, unknown>
  } | null>(null)

  /**
   * Transition lock between resolve() and chat entering submitted/streaming state.
   * Prevents users from sending messages in the gap between tool completion and LLM response.
   */
  const resolving = ref(false)
  let resolvingTimer: ReturnType<typeof setTimeout> | null = null

  function buildToolOutput(
    toolCall: { toolName: string; toolCallId: string },
    output: unknown,
    state = 'output-available',
  ) {
    const base: Record<string, unknown> = {
      state,
      type: 'tool-result',
      tool: toolCall.toolName,
      toolCallId: toolCall.toolCallId,
    }
    if (state === 'output-error') {
      base.errorText = typeof output === 'string' ? output : JSON.stringify(output)
    } else {
      base.output = output
    }
    return base
  }

  function setPending(
    toolCall: { toolName: string; toolCallId: string },
    result: Record<string, unknown>,
  ) {
    pendingToolCall.value = { toolCall, result }
  }

  function resolve(output: unknown) {
    if (!pendingToolCall.value) {
      console.warn('[usePendingToolCall] resolve: no pending tool call')
      return
    }

    resolving.value = true
    if (resolvingTimer) clearTimeout(resolvingTimer)

    const { toolCall } = pendingToolCall.value
    chat.addToolOutput(buildToolOutput(toolCall, output))
    pendingToolCall.value = null

    resolvingTimer = setTimeout(() => {
      resolving.value = false
    }, 3000)
  }

  return { pendingToolCall, resolving, buildToolOutput, setPending, resolve }
}
