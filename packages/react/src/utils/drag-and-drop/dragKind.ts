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
 * Creates a kind to pass to a draggable's `kind` prop and a drop target's `accept` prop.
 * The type argument declares the payload of the items of this kind.
 *
 * ```ts
 * const card = Draggable.createKind<Card>('card');
 * ```
 *
 * Each call creates a unique kind, so declare it once and share the value with every
 * draggable and drop target of the interaction. The name is only a debugging aid.
 */
export function createKind<TPayload = undefined, TDragData = unknown>(
  name: string,
): DragKind<TPayload, TDragData> {
  return makeKind(name, Symbol(name));
}

/**
 * Creates a kind identified by a string key rather than by the returned object.
 * Kinds from `createKind` match only when the source and the target received the
 * same object, which code that doesn't share modules, such as a plugin loaded at
 * runtime or a second copy of a package, can't do. Two `createGlobalKind` calls
 * with the same key match each other from anywhere on the page.
 *
 * ```ts
 * const card = Draggable.createGlobalKind<Card>('myapp/card');
 * ```
 *
 * Keys are shared by the whole page, so prefix them with your app or package name
 * to avoid colliding with another library's kinds. Both sides must agree on the
 * payload type, which TypeScript can't check across bundles. Prefer
 * {@link createKind} whenever the source and the target can import the same constant.
 * @param key - A key such as `'myapp/card'`.
 */
export function createGlobalKind<TPayload = undefined, TDragData = unknown>(
  key: string,
): DragKind<TPayload, TDragData> {
  return makeKind(key, Symbol.for(KIND_ID_PREFIX + key));
}

function makeKind<TPayload, TDragData>(name: string, id: symbol): DragKind<TPayload, TDragData> {
  const matches = (value: DragSource<unknown> | DropTargetRecord<unknown>) => value.kind === id;
  return {
    name,
    id,
    // A type predicate can't be inferred from an implementation, so it is asserted here.
    matches: matches as DragKind<TPayload, TDragData>['matches'],
  } as DragKind<TPayload, TDragData>;
}

/**
 * A kind that matches every drag. Pass it to a drop target's `accept` prop to accept everything.
 *
 * ```tsx
 * <Draggable.Target accept={Draggable.anyKind} onDraggableDrop={commit} />
 * ```
 *
 * The resulting `source.payload` is `unknown` until narrowed with a specific kind's `matches` method.
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
} as DragKind<unknown>;

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
