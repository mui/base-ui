import { generateId } from './generateId';

/**
 * Implements pub/sub pattern for event handling.
 */
export class EventEmitter<T> {
  private listeners: ((data: T) => void)[] = [];

  public lastEventId = '';

  /**
   * Subscribe to events emitted by this emitter.
   * @param listener The callback function to invoke when events are emitted.
   * @returns A function that unsubscribes the listener when called.
   */
  subscribe(listener: (data: T) => void) {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event to all subscribers.
   * @param data The event data to pass to listeners.
   */
  emit(data: T) {
    this.lastEventId = generateId('event');
    this.listeners.forEach((listener) => listener(data));
  }
}
