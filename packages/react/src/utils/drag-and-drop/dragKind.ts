/**
 * Drag kinds: a draggable declares the one kind it is, a drop target and a monitor the
 * kinds they accept. Each kind carries the payload type of the things it tags.
 */

import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import type { AnyDragAccept, DragKind, DragSource, DropTargetRecord } from '../../types/drag';

/** Namespaces explicitly global identities, so a key can't collide with another `Symbol.for`. */
const KIND_ID_PREFIX = 'base-ui/drag-kind:';
// Its own namespace, so neither public factory can mint this id whatever name/key it receives.
const ANY_KIND_ID = Symbol.for('base-ui/drag-kind-sentinel:any');

/**
 * Creates a drag kind to pass to a draggable's `kind` and a drop target's
 * `accept`.
 *
 * ```ts
 * const card = Draggable.createKind<Card>('card');
 * ```
 *
 * Each call creates a unique identity. Declare the kind once and share it with every
 * draggable and drop target in the interaction. The name is only a debugging aid.
 * Separate calls with the same name do not match.
 *
 * Use {@link createGlobalKind} only when independently evaluated bundles deliberately
 * need to share a kind by a namespaced key.
 */
export function createKind<TPayload = undefined>(name: string): DragKind<TPayload> {
  return makeKind(name, Symbol(name));
}

/**
 * Creates a globally interned drag kind for integrations where independently evaluated
 * bundles must match without sharing the same kind value.
 *
 * ```ts
 * const card = Draggable.createGlobalKind<Card>('myapp/card');
 * ```
 *
 * The key is the runtime identity, so every call with the same key matches, including
 * calls made by another copy of the bundle. It must be namespaced (for example,
 * `'myapp/card'`) because using the same key with incompatible payload types bypasses
 * TypeScript and causes the integrations to exchange the wrong payload at runtime.
 * Prefer {@link createKind} when the kind value can be shared directly.
 * @param key - A namespaced global key such as `'myapp/card'`.
 */
export function createGlobalKind<TPayload = undefined>(key: string): DragKind<TPayload> {
  const separatorIndex = key.indexOf('/');
  if (separatorIndex <= 0 || key.endsWith('/')) {
    throw new Error(
      'Base UI: createGlobalKind requires a namespaced key. ' +
        'Global drag kind keys are shared page-wide, so an unnamespaced key can collide with another integration and expose the wrong payload type. ' +
        'Use a key such as "myapp/card". ' +
        'See https://base-ui.com/react/drag-and-drop/overview',
    );
  }
  return makeKind(key, Symbol.for(KIND_ID_PREFIX + key));
}

function makeKind<TPayload>(name: string, id: symbol): DragKind<TPayload> {
  const matches = (value: DragSource<unknown> | DropTargetRecord<unknown>) => value.kind === id;
  return {
    name,
    id,
    // A type predicate can't be inferred from an implementation, so it is asserted here.
    matches: matches as DragKind<TPayload>['matches'],
  };
}

/**
 * A catch-all kind for a drop target that accepts every drag on the page.
 *
 * ```tsx
 * <DropTarget.Root accept={DropTarget.anyKind} onDrop={commit} />
 * ```
 *
 * The accepted source's payload is `unknown` until narrowed with a specific kind.
 */
export const anyDragKind: DragKind<unknown> = {
  name: 'any',
  // Interned, and matched on `.id` rather than object identity, because a doubly bundled
  // engine (or a hot reload) has two copies of this module. An identity check across them
  // would fail, leaving a catch-all target accepting nothing.
  id: ANY_KIND_ID,
  // Never called: `matchesAccept` short-circuits on this id, and nothing declares
  // `anyDragKind` as its `kind`. Answering `true` keeps it honest if a consumer does
  // reach for it as a predicate.
  matches: ((value: unknown) => value != null) as unknown as DragKind<unknown>['matches'],
};

/**
 * Tests a source against an `accept` declaration. Omitted (monitors, auto-scrollers) or
 * {@link anyDragKind} accepts any source; a kind or an array of kinds matches on the
 * source's own kind.
 */
export function matchesAccept(
  accept: AnyDragAccept | undefined,
  // Only `kind` is read, so this accepts a source carrying any payload.
  source: Pick<DragSource<unknown>, 'kind'>,
): boolean {
  if (accept === undefined || (accept as DragKind<unknown>).id === ANY_KIND_ID) {
    return true;
  }
  if (Array.isArray(accept)) {
    return accept.some((kind) => kind.id === ANY_KIND_ID || kind.id === source.kind);
  }
  return (accept as DragKind<unknown>).id === source.kind;
}

/**
 * Content comparison for an `accept` value, not identity: it is commonly an
 * inline array (`accept={[card, file]}`) whose identity changes every render
 * while the kinds inside don't.
 */
export function sameAccept(a: AnyDragAccept | undefined, b: AnyDragAccept | undefined): boolean {
  if (a === b) {
    return true;
  }
  return Array.isArray(a) && Array.isArray(b) && areArraysEqual(a, b);
}
