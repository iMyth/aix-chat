import { computed, isRef, ref, type Ref } from 'vue'
import { useChatMessage } from './useChatMessage'

interface VoiceRecorderOptions {
  onResult?: (text: string) => void
  onEmpty?: () => void
  onError?: (err: Error) => void
  sender?: string | Ref<string>
  sttEndpoint?: string
  sttHeaders?: Record<string, string>
}

const VIRTUAL_DEVICE_KEYWORDS = [
  'virtual', 'ideashare', 'blackhole', 'soundflower',
  'loopback', 'obs', 'screen', 'share', 'display',
]

function isVirtualDevice(label: string) {
  return VIRTUAL_DEVICE_KEYWORDS.some((kw) => (label || '').toLowerCase().includes(kw))
}

function detectMimeType(): string {
  for (const mime of [
    'audio/webm;codecs=opus', 'audio/webm;codecs=pcm', 'audio/webm',
    'audio/ogg;codecs=opus', 'audio/mp4', 'audio/mpeg',
  ]) {
    if (MediaRecorder.isTypeSupported(mime)) return mime
  }
  return ''
}

export function useVoiceRecorder(options: VoiceRecorderOptions = {}) {
  const msg = useChatMessage()
  const {
    onResult, onEmpty, onError,
    sender = '',
    sttEndpoint = '/api/stt/open',
    sttHeaders = {},
  } = options

  const isRecording = ref(false)
  const isTranscribing = ref(false)
  const recordingDuration = ref(0)
  const showVoiceOverlay = ref(false)
  const voiceCancelled = ref(false)
  const audioLevel = ref(0)

  let mediaRecorder: MediaRecorder | null = null
  let audioChunks: Blob[] = []
  let recordingTimer: ReturnType<typeof setInterval> | null = null
  let recordStartTime = 0

  let audioContext: AudioContext | null = null
  let analyserNode: AnalyserNode | null = null
  let volumeRaf: number | null = null

  async function refreshAudioDevices() {
    try {
      const tmp = await navigator.mediaDevices.getUserMedia({ audio: true })
      tmp.getTracks().forEach((t) => t.stop())
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone (${d.deviceId.slice(0, 8)})`,
          isVirtual: isVirtualDevice(d.label),
        }))
    } catch {
      return []
    }
  }

  const startRecording = async () => {
    try {
      const devices = await refreshAudioDevices()
      const real = devices.filter((d) => !d.isVirtual)
      const deviceId = real.length > 0
        ? (real.find((d) => d.deviceId === 'default') || real[0]).deviceId
        : devices[0]?.deviceId

      const constraints = deviceId ? { deviceId: { exact: deviceId } } : true
      const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints })
      const track = stream.getAudioTracks()[0]

      // Volume monitoring
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const source = audioContext.createMediaStreamSource(stream)
        analyserNode = audioContext.createAnalyser()
        analyserNode.fftSize = 256
        analyserNode.smoothingTimeConstant = 0.3
        source.connect(analyserNode)
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount)
        const updateLevel = () => {
          analyserNode!.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
          audioLevel.value = Math.min(100, Math.round((sum / dataArray.length / 255) * 100 * 2))
          volumeRaf = requestAnimationFrame(updateLevel)
        }
        volumeRaf = requestAnimationFrame(updateLevel)
      } catch { /* ignore */ }

      const mimeType = detectMimeType()
      mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      audioChunks = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        if (recordingTimer) clearInterval(recordingTimer)
        recordingDuration.value = 0
        showVoiceOverlay.value = false

        if (volumeRaf) cancelAnimationFrame(volumeRaf)
        if (audioContext) { audioContext.close(); audioContext = null }
        analyserNode = null
        audioLevel.value = 0

        if (voiceCancelled.value) {
          voiceCancelled.value = false
          audioChunks = []
          return
        }
        if (audioChunks.length === 0) return

        const blob = new Blob(audioChunks, { type: mimeType || 'audio/webm' })
        if (blob.size > 10 * 1024 * 1024) {
          msg.warning('录音文件过大')
          return
        }

        const reader = new FileReader()
        reader.onloadend = async () => {
          await sendToSTT(reader.result as string)
        }
        reader.readAsDataURL(blob)
      }

      mediaRecorder.start(1000)
      isRecording.value = true
      recordStartTime = Date.now()
      recordingDuration.value = 0
      recordingTimer = setInterval(() => { recordingDuration.value++ }, 1000)
    } catch (err: any) {
      console.error('[Voice] 获取麦克风权限失败:', err)
      onError?.(err)
      showVoiceOverlay.value = false
    }
  }

  const stopRecording = (cancelled = false) => {
    voiceCancelled.value = cancelled
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      isRecording.value = false
    }
  }

  const sendToSTT = async (base64DataUri: string) => {
    isTranscribing.value = true
    try {
      const senderValue = isRef(sender) ? sender.value : sender
      const res = await fetch(sttEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...sttHeaders },
        body: JSON.stringify({ base64: base64DataUri, sender: senderValue }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `STT 请求失败 (${res.status})`)
      }
      const data = await res.json()
      if (data.text) {
        onResult?.(data.text)
      } else {
        onEmpty?.()
      }
    } catch (err: any) {
      console.error('[Voice] STT 失败:', err)
      onError?.(err)
    } finally {
      isTranscribing.value = false
    }
  }

  const formattedDuration = computed(() => {
    const m = Math.floor(recordingDuration.value / 60)
    const s = recordingDuration.value % 60
    return `${m}:${String(s).padStart(2, '0')}`
  })

  function cleanup() {
    if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop()
    if (recordingTimer) clearInterval(recordingTimer)
  }

  return {
    isRecording, isTranscribing, recordingDuration, formattedDuration,
    showVoiceOverlay, voiceCancelled, audioLevel,
    startRecording, stopRecording, getRecordStartTime: () => recordStartTime,
    cleanup,
  }
}
