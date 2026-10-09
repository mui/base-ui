import type { FloatingEventEmitter } from './types';

export function createEventEmitter<EventMap extends object>(): FloatingEventEmitter<EventMap> {
  const map = new Map<string, Set<(data: any) => void>>();
  return {
    emit(event, data) {
      map.get(event)?.forEach((listener) => listener(data));
    },
    on(event, listener) {
      if (!map.has(event)) {
        map.set(event, new Set());
      }
      map.get(event)!.add(listener);
    },
    off(event, listener) {
      map.get(event)?.delete(listener);
    },
  };
}
