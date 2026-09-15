import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { getSharedSlot } from '../sharedState';
import { getDropTargetShadowRoots, subscribeDropTargetShadowRoots } from '../dropTarget';
import type { DragCleanupFn } from '../../../types/drag';

interface DragCursorState {
  /** The document whose root carries the drag class/var while locked; `null` otherwise. */
  lockedDocument: Document | null;
  /** The inline `--drag-cursor` value the lock overwrote, restored on unlock. */
  savedCursorValue: string;
  /** Whether the root already had the classes owned by this lock. */
  savedDraggingClass: boolean;
  savedStyleClass: boolean;
  /** Stylesheets installed per document and nonce. */
  styles: WeakMap<Document, Map<string, HTMLStyleElement>>;
  /** The cursor sheet built for each shadow root, reused across drags. */
  shadowSheets: WeakMap<ShadowRoot, CSSStyleSheet>;
  /** The shadow roots carrying the cursor sheet for the current lock. */
  lockedShadowRoots: Set<ShadowRoot>;
  /** Stops tracking drop-target shadow roots that appear mid-drag; `null` when unlocked. */
  unsubscribeShadowRoots: DragCleanupFn | null;
}

const state = getSharedSlot<DragCursorState>('dragCursor', () => ({
  lockedDocument: null,
  savedCursorValue: '',
  savedDraggingClass: false,
  savedStyleClass: false,
  styles: new WeakMap<Document, Map<string, HTMLStyleElement>>(),
  shadowSheets: new WeakMap<ShadowRoot, CSSStyleSheet>(),
  lockedShadowRoots: new Set<ShadowRoot>(),
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
 * Insert the scoped cursor rule into `doc` once.
 *
 * Injecting and removing the sheet per drag would invalidate style twice over
 * and re-run selector matching from scratch, so the rule is installed once and
 * gated on a class. Toggling that class still invalidates style for the whole
 * document — a universal selector cannot avoid that — so there is one recalc at
 * pickup and one at drop, and on a very large tree that shows up as a hitch at
 * the moment of lift. It buys the only thing that beats per-element cursors in
 * the document tree (the handle's `grab`, an input's `text`): `*` with
 * `!important`. Inline `cursor` on the root does not, because those elements set
 * their own. The cost is per drag, not per frame.
 *
 * Document styles stop at shadow boundaries, so a drop target's shadow tree keeps
 * its own `cursor: pointer` under this rule. Those trees get an equivalent adopted
 * sheet for the duration of the lock (see `adoptShadowRootCursor`).
 */
function ensureStyleInjected(doc: Document, nonce: string | undefined): boolean {
  const key = nonce ?? '';
  let documentStyles = state.styles.get(doc);
  const existing = documentStyles?.get(key);
  if (existing?.isConnected) {
    return true;
  }

  const style = doc.createElement('style');
  // The nonce must be present before insertion: a strict `style-src` policy
  // evaluates the element when it is attached, and adding the nonce afterwards
  // cannot make a rejected sheet trusted retroactively.
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
    sheet.insertRule(`html.${DRAGGING_CLASS}.${STYLE_CLASS} * { ${CURSOR_DECLARATION} }`);
  } catch {
    // A rejected CSP sheet can be inaccessible through CSSOM. Dragging itself
    // must keep working even when the cursor enhancement cannot be installed.
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
 * Adopt the cursor rule into a shadow root holding a drop target, for the
 * duration of the lock. Only the roots the engine already tracks are covered: a
 * shadow tree with no drop target in it keeps its own cursor while dragged over.
 *
 * Unlike the document sheet, this one is adopted and removed per drag rather
 * than gated on a class: a shadow tree cannot select the document's `<html>`
 * class portably, and the roots involved are small enough that the extra style
 * invalidation is not a concern. `--drag-cursor` inherits through the boundary,
 * so the same custom property drives it. Constructable sheets are exempt from
 * CSP `style-src`, so no nonce is needed; skipped where the CSSOM API is missing.
 */
function adoptShadowRootCursor(shadowRoot: ShadowRoot, doc: Document): void {
  if (
    state.lockedShadowRoots.has(shadowRoot) ||
    !('adoptedStyleSheets' in shadowRoot) ||
    ownerDocument(shadowRoot.host) !== doc
  ) {
    return;
  }
  let sheet = state.shadowSheets.get(shadowRoot);
  if (!sheet) {
    try {
      sheet = new (ownerWindow(shadowRoot.host).CSSStyleSheet)();
      sheet.replaceSync(`* { ${CURSOR_DECLARATION} }`);
    } catch {
      // Constructable stylesheets unsupported in this realm: the shadow tree keeps
      // its own cursor, and dragging itself keeps working.
      return;
    }
    state.shadowSheets.set(shadowRoot, sheet);
  }
  if (!shadowRoot.adoptedStyleSheets.includes(sheet)) {
    shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet];
  }
  state.lockedShadowRoots.add(shadowRoot);
}

function releaseShadowRootCursor(shadowRoot: ShadowRoot): void {
  if (!state.lockedShadowRoots.delete(shadowRoot)) {
    return;
  }
  const sheet = state.shadowSheets.get(shadowRoot);
  if (sheet && shadowRoot.adoptedStyleSheets.includes(sheet)) {
    shadowRoot.adoptedStyleSheets = shadowRoot.adoptedStyleSheets.filter(
      (adopted) => adopted !== sheet,
    );
  }
}

function applyCursorLock(
  element: Element,
  cursor: string,
  options: DragCursorStyleOptions = {},
): void {
  const doc = ownerDocument(element);
  const root = doc.documentElement;
  // Snapshot a pre-existing inline `--drag-cursor` (a consumer may set it to
  // theme the default) so unlock restores it instead of removing it.
  state.savedCursorValue = root.style.getPropertyValue(CURSOR_VAR);
  state.savedDraggingClass = root.classList.contains(DRAGGING_CLASS);
  state.savedStyleClass = root.classList.contains(STYLE_CLASS);
  root.style.setProperty(CURSOR_VAR, cursor);
  root.classList.add(DRAGGING_CLASS);
  if (!options.disableStyleElements && ensureStyleInjected(doc, options.nonce)) {
    root.classList.add(STYLE_CLASS);
    for (const shadowRoot of getDropTargetShadowRoots()) {
      adoptShadowRootCursor(shadowRoot, doc);
    }
    // A drop target mounting inside a new shadow root mid-drag gets the sheet too;
    // one unmounting takes it with it, so the root is left as it was found.
    state.unsubscribeShadowRoots = subscribeDropTargetShadowRoots((shadowRoot, registered) => {
      if (registered) {
        adoptShadowRootCursor(shadowRoot, doc);
      } else {
        releaseShadowRootCursor(shadowRoot);
      }
    });
  } else {
    root.classList.remove(STYLE_CLASS);
  }
  state.lockedDocument = doc;
}

function restoreLockedRoot(): void {
  state.unsubscribeShadowRoots?.();
  state.unsubscribeShadowRoots = null;
  for (const shadowRoot of Array.from(state.lockedShadowRoots)) {
    releaseShadowRootCursor(shadowRoot);
  }
  const doc = state.lockedDocument;
  if (doc) {
    const root = doc.documentElement;
    root.classList.toggle(DRAGGING_CLASS, state.savedDraggingClass);
    root.classList.toggle(STYLE_CLASS, state.savedStyleClass);
    if (state.savedCursorValue) {
      root.style.setProperty(CURSOR_VAR, state.savedCursorValue);
    } else {
      root.style.removeProperty(CURSOR_VAR);
    }
  }
  state.lockedDocument = null;
  state.savedCursorValue = '';
  state.savedDraggingClass = false;
  state.savedStyleClass = false;
}

/**
 * Force a cursor across the whole document while a pointer drag is active. The
 * global lifecycle admits one pointer session, so `lockedDocument` is also the
 * single-holder latch and a repeated call cannot overwrite the saved cursor.
 */
export function lock(element: Element, cursor: string, options?: DragCursorStyleOptions): void {
  if (state.lockedDocument !== null) {
    return;
  }
  applyCursorLock(element, cursor, options);
}

export function unlock(): void {
  restoreLockedRoot();
}

export function resetForTests(): void {
  restoreLockedRoot();
}
