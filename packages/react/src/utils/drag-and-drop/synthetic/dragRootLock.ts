import { ownerDocument } from '@base-ui/utils/owner';
import { getSharedSlot } from '../sharedState';
import { createRefCountedLock } from './refCountedLock';

const LOCKED_PROPS: Array<{ style: LockedProperty; value: string }> = [
  { style: 'touchAction', value: 'none' },
  { style: 'userSelect', value: 'none' },
  { style: 'webkitUserSelect', value: 'none' },
  { style: 'webkitTouchCallout', value: 'none' },
  { style: 'overscrollBehavior', value: 'none' },
];

interface LockedRoot {
  /** `<html>` and `<body>`, in that order. */
  elements: HTMLElement[];
  /** Saved per-element styles, parallel to `elements`. */
  saved: Array<Partial<Record<LockedProperty, string | undefined>>>;
}

interface DragRootLockState {
  locked: LockedRoot | null;
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
  const seen = new Set<Document>();

  while (current && !seen.has(current)) {
    seen.add(current);
    elements.push(current.documentElement);
    if (current.body) {
      elements.push(current.body);
    }
    let parentDoc: Document | null = null;
    try {
      const hostFrame: Element | null = current.defaultView?.frameElement ?? null;
      parentDoc = hostFrame?.ownerDocument ?? null;
    } catch {
      // Cross-origin ancestor: not reachable, stop climbing.
      parentDoc = null;
    }
    current = parentDoc;
  }

  return elements;
}

function applyRootLock(element: Element): void {
  // Lock both `<html>` and `<body>` on the dragged element's document and every
  // reachable ancestor document. iOS Safari and some Android browsers honour
  // `touch-action`/`overscroll-behavior` on `body` independently of `html`;
  // locking only one element lets scroll still leak through during a synthetic
  // drag, and locking only the inner document lets an iframe's host page scroll.
  const doc = ownerDocument(element);
  const elements = collectLockElements(doc);

  const saved: Array<Partial<Record<LockedProperty, string | undefined>>> = [];
  // Read all originals before writing any: `userSelect`/`webkitUserSelect` alias
  // each other, so interleaved save+set would capture the locked value instead.
  for (const el of elements) {
    const elSaved: Partial<Record<LockedProperty, string | undefined>> = {};
    for (const { style } of LOCKED_PROPS) {
      elSaved[style] = el.style[style as keyof CSSStyleDeclaration] as string;
    }
    saved.push(elSaved);
  }
  for (const el of elements) {
    for (const { style, value } of LOCKED_PROPS) {
      (el.style as unknown as Record<string, string>)[style] = value;
    }
  }
  state.locked = { elements, saved };
}

function restoreLockedStyles(): void {
  const locked = state.locked;
  if (locked) {
    for (let i = 0; i < locked.elements.length; i += 1) {
      const el = locked.elements[i];
      const elSaved = locked.saved[i];
      for (const { style } of LOCKED_PROPS) {
        const prev = elSaved[style];
        if (prev === undefined) {
          delete (el.style as unknown as Partial<Record<string, string>>)[style];
        } else {
          (el.style as unknown as Record<string, string>)[style] = prev;
        }
      }
    }
  }
  state.locked = null;
}

/**
 * Freeze scrolling, selection and the callout menu on the dragged element's
 * document (and every reachable ancestor document) while a pointer drag runs.
 */
export const { lock, unlock, resetForTests } = createRefCountedLock<[Element]>({
  slot: 'dragRootLock.lock',
  acquire: applyRootLock,
  release: restoreLockedStyles,
});

type LockedProperty =
  | 'touchAction'
  | 'userSelect'
  | 'webkitUserSelect'
  | 'webkitTouchCallout'
  | 'overscrollBehavior';
