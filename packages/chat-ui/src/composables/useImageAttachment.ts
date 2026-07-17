import type { Ref } from 'vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useChatMessage } from './useChatMessage'

const MAX_SIZE = 5 * 1024 * 1024
const COMPRESS_MAX_DIMENSION = 1920
const COMPRESS_QUALITY = 0.8

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > COMPRESS_MAX_DIMENSION || height > COMPRESS_MAX_DIMENSION) {
        const ratio = Math.min(COMPRESS_MAX_DIMENSION / width, COMPRESS_MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          const name = file.name.replace(/\.[^.]+$/, '.jpg')
          resolve(new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() }))
        },
        'image/jpeg',
        COMPRESS_QUALITY,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }
    img.src = url
  })
}

export function useImageAttachment() {
  const { t } = useI18n()
  const msg = useChatMessage()

  const files = ref<FileList | null>(null)
  const fileInputRef = ref<HTMLInputElement | null>(null)

  // 同一份粘贴事件被多个 @paste 监听到时，只处理一次（防止图片双倍）
  const handledPasteEvents = new WeakSet<ClipboardEvent>()

  const handleImageSelect = (e: Event) => {
    const selected = (e.target as HTMLInputElement).files
    if (selected?.length) addFiles(Array.from(selected))
  }

  const handlePaste = (e: ClipboardEvent) => {
    if (handledPasteEvents.has(e)) return
    handledPasteEvents.add(e)

    const items = e.clipboardData?.items
    if (!items) return
    const imgs: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault()
        const f = items[i].getAsFile()
        if (f) imgs.push(f)
      }
    }
    if (imgs.length > 0) {
      addFiles(imgs)
      msg.success(t('ai_chat_input_pastedImages', [imgs.length]))
    }
  }

  const addFiles = async (newFiles: File[]) => {
    if (!newFiles?.length) return
    const imageFiles = newFiles.filter((file) => {
      if (!file.type.startsWith('image/')) {
        msg.warning(t('ai_chat_input_notImageFile', [file.name]))
        return false
      }
      return true
    })
    if (imageFiles.length === 0) return

    const processed = await Promise.all(
      imageFiles.map(async (file) => {
        const compressed = await compressImage(file)
        if (compressed.size > MAX_SIZE) {
          msg.warning(t('ai_chat_input_fileSizeExceed', [file.name]))
          return null
        }
        return compressed
      }),
    )
    const valid = processed.filter(Boolean) as File[]
    if (valid.length > 0) {
      const dt = new DataTransfer()
      if (files.value) Array.from(files.value).forEach((f) => dt.items.add(f))
      valid.forEach((f) => dt.items.add(f))
      files.value = dt.files
    }
  }

  const removeImage = (index: number) => {
    if (!files.value) return
    const dt = new DataTransfer()
    Array.from(files.value).forEach((f, i) => {
      if (i !== index) dt.items.add(f)
    })
    files.value = dt.files.length > 0 ? dt.files : null
    if (fileInputRef.value) fileInputRef.value.files = dt.files
  }

  const triggerImageSelect = () => {
    const input = fileInputRef.value
    if (!input) return

    const ua = navigator.userAgent || ''
    const isAndroidWebView =
      /Android/i.test(ua) && (/wv\b/.test(ua) || /Version\/[\d.]+.*Chrome\/[\d.]+ Mobile/.test(ua))

    if (isAndroidWebView) {
      input.style.display = 'block'
      input.style.position = 'fixed'
      input.style.top = '-9999px'
      input.style.left = '-9999px'
      input.style.opacity = '0'
      setTimeout(() => {
        input.click()
        setTimeout(() => {
          input.style.display = 'none'
        }, 500)
      }, 100)
    } else {
      input.click()
    }
  }

  const previewImages = computed(() => {
    if (!files.value) return []
    return Array.from(files.value).map((file, index) => ({
      index,
      name: file.name,
      url: URL.createObjectURL(file),
    }))
  })

  function cleanup() {
    previewImages.value.forEach((img) => URL.revokeObjectURL(img.url))
  }

  function reset() {
    files.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
  }

  return {
    files,
    fileInputRef,
    handleImageSelect,
    handlePaste,
    removeImage,
    triggerImageSelect,
    previewImages,
    cleanup,
    reset,
  }
}
