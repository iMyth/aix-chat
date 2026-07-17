import { DefaultChatTransport, type UIMessage } from 'ai'

/**
 * Wraps DefaultChatTransport, replacing image parts in historical messages
 * with text placeholders before sending. Only the last user message's images
 * are preserved to avoid re-transmitting large base64 data on every request.
 */
export class ImageStrippingTransport<UI_MESSAGE extends UIMessage = UIMessage> {
  private _inner: DefaultChatTransport<UI_MESSAGE>

  constructor(options: ConstructorParameters<typeof DefaultChatTransport<UI_MESSAGE>>[0]) {
    this._inner = new DefaultChatTransport<UI_MESSAGE>(options)
  }

  sendMessages({ messages, ...rest }: { messages: any[]; [key: string]: unknown }) {
    const cleaned = stripHistoryImages(messages)
    return this._inner.sendMessages({ messages: cleaned, ...rest } as any)
  }

  reconnectToStream(options: any) {
    return this._inner.reconnectToStream(options)
  }
}

function isImagePart(part: any): boolean {
  if (part.type === 'image') return true
  if (part.type === 'file' && part.mediaType?.startsWith('image/')) return true
  return false
}

function stripHistoryImages(messages: any[]): any[] {
  let lastImageMsgIdx = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role === 'user' && msg.parts?.some(isImagePart)) {
      lastImageMsgIdx = i
      break
    }
  }

  return messages.map((msg, idx) => {
    if (idx === lastImageMsgIdx) return msg
    if (msg.role !== 'user' || !msg.parts?.length) return msg

    const hasImage = msg.parts.some(isImagePart)
    if (!hasImage) return msg

    const newParts = msg.parts.map((part: any) =>
      isImagePart(part) ? { type: 'text', text: '[图片]' } : part,
    )
    return { ...msg, parts: newParts }
  })
}
