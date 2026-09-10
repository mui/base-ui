import { describe, it, expect, vi } from 'vitest';
import { createDndRenderer, type DndTestEngine } from '#test-utils';
import { createElement, registerCleanup, setupDragEngineTests } from '../../../../test/dnd';
import {
  findDirectionalTarget,
  entryPoint,
  entryPointForTarget,
  getAcceptingTargets,
  rectCenter,
} from './keyboardCollision';
import { computeDropPosition } from '../collectionDrop';
import { reorderRowBrand } from '../reorderRow';
import { createKind } from '../dragKind';
import type { DragKind, DragSource, DragInput } from '../../../types/drag';

setupDragEngineTests();

const cardKind = createKind('card');

function makeSource(element: HTMLElement): DragSource {
  return { element, label: 'source', kind: cardKind.id, dragHandle: null, payload: {} };
}

function makeInput(clientX: number, clientY: number): DragInput {
  return {
    button: -1,
    buttons: 1,
    clientX,
    clientY,
    pageX: clientX,
    pageY: clientY,
    pointerType: 'mouse',
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
  };
}

function registerTarget(
  engine: DndTestEngine,
  element: HTMLElement,
  accept?: ReadonlyArray<DragKind<unknown>>,
): void {
  engine.registerDropTarget(element, { accept, getPayload: () => ({}) });
}

// A reorder row: a collection brands its per-item targets' payload, which is what
// makes the collision enter them at their edge (not their center).
function registerRow(
  engine: DndTestEngine,
  element: HTMLElement,
  itemId: string,
  accept?: ReadonlyArray<DragKind<unknown>>,
): void {
  engine.registerDropTarget(element, {
    accept,
    getPayload: () => ({ ...reorderRowBrand, role: 'item', itemId, targetInstanceId: 1 }),
  });
}

