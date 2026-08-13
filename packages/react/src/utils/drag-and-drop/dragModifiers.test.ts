import { describe, it, expect, vi } from 'vitest';
import {
  applyDragModifiers,
  compileDragModifiers,
  modifyDragPoint,
  createDragModifiersState,
  restrictToVerticalAxis,
  restrictToHorizontalAxis,
  restrictToWindowEdges,
  restrictToParentElement,
  restrictToElement,
  snapToGrid,
} from './dragModifiers';
import type { DragModifier, DragModifierContext, DragPosition } from '../../types/drag';

function makeRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON() {},
  } as DOMRect;
}

function makeWindow(
  innerWidth: number,
  innerHeight: number,
  clientWidth = 0,
  clientHeight = 0,
): Window {
  return {
    innerWidth,
    innerHeight,
    document: { documentElement: { clientWidth, clientHeight } },
  } as unknown as Window;
}

function makeContext(overrides: Partial<DragModifierContext> = {}): DragModifierContext {
  return {
    point: { x: 0, y: 0 },
    initialPoint: { x: 0, y: 0 },
    input: { x: 0, y: 0 },
    sourceElement: document.createElement('div'),
    sourceRect: makeRect(0, 0, 0, 0),
    scale: { x: 1, y: 1 },
    previewRect: null,
    previewOffset: { x: 0, y: 0 },
    mode: 'pointer',
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ownerWindow: makeWindow(800, 600),
    ...overrides,
  };
}

type ApplyOptions = Parameters<typeof applyDragModifiers>[2];

function makeApplyOptions(overrides: Partial<ApplyOptions> = {}): ApplyOptions {
  return {
    initialPoint: { x: 0, y: 0 },
    input: { x: 0, y: 0 },
    sourceElement: document.createElement('div'),
    sourceRect: makeRect(0, 0, 0, 0),
    scale: { x: 1, y: 1 },
    previewOffset: { x: 0, y: 0 },
    mode: 'pointer',
    keys: { ctrlKey: false, shiftKey: false, altKey: false, metaKey: false },
    ownerWindow: window,
    getPreviewRect: () => null,
    ...overrides,
  };
}

describe('restrictToVerticalAxis', () => {
  it('pins x to the drag origin and passes y through', () => {
    const result = restrictToVerticalAxis(
      makeContext({ initialPoint: { x: 10, y: 10 }, point: { x: 50, y: 80 } }),
    );
    expect(result).toEqual({ x: 10, y: 80 });
  });
});

describe('restrictToHorizontalAxis', () => {
  it('pins y to the drag origin and passes x through', () => {
    const result = restrictToHorizontalAxis(
      makeContext({ initialPoint: { x: 10, y: 10 }, point: { x: 50, y: 80 } }),
    );
    expect(result).toEqual({ x: 50, y: 10 });
  });
});

describe('snapToGrid', () => {
  it('snaps to a square grid anchored at the drag origin', () => {
    const result = snapToGrid(20)(
      makeContext({ initialPoint: { x: 100, y: 100 }, point: { x: 132, y: 145 } }),
    );
    expect(result).toEqual({ x: 140, y: 140 });
  });

  it('supports a rectangular grid', () => {
    const result = snapToGrid({ x: 30, y: 15 })(
      makeContext({ initialPoint: { x: 0, y: 0 }, point: { x: 40, y: 22 } }),
    );
    expect(result).toEqual({ x: 30, y: 15 });
  });

  it('leaves an axis unsnapped when its step is not positive', () => {
    const result = snapToGrid({ x: 20, y: 0 })(
      makeContext({ initialPoint: { x: 0, y: 0 }, point: { x: 33, y: 47 } }),
    );
    expect(result).toEqual({ x: 40, y: 47 });
  });

  // The step names a distance on the surface being dragged over, so a scaled ancestor — a
  // zoomable canvas — has to stretch it into client pixels, or the grid lands between cells.
  it('scales the step by the ancestor scale', () => {
    const result = snapToGrid(20)(
      makeContext({
        initialPoint: { x: 0, y: 0 },
        point: { x: 22, y: 22 },
        scale: { x: 0.5, y: 0.5 },
      }),
    );
    // A 20-unit grid at 50% zoom is 10 client pixels; 22 rounds to 20.
    expect(result).toEqual({ x: 20, y: 20 });
  });

  it('scales each axis independently', () => {
    const result = snapToGrid(10)(
      makeContext({
        initialPoint: { x: 0, y: 0 },
        point: { x: 11, y: 11 },
        scale: { x: 2, y: 0.5 },
      }),
    );
    expect(result).toEqual({ x: 20, y: 10 });
  });
});

