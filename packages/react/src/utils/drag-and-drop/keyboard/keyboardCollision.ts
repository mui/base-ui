/**
 * Direction-based drop-target collision for keyboard dragging: given an arrow
 * key, pick the nearest accepting drop target ahead in that direction, biased
 * against cross-axis drift so navigation feels grid-like.
 *
 * The virtual cursor is aimed at one of two points, chosen per target. A reorder
 * row — a collection's per-item target, which reads its before/after insertion
 * side from where the cursor sits within it — is entered at its far entering
 * edge, so reversing direction toggles before/after on the same row. A plain
 * drop zone has no side to express, so it is entered at its center: one press
 * per zone, no far-edge parking.
 */

import { ownerDocument } from '@base-ui/utils/owner';
import {
  getDeclaredDropTargetPayload,
  getRegisteredDropTargetElements,
  resolveDropTarget,
} from '../dropTarget';
import { isReorderRowPayload } from '../reorderRow';
import { remapInput } from '../utils';
import type {
  DragSource,
  DragInput,
  DropTargetRecord,
  DragKeyboardArrowKey,
  DragKeyboardMoveTarget,
  DragPosition,
} from '../../../types/drag';

interface DirectionalTargetParameters {
  key: DragKeyboardArrowKey;
  source: DragSource;
  input: DragInput;
  /** The dragged source element, skipped as a candidate. */
  exclude: Element | null;
  /**
   * The session's modifier clamp — the same transform the sensor applies to
   * every committed point. The reversal check compares the parked cursor to a
   * row's back entry edge, and with modifiers the cursor was parked at the
   * *modified* edge; comparing against the raw one would break the `→ ←`
   * round trip under a displacing modifier like `snapToGrid`.
   */
  modifyPoint?: ((point: DragPosition) => DragPosition) | undefined;
}

