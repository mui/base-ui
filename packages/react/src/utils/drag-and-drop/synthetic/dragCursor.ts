import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { getSharedSlot } from '../sharedState';
import { trackDropTargetShadowRoots } from '../dropTarget';
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
  const existing = state.styles.get(doc)?.get(key);
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

  getOrCreate(state.styles, doc, () => new Map()).set(key, style);
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
  let sheet: CSSStyleSheet;
  try {
    sheet = getOrCreate(state.shadowSheets, shadowRoot, () => {
      const created = new (ownerWindow(shadowRoot.host).CSSStyleSheet)();
      created.replaceSync(`* { ${CURSOR_DECLARATION} }`);
      return created;
    });
  } catch {
    // No constructable stylesheets in this realm. The shadow tree keeps its own
    // cursor, and dragging still works.
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
 * Force a cursor across the whole document while a pointer drag is active. Only
 * one pointer session runs at a time, so a set `restore` means the lock is held,
 * and a repeated call can't overwrite the saved cursor.
 */
export function lock(element: Element, cursor: string, options: DragCursorStyleOptions = {}): void {
  if (state.restore !== null) {
    return;
  }
  const doc = ownerDocument(element);
  const root = doc.documentElement;
  // Save any inline `--drag-cursor` a consumer set to theme the default, so
  // unlock restores it instead of removing it. Also save whether the root already
  // had the classes owned by this lock.
  const savedCursorValue = root.style.getPropertyValue(CURSOR_VAR);
  const savedCursorPriority = root.style.getPropertyPriority(CURSOR_VAR);
  const savedDraggingClass = root.classList.contains(DRAGGING_CLASS);
  const savedStyleClass = root.classList.contains(STYLE_CLASS);
  root.style.setProperty(CURSOR_VAR, cursor);
  root.classList.add(DRAGGING_CLASS);
  let unsubscribeShadowRoots: DragCleanupFn | null = null;
  if (!options.disableStyleElements && ensureStyleInjected(doc, options.nonce)) {
    root.classList.add(STYLE_CLASS);
    // A drop target that mounts in a new shadow root mid-drag gets the sheet too.
    // When it unmounts, the sheet goes with it and the root is left as it was.
    unsubscribeShadowRoots = trackDropTargetShadowRoots((shadowRoot) =>
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
