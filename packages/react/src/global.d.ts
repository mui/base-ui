declare global {
  /**
   * When `true`, disables animation-related code, even if supported by the runtime enviroment.
   */
  // eslint-disable-next-line vars-on-top
  var BASE_UI_ANIMATIONS_DISABLED: boolean;

  interface CloseWatcherEventMap {
    close: Event;
    cancel: Event;
  }

  interface CloseWatcher extends EventTarget {
    onclose: ((this: CloseWatcher, ev: Event) => void) | null;
    oncancel: ((this: CloseWatcher, ev: Event) => void) | null;
    close: () => void;
    requestClose: () => void;
    destroy: () => void;
    addEventListener<K extends keyof CloseWatcherEventMap>(
      type: K,
      listener: (this: CloseWatcher, ev: CloseWatcherEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof CloseWatcherEventMap>(
      type: K,
      listener: (this: CloseWatcher, ev: CloseWatcherEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void;
  }

  interface CloseWatcherConstructor {
    new (options?: { signal?: AbortSignal | undefined }): CloseWatcher;
  }

  interface Window {
    CloseWatcher?: CloseWatcherConstructor | undefined;
  }
}

export type {};
