import type { Component } from 'vue'
import type { ToolConfig, ToolDefinition } from './createChat'

/**
 * 定义工具列表
 *
 * @example
 * ```ts
 * import { defineTools } from '@aix/chat'
 * import OptionCard from './OptionCard.vue'
 *
 * export const tools = defineTools([
 *   {
 *     name: 'showOptions',
 *     description: '展示选项',
 *     parameters: { type: 'object', properties: { ... } },
 *     component: OptionCard,
 *     mapProps: (args) => ({ options: args.options }),
 *     execute: async (args) => { ... },
 *     onEvent: (eventName, data) => { ... }
 *   }
 * ])
 * ```
 */
export function defineTools<T extends ToolConfig[]>(tools: T) {
  return {
    /** 原始工具定义 */
    tools,

    /** 工具 schema（传给后端） */
    get schemas(): ToolDefinition[] {
      return tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      }))
    },

    /** 卡片注册表（pending） */
    get pendingCards(): Record<string, Component> {
      const cards: Record<string, Component> = {}
      for (const t of tools) {
        if (t.component) {
          cards[t.name] = t.component
        }
      }
      return cards
    },

    /** 根据工具名获取配置 */
    getTool(name: string): ToolConfig | undefined {
      return tools.find(t => t.name === name)
    },

    /** 执行工具 */
    async executeTool(name: string, args: any): Promise<any> {
      const tool = this.getTool(name)
      if (!tool?.execute) {
        throw new Error(`Tool "${name}" not found or has no execute function`)
      }
      return tool.execute(args)
    },
  }
}