/** The center point of a rect, in client coordinates. */
export function rectCenter(rect: DOMRect): DragPosition {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/** Unit vector for an arrow key (`ArrowUp` is `{ x: 0, y: -1 }`, …). */
export function unitVector(key: DragKeyboardArrowKey): DragPosition {
  switch (key) {
    case 'ArrowUp':
      return { x: 0, y: -1 };
    case 'ArrowDown':
      return { x: 0, y: 1 };
    case 'ArrowLeft':
      return { x: -1, y: 0 };
    case 'ArrowRight':
      return { x: 1, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}

function oppositeKey(key: DragKeyboardArrowKey): DragKeyboardArrowKey {
  switch (key) {
    case 'ArrowUp':
      return 'ArrowDown';
    case 'ArrowDown':
      return 'ArrowUp';
    case 'ArrowLeft':
      return 'ArrowRight';
    default: // ArrowRight
      return 'ArrowLeft';
  }
}

// Sub-pixel slack for matching the cursor to a target's entry edge. In the
// reversal case `entryPoint` parked the cursor exactly there on the previous
// move, so the coordinates are identical bar rect jitter; the tolerance stays
// tight so an arbitrary mid-container drag-start position never reads as an
// entry edge.
const REVERSAL_ENTRY_TOLERANCE = 1;

/**
 * Whether a target reads a before/after insertion side from the cursor's
 * position within it, and so is entered at its edge rather than its center. A
 * collection brands its per-item targets' payload (see {@link isReorderRowPayload});
 * checking the brand here avoids a dependency on the collection layer above,
 * and a public payload cannot claim the semantics by coincidence.
 */
function isReorderItemTarget(record: DropTargetRecord): boolean {
  return isReorderRowPayload(record.payload);
}

/**
 * The point to aim the virtual cursor at for a reorder row entered via `key`:
 * centered on the cross axis, biased to the far edge in the movement direction
 * so `computeDropPosition` resolves the insertion side matching the movement.
 * Horizontal parking is physical in both LTR and RTL: `computeDropPosition`
 * already maps physical to reading order for RTL rows, so flipping here too
 * would double-invert and break the reversal round trip.
 */
export function entryPoint(rect: DOMRect, key: DragKeyboardArrowKey): DragPosition {
  const { x: centerX, y: centerY } = rectCenter(rect);
  switch (key) {
    case 'ArrowUp':
      return { x: centerX, y: rect.top + rect.height * 0.1 };
    case 'ArrowDown':
      return { x: centerX, y: rect.top + rect.height * 0.9 };
    case 'ArrowLeft':
      return { x: rect.left + rect.width * 0.1, y: centerY };
    default: // ArrowRight
      return { x: rect.left + rect.width * 0.9, y: centerY };
  }
}

/**
 * Where the virtual cursor would land on `element` entered via `key`, together
 * with the record that accepts it there — the entering edge for a reorder row
 * (so before/after resolves), or the center for a plain drop zone. `null` when
 * the target does not accept the drag at the point the cursor would occupy.
 *
 * `canDrop` is evaluated at that prospective point rather than at the cursor's
 * current position, so a target that accepts only the region the cursor is
 * moving into is reachable, and one that rejects it is never selected.
 */
function resolveEntry(
  element: Element,
  rect: DOMRect,
  key: DragKeyboardArrowKey,
  source: DragSource,
  input: DragInput,
): { record: DropTargetRecord; point: DragPosition } | null {
  const edge = entryPoint(rect, key);
  // A row that declares the brand as a plain value is a row at every point on it,
  // so the centre resolution below could only ever be computed and thrown away.
  // Aim straight at the edge instead — one `canDrop` and one `payload` per
  // candidate rather than two, which is the whole registry on a long list.
  //
  // Gated on the *declared* payload, never a resolved one: a callback payload can
  // answer differently per point, so only the value form proves the target is a
  // row everywhere. Anything else keeps the centre-first order below, which is
  // what plain zones need.
  if (isReorderRowPayload(getDeclaredDropTargetPayload(element))) {
    const rowRecord = resolveDropTarget(element, { source, input: remapInput(input, edge) });
    return rowRecord ? { record: rowRecord, point: edge } : null;
  }

  const center = rectCenter(rect);
  const centerRecord = resolveDropTarget(element, { source, input: remapInput(input, center) });
  if (centerRecord && !isReorderItemTarget(centerRecord)) {
    return { record: centerRecord, point: center };
  }
  // Either a reorder row whose payload is a callback — aimed at its entering edge,
  // so that is the point that has to accept — or a target that rejected its center,
  // which a row accepting only the half being entered legitimately does.
  const edgeRecord = resolveDropTarget(element, { source, input: remapInput(input, edge) });
  // Not gated on the reorder brand: a plain zone whose `canDrop` rejects its
  // centre but accepts the edge being entered is perfectly legal, and gating
  // here left it reachable by pointer but not by keyboard.
  if (edgeRecord) {
    return { record: edgeRecord, point: edge };
  }
  return null;
}

/**
 * The point to aim the virtual cursor at for `element` entered via `key`.
 * Falls back to the center for a target that no longer accepts the source.
 */
export function entryPointForTarget(
  element: Element,
  key: DragKeyboardArrowKey,
  source: DragSource,
  input: DragInput,
): DragPosition {
  const rect = measure(element);
  return resolveEntry(element, rect, key, source, input)?.point ?? rectCenter(rect);
}

/**
 * Rects measured for the current stable layout.
 *
 * One press measures every registered target two or three times over —
 * `findDirectionalTarget` scans the registry, a `keyboardMovement` resolver's
 * `getTargets` scans it again, and the winner is re-measured to derive its aim
 * point. On a 500-row board that is well over a thousand layout reads per press,
 * and arrows are deliberately not gated on `event.repeat`, so a held key repeats
 * it at the OS rate.
 *
 * The sensor keeps this cache through held-key repeat frames, then invalidates
 * it on DOM layout mutations, scrolling, resizing, a non-repeat press, and drag
 * teardown. A static 500-row board consequently measures once while a held
 * arrow advances at the display rate, while a live reorder still refreshes
 * before the next press.
 */
// A `WeakMap` so a scan over a large board doesn't pin virtualized rows.
let rectCache = new WeakMap<Element, DOMRect>();

/**
 * Drop the rect cache when the layout may have changed.
 */
export function invalidateCollisionRects(): void {
  rectCache = new WeakMap();
}

function measure(element: Element): DOMRect {
  let rect = rectCache.get(element);
  if (rect === undefined) {
    rect = element.getBoundingClientRect();
    rectCache.set(element, rect);
  }
  return rect;
}

/**
 * Candidate drop-target elements for keyboard collision, with rects measured
 * once per stable layout. Shared by `findDirectionalTarget` and `getAcceptingTargets`
 * so the two can never disagree on which targets are considered.
 */
function* candidateTargets(
  exclude: Element | null,
): Generator<{ element: Element; rect: DOMRect }> {
  // The virtual cursor lives in the source document's client coordinate space;
  // a target in another document (iframe) mixes coordinate spaces and can't be
  // compared meaningfully. Cross-document DnD is unsupported, so skip them.
  const sourceDoc = exclude ? ownerDocument(exclude) : null;
  for (const element of getRegisteredDropTargetElements(sourceDoc ?? undefined)) {
    if (element === exclude || !element.isConnected) {
      continue;
    }
    const rect = measure(element);
    // A registered `display: none` target has a 0×0 rect at (0, 0); it passes
    // `isConnected` and could win collision, jumping the cursor to (0, 0). Skip
    // zero-size rects before any collision math.
    if (rect.width === 0 || rect.height === 0) {
      continue;
    }
    yield { element, rect };
  }
}

/**
 * Every registered drop target that accepts the active drag, with a fresh rect
 * and its resolved record. Backs a `keyboardMovement` resolver's `getTargets`.
 */
export function getAcceptingTargets(
  source: DragSource,
  input: DragInput,
  exclude: Element | null,
): DragKeyboardMoveTarget[] {
  const targets: DragKeyboardMoveTarget[] = [];
  for (const { element, rect } of candidateTargets(exclude)) {
    const record = resolveDropTarget(element, { source, input });
    if (record) {
      targets.push({ element, rect, record });
    }
  }
  return targets;
}

/** The winning target of {@link findDirectionalTarget}, with its resolved aim point. */
export interface DirectionalTargetHit {
  element: Element;
  /**
   * The point the cursor would be aimed at, measured before any reveal scroll —
   * the same point the winner was scored and `canDrop`-resolved against.
   * Callers that scroll the target into view first must re-derive it from the
   * post-scroll rect (`entryPointForTarget`).
   */
  point: DragPosition;
}

/**
 * Whether the cursor is inside `rect` rather than on its boundary.
 *
 * Deliberately exclusive, unlike the shared `isPointInRect`: a cursor
 * sitting exactly on a zone's edge — easy to land on with `snapToGrid(24)` and
 * the 24px default step — is not "already inside" that zone, and treating it as
 * such skipped the zone entirely, leaving it unreachable from that position.
 */
function isStrictlyInsideRect(
  x: number,
  y: number,
  rect: { left: number; top: number; right: number; bottom: number },
): boolean {
  return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
}

/**
 * The smallest score any point inside `rect` could produce, from the rect alone.
 *
 * The score below is `along + 2 * cross`, and both aim points `resolveEntry` can
 * choose (the entering edge and the centre) lie inside the rect — so a rect whose
 * *best* case already loses to the current winner cannot win, and can be skipped
 * before paying for the target's `canDrop` and `payload`. That matters because
 * arrow keys are deliberately not `event.repeat`-gated: a held arrow runs this
 * scan once per OS repeat tick, over every registered target.
 *
 * Arrow directions are axis-aligned, so `along` and `cross` fall on separate axes
 * and each minimum is a clamp of the cursor against the rect. `along` is floored
 * at 0 because the loop only accepts strictly positive progress anyway.
 */
function bestPossibleScore(
  rect: DOMRect,
  currentX: number,
  currentY: number,
  dir: DragPosition,
): number {
  let minAlong: number;
  let minCross: number;
  if (dir.x !== 0) {
    minAlong = dir.x > 0 ? rect.left - currentX : currentX - rect.right;
    minCross = currentY < rect.top ? rect.top - currentY : Math.max(0, currentY - rect.bottom);
  } else {
    minAlong = dir.y > 0 ? rect.top - currentY : currentY - rect.bottom;
    minCross = currentX < rect.left ? rect.left - currentX : Math.max(0, currentX - rect.right);
  }
  return Math.max(0, minAlong) + minCross * 2;
}

/**
 * The nearest accepting drop target ahead of the cursor in the `key` direction,
 * or `null` when none lies ahead (the sensor then falls back to a step nudge).
 * The winner carries the entry point it was resolved against.
 *
 * Measures every registered target once per press, through the `rectCache` the
 * sensor invalidates as each press begins — a rect must not survive a press,
 * because committing a move can reorder the DOM and the reveal scroll that
 * follows invalidates every rect anyway.
 */
export function findDirectionalTarget({
  key,
  source,
  input,
  exclude,
  modifyPoint,
}: DirectionalTargetParameters): DirectionalTargetHit | null {
  const dir = unitVector(key);
  const currentX = input.clientX;
  const currentY = input.clientY;

  let best: DirectionalTargetHit | null = null;
  let bestScore = Infinity;

  for (const { element, rect } of candidateTargets(exclude)) {
    // The point this target is scored against — also the point the cursor would
    // land on, so scoring, `canDrop` and the committed position all agree.
    let candidate: DragPosition;

    if (isStrictlyInsideRect(currentX, currentY, rect)) {
      // The cursor already sits inside this target, so skip it — we want the
      // next sibling, not to re-enter our own box (collection root, current
      // column…). The exception is a reorder row the cursor entered at its far
      // edge and is now reversing out of: stepping to the row's opposite edge
      // keeps a `→ ←` round trip a no-op. Detect that by the cursor sitting at
      // the row's entry point for the opposite key; an arbitrary position inside
      // a large container never matches, and pressing the same direction again
      // (cursor off the back edge) advances to the neighbour.
      const record = resolveDropTarget(element, { source, input });
      if (!record || !isReorderItemTarget(record)) {
        continue;
      }
      const rawBackEdge = entryPoint(rect, oppositeKey(key));
      const backEdge = modifyPoint ? modifyPoint(rawBackEdge) : rawBackEdge;
      const vertical = key === 'ArrowUp' || key === 'ArrowDown';
      const atBackEdge = vertical
        ? Math.abs(currentY - backEdge.y) <= REVERSAL_ENTRY_TOLERANCE
        : Math.abs(currentX - backEdge.x) <= REVERSAL_ENTRY_TOLERANCE;
      if (!atBackEdge) {
        continue;
      }
      const entry = resolveEntry(element, rect, key, source, input);
      if (!entry) {
        continue;
      }
      candidate = entry.point;
    } else {
      // Cheap geometric pre-filter before the costly `accept`/`canDrop`
      // resolution, on the farthest point `resolveEntry` can choose (the
      // entering edge; a plain zone's center is never ahead of it), so nothing
      // the scorer would accept is ever excluded here. Filtering on the center
      // instead skipped a reorder row whose entry edge lay ahead while the
      // cursor sat off-axis outside it. A candidate admitted here whose
      // *resolved* entry is behind still fails the `along` check below.
      const farthest = entryPoint(rect, key);
      if ((farthest.x - currentX) * dir.x + (farthest.y - currentY) * dir.y <= 0) {
        continue; // not ahead of the cursor in this direction
      }
      // Branch and bound, on the same rect the filter above already read: a
      // candidate that cannot beat the current winner even at its best point is
      // dropped before the consumer callbacks run.
      if (bestPossibleScore(rect, currentX, currentY, dir) >= bestScore) {
        continue;
      }
      const entry = resolveEntry(element, rect, key, source, input);
      if (!entry) {
        continue;
      }
      candidate = entry.point;
    }

    const dx = candidate.x - currentX;
    const dy = candidate.y - currentY;
    const along = dx * dir.x + dy * dir.y; // progress in the pressed direction
    // Require strictly positive progress. A `<= 1` threshold left a target whose
    // center is ≤1px ahead unreachable in that direction; `<= 0` still excludes
    // the cursor's own row (exactly on-axis) while admitting the next one.
    if (along <= 0) {
      continue;
    }
    const cross = Math.abs(dx * dir.y - dy * dir.x); // perpendicular drift
    const score = along + cross * 2;
    if (score < bestScore) {
      bestScore = score;
      best = { element, point: candidate };
    }
  }

  return best;
}