describe('keyboardCollision', () => {
  const { renderDnd } = createDndRenderer();

  describe('findDirectionalTarget', () => {
    it('picks the nearest target ahead in the pressed direction', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // cursor at (100, 100); both targets are directly below it.
      const near = createElement({ left: 0, width: 200, top: 150, height: 100 }); // center (100, 200)
      const far = createElement({ left: 0, width: 200, top: 350, height: 100 }); // center (100, 400)
      registerTarget(engine, near);
      registerTarget(engine, far);

      const result = findDirectionalTarget({
        key: 'ArrowDown',
        source: makeSource(source),
        input: makeInput(100, 100),
        exclude: source,
      });

      expect(result?.element).toBe(near);
    });

    it('skips canDrop on a candidate that cannot beat the current winner', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Registered nearest-first, so the winner is found before the two that
      // cannot beat it — the order that lets the bound prune them.
      const near = createElement({ left: 0, width: 200, top: 150, height: 100 });
      const farBehindOnAxis = createElement({ left: 0, width: 200, top: 900, height: 100 });
      const farDrifted = createElement({ left: 2000, width: 200, top: 200, height: 100 });
      const nearCanDrop = vi.fn(() => true);
      const farCanDrop = vi.fn(() => true);
      const driftedCanDrop = vi.fn(() => true);
      engine.registerDropTarget(near, { canDrop: nearCanDrop, getPayload: () => ({}) });
      engine.registerDropTarget(farBehindOnAxis, { canDrop: farCanDrop, getPayload: () => ({}) });
      engine.registerDropTarget(farDrifted, { canDrop: driftedCanDrop, getPayload: () => ({}) });

      const result = findDirectionalTarget({
        key: 'ArrowDown',
        source: makeSource(source),
        input: makeInput(100, 100),
        exclude: source,
      });

      expect(result?.element).toBe(near);
      // Held key events are coalesced to at most one executed move per frame, but
      // each move can still scan every registered target. A candidate whose best
      // possible score already loses must not cost the consumer a `canDrop` (nor
      // the `payload` behind it).
      expect(nearCanDrop).toHaveBeenCalled();
      expect(farCanDrop).not.toHaveBeenCalled();
      expect(driftedCanDrop).not.toHaveBeenCalled();
    });

    it('still finds a winner registered after a nearer-looking loser', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Reverse order: the eventual winner is seen last, so the bound must not
      // prune a candidate that genuinely improves on the incumbent. The margin is
      // deliberately thin — the incumbent scores ~110 and the winner's bound is
      // 50 — so a bound that overestimated even slightly would prune the winner
      // and leave `far` standing.
      const far = createElement({ left: 0, width: 200, top: 205, height: 100 });
      const near = createElement({ left: 0, width: 200, top: 150, height: 100 });
      registerTarget(engine, far);
      registerTarget(engine, near);

      const result = findDirectionalTarget({
        key: 'ArrowDown',
        source: makeSource(source),
        input: makeInput(100, 100),
        exclude: source,
      });

      expect(result?.element).toBe(near);
    });

    it('biases against cross-axis drift so navigation feels grid-like', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Two targets at equal forward distance below the cursor; the on-axis one
      // wins over the laterally-drifted one because of the cross-axis penalty.
      const onAxis = createElement({ left: 10, width: 200, top: 250, height: 100 }); // center (110, 300)
      const drifted = createElement({ left: 200, width: 200, top: 250, height: 100 }); // center (300, 300)
      registerTarget(engine, onAxis);
      registerTarget(engine, drifted);

      const result = findDirectionalTarget({
        key: 'ArrowDown',
        source: makeSource(source),
        input: makeInput(100, 100),
        exclude: source,
      });

      expect(result?.element).toBe(onAxis);
    });

    it('skips a container the cursor is already inside', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // The cursor (100, 100) sits inside `container`; its sibling below should
      // win instead of re-entering the current box.
      const container = createElement({ left: 0, width: 200, top: 0, height: 400 });
      const sibling = createElement({ left: 0, width: 200, top: 550, height: 100 }); // center (100, 600)
      registerTarget(engine, container);
      registerTarget(engine, sibling);

      const result = findDirectionalTarget({
        key: 'ArrowDown',
        source: makeSource(source),
        input: makeInput(100, 100),
        exclude: source,
      });

      expect(result?.element).toBe(sibling);
    });

    it('returns null when no target lies ahead', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const below = createElement({ left: 0, width: 200, top: 250, height: 100 });
      registerTarget(engine, below);

      const result = findDirectionalTarget({
        key: 'ArrowUp', // nothing lies above the cursor
        source: makeSource(source),
        input: makeInput(100, 100),
        exclude: source,
      });

      expect(result).toBeNull();
    });

    it('honours accept, skipping a nearer rejecting target', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const accepting = createElement({ left: 0, width: 200, top: 350, height: 100 }); // center (100, 400)
      const rejecting = createElement({ left: 0, width: 200, top: 150, height: 100 }); // nearer, center (100, 200)
      registerTarget(engine, accepting, [cardKind]);
      registerTarget(engine, rejecting, [createKind('other')]);

      const result = findDirectionalTarget({
        key: 'ArrowDown',
        source: makeSource(source), // kind 'card'
        input: makeInput(100, 100),
        exclude: source,
      });

      // The nearer target rejects 'card'; the farther accepting one is chosen.
      expect(result?.element).toBe(accepting);
    });

    it('aims a value-payload row at its edge, resolving it once instead of twice', async () => {
      // The shape a real collection registers: the brand as a plain value, not a
      // callback. That is provably a row at every point on it, so the collision
      // skips the centre resolution it would only throw away — one `canDrop` per
      // candidate rather than two, across the whole registry on a long list.
      const { engine } = await renderDnd();
      const source = createElement();
      const row = createElement({ left: 0, width: 200, top: 100, height: 100 });
      const seen: number[] = [];
      engine.registerDropTarget(row, {
        payload: { ...reorderRowBrand, role: 'item', itemId: 'row', targetInstanceId: 1 },
        canDrop: ({ input }) => {
          seen.push(input.clientY);
          return true;
        },
      });

      const result = findDirectionalTarget({
        key: 'ArrowDown',
        source: makeSource(source),
        input: makeInput(100, 50),
        exclude: source,
      });

      // Same answer the callback form gives — the entry edge, not the centre.
      expect(result?.element).toBe(row);
      expect(result?.point).toEqual({ x: 100, y: 190 });
      // And it got there without ever asking about the centre (y = 150).
      expect(seen).toEqual([190]);
    });

    it('keeps resolving a getPayload row at both points', async () => {
      // A callback can answer differently per point, so a peek at one point
      // cannot prove the target is a row everywhere: the centre-first order has
      // to stand for this form.
      const { engine } = await renderDnd();
      const source = createElement();
      const row = createElement({ left: 0, width: 200, top: 100, height: 100 });
      const seen: number[] = [];
      engine.registerDropTarget(row, {
        getPayload: () => ({
          ...reorderRowBrand,
          role: 'item',
          itemId: 'row',
          targetInstanceId: 1,
        }),
        canDrop: ({ input }) => {
          seen.push(input.clientY);
          return true;
        },
      });

      const result = findDirectionalTarget({
        key: 'ArrowDown',
        source: makeSource(source),
        input: makeInput(100, 50),
        exclude: source,
      });

      expect(result?.element).toBe(row);
      expect(result?.point).toEqual({ x: 100, y: 190 });
      expect(seen).toEqual([150, 190]);
    });

    it('resolves canDrop at the prospective entry point, not the cursor position', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const row = createElement({ left: 0, width: 200, top: 100, height: 100 });
      const seen: number[] = [];
      engine.registerDropTarget(row, {
        getPayload: () => ({
          ...reorderRowBrand,
          role: 'item',
          itemId: 'row',
          targetInstanceId: 1,
        }),
        canDrop: ({ input }) => {
          seen.push(input.clientY);
          // Only the lower half of the row (below y = 150) accepts.
          return input.clientY > 150;
        },
      });

      // The cursor sits above the row, in the region its canDrop rejects; the
      // row must still be reachable because acceptance is evaluated at the
      // point the cursor is moving *to* (the ArrowDown entry edge, y = 190).
      const result = findDirectionalTarget({
        key: 'ArrowDown',
        source: makeSource(source),
        input: makeInput(100, 50),
        exclude: source,
      });

      expect(result?.element).toBe(row);
      expect(result?.point).toEqual({ x: 100, y: 190 });
      // canDrop only ever saw prospective entry coordinates, never the cursor's.
      expect(seen).toContain(190);
      expect(seen).not.toContain(50);
    });

    it('reverses within the reorder row just entered instead of skipping past it', async () => {
      const { engine } = await renderDnd();
      // A horizontal row of reorder items: source | b | c.
      const source = createElement({ left: 0, width: 100, top: 0, height: 100 });
      const b = createElement({ left: 100, width: 100, top: 0, height: 100 });
      const c = createElement({ left: 200, width: 100, top: 0, height: 100 });
      registerRow(engine, b, 'b');
      registerRow(engine, c, 'c');

      // Enter B from the left: collision picks B and the sensor parks the cursor
      // at B's trailing entry edge (90% → x = 190).
      const entered = findDirectionalTarget({
        key: 'ArrowRight',
        source: makeSource(source),
        input: makeInput(50, 50),
        exclude: source,
      });
      expect(entered?.element).toBe(b);
      const parked = entryPoint(b.getBoundingClientRect(), 'ArrowRight');
      // Pin the parked coordinates: a drifted `entryPoint` would otherwise
      // keep the round trip self-consistently green from the wrong spot.
      expect(parked).toEqual({ x: 190, y: 50 });

      // Reversing from that edge returns to B (its leading zone), not the
      // neighbour beyond it — a `→ ←` round trip is a no-op.
      const reversed = findDirectionalTarget({
        key: 'ArrowLeft',
        source: makeSource(source),
        input: makeInput(parked.x, parked.y),
        exclude: source,
      });
      expect(reversed?.element).toBe(b);
    });

    it('advances to the next reorder row when pressing the same direction again', async () => {
      const { engine } = await renderDnd();
      const source = createElement({ left: 0, width: 100, top: 0, height: 100 });
      const b = createElement({ left: 100, width: 100, top: 0, height: 100 });
      const c = createElement({ left: 200, width: 100, top: 0, height: 100 });
      registerRow(engine, b, 'b');
      registerRow(engine, c, 'c');

      // Parked at B's trailing edge (entered via →), pressing → again must not
      // stick inside B; it advances to the next sibling C.
      const parked = entryPoint(b.getBoundingClientRect(), 'ArrowRight');
      expect(parked).toEqual({ x: 190, y: 50 });
      const result = findDirectionalTarget({
        key: 'ArrowRight',
        source: makeSource(source),
        input: makeInput(parked.x, parked.y),
        exclude: source,
      });
      expect(result?.element).toBe(c);
    });

    it('keeps the reversal round trip intact under a displacing modifyPoint', async () => {
      const { engine } = await renderDnd();
      const source = createElement({ left: 0, width: 100, top: 0, height: 100 });
      const b = createElement({ left: 100, width: 100, top: 0, height: 100 });
      const c = createElement({ left: 200, width: 100, top: 0, height: 100 });
      registerRow(engine, b, 'b');
      registerRow(engine, c, 'c');
      // The same transform the sensor applies to every committed point: the
      // cursor parks at the *modified* entry edge, so the reversal check has
      // to compare against that, not the raw one.
      const snapToGrid = (point: { x: number; y: number }) => ({
        x: Math.round(point.x / 16) * 16,
        y: point.y,
      });

      const entered = findDirectionalTarget({
        key: 'ArrowRight',
        source: makeSource(source),
        input: makeInput(50, 50),
        exclude: source,
        modifyPoint: snapToGrid,
      });
      expect(entered?.element).toBe(b);
      // Where the sensor actually parks the cursor: 190 snapped to 192.
      const parked = snapToGrid(entryPoint(b.getBoundingClientRect(), 'ArrowRight'));
      expect(parked).toEqual({ x: 192, y: 50 });

      // Without `modifyPoint`, the raw back edge (190) misses the modified
      // cursor (192) by more than the tolerance and `→ ←` would skip past B.
      const reversed = findDirectionalTarget({
        key: 'ArrowLeft',
        source: makeSource(source),
        input: makeInput(parked.x, parked.y),
        exclude: source,
        modifyPoint: snapToGrid,
      });
      expect(reversed?.element).toBe(b);
    });

    it('keeps the ← → round trip a no-op in an RTL row set', async () => {
      const { engine } = await renderDnd();
      // Physically: c | b | source. In RTL reading order the set reads
      // source, b, c — ArrowLeft advances physically left.
      const source = createElement({ left: 200, width: 100, top: 0, height: 100 });
      const b = createElement({ left: 100, width: 100, top: 0, height: 100 });
      const c = createElement({ left: 0, width: 100, top: 0, height: 100 });
      b.style.direction = 'rtl';
      c.style.direction = 'rtl';
      registerRow(engine, b, 'b');
      registerRow(engine, c, 'c');

      // Enter B from the right; the cursor parks at B's far entering edge —
      // the physical left edge (x = 110), regardless of reading direction.
      const entered = findDirectionalTarget({
        key: 'ArrowLeft',
        source: makeSource(source),
        input: makeInput(250, 50),
        exclude: source,
      });
      expect(entered?.element).toBe(b);
      const parked = entryPoint(b.getBoundingClientRect(), 'ArrowLeft');
      expect(parked).toEqual({ x: 110, y: 50 });

      // Reversing steps back within B — with a reading-order flip in the entry
      // point, the reversal candidate fell behind the cursor and was filtered,
      // so `→` after `←` skipped B entirely.
      const reversed = findDirectionalTarget({
        key: 'ArrowRight',
        source: makeSource(source),
        input: makeInput(parked.x, parked.y),
        exclude: source,
      });
      expect(reversed?.element).toBe(b);
    });

    it('finds a reorder row whose entry edge lies ahead while its center trails the cursor', async () => {
      const { engine } = await renderDnd();
      const source = createElement({ left: 100, width: 100, top: 0, height: 50 });
      // The cursor sits above a wide row, past its center: pressing ArrowRight,
      // the center (x = 100) is behind the cursor (x = 150) but the entering
      // edge (x = 180) — the point the scorer aims at — lies ahead. A pre-filter
      // on the center would skip the row entirely.
      const row = createElement({ left: 0, width: 200, top: 100, height: 100 });
      registerRow(engine, row, 'row');

      const result = findDirectionalTarget({
        key: 'ArrowRight',
        source: makeSource(source),
        input: makeInput(150, 50),
        exclude: source,
      });

      expect(result?.element).toBe(row);
    });

    it('ignores a drop target living in another document (iframe)', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const frame = document.createElement('iframe');
      document.body.appendChild(frame);
      registerCleanup(() => frame.remove());
      const innerDoc = frame.contentDocument!;
      // Directly ahead of the cursor — but its rect is in the iframe's client
      // coordinate space, which cannot be compared to the main document's.
      const foreign = innerDoc.createElement('div');
      const measureForeign = vi.fn(() => new DOMRect(0, 150, 200, 100));
      foreign.getBoundingClientRect = measureForeign;
      innerDoc.body.appendChild(foreign);
      engine.registerDropTarget(foreign, {});

      const result = findDirectionalTarget({
        key: 'ArrowDown',
        source: makeSource(source),
        input: makeInput(100, 100),
        exclude: source,
      });

      expect(result).toBeNull();
      expect(getAcceptingTargets(makeSource(source), makeInput(100, 100), source)).toHaveLength(0);
      expect(measureForeign).not.toHaveBeenCalled();
    });

    it('crosses a plain zone in a single press: reversing does not re-enter it', async () => {
      const { engine } = await renderDnd();
      // Two side-by-side columns (plain "on" drop zones), the cursor parked at
      // the center of the right one after a previous ArrowRight.
      const left = createElement({ left: 0, width: 200, top: 0, height: 200 }); // center (100, 100)
      const right = createElement({ left: 200, width: 200, top: 0, height: 200 }); // center (300, 100)
      registerTarget(engine, left);
      registerTarget(engine, right);
      const source = createElement();

      // From the right column's center, one ArrowLeft crosses straight to the
      // left column — a zone is never re-entered at an intermediate edge.
      const result = findDirectionalTarget({
        key: 'ArrowLeft',
        source: makeSource(source),
        input: makeInput(rectCenter(right.getBoundingClientRect()).x, 100),
        exclude: source,
      });
      expect(result?.element).toBe(left);
    });
  });

  describe('getAcceptingTargets', () => {
    it('lists accepting targets with rects and records, applying the candidate filters', async () => {
      const { engine } = await renderDnd();
      const source = createElement();

      const accepting = createElement({ left: 0, width: 200, top: 150, height: 100 });
      registerTarget(engine, accepting, [cardKind]);
      // Filtered out: wrong kind, the dragged element itself, disconnected, zero-size.
      const refusing = createElement({ left: 0, width: 200, top: 300, height: 100 });
      registerTarget(engine, refusing, [createKind('file')]);
      registerTarget(engine, source, [cardKind]);
      const detached = createElement({ left: 0, width: 200, top: 450, height: 100 });
      registerTarget(engine, detached, [cardKind]);
      detached.remove();
      const hidden = createElement({ left: 0, width: 0, top: 600, height: 0 });
      registerTarget(engine, hidden, [cardKind]);

      const targets = getAcceptingTargets(makeSource(source), makeInput(100, 100), source);

      expect(targets).toHaveLength(1);
      expect(targets[0].element).toBe(accepting);
      expect(targets[0].rect).toEqual(accepting.getBoundingClientRect());
      expect(targets[0].record.element).toBe(accepting);
    });
  });

  describe('entryPointForTarget', () => {
    it('aims at the entering edge for a reorder row', async () => {
      const { engine } = await renderDnd();
      const row = createElement({ left: 0, width: 200, top: 100, height: 100 });
      registerRow(engine, row, 'row');
      const source = createElement();

      // ArrowDown enters from the top and parks near the bottom (resolves "after").
      expect(entryPointForTarget(row, 'ArrowDown', makeSource(source), makeInput(0, 0))).toEqual({
        x: 100,
        y: 190,
      });
    });

    it('aims at the center for a plain drop zone', async () => {
      const { engine } = await renderDnd();
      const zone = createElement({ left: 0, width: 200, top: 100, height: 100 });
      registerTarget(engine, zone);
      const source = createElement();

      expect(entryPointForTarget(zone, 'ArrowDown', makeSource(source), makeInput(0, 0))).toEqual(
        rectCenter(zone.getBoundingClientRect()),
      );
    });
  });

  describe('entryPoint', () => {
    it('aims at the entering edge so before/after resolves by direction', () => {
      const rect = new DOMRect(0, 100, 200, 100); // left 0, top 100, width 200, height 100

      // Down enters from the top, aiming near the bottom (resolves "after").
      expect(entryPoint(rect, 'ArrowDown')).toEqual({ x: 100, y: 190 });
      // Up enters from the bottom, aiming near the top (resolves "before").
      expect(entryPoint(rect, 'ArrowUp')).toEqual({ x: 100, y: 110 });
      // Horizontal keys aim at the cross-axis center.
      expect(entryPoint(rect, 'ArrowRight')).toEqual({ x: 180, y: 150 });
      expect(entryPoint(rect, 'ArrowLeft')).toEqual({ x: 20, y: 150 });
    });

    it('parks at the physical far edge so RTL rows resolve by reading order', () => {
      // `computeDropPosition` maps physical → reading order for RTL rows, so
      // the parking point must stay physical — flipping in both places would
      // double-invert and resolve the retreating side.
      const row = createElement({ left: 0, width: 200, top: 100, height: 100 });
      row.style.direction = 'rtl';
      const rect = row.getBoundingClientRect();
      const capabilities = { hasOn: false, hasBeforeAfter: true };

      // ArrowLeft advances in RTL reading order: physical left edge → 'after'.
      const leftPark = entryPoint(rect, 'ArrowLeft');
      expect(leftPark).toEqual({ x: 20, y: 150 });
      expect(computeDropPosition(row, leftPark.x, capabilities, 'horizontal')).toBe('after');

      // ArrowRight retreats in RTL reading order: physical right edge → 'before'.
      const rightPark = entryPoint(rect, 'ArrowRight');
      expect(rightPark).toEqual({ x: 180, y: 150 });
      expect(computeDropPosition(row, rightPark.x, capabilities, 'horizontal')).toBe('before');
    });
  });
});