describe('restrictToWindowEdges', () => {
  it('clamps the point to the viewport', () => {
    const context = makeContext({ point: { x: 900, y: 700 } });
    expect(restrictToWindowEdges(context)).toEqual({ x: 800, y: 600 });
    expect(restrictToWindowEdges({ ...context, point: { x: -10, y: -5 } })).toEqual({ x: 0, y: 0 });
  });

  it('prefers documentElement.clientWidth/Height over the window size when non-zero', () => {
    // `innerWidth/innerHeight` include the scrollbar gutter; the layout viewport
    // is what `elementFromPoint` can actually hit.
    const context = makeContext({
      point: { x: 900, y: 700 },
      ownerWindow: makeWindow(800, 600, 400, 300),
    });
    expect(restrictToWindowEdges(context)).toEqual({ x: 400, y: 300 });
  });

  it('insets the max edge by the preview size so the whole preview stays visible', () => {
    const result = restrictToWindowEdges(
      makeContext({ point: { x: 900, y: 700 }, previewRect: makeRect(0, 0, 100, 50) }),
    );
    expect(result).toEqual({ x: 700, y: 550 });
  });

  it('shifts both edges by the preview offset so the preview (not the cursor) is contained', () => {
    // The preview sits at point − previewOffset, so its left edge hits the
    // viewport when point.x = previewOffset.x, and its right edge when
    // point.x = viewport.width − previewRect.width + previewOffset.x.
    const context = makeContext({
      previewOffset: { x: 10, y: 20 },
      previewRect: makeRect(0, 0, 100, 50),
    });
    expect(restrictToWindowEdges({ ...context, point: { x: 900, y: 700 } })).toEqual({
      x: 710,
      y: 570,
    });
    expect(restrictToWindowEdges({ ...context, point: { x: 0, y: 0 } })).toEqual({ x: 10, y: 20 });
  });
});

describe('restrictToElement', () => {
  it('clamps the point to the element bounds', () => {
    const element = document.createElement('div');
    element.getBoundingClientRect = () => makeRect(100, 100, 200, 200);
    const result = restrictToElement(element)(makeContext({ point: { x: 350, y: 50 } }));
    expect(result).toEqual({ x: 300, y: 100 });
  });

  it('accepts a ref object holding the element', () => {
    const element = document.createElement('div');
    element.getBoundingClientRect = () => makeRect(100, 100, 200, 200);
    const result = restrictToElement({ current: element })(
      makeContext({ point: { x: 350, y: 50 } }),
    );
    expect(result).toEqual({ x: 300, y: 100 });
  });

  it('insets by the preview size', () => {
    const element = document.createElement('div');
    element.getBoundingClientRect = () => makeRect(100, 100, 200, 200);
    const result = restrictToElement(element)(
      makeContext({ point: { x: 350, y: 350 }, previewRect: makeRect(0, 0, 40, 40) }),
    );
    expect(result).toEqual({ x: 260, y: 260 });
  });

  it('shifts both edges by the preview offset', () => {
    const element = document.createElement('div');
    element.getBoundingClientRect = () => makeRect(100, 100, 200, 200);
    const modifier = restrictToElement(element);
    const context = makeContext({
      previewOffset: { x: 10, y: 20 },
      previewRect: makeRect(0, 0, 40, 40),
    });
    expect(modifier({ ...context, point: { x: 350, y: 350 } })).toEqual({ x: 270, y: 280 });
    expect(modifier({ ...context, point: { x: 50, y: 50 } })).toEqual({ x: 110, y: 120 });
  });

  it('pins to the min edge when the preview is larger than the bounds', () => {
    const element = document.createElement('div');
    element.getBoundingClientRect = () => makeRect(100, 100, 50, 50);
    const modifier = restrictToElement(element);
    const context = makeContext({
      previewOffset: { x: 10, y: 20 },
      previewRect: makeRect(0, 0, 200, 200),
    });
    // The max edge (rect.right − previewRect.width + offset) falls below the min
    // edge; the point pins to rect.left + offset instead of an inverted range.
    expect(modifier({ ...context, point: { x: 500, y: 500 } })).toEqual({ x: 110, y: 120 });
    expect(modifier({ ...context, point: { x: 130, y: 130 } })).toEqual({ x: 110, y: 120 });
  });

  it('passes the point through when the element reports a zero-size rect', () => {
    // display: none or a detached element reports 0×0 at the origin; clamping to
    // it would pin the drag to (0, 0).
    const element = document.createElement('div');
    element.getBoundingClientRect = () => makeRect(0, 0, 0, 0);
    const result = restrictToElement(element)(makeContext({ point: { x: 350, y: 50 } }));
    expect(result).toEqual({ x: 350, y: 50 });
  });

  it('re-reads the rect on every constrained move', () => {
    const element = document.createElement('div');
    let rect = makeRect(100, 100, 200, 200);
    element.getBoundingClientRect = () => rect;
    const modifier = restrictToElement(element);
    expect(modifier(makeContext({ point: { x: 350, y: 150 } }))).toEqual({ x: 300, y: 150 });
    rect = makeRect(0, 0, 100, 100);
    expect(modifier(makeContext({ point: { x: 350, y: 150 } }))).toEqual({ x: 100, y: 100 });
  });

  it('passes the point through when the reference resolves to nothing', () => {
    const result = restrictToElement(() => null)(makeContext({ point: { x: 5, y: 9 } }));
    expect(result).toEqual({ x: 5, y: 9 });
  });
});

