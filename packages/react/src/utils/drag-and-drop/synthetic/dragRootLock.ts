import { ownerDocument } from '@base-ui/utils/owner';
import { getSharedSlot } from '../sharedState';

/** The inline styles the lock sets to `none` on every root it holds. */
const LOCKED_PROPS = [
  { style: 'touchAction', property: 'touch-action' },
  { style: 'userSelect', property: 'user-select' },
  { style: 'webkitUserSelect', property: '-webkit-user-select' },
  { style: 'webkitTouchCallout', property: '-webkit-touch-callout' },
  { style: 'overscrollBehavior', property: 'overscroll-behavior' },
];

interface SavedStyle {
  element: HTMLElement;
  style: string;
  property: string;
  value: string | undefined;
  priority: string;
}

interface DragRootLockState {
  /** The inline styles the lock overwrote, or `null` when unlocked. */
  locked: SavedStyle[] | null;
}

const state = getSharedSlot<DragRootLockState>('dragRootLock', () => ({
  locked: null,
}));

/**
 * Collect the `<html>` and `<body>` of `doc` and of every ancestor document up
 * the iframe chain. During a touch drag inside an iframe, the outer document can
 * still scroll or select text unless its roots are locked too. Same-origin
 * ancestors are reachable through `frameElement`. A cross-origin one throws on
 * access, so the climb stops there.
 */
function collectLockElements(doc: Document): HTMLElement[] {
  const elements: HTMLElement[] = [];
  let current: Document | null = doc;

  while (current) {
    elements.push(current.documentElement);
    if (current.body) {
      elements.push(current.body);
    }
    try {
      current = current.defaultView?.frameElement?.ownerDocument ?? null;
    } catch {
      // Cross-origin ancestor. Stop climbing.
      current = null;
    }
  }

  return elements;
}

export function unlock(): void {
  const locked = state.locked;
  if (locked) {
    for (const { element, style, value } of locked) {
      if (value === undefined) {
        delete (element.style as unknown as Partial<Record<string, string>>)[style];
      } else {
        (element.style as unknown as Record<string, string>)[style] = value;
      }
    }
    // Restore priorities after values because prefixed aliases can reset them.
    for (const { element, property, value, priority } of locked) {
      if (priority && value !== undefined) {
        element.style.setProperty(property, value, priority);
      }
    }
  }
  state.locked = null;
}

/**
 * Freeze scrolling, selection and the callout menu on the dragged element's
 * document and every reachable ancestor document while a pointer drag runs.
 * Only one pointer session runs at a time, so a saved lock means the lock is
 * held. A repeated call returns early and keeps the original restoration data.
 */
export function lock(element: Element): void {
  if (state.locked !== null) {
    return;
  }
  // Lock both `<html>` and `<body>`. iOS Safari and some Android browsers apply
  // `touch-action` and `overscroll-behavior` on `body` independently of `html`,
  // so locking only one lets scroll leak through. Locking only the inner document
  // would let an iframe's host page scroll.
  //
  // Read all original values before writing any. `userSelect` and
  // `webkitUserSelect` alias each other, so saving and setting in one pass would
  // capture the locked value.
  const saved = collectLockElements(ownerDocument(element)).flatMap((root) =>
    LOCKED_PROPS.map(({ style, property }) => ({
      element: root,
      style,
      property,
      value: root.style[style as keyof CSSStyleDeclaration] as string | undefined,
      priority: root.style.getPropertyPriority(property),
    })),
  );
  for (const { element: root, style } of saved) {
    (root.style as unknown as Record<string, string>)[style] = 'none';
  }
  state.locked = saved;
}
