/**
 * An event emitter whose events and payloads are listed in `EventMap`.
 */
export interface FloatingEventEmitter<EventMap extends object> {
  emit<Name extends keyof EventMap & string>(event: Name, data: EventMap[Name]): void;
  on<Name extends keyof EventMap & string>(
    event: Name,
    handler: (data: EventMap[Name]) => void,
  ): void;
  off<Name extends keyof EventMap & string>(
    event: Name,
    handler: (data: EventMap[Name]) => void,
  ): void;
}

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
