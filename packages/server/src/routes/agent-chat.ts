import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { streamText, toUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { conversationRepo } from '../repositories/conversation.js'

// 创建 Qwen (DashScope) 客户端
const qwen = createOpenAICompatible({
  name: 'Qwen',
  apiKey: process.env.DASHSCOPE_API_KEY || '',
  baseURL: process.env.OPENAI_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
})

const chatSchema = z.object({
  agentId: z.string(),
  messages: z.array(z.any()),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    parameters: z.record(z.string(), z.any()).optional(),
  })).optional(),
  systemPrompt: z.string().optional(),
})

// Simple user identification (in production, get from auth token)
const getUserId = (request: any): string => {
  return request.headers['x-user-id'] || 'default-user'
}

export const agentChatRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/chat', async (request, reply) => {
    const body = chatSchema.parse(request.body)
    const { agentId, messages, tools = [], systemPrompt } = body
    const userId = getUserId(request)

    // Get or create conversation from database
    const conversation = await conversationRepo.getOrCreateConversation(agentId, userId)

    // Convert frontend messages to AI SDK ModelMessage format
    // Frontend sends { role, content } — map to ModelMessage { role, content }
    const modelMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content || msg.parts?.map((p: any) => p.text).filter(Boolean).join('') || '',
    }))

    // Convert tools to AI SDK format
    const aiTools = tools.reduce((acc, tool) => {
      acc[tool.name] = {
        description: tool.description,
        parameters: tool.parameters || {},
      }
      return acc
    }, {} as Record<string, any>)

    try {
      const result = streamText({
        model: qwen(process.env.TEXT_MODEL || 'qwen3.6-plus'),
        instructions: systemPrompt,
        messages: modelMessages,
        tools: aiTools,
        onStepEnd: async ({ toolCalls }) => {
          // Store tool calls in database
          if (toolCalls && toolCalls.length > 0) {
            for (const tc of toolCalls) {
              await conversationRepo.addMessage(
                conversation.id,
                'assistant',
                '',
                [tc],
                null
              )
            }
          }
        },
        onEnd: async ({ text }) => {
          // Store assistant response in database
          if (text) {
            await conversationRepo.addMessage(
              conversation.id,
              'assistant',
              text,
              null,
              null
            )
          }
        },
      })

      // Convert to UIMessageStream and send as SSE
      const response = createUIMessageStreamResponse({
        stream: toUIMessageStream({
          stream: result.stream,
          sendReasoning: true,  // Enable reasoning/thinking display
        }),
      })

      // Set all headers at once using writeHead (ensures CORS headers are sent)
      const requestOrigin = request.headers.origin || '*'
      const headers: Record<string, string> = {
        'Content-Type': response.headers.get('Content-Type') || 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        // CORS headers — @fastify/cors onSend hook doesn't run after reply.hijack()
        'Access-Control-Allow-Origin': requestOrigin,
        'Access-Control-Allow-Credentials': 'true',
      }

      // Hijack the response to handle streaming manually
      reply.hijack()

      reply.raw.writeHead(200, headers)
      reply.raw.flushHeaders()  // Ensure headers are sent immediately for SSE

      // Pipe the stream
      if (!response.body) {
        reply.raw.end()
        return
      }

      const reader = response.body.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          reply.raw.write(value)
        }
      } finally {
        reader.releaseLock()
        reply.raw.end()
      }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'AI service error',
        message: error.message,
      })
    }
  })

  // Get user's conversations
  fastify.get('/conversations', async (request) => {
    const userId = getUserId(request)
    return conversationRepo.getUserConversations(userId)
  })

  // Get conversation messages
  fastify.get('/conversations/:conversationId/messages', async (request) => {
    const { conversationId } = request.params as { conversationId: string }
    return conversationRepo.getMessages(conversationId)
  })

  // Delete conversation
  fastify.delete('/conversations/:conversationId', async (request) => {
    const { conversationId } = request.params as { conversationId: string }
    await conversationRepo.deleteConversation(conversationId)
    return { success: true }
  })
}
