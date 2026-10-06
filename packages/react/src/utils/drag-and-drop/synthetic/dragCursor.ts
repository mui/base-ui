import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { getSharedSlot } from '../sharedState';
import { trackDropTargetShadowRoots } from '../dropTarget';
import { adoptStyleSheet, unadoptStyleSheet } from '../utils';
import type { DragCleanupFn } from '../types';

interface DragCursorState {
  /** The document whose root has the drag class and variable, or `null` when unlocked. */
  lockedDocument: Document | null;
  /** The inline `--drag-cursor` value the lock overwrote, restored on unlock. */
  savedCursorValue: string;
  savedCursorPriority: string;
  /** Whether the root already had the classes owned by this lock. */
  savedDraggingClass: boolean;
  savedStyleClass: boolean;
  /** Stylesheets installed per document and nonce. */
  styles: WeakMap<Document, Map<string, HTMLStyleElement>>;
  /** The cursor sheet built for each shadow root, reused across drags. */
  shadowSheets: WeakMap<ShadowRoot, CSSStyleSheet>;
  /** Removes the cursor sheet from every drop-target shadow root, or `null` when unlocked. */
  unsubscribeShadowRoots: DragCleanupFn | null;
}

const state = getSharedSlot<DragCursorState>('dragCursor', () => ({
  lockedDocument: null,
  savedCursorValue: '',
  savedCursorPriority: '',
  savedDraggingClass: false,
  savedStyleClass: false,
  styles: new WeakMap<Document, Map<string, HTMLStyleElement>>(),
  shadowSheets: new WeakMap<ShadowRoot, CSSStyleSheet>(),
  unsubscribeShadowRoots: null,
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
 * Insert the scoped cursor rule into `doc` once. Returns `false` when the sheet
 * can't be installed.
 *
 * Adding and removing the sheet on every drag would invalidate style twice and
 * redo selector matching, so the rule is installed once and gated on a class.
 * Toggling the class still invalidates style for the whole document, since the
 * rule uses a universal selector. That is one recalc at pickup and one at drop,
 * which can cause a hitch at lift on a very large tree, but nothing per frame.
 *
 * `*` with `!important` is the only way to override per-element cursors such as
 * a handle's `grab` or an input's `text`. An inline `cursor` on the root doesn't
 * work, because those elements set their own.
 *
 * Document styles stop at shadow boundaries, so a drop target's shadow tree
 * keeps its own `cursor: pointer`. Those trees get an equivalent adopted sheet
 * while the lock is held (see `adoptShadowRootCursor`).
 */
function ensureStyleInjected(doc: Document, nonce: string | undefined): boolean {
  const key = nonce ?? '';
  let documentStyles = state.styles.get(doc);
  const existing = documentStyles?.get(key);
  if (existing?.isConnected) {
    return true;
  }

  const style = doc.createElement('style');
  // Set the nonce before insertion. A strict `style-src` policy checks the
  // element when it is attached, and a nonce added later can't un-reject it.
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
    // CSSOM access can throw on a sheet that CSP rejected. Dragging still works
    // without the cursor rule.
    style.remove();
    return false;
  }

  if (!documentStyles) {
    documentStyles = new Map<string, HTMLStyleElement>();
    state.styles.set(doc, documentStyles);
  }
  documentStyles.set(key, style);
  return true;
}

/**
 * Adopt the cursor rule into a shadow root that holds a drop target, while the
 * lock is held. Only roots the engine already tracks are covered, so a shadow
 * tree without a drop target keeps its own cursor.
 *
 * Unlike the document sheet, this one is adopted and removed on each drag
 * instead of gated on a class. A shadow tree can't portably select the
 * document's `<html>` class, and these roots are small enough that the extra
 * style invalidation doesn't matter. `--drag-cursor` inherits through the
 * boundary, so the same custom property drives both. Constructable sheets are
 * exempt from CSP `style-src` and need no nonce. Does nothing where the CSSOM
 * API is missing.
 */
function adoptShadowRootCursor(shadowRoot: ShadowRoot, doc: Document): DragCleanupFn | undefined {
  if (!('adoptedStyleSheets' in shadowRoot) || ownerDocument(shadowRoot.host) !== doc) {
    return undefined;
  }
  let sheet = state.shadowSheets.get(shadowRoot);
  if (!sheet) {
    try {
      sheet = new (ownerWindow(shadowRoot.host).CSSStyleSheet)();
      sheet.replaceSync(`* { ${CURSOR_DECLARATION} }`);
    } catch {
      // No constructable stylesheets in this realm. The shadow tree keeps its own
      // cursor, and dragging still works.
      return undefined;
    }
    state.shadowSheets.set(shadowRoot, sheet);
  }
  adoptStyleSheet(shadowRoot, sheet);
  return () => unadoptStyleSheet(shadowRoot, sheet);
}

export function unlock(): void {
  state.unsubscribeShadowRoots?.();
  state.unsubscribeShadowRoots = null;
  const doc = state.lockedDocument;
  if (doc) {
    const root = doc.documentElement;
    root.classList.toggle(DRAGGING_CLASS, state.savedDraggingClass);
    root.classList.toggle(STYLE_CLASS, state.savedStyleClass);
    if (state.savedCursorValue) {
      root.style.setProperty(CURSOR_VAR, state.savedCursorValue, state.savedCursorPriority);
    } else {
      root.style.removeProperty(CURSOR_VAR);
    }
  }
  // The saved values are overwritten by the next lock before they are read again.
  state.lockedDocument = null;
}

/**
 * Force a cursor across the whole document while a pointer drag is active. Only
 * one pointer session runs at a time, so a set `lockedDocument` means the lock is
 * held, and a repeated call can't overwrite the saved cursor.
 */
export function lock(element: Element, cursor: string, options: DragCursorStyleOptions = {}): void {
  if (state.lockedDocument !== null) {
    return;
  }
  const doc = ownerDocument(element);
  const root = doc.documentElement;
  // Save any inline `--drag-cursor` a consumer set to theme the default, so
  // unlock restores it instead of removing it.
  state.savedCursorValue = root.style.getPropertyValue(CURSOR_VAR);
  state.savedCursorPriority = root.style.getPropertyPriority(CURSOR_VAR);
  state.savedDraggingClass = root.classList.contains(DRAGGING_CLASS);
  state.savedStyleClass = root.classList.contains(STYLE_CLASS);
  root.style.setProperty(CURSOR_VAR, cursor);
  root.classList.add(DRAGGING_CLASS);
  if (!options.disableStyleElements && ensureStyleInjected(doc, options.nonce)) {
    root.classList.add(STYLE_CLASS);
    // A drop target that mounts in a new shadow root mid-drag gets the sheet too.
    // When it unmounts, the sheet goes with it and the root is left as it was.
    state.unsubscribeShadowRoots = trackDropTargetShadowRoots((shadowRoot) =>
      adoptShadowRootCursor(shadowRoot, doc),
    );
  } else {
    root.classList.remove(STYLE_CLASS);
  }
  state.lockedDocument = doc;
}