describe('restrictToParentElement', () => {
  it("clamps the point to the source's parent bounds", () => {
    const parent = document.createElement('div');
    const child = document.createElement('div');
    parent.appendChild(child);
    parent.getBoundingClientRect = () => makeRect(0, 0, 500, 500);
    const result = restrictToParentElement(
      makeContext({ sourceElement: child, point: { x: 600, y: 250 } }),
    );
    expect(result).toEqual({ x: 500, y: 250 });
  });

  it('clamps to the shadow host when the source is a direct child of a shadow root', () => {
    const host = document.createElement('div');
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const child = document.createElement('div');
    shadowRoot.appendChild(child);
    host.getBoundingClientRect = () => makeRect(0, 0, 300, 300);
    const result = restrictToParentElement(
      makeContext({ sourceElement: child, point: { x: 400, y: 150 } }),
    );
    expect(result).toEqual({ x: 300, y: 150 });
  });

  it('passes the point through when the source has no parent', () => {
    const result = restrictToParentElement(
      makeContext({ sourceElement: document.createElement('div'), point: { x: 7, y: 3 } }),
    );
    expect(result).toEqual({ x: 7, y: 3 });
  });
});

describe('compileDragModifiers', () => {
  it('returns null when there is nothing to apply', () => {
    expect(compileDragModifiers(undefined)).toBeNull();
    expect(compileDragModifiers([])).toBeNull();
    expect(compileDragModifiers([false, null, undefined])).toBeNull();
  });

  it('wraps a single modifier in a list', () => {
    expect(compileDragModifiers(restrictToVerticalAxis)).toEqual([restrictToVerticalAxis]);
  });

  it('filters falsy entries so modifiers can be applied conditionally', () => {
    const grid = snapToGrid(8);
    expect(compileDragModifiers([false, restrictToVerticalAxis, null, grid, undefined])).toEqual([
      restrictToVerticalAxis,
      grid,
    ]);
  });
});

describe('applyDragModifiers', () => {
  it('applies modifiers in order, each clamping the previous result', () => {
    const result = applyDragModifiers(
      [snapToGrid(20), restrictToVerticalAxis],
      { x: 132, y: 145 },
      makeApplyOptions({ initialPoint: { x: 100, y: 100 } }),
    );
    // snapToGrid → { 140, 140 }, then restrictToVerticalAxis pins x back to 100.
    expect(result).toEqual({ x: 100, y: 140 });
  });

  it('hands every modifier the keys held by the event that produced the move', () => {
    const seen: Array<Record<string, boolean>> = [];
    const probe: DragModifier = (context) => {
      seen.push({
        ctrlKey: context.ctrlKey,
        shiftKey: context.shiftKey,
        altKey: context.altKey,
        metaKey: context.metaKey,
      });
      return context.point;
    };
    applyDragModifiers(
      [probe, probe],
      { x: 10, y: 10 },
      makeApplyOptions({
        keys: { ctrlKey: false, shiftKey: true, altKey: true, metaKey: false },
      }),
    );
    expect(seen).toEqual([
      { ctrlKey: false, shiftKey: true, altKey: true, metaKey: false },
      { ctrlKey: false, shiftKey: true, altKey: true, metaKey: false },
    ]);
  });

  it('measures the preview lazily, and at most once per application', () => {
    const getPreviewRect = vi.fn(() => makeRect(0, 0, 40, 40));

    // An axis lock never reads previewRect, so it must not pay for the measure.
    applyDragModifiers(
      [restrictToVerticalAxis],
      { x: 10, y: 10 },
      makeApplyOptions({ getPreviewRect }),
    );
    expect(getPreviewRect).not.toHaveBeenCalled();

    const reads: Array<DOMRect | null> = [];
    const probe: DragModifier = (context) => {
      reads.push(context.previewRect);
      return context.point;
    };
    applyDragModifiers([probe, probe], { x: 10, y: 10 }, makeApplyOptions({ getPreviewRect }));
    expect(getPreviewRect).toHaveBeenCalledTimes(1);
    expect(reads).toHaveLength(2);
    expect(reads[0]?.width).toBe(40);
    expect(reads[1]).toBe(reads[0]);
  });

  it('returns the original point and logs when a modifier throws', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = applyDragModifiers(
      [
        ({ point }) => ({ x: point.x + 5, y: point.y + 5 }),
        () => {
          throw new Error('broken modifier');
        },
      ],
      { x: 3, y: 9 },
      makeApplyOptions(),
    );
    // The input point, not the partially-constrained one.
    expect(result).toEqual({ x: 3, y: 9 });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Base UI: a drag "modifiers" function threw'),
      expect.any(Element),
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });
});

