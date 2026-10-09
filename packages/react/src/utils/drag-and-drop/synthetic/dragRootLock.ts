import { ownerDocument } from '@base-ui/utils/owner';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { getSharedSlot } from '../sharedState';
import type { DragCleanupFn } from '../types';

/** An inline style the engine overrides, with the value it sets. */
export interface InlineStyleOverride {
  /** The `CSSStyleDeclaration` key, such as `webkitUserSelect`. */
  property: string;
  /** The CSS property name, such as `-webkit-user-select`, used for its priority. */
  cssName: string;
  value: string;
}

/**
 * Override inline styles on `element` and return a cleanup that restores them. All values
 * are read before any is written, since `userSelect` and `webkitUserSelect` alias in some
 * engines. The restore skips a property changed since, so a consumer's later inline
 * style wins.
 */
export function overrideInlineStyles(
  element: HTMLElement,
  overrides: readonly InlineStyleOverride[],
): DragCleanupFn {
  const style = element.style;
  const values = style as unknown as Record<string, string | undefined>;
  const saved = overrides.map((override) => ({
    ...override,
    previous: values[override.property] ?? '',
    priority: style.getPropertyPriority(override.cssName),
  }));
  for (const { property, value } of saved) {
    values[property] = value;
  }
  return () => {
    // Check every property before restoring any, for the same aliasing reason.
    const unchanged = saved.filter(({ property, value }) => values[property] === value);
    for (const { property, previous } of unchanged) {
      values[property] = previous;
    }
    // Restore priorities after values because prefixed aliases can reset them.
    for (const { cssName, previous, priority } of unchanged) {
      if (priority) {
        style.setProperty(cssName, previous, priority);
      }
    }
  };
}

/** The inline styles that stop text selection and the touch callout menu. */
export const SELECTION_LOCK_STYLES: readonly InlineStyleOverride[] = [
  { property: 'userSelect', cssName: 'user-select', value: 'none' },
  { property: 'webkitUserSelect', cssName: '-webkit-user-select', value: 'none' },
  { property: 'webkitTouchCallout', cssName: '-webkit-touch-callout', value: 'none' },
];

/** The inline styles the lock sets to `none` on every root it holds. */
const LOCKED_STYLES: readonly InlineStyleOverride[] = [
  { property: 'touchAction', cssName: 'touch-action', value: 'none' },
  ...SELECTION_LOCK_STYLES,
  { property: 'overscrollBehavior', cssName: 'overscroll-behavior', value: 'none' },
];

interface DragRootLockState {
  /** Restores the inline styles the lock overwrote, or `null` when unlocked. */
  restore: DragCleanupFn | null;
}

const state = getSharedSlot<DragRootLockState>('dragRootLock', () => ({
  restore: null,
}));

/**
 * Collect the `<html>` and `<body>` of `doc` and every ancestor document up the
 * iframe chain, since the outer page can still scroll or select text during a touch
 * drag in an iframe. The climb stops at a cross-origin ancestor, which throws.
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
  const restore = state.restore;
  state.restore = null;
  restore?.();
}

/**
 * Freeze scrolling, selection and the callout menu on the element's document and
 * every reachable ancestor document during a pointer drag. Only one pointer session
 * runs at a time, so a repeated call while held keeps the original restore data.
 */
export function lock(element: Element): void {
  if (state.restore !== null) {
    return;
  }
  // iOS Safari and some Android browsers apply `touch-action` and
  // `overscroll-behavior` on `<body>` independently of `<html>`, so both are locked.
  state.restore = mergeCleanups(
    ...collectLockElements(ownerDocument(element)).map((root) =>
      overrideInlineStyles(root, LOCKED_STYLES),
    ),
  );
}
