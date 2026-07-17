import type { Component } from 'vue'
import { reactive } from 'vue'

export interface CardMap {
  pending?: Record<string, Component>
  completed?: Record<string, Component>
}

export interface CardRegistry {
  pending: Record<string, Component>
  completed: Record<string, Component>
  getPendingComponent: (type: string) => Component | null
  getCompletedComponent: (toolName: string) => Component | null
}

export function createCardRegistry(cardMap: CardMap = {}): CardRegistry {
  const registry = reactive({
    pending: { ...cardMap.pending } as Record<string, Component>,
    completed: { ...cardMap.completed } as Record<string, Component>,

    getPendingComponent(type: string): Component | null {
      return registry.pending[type] ?? null
    },

    getCompletedComponent(toolName: string): Component | null {
      return registry.completed[toolName] ?? null
    },
  })

  return registry
}
