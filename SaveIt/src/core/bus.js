// Decoupled EventBus for cross-component communication

class EventBus {
  constructor() {
    this.listeners = new Map()
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(handler)
    return () => this.off(event, handler)
  }

  off(event, handler) {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  emit(event, payload) {
    const handlers = this.listeners.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload)
        } catch (err) {
          console.error(`Error in event handler for ${event}:`, err)
        }
      }
    }
  }
}

export const bus = new EventBus()
