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
 * Collect the `<html>`/`<body>` of `doc` and of every ancestor document up the
 * iframe chain. During an iframe touch drag the outer document can still
 * scroll/select unless its roots are locked too; a same-origin ancestor is
 * reachable via `frameElement`, and a cross-origin one throws on access — caught
 * and treated as the top of the reachable chain.
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
      // Cross-origin ancestor: not reachable, stop climbing.
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
 * document (and every reachable ancestor document) while a pointer drag runs.
 * The global lifecycle admits one pointer session, so the saved lock itself is
 * the single-holder latch; a repeated call must not replace its restoration data.
 */
export function lock(element: Element): void {
  if (state.locked !== null) {
    return;
  }
  // Lock both `<html>` and `<body>` on the dragged element's document and every
  // reachable ancestor document. iOS Safari and some Android browsers honour
  // `touch-action`/`overscroll-behavior` on `body` independently of `html`;
  // locking only one element lets scroll still leak through during a synthetic
  // drag, and locking only the inner document lets an iframe's host page scroll.
  //
  // Read all originals before writing any: `userSelect`/`webkitUserSelect` alias
  // each other, so interleaved save+set would capture the locked value instead.
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
