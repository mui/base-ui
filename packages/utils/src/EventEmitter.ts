/* False positives for react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/rules-of-hooks */
import * as React from 'react';
import { useEventCallback } from './useEventCallback';

/**
 * Generic, strongly-typed event emitter.
 * EventMap values are tuple types describing handler parameters.
 */
export class EventEmitter<EventMap extends Record<string, any[]>> {
  private listeners = new Map<keyof EventMap, Set<(...args: any[]) => void>>();

  /**
   * Subscribes a handler to a specific event.
   *
   * @param event The event name to listen to.
   * @param handler The function to invoke when the event is emitted.
   * @returns A cleanup function that unsubscribes the handler.
   */
  public on<E extends keyof EventMap>(
    event: E,
    handler: (...args: EventMap[E]) => void,
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as (...args: any[]) => void);
    return () => this.off(event, handler);
  }

  /**
   * Unsubscribes a previously registered handler from an event.
   *
   * @param event The event name to remove the handler from.
   * @param handler The handler function to remove.
   */
  public off<E extends keyof EventMap>(event: E, handler: (...args: EventMap[E]) => void): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler as (...args: any[]) => void);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emits an event and synchronously invokes all subscribed handlers with the provided arguments.
   *
   * @param event The event name to emit.
   * @param args The arguments to pass to each handler.
   */
  public emit<E extends keyof EventMap>(event: E, ...args: EventMap[E]): void {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) {
      return;
    }
    const listeners = Array.from(set);
    for (const listener of listeners) {
      listener(...(args as any[]));
    }
  }

  /**
   * React-friendly subscription helper that auto-cleans up on unmount.
   * Wraps the handler in `useEventCallback` and subscribes in an effect.
   *
   * @param event The event name to subscribe to.
   * @param handler The handler invoked when the event is emitted.
   */
  public useHandler<E extends keyof EventMap>(
    event: E,
    handler: (...args: EventMap[E]) => void,
  ): void {
    const stableHandler = useEventCallback(handler);
    React.useEffect(
      () => this.on(event, stableHandler as (...args: any[]) => void),
      [event, stableHandler],
    );
  }
}
