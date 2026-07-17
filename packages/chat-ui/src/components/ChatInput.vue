<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useChatMessage } from '../composables/useChatMessage'
import { useImageAttachment } from '../composables/useImageAttachment'
import { useVoiceRecorder } from '../composables/useVoiceRecorder'
import { CHAT_CONFIG_KEY } from '../registry/symbols'
import type { ChatConfig } from '../config/types'

const { t } = useI18n()
const msg = useChatMessage()
const config = inject<ChatConfig>(CHAT_CONFIG_KEY)

const props = defineProps<{
  pendingToolCall?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'send', payload: { text: string; files: FileList | null }): void
  (e: 'reset'): void
}>()

const input = ref('')

// 从 config 读取配置
const sender = config?.avatar.sender || ''
const enableVoice = config?.voice.enabled ?? true
const enableImageUpload = config?.ui.enableImageUpload ?? true
const enableReset = config?.ui.enableReset ?? true
const customPlaceholder = config?.ui.inputPlaceholder || ''

// 语音模式 - 如果语音未启用，强制为 false
const voiceMode = computed({
  get: () => enableVoice ? voiceModeInternal.value : false,
  set: (val: boolean) => { voiceModeInternal.value = val },
})
const voiceModeInternal = ref(false)

// 输入框占位符
const placeholderText = computed(() => customPlaceholder || t('ai_chat_input_inputPlaceholder'))

// STT preview
const sttPreviewText = ref('')
const showSttPreview = computed(() => sttPreviewText.value.length > 0)
const confirmSttPreview = () => {
  if (!sttPreviewText.value) return
  emit('send', { text: sttPreviewText.value, files: images.files.value })
  sttPreviewText.value = ''
  images.reset()
}
const cancelSttPreview = () => { sttPreviewText.value = '' }

// Voice
const recorder = useVoiceRecorder({
  sender,
  sttEndpoint: config?.voice.sttEndpoint,
  onResult: (text) => { sttPreviewText.value = text },
  onEmpty: () => { msg.warning(t('ai_chat_input_voiceEmpty')) },
  onError: (err) => { msg.error(err?.message || t('ai_chat_input_voiceFailed')) },
})

// Image
const images = useImageAttachment()
const fileInputRef = images.fileInputRef

// Wave bars
const baseHeights = [10, 16, 22, 16, 10]
const waveBarHeight = (index: number) => {
  const ratio = Math.max(0.15, recorder.audioLevel.value / 100)
  return Math.round(baseHeights[index % 5] * ratio)
}

// Hold-to-talk
const CANCEL_THRESHOLD = 80
const HOLD_DELAY = 300
let touchStartY = 0
let holdTimer: ReturnType<typeof setTimeout> | null = null
let isMouseHolding = false
let recordingPending = false
let holdActive = false

const onHoldStart = (e: TouchEvent | MouseEvent) => {
  if (recorder.isTranscribing.value || props.pendingToolCall || showSttPreview.value) return
  e.preventDefault()
  touchStartY = (e as TouchEvent).touches ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
  recorder.voiceCancelled.value = false
  recordingPending = false
  holdActive = true
  holdTimer = setTimeout(async () => {
    recordingPending = true
    recorder.showVoiceOverlay.value = true
    await recorder.startRecording()
    recordingPending = false
    if (!holdActive) recorder.stopRecording(true)
  }, HOLD_DELAY)
}

const onHoldMove = (e: TouchEvent | MouseEvent) => {
  if (!recorder.isRecording.value) return
  const clientY = (e as TouchEvent).touches ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
  recorder.voiceCancelled.value = touchStartY - clientY > CANCEL_THRESHOLD
}

const onHoldEnd = () => {
  holdActive = false
  if (holdTimer) clearTimeout(holdTimer)
  if (recordingPending) return
  if (!recorder.isRecording.value) { recorder.showVoiceOverlay.value = false; return }
  if (Date.now() - recorder.getRecordStartTime() < 800) { recorder.stopRecording(true); return }
  recorder.stopRecording(recorder.voiceCancelled.value)
}

const onMouseHoldStart = (e: MouseEvent) => {
  if (e.button !== 0) return
  isMouseHolding = true
  onHoldStart(e)
  document.addEventListener('mousemove', onMouseHoldMove)
  document.addEventListener('mouseup', onMouseHoldEnd)
}
const onMouseHoldMove = (e: MouseEvent) => { if (isMouseHolding) onHoldMove(e) }
const onMouseHoldEnd = () => {
  if (!isMouseHolding) return
  isMouseHolding = false
  document.removeEventListener('mousemove', onMouseHoldMove)
  document.removeEventListener('mouseup', onMouseHoldEnd)
  onHoldEnd()
}

// Send
const sending = ref(false)
const canSend = computed(() => {
  if (props.pendingToolCall || props.disabled || sending.value) return false
  return input.value.trim() || (images.files.value && images.files.value.length > 0)
})

const handleSubmit = (e: Event) => {
  e.preventDefault()
  if (!canSend.value) return
  sending.value = true
  emit('send', { text: input.value, files: images.files.value })
  input.value = ''
  images.reset()
  setTimeout(() => { sending.value = false }, 500)
}

const handleKeyup = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e)
}

