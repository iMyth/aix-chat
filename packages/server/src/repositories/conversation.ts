import { sql } from '../libs/db.js'

export interface Conversation {
  id: string
  agent_id: string
  user_id: string
  created_at: Date
  updated_at: Date
}

export interface Message {
  id: string
  conversation_id: string
  role: string
  content: string | null
  tool_calls: any | null
  tool_call_id: string | null
  created_at: Date
}

export class ConversationRepository {
  /**
   * 创建或获取对话
   */
  async getOrCreateConversation(agentId: string, userId: string): Promise<Conversation> {
    // 尝试获取最近的对话
    const existing = await sql<Conversation[]>`
      SELECT * FROM conversations
      WHERE agent_id = ${agentId} AND user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT 1
    `

    if (existing.length > 0) {
      return existing[0]
    }

    // 创建新对话
    const [conversation] = await sql<Conversation[]>`
      INSERT INTO conversations (agent_id, user_id)
      VALUES (${agentId}, ${userId})
      RETURNING *
    `

    return conversation
  }

  /**
   * 获取对话的所有消息
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    return sql<Message[]>`
      SELECT * FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
    `
  }

  /**
   * 添加消息
   */
  async addMessage(
    conversationId: string,
    role: string,
    content: string | null,
    toolCalls: any = null,
    toolCallId: string | null = null
  ): Promise<Message> {
    const [message] = await sql<Message[]>`
      INSERT INTO messages (conversation_id, role, content, tool_calls, tool_call_id)
      VALUES (${conversationId}, ${role}, ${content}, ${JSON.stringify(toolCalls)}, ${toolCallId})
      RETURNING *
    `

    // 更新对话的 updated_at
    await sql`
      UPDATE conversations
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${conversationId}
    `

    return message
  }

  /**
   * 获取用户的对话列表
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    return sql<Conversation[]>`
      SELECT * FROM conversations
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await sql`DELETE FROM conversations WHERE id = ${conversationId}`
  }
}

export const conversationRepo = new ConversationRepository()