describe('createDragModifiersState', () => {
  it('returns null and skips the source measure when nothing is declared', () => {
    const measure = vi.fn(() => makeRect(0, 0, 10, 10));
    const source = document.createElement('div');
    const start = { x: 0, y: 0 };
    expect(
      createDragModifiersState(undefined, source, start, 'pointer', { measureSourceRect: measure }),
    ).toBeNull();
    expect(
      createDragModifiersState([], source, start, 'pointer', { measureSourceRect: measure }),
    ).toBeNull();
    expect(
      createDragModifiersState([false, null], source, start, 'pointer', {
        measureSourceRect: measure,
      }),
    ).toBeNull();
    expect(measure).not.toHaveBeenCalled();
  });

  it('constrains the start point so the drag begins where its first frame resolves', () => {
    const boundary = document.createElement('div');
    boundary.getBoundingClientRect = () => makeRect(100, 100, 200, 200);
    const source = document.createElement('div');
    const measure = vi.fn(() => makeRect(40, 40, 20, 20));
    const state = createDragModifiersState(
      restrictToElement(boundary),
      source,
      { x: 50, y: 350 },
      'pointer',
      { measureSourceRect: measure },
    )!;
    expect(state.initialPoint).toEqual({ x: 100, y: 300 });
    expect(state.sourceElement).toBe(source);
    expect(measure).toHaveBeenCalledTimes(1);
    expect(state.sourceRect).toBe(measure.mock.results[0].value);
  });
});

describe('modifyDragPoint', () => {
  it('feeds the preview offset and rect from the preview handle', () => {
    const boundary = document.createElement('div');
    boundary.getBoundingClientRect = () => makeRect(0, 0, 200, 200);
    const offsets: DragPosition[] = [];
    const probe: DragModifier = (context) => {
      offsets.push({ ...context.previewOffset });
      return context.point;
    };
    const source = document.createElement('div');
    const state = createDragModifiersState(
      [probe, restrictToElement(boundary)],
      source,
      { x: 50, y: 50 },
      'pointer',
      { measureSourceRect: () => makeRect(0, 0, 20, 20) },
    )!;
    // State creation applies the modifiers with no preview yet.
    expect(offsets).toEqual([{ x: 0, y: 0 }]);
    expect(state.initialPoint).toEqual({ x: 50, y: 50 });

    const previewElement = document.createElement('div');
    previewElement.getBoundingClientRect = () => makeRect(0, 0, 50, 30);
    const previewLike = {
      getPreviewElement: () => ({ element: previewElement }),
      getPreviewOffset: () => ({ x: 5, y: 7 }),
    };
    const result = modifyDragPoint(state, { x: 500, y: 500 }, 'pointer', previewLike);
    expect(offsets[1]).toEqual({ x: 5, y: 7 });
    // Edges shifted by the offset and inset by the preview rect:
    // max x = 200 − 50 + 5, max y = 200 − 30 + 7.
    expect(result).toEqual({ x: 155, y: 177 });
  });

  it('does not measure the preview when no modifier reads its rect', () => {
    const source = document.createElement('div');
    const state = createDragModifiersState(
      restrictToVerticalAxis,
      source,
      { x: 10, y: 10 },
      'pointer',
      { measureSourceRect: () => makeRect(0, 0, 20, 20) },
    )!;
    const previewElement = document.createElement('div');
    const getRect = vi.fn(() => makeRect(0, 0, 50, 30));
    previewElement.getBoundingClientRect = getRect;
    const previewLike = {
      getPreviewElement: () => ({ element: previewElement }),
      getPreviewOffset: () => ({ x: 0, y: 0 }),
    };
    const result = modifyDragPoint(state, { x: 40, y: 60 }, 'pointer', previewLike);
    expect(result).toEqual({ x: 10, y: 60 });
    expect(getRect).not.toHaveBeenCalled();
  });
});