const confirmReset = () => {
  ElMessageBox.confirm(t('ai_chat_header_resetConfirm'), t('ai_chat_header_resetChat'), {
    confirmButtonText: t('ai_chat_header_resetConfirmYes'),
    cancelButtonText: t('ai_chat_header_resetConfirmNo'),
    type: 'warning',
  }).then(() => { emit('reset') }).catch(() => {})
}

onBeforeUnmount(() => {
  images.cleanup()
  recorder.cleanup()
  if (holdTimer) clearTimeout(holdTimer)
  document.removeEventListener('mousemove', onMouseHoldMove)
  document.removeEventListener('mouseup', onMouseHoldEnd)
})
</script>

<template>
  <div class="input-area" @paste="images.handlePaste">
    <!-- Voice overlay -->
    <Transition name="voice-overlay">
      <div v-if="recorder.showVoiceOverlay.value" class="voice-float" :class="{ cancelled: recorder.voiceCancelled.value }">
        <div class="voice-wave">
          <span v-for="i in 5" :key="i" class="voice-wave-bar" :style="{ height: waveBarHeight(i - 1) + 'px' }" />
        </div>
        <span class="voice-float-time">{{ recorder.formattedDuration.value }}</span>
        <span class="voice-float-hint">{{ recorder.voiceCancelled.value ? $t('ai_chat_input_recordingCancelled') : $t('ai_chat_input_slideToCancel') }}</span>
      </div>
    </Transition>

    <!-- Pending hint -->
    <div v-if="pendingToolCall" class="pending-hint">{{ $t('ai_chat_input_pendingHint') }}</div>

    <!-- STT preview -->
    <Transition name="stt-preview">
      <div v-if="showSttPreview" class="stt-preview">
        <div class="stt-preview-text">{{ sttPreviewText }}</div>
        <div class="stt-preview-actions">
          <button type="button" class="stt-preview-btn cancel" @click="cancelSttPreview">
            <IconMdiClose class="btn-icon" />
          </button>
          <button type="button" class="stt-preview-btn confirm" @click="confirmSttPreview">
            <IconMdiArrowUp class="btn-icon" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Image preview -->
    <div v-if="images.previewImages.value.length > 0" class="image-preview-container">
      <div v-for="image in images.previewImages.value" :key="image.index" class="image-preview-item">
        <img :src="image.url" :alt="image.name" />
        <button type="button" class="remove-image-btn" @click="images.removeImage(image.index)">
          <IconMdiClose class="remove-icon" />
        </button>
      </div>
    </div>

    <input ref="fileInputRef" type="file" accept="image/*" multiple style="display: none" @change="images.handleImageSelect" />

    <!-- Main input -->
    <form @submit="handleSubmit" class="input-form">
      <button v-if="enableVoice" type="button" class="mode-toggle-btn" @click="voiceMode = !voiceMode" :title="voiceMode ? placeholderText : $t('ai_chat_input_holdToTalk')">
        <IconMdiKeyboard v-if="voiceMode" class="btn-icon" />
        <IconMdiMicrophone v-else class="btn-icon" />
      </button>

      <div class="input-wrapper">
        <template v-if="!voiceMode">
          <button v-if="enableImageUpload" type="button" class="inline-action-btn" style="margin-left: 4px" @click="images.triggerImageSelect" :title="$t('ai_chat_input_uploadImageTip')">
            <IconMdiPaperclip class="btn-icon" />
          </button>
          <input v-model="input" type="text" class="chat-input" :placeholder="placeholderText" @keyup="handleKeyup" />
          <button type="submit" class="send-btn" :class="{ active: canSend }" :disabled="!canSend">
            <IconMdiArrowUp class="btn-icon" />
          </button>
        </template>
        <template v-else>
          <button v-if="enableImageUpload" type="button" class="inline-action-btn inline-action-btn--compact" style="margin-left: 4px" @click="images.triggerImageSelect">
            <IconMdiPaperclip class="btn-icon" />
          </button>
          <div class="hold-to-talk-btn" :class="{ active: recorder.isRecording.value, disabled: recorder.isTranscribing.value || pendingToolCall || showSttPreview }" @touchstart="onHoldStart" @touchmove="onHoldMove" @touchend="onHoldEnd" @touchcancel="onHoldEnd" @mousedown="onMouseHoldStart">
            <template v-if="recorder.isTranscribing.value">
              <IconMdiLoading class="btn-icon spinning" /> {{ $t('ai_chat_input_transcribing') }}
            </template>
            <template v-else-if="recorder.isRecording.value">
              <span class="rec-dot"></span> {{ recorder.formattedDuration.value }} {{ $t('ai_chat_input_slideToCancel') }}
            </template>
            <template v-else>
              <IconMdiMicrophone class="btn-icon" /> {{ $t('ai_chat_input_holdToTalk') }}
            </template>
          </div>
        </template>
      </div>

      <button v-if="enableReset" type="button" class="reset-btn" @click="confirmReset" :title="$t('ai_chat_header_resetChat')">
        <IconMdiRefresh class="btn-icon" />
      </button>
    </form>
  </div>
</template>

<style scoped lang="scss">
@use '../styles/chat-input';

.btn-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.remove-icon {
  width: 14px;
  height: 14px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
