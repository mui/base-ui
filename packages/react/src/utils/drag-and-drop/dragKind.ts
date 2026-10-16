/**
 * Drag kinds. A draggable declares its kind, and drop targets and monitors declare the
 * kinds they accept. Each kind carries the payload type of its items.
 */

import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import type {
  DraggableAccept,
  DraggableAcceptedKind,
  DraggableKind,
} from '../../draggable/DraggableProvider';
import type { DraggableRootRecord } from '../../draggable/root/DraggableRoot';
import type { DraggableTargetRecord } from '../../draggable/target/DraggableTarget';

/** Prefixes global kind ids, so a key can't collide with an unrelated `Symbol.for` key. */
const KIND_ID_PREFIX = 'base-ui/drag-kind:';
// A separate namespace, so neither public factory can produce this id.
const ANY_KIND_ID = Symbol.for('base-ui/drag-kind-sentinel:any');

/**
 * Creates a kind to pass to a draggable's `kind` prop and a drop target's `accept` prop.
 * The type argument declares the payload of the items of this kind. Each call creates a
 * unique kind, so declare it once and share it with every draggable and drop target of the
 * interaction. The name is only a debugging aid.
 *
 * ```ts
 * const card = Draggable.createKind<Card>('card');
 * ```
 */
export function createKind<TPayload = undefined, TDragData = unknown>(
  name: string,
): DraggableKind<TPayload, TDragData> {
  return makeKind(name, Symbol(name));
}

/**
 * Creates a kind identified by a string key, for code that can't share a `createKind`
 * object, such as a plugin loaded at runtime or a second copy of a package. Calls with the
 * same key match anywhere on the page, so prefix keys with your app or package name. Both
 * sides must agree on the payload type, which TypeScript can't check across bundles.
 *
 * ```ts
 * const card = Draggable.createGlobalKind<Card>('myapp/card');
 * ```
 * @param key - A key such as `'myapp/card'`.
 */
export function createGlobalKind<TPayload = undefined, TDragData = unknown>(
  key: string,
): DraggableKind<TPayload, TDragData> {
  return makeKind(key, Symbol.for(KIND_ID_PREFIX + key));
}

function makeKind<TPayload, TDragData>(
  name: string,
  id: symbol,
): DraggableKind<TPayload, TDragData> {
  const matches = (value: DraggableRootRecord<unknown> | DraggableTargetRecord<unknown>) =>
    value.kind === id;
  return {
    name,
    id,
    // A type predicate can't be inferred from an implementation, so it is asserted here.
    matches: matches as DraggableKind<TPayload, TDragData>['matches'],
  } as DraggableKind<TPayload, TDragData>;
}

/**
 * A kind that matches every drag. Pass it to a drop target's `accept` prop to accept everything.
 * `source.payload` is then `unknown` until narrowed with a specific kind's `matches` method.
 * It only fits `accept`: a draggable, a preview, or a collision provider can't use it as its `kind`.
 *
 * ```tsx
 * <Draggable.Target accept={Draggable.anyKind} onDraggableDrop={commit} />
 * ```
 */
export const anyDragKind: DraggableAcceptedKind<unknown> = {
  name: 'any',
  // Matched on the interned `.id`, not object identity: a doubly bundled engine or a
  // hot reload has two copies of this module, and a catch-all target would accept nothing.
  id: ANY_KIND_ID,
  // The engine never calls this (`matchesAccept` short-circuits on the id). It answers
  // `true` for any record in case a consumer calls it as a predicate.
  matches: ((value: unknown) =>
    value != null) as unknown as DraggableAcceptedKind<unknown>['matches'],
};

/**
 * Tests a source against an `accept` declaration. An omitted `accept` or {@link anyDragKind}
 * accepts any source. This runs for every target and viewport each frame, where a `TypeError`
 * would break the drag, so a plain-JS `null` counts as omitted and an array hole matches nothing.
 */
export function matchesAccept(
  accept: DraggableAccept<unknown> | undefined,
  // Only `kind` is read, so this accepts a source carrying any payload.
  source: Pick<DraggableRootRecord<unknown>, 'kind'>,
): boolean {
  if (accept == null || (accept as DraggableAcceptedKind<unknown>).id === ANY_KIND_ID) {
    return true;
  }
  if (Array.isArray(accept)) {
    return accept.some((kind) => kind?.id === ANY_KIND_ID || kind?.id === source.kind);
  }
  return (accept as DraggableAcceptedKind<unknown>).id === source.kind;
}

/**
 * Compares two `accept` values by content, since an inline array such as
 * `accept={[card, file]}` is a new object on every render.
 */
export function sameAccept(
  a: DraggableAccept<unknown> | undefined,
  b: DraggableAccept<unknown> | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  return Array.isArray(a) && Array.isArray(b) && areArraysEqual(a, b);
}
