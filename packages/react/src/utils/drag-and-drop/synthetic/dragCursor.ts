import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { getSharedSlot } from '../sharedState';
import { trackRegisteredShadowRoots } from '../dropTarget';
import { adoptStyleSheet, getOrCreate, unadoptStyleSheet } from '../utils';
import type { DragCleanupFn } from '../types';

interface DragCursorState {
  /** Undoes the held lock, or `null` when unlocked. */
  restore: DragCleanupFn | null;
  /** Stylesheets installed per document and nonce. */
  styles: WeakMap<Document, Map<string, HTMLStyleElement>>;
  /** The cursor sheet built for each shadow root, reused across drags. */
  shadowSheets: WeakMap<ShadowRoot, CSSStyleSheet>;
}

const state = getSharedSlot<DragCursorState>('dragCursor', () => ({
  restore: null,
  styles: new WeakMap<Document, Map<string, HTMLStyleElement>>(),
  shadowSheets: new WeakMap<ShadowRoot, CSSStyleSheet>(),
}));

const DRAGGING_CLASS = 'baseui-dragging';
const STYLE_CLASS = 'baseui-dragging-styles';
const CURSOR_VAR = '--drag-cursor';
const CURSOR_DECLARATION = `cursor: var(${CURSOR_VAR}, grabbing) !important;`;

interface DragCursorStyleOptions {
  nonce?: string | undefined;
  disableStyleElements?: boolean | undefined;
}

/**
 * Insert the scoped cursor rule into `doc` once; `false` when it can't be installed. It
 * stays installed, gated on a class, since adding a sheet per drag would redo selector
 * matching. `*` with `!important` is the only way to override per-element cursors such
 * as an input's `text`. Shadow trees get their own sheet (see `adoptShadowRootCursor`).
 */
function ensureStyleInjected(doc: Document, nonce: string | undefined): boolean {
  const key = nonce ?? '';
  const existing = state.styles.get(doc)?.get(key);
  if (existing?.isConnected) {
    return true;
  }

  const style = doc.createElement('style');
  // Before insertion: a strict `style-src` policy checks the element when it is
  // attached, and a nonce added later can't un-reject it.
  if (nonce) {
    style.setAttribute('nonce', nonce);
  }
  doc.head.appendChild(style);
  try {
    const sheet = style.sheet;
    if (sheet == null) {
      style.remove();
      return false;
    }
    sheet.insertRule(
      `html.${DRAGGING_CLASS}.${STYLE_CLASS}, html.${DRAGGING_CLASS}.${STYLE_CLASS} * { ${CURSOR_DECLARATION} }`,
    );
  } catch {
    // CSSOM access can throw on a sheet CSP rejected. Dragging works without it.
    style.remove();
    return false;
  }

  getOrCreate(state.styles, doc, () => new Map()).set(key, style);
  return true;
}

/**
 * Adopt the cursor rule into a shadow root holding a registered target or draggable
 * while the lock is held; other shadow trees keep their own cursor. Adopted per drag rather than gated on a
 * class, since a shadow tree can't portably select the document's `<html>` class.
 * `--drag-cursor` inherits through the boundary.
 */
function adoptShadowRootCursor(shadowRoot: ShadowRoot, doc: Document): DragCleanupFn | undefined {
  if (!('adoptedStyleSheets' in shadowRoot) || ownerDocument(shadowRoot.host) !== doc) {
    return undefined;
  }
  let sheet: CSSStyleSheet;
  try {
    sheet = getOrCreate(state.shadowSheets, shadowRoot, () => {
      const created = new (ownerWindow(shadowRoot.host).CSSStyleSheet)();
      created.replaceSync(`* { ${CURSOR_DECLARATION} }`);
      return created;
    });
  } catch {
    // No constructable stylesheets in this realm. The shadow tree keeps its cursor.
    return undefined;
  }
  adoptStyleSheet(shadowRoot, sheet);
  return () => unadoptStyleSheet(shadowRoot, sheet);
}

export function unlock(): void {
  state.restore?.();
  state.restore = null;
}

/**
 * Force a cursor across the whole document during a pointer drag. Only one pointer
 * session runs at a time, so a repeated call while held keeps the saved cursor.
 */
export function lock(element: Element, cursor: string, options: DragCursorStyleOptions = {}): void {
  if (state.restore !== null) {
    return;
  }
  const doc = ownerDocument(element);
  const root = doc.documentElement;
  // Save the consumer's inline `--drag-cursor` and the root's existing classes, so
  // unlock restores them.
  const savedCursorValue = root.style.getPropertyValue(CURSOR_VAR);
  const savedCursorPriority = root.style.getPropertyPriority(CURSOR_VAR);
  const savedDraggingClass = root.classList.contains(DRAGGING_CLASS);
  const savedStyleClass = root.classList.contains(STYLE_CLASS);
  root.style.setProperty(CURSOR_VAR, cursor);
  root.classList.add(DRAGGING_CLASS);
  let unsubscribeShadowRoots: DragCleanupFn | null = null;
  if (!options.disableStyleElements && ensureStyleInjected(doc, options.nonce)) {
    root.classList.add(STYLE_CLASS);
    // A drop target mounting in a new shadow root mid-drag gets the sheet too, and
    // loses it when it unmounts.
    unsubscribeShadowRoots = trackRegisteredShadowRoots((shadowRoot) =>
      adoptShadowRootCursor(shadowRoot, doc),
    );
  } else {
    root.classList.remove(STYLE_CLASS);
  }
  state.restore = () => {
    unsubscribeShadowRoots?.();
    unsubscribeShadowRoots = null;
    root.classList.toggle(DRAGGING_CLASS, savedDraggingClass);
    root.classList.toggle(STYLE_CLASS, savedStyleClass);
    if (savedCursorValue) {
      root.style.setProperty(CURSOR_VAR, savedCursorValue, savedCursorPriority);
    } else {
      root.style.removeProperty(CURSOR_VAR);
    }
  };
}
