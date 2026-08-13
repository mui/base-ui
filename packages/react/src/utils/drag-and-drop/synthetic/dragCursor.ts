import { ownerDocument } from '@base-ui/utils/owner';
import { getSharedSlot } from '../sharedState';
import { createRefCountedLock } from './refCountedLock';

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
}

const state = getSharedSlot<DragCursorState>('dragCursor', () => ({
  lockedDocument: null,
  savedCursorValue: '',
  savedDraggingClass: false,
  savedStyleClass: false,
  styles: new WeakMap<Document, Map<string, HTMLStyleElement>>(),
}));

const DRAGGING_CLASS = 'baseui-dragging';
const STYLE_CLASS = 'baseui-dragging-styles';
const CURSOR_VAR = '--drag-cursor';

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
 * the moment of lift. It buys the only thing that reliably beats per-element
 * cursors (the handle's `grab`, an input's `text`): `*` with `!important`.
 * Inline `cursor` on the root does not, because those elements set their own.
 * The cost is per drag, not per frame.
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
    sheet.insertRule(
      `html.${DRAGGING_CLASS}.${STYLE_CLASS} * { cursor: var(${CURSOR_VAR}, grabbing) !important; }`,
    );
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
  } else {
    root.classList.remove(STYLE_CLASS);
  }
  state.lockedDocument = doc;
}

function restoreLockedRoot(): void {
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
 * Force a cursor across the whole document while a pointer drag is active.
 * Unlocking at depth 0 removes the class and restores the variable to its
 * pre-lock value (a consumer may set it inline to theme the default).
 */
export const { lock, unlock, resetForTests } = createRefCountedLock<
  [Element, string, DragCursorStyleOptions?]
>({
  slot: 'dragCursor.lock',
  acquire: applyCursorLock,
  release: restoreLockedRoot,
});
