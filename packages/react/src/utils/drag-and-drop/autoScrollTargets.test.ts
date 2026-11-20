import { describe, it, expect } from 'vitest';
import type { DraggableInput } from '../../draggable/DraggableProvider';
import { getEdgeScrollDepth } from './autoScrollTargets';
import type { ScrollTarget } from './autoScrollTargets';

describe('getEdgeScrollDepth', () => {
  // A 200x200 target over 1000x1000 of content, so each edge zone is 50px deep.
  // Only `rect`, `scroller` and `adapter` are read, so plain metrics stand in for the
  // scroller and no DOM metric needs mocking.
  function makeTarget(offsets: { scrollTop?: number; scrollLeft?: number; rtl?: boolean }) {
    const target = {
      rect: new DOMRect(0, 0, 200, 200),
      scroller: {
        scrollTop: offsets.scrollTop ?? 400,
        scrollLeft: offsets.scrollLeft ?? 400,
        scrollHeight: 1000,
        scrollWidth: 1000,
        clientHeight: 200,
        clientWidth: 200,
      },
      adapter: {
        getOverflow: () => ({ x: true, y: true }),
        hasNegativeOrigin: (_: unknown, axis: string) => axis === 'x' && offsets.rtl === true,
      },
    };
    return target as unknown as ScrollTarget;
  }

  // Chrome 115+ reports fractional limits: 799.5 + 200 < 1000 looks scrollable.
  // RTL offsets run from 0 at the right-hand start to -800 at the left-hand end.
  it.each([
    { name: 'bottom edge with room', axis: 'y', x: 100, y: 190, offsets: {}, depth: 0.8 },
    {
      name: 'bottom edge at a fractional limit',
      axis: 'y',
      x: 100,
      y: 190,
      offsets: { scrollTop: 799.5 },
      depth: 0,
    },
    { name: 'top edge with room', axis: 'y', x: 100, y: 10, offsets: {}, depth: -0.8 },
    {
      name: 'top edge at the limit',
      axis: 'y',
      x: 100,
      y: 10,
      offsets: { scrollTop: 0 },
      depth: 0,
    },
    { name: 'right edge with room', axis: 'x', x: 190, y: 100, offsets: {}, depth: 0.8 },
    {
      name: 'right edge at a fractional limit',
      axis: 'x',
      x: 190,
      y: 100,
      offsets: { scrollLeft: 799.5 },
      depth: 0,
    },
    { name: 'left edge with room', axis: 'x', x: 10, y: 100, offsets: {}, depth: -0.8 },
    {
      name: 'left edge at the limit',
      axis: 'x',
      x: 10,
      y: 100,
      offsets: { scrollLeft: 0 },
      depth: 0,
    },
    {
      name: 'RTL left edge at the start',
      axis: 'x',
      x: 10,
      y: 100,
      offsets: { scrollLeft: 0, rtl: true },
      depth: -0.8,
    },
    {
      name: 'RTL right edge at the start',
      axis: 'x',
      x: 190,
      y: 100,
      offsets: { scrollLeft: 0, rtl: true },
      depth: 0,
    },
    {
      name: 'RTL right edge at a fractional end',
      axis: 'x',
      x: 190,
      y: 100,
      offsets: { scrollLeft: -799.5, rtl: true },
      depth: 0.8,
    },
    {
      name: 'RTL left edge at a fractional end',
      axis: 'x',
      x: 10,
      y: 100,
      offsets: { scrollLeft: -799.5, rtl: true },
      depth: 0,
    },
  ] as const)('returns $depth at the $name', ({ axis, x, y, offsets, depth }) => {
    const input = { clientX: x, clientY: y } as DraggableInput;
    expect(getEdgeScrollDepth(makeTarget(offsets), input, axis, false)).toBeCloseTo(depth, 5);
  });
});
