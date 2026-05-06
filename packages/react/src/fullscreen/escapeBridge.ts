'use client';

import {
  exitDocumentFullscreen,
  FULLSCREEN_CHANGE_EVENTS,
  getFullscreenElement,
} from './root/fullscreenApi';

// Keyboard Lock API surface (https://wicg.github.io/keyboard-lock/). Only Chromium
// browsers expose this today; Safari and Firefox return `undefined` and we
// silently fall back to the browser-native Esc-exits-fullscreen behavior.
interface KeyboardLockAPI {
  lock: (keyCodes?: string[]) => Promise<void>;
  unlock: () => void;
}
function getKeyboardLock(): KeyboardLockAPI | undefined {
  if (typeof navigator === 'undefined') {
    return undefined;
  }
  return (navigator as Navigator & { keyboard?: KeyboardLockAPI | undefined }).keyboard;
}

let installed = false;

function handleFullscreenChange() {
  const keyboard = getKeyboardLock();
  if (!keyboard) {
    return;
  }
  if (getFullscreenElement(document)) {
    // Lock Esc so it reaches JS handlers (Dialog, Popover, Menu, etc.) instead
    // of the browser using it to exit fullscreen.
    keyboard.lock(['Escape']).catch(() => {
      // If the lock is rejected (e.g. browser policy), we fall back to the
      // native Esc-exits-fullscreen behavior. Nothing to do here.
    });
  } else {
    // Per the spec, leaving fullscreen automatically releases any lock, but
    // calling unlock() here is idempotent and keeps state predictable across
    // browsers that don't strictly follow the spec.
    keyboard.unlock();
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape') {
    return;
  }
  if (!getFullscreenElement(document)) {
    return;
  }
  // Defer the exit decision to a microtask so synchronous Esc handlers later
  // in the bubble (such as `useDismiss` on an open <Dialog.Popup>) get a
  // chance to call `event.preventDefault()` first. If they did, we leave
  // fullscreen alone; otherwise we exit, matching the native
  // Esc-exits-fullscreen contract.
  queueMicrotask(() => {
    if (event.defaultPrevented) {
      return;
    }
    if (!getFullscreenElement(document)) {
      return;
    }
    exitDocumentFullscreen(document)?.catch(() => {
      // The next `fullscreenchange` event reconciles store state if needed.
    });
  });
}

/**
 * Installs the document-level Esc bridge for fullscreen mode.
 *
 * - Captures the Escape key (via the Keyboard Lock API in supporting browsers)
 *   while a document element is in fullscreen, so `Dialog`, `Popover`, `Menu`,
 *   and any other dismissible popup gets a chance to dismiss on Esc before the
 *   browser exits fullscreen.
 * - Falls back to the browser-native Esc-exits-fullscreen behavior on browsers
 *   that don't implement Keyboard Lock (Safari, Firefox).
 *
 * Called from the Fullscreen runtime entry points (`useFullscreenRoot` and
 * `Fullscreen.request`) so it survives bundler tree-shaking under
 * `sideEffects: false`. Idempotent and SSR-safe (no-op when `document` is
 * unavailable).
 */
export function installFullscreenEscapeBridge() {
  if (installed) {
    return;
  }
  if (typeof document === 'undefined') {
    return;
  }
  installed = true;
  for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
    document.addEventListener(eventName, handleFullscreenChange);
  }
  document.addEventListener('keydown', handleKeyDown);
}
