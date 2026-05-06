import { installFullscreenEscapeBridge } from './escapeBridge';
import { exitDocumentFullscreen, requestElementFullscreen } from './root/fullscreenApi';
import type { FullscreenNavigationUI } from './root/useFullscreenRoot';

export interface FullscreenRequestOptions {
  /**
   * Hint to the browser describing how the navigation UI should be presented
   * while the element is in fullscreen. Forwarded to `Element.requestFullscreen()`.
   * @default 'auto'
   */
  navigationUI?: FullscreenNavigationUI | undefined;
}

/**
 * Imperatively requests fullscreen for the given element.
 *
 * Must be called from a user-gesture event handler (or from a task that still
 * inherits a recent activation). Returns a promise that resolves once the
 * browser enters fullscreen, or rejects if the request was blocked or the
 * Fullscreen API is unavailable on the element.
 *
 * Use this for fire-and-forget cases like fullscreening the entire page.
 * Prefer `<Fullscreen.Root>` when you need managed open/close state, triggers,
 * or `data-fullscreen` attributes.
 *
 * @param element The element to present in fullscreen.
 * @param options Optional options forwarded to the browser API.
 *
 * Documentation: [Base UI Fullscreen](https://base-ui.com/react/components/fullscreen)
 */
export function request(element: Element, options: FullscreenRequestOptions = {}): Promise<void> {
  installFullscreenEscapeBridge();
  const { navigationUI = 'auto' } = options;
  const promise = requestElementFullscreen(element as HTMLElement, navigationUI);
  if (promise === null) {
    return Promise.reject(
      new Error(
        'Base UI: Fullscreen.request() was called on an element whose owner document does not support the Fullscreen API. ' +
          'Check `document.fullscreenEnabled` before calling. ' +
          'See https://base-ui.com/react/components/fullscreen',
      ),
    );
  }
  return promise;
}

/**
 * Imperatively exits fullscreen on the given document (defaults to the global
 * document).
 *
 * Returns a promise that resolves once the browser has exited fullscreen, or
 * resolves immediately when no element is currently fullscreen.
 *
 * Documentation: [Base UI Fullscreen](https://base-ui.com/react/components/fullscreen)
 */
export function exit(doc?: Document): Promise<void> {
  if (typeof document === 'undefined' && doc === undefined) {
    return Promise.resolve();
  }
  const targetDoc = doc ?? document;
  const promise = exitDocumentFullscreen(targetDoc);
  return promise ?? Promise.resolve();
}
