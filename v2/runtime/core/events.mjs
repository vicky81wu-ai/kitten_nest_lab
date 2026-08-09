export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(name, listener) {
    if (typeof listener !== 'function') return () => {};
    const list = this.listeners.get(name) || new Set();
    list.add(listener);
    this.listeners.set(name, list);
    return () => {
      list.delete(listener);
      if (!list.size) this.listeners.delete(name);
    };
  }

  emit(name, detail) {
    const list = this.listeners.get(name);
    if (!list) return;
    [...list].forEach((listener) => {
      try {
        listener(detail);
      } catch (error) {
        console.error(`[v2:event:${name}]`, error);
      }
    });
  }

  clear() {
    this.listeners.clear();
  }
}
