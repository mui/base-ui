import { afterEach, describe, it, expect, vi } from 'vitest';
import { isJSDOM } from '#test-utils';
import { createSyntheticPreview, retargetEndingPreviewSource } from './syntheticPreview';
import { restrictToElement, restrictToVerticalAxis } from '../dragModifiers';
import type { DraggablePosition } from '../../../draggable/DraggableProvider';
import type { DragPreviewElementHandle } from './cloneDragPreview';

/**
 * A stand-in for the element the engine builds next to the drag source. jsdom
 * doesn't lay out, so the size reads the modifiers depend on are stubbed.
 */
function createPreviewElement(
  width = 0,
  height = 0,
  isHost = true,
): DragPreviewElementHandle & { destroyed: boolean } {
  const element = document.createElement('div');
  Object.defineProperty(element, 'offsetWidth', { value: width, configurable: true });
  Object.defineProperty(element, 'offsetHeight', { value: height, configurable: true });
  element.getBoundingClientRect = () => new DOMRect(0, 0, width, height);
  return {
    element,
    isHost,
    sourceRect: new DOMRect(0, 0, width, height),
    positionScale: { x: 1, y: 1 },
    destroyed: false,
    ensureConnected() {},
    prepareForDrop() {},
    destroy() {
      this.destroyed = true;
      element.remove();
    },
  };
}

// Teardown runs in `afterEach` rather than as trailing statements inside each
// test, so a failed assertion can't skip the cleanup and cascade into every
// later test (a leaked `data-dragging` on `document.body`, an undead handle).
const activeHandles: Array<{ destroy(): void }> = [];
const attachedSources: HTMLElement[] = [];

/** An identity no remounted source matches, so settling previews never retarget. */
const UNMATCHED_IDENTITY = {
  kind: Symbol('test-source'),
  previewKey: undefined,
  payload: undefined,
};

/** `createSyntheticPreview` with the handle queued for `afterEach` destruction. */
function createHandle(
  source: HTMLElement,
  modifiers: Parameters<typeof createSyntheticPreview>[2] = null,
): ReturnType<typeof createSyntheticPreview> {
  const handle = createSyntheticPreview(source, UNMATCHED_IDENTITY, modifiers);
  activeHandles.push(handle);
  return handle;
}

/** A source `<div>` appended to the body and removed in `afterEach`. */
function createSource(): HTMLElement {
  const source = document.createElement('div');
  document.body.appendChild(source);
  attachedSources.push(source);
  return source;
}

afterEach(() => {
  // `destroy()` is idempotent (asserted below), so re-destroying a handle a
  // test already tore down is safe.
  while (activeHandles.length > 0) {
    activeHandles.pop()!.destroy();
  }
  while (attachedSources.length > 0) {
    attachedSources.pop()!.remove();
  }
  // Several tests use `document.body` itself as the source.
  document.body.removeAttribute('data-dragging');
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('syntheticPreview', () => {
  it('stops positioning when a modifier destroys the preview', () => {
    const handle = createHandle(createSource(), [
      ({ point }) => {
        handle.destroy();
        return point;
      },
    ]);
    const preview = createPreviewElement(120, 30);
    handle.setPreviewElement(preview);
    expect(() => handle.update(20, 20)).not.toThrow();
    expect(preview.destroyed).toBe(true);
  });

  it('marks the source as dragging, and clears it on destroy', () => {
    const source = createSource();
    const handle = createHandle(source);

    // Not on creation: the preview is measured from the source first, so a
    // `[data-dragging]` rule that resizes or hides it can't corrupt the geometry.
    expect(source).not.toHaveAttribute('data-dragging');
    handle.markSourceDragging();
    expect(source).toHaveAttribute('data-dragging');

    handle.destroy();
    expect(source).not.toHaveAttribute('data-dragging');
  });

  it('moves data-dragging to the new node when a virtualizer remounts the source', () => {
    const oldNode = createSource();
    const newNode = createSource();
    const handle = createHandle(oldNode);
    handle.markSourceDragging();

    handle.retargetSource(newNode);

    // A CSS-only `[data-dragging]` dim would otherwise stop applying the moment the
    // row was recycled, while `isDragging` kept tracking it.
    expect(oldNode).not.toHaveAttribute('data-dragging');
    expect(newNode).toHaveAttribute('data-dragging');

    handle.destroy();
    expect(newNode).not.toHaveAttribute('data-dragging');
  });

  it('destroy() is safe to call twice', () => {
    const handle = createHandle(document.body);
    handle.destroy();
    expect(() => handle.destroy()).not.toThrow();
  });

  describe('setPreviewElement', () => {
    it('exposes the adopted preview element and destroys it on release', () => {
      const handle = createHandle(document.body);
      const preview = createPreviewElement();
      handle.setPreviewElement(preview);
      expect(handle.getPreviewElement()).toBe(preview);
      handle.removePreviewElement();
      expect(handle.getPreviewElement()).toBeNull();
      expect(preview.destroyed).toBe(true);
    });

    it('re-anchors the preview when the offset is resolved after its content renders', () => {
      // A `DragPreview` with an offset callback can only be measured once React has
      // filled the host, which is after the engine placed it.
      const handle = createHandle(document.body);
      const preview = createPreviewElement();
      handle.setPreviewElement(preview);
      handle.update(100, 200);
      expect(preview.element.style.translate).toBe('100px 200px');

      handle.setPreviewOffset({ x: 10, y: 20 });
      // Re-anchored without waiting for another pointer move.
      expect(preview.element.style.translate).toBe('90px 180px');
    });

    it('destroys the preview element when the whole preview is torn down', () => {
      const handle = createHandle(document.body);
      const preview = createPreviewElement();
      handle.setPreviewElement(preview);
      handle.destroy();
      expect(preview.destroyed).toBe(true);
    });

    it('keeps a cloned preview mounted through its authored drop transition', async () => {
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames: FrameRequestCallback[] = [];
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        frames.push(callback);
        return frames.length;
      });
      const source = createSource();
      source.getBoundingClientRect = () => new DOMRect(40, 50, 120, 30);
      const handle = createHandle(source);
      const preview = createPreviewElement(120, 30, false);
      document.body.appendChild(preview.element);
      let finishAnimation: () => void;
      const finished = new Promise<void>((resolve) => {
        finishAnimation = resolve;
      });
      preview.element.getAnimations = () =>
        [
          {
            effect: { getTiming: () => ({ iterations: 1 }) },
            finished,
          },
        ] as unknown as Animation[];

      handle.setPreviewElement(preview);
      handle.markSourceDragging();
      handle.prepareForDrop();
      handle.destroy();

      expect(preview.element).toHaveAttribute('data-ending-style');
      expect(source).toHaveAttribute('data-dragging');
      expect(source).toHaveAttribute('data-settling');
      expect(preview.destroyed).toBe(false);

      frames.shift()!(0);
      expect(preview.element.style.translate).toBe('40px 50px');
      expect(preview.destroyed).toBe(false);

      finishAnimation!();
      await finished;
      await Promise.resolve();
      expect(preview.destroyed).toBe(true);
      expect(source).not.toHaveAttribute('data-dragging');
      expect(source).not.toHaveAttribute('data-settling');
    });

    it.each(['duration', 'iterations'])('ignores animations with infinite %s', (property) => {
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames: FrameRequestCallback[] = [];
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        frames.push(callback);
        return frames.length;
      });
      const source = createSource();
      const handle = createHandle(source);
      const preview = createPreviewElement(120, 30, false);
      document.body.appendChild(preview.element);
      preview.element.getAnimations = () =>
        [
          {
            effect: { getTiming: () => ({ duration: 100, iterations: 1, [property]: Infinity }) },
            finished: new Promise<void>(() => {}),
          },
        ] as unknown as Animation[];
      handle.setPreviewElement(preview);
      handle.markSourceDragging();
      handle.prepareForDrop();
      handle.destroy();
      frames.shift()!(0);
      expect(preview.destroyed).toBe(true);
      expect(source).not.toHaveAttribute('data-dragging');
    });

    it('cleans up a settling preview whose animation stays paused', () => {
      vi.useFakeTimers();
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames: FrameRequestCallback[] = [];
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        frames.push(callback);
        return frames.length;
      });
      const source = createSource();
      source.getBoundingClientRect = () => new DOMRect(40, 50, 120, 30);
      const handle = createHandle(source);
      const preview = createPreviewElement(120, 30, false);
      document.body.appendChild(preview.element);
      preview.element.getAnimations = () =>
        [
          {
            effect: {
              getTiming: () => ({ iterations: 1 }),
              getComputedTiming: () => ({ endTime: 200 }),
            },
            finished: new Promise<void>(() => {}),
            playState: 'paused',
          },
        ] as unknown as Animation[];

      handle.setPreviewElement(preview);
      handle.markSourceDragging();
      handle.prepareForDrop();
      handle.destroy();
      frames.shift()!(0);

      expect(preview.destroyed).toBe(false);
      vi.advanceTimersByTime(999);
      expect(preview.destroyed).toBe(false);
      vi.advanceTimersByTime(1);
      expect(preview.destroyed).toBe(true);
      expect(source).not.toHaveAttribute('data-dragging');
      expect(source).not.toHaveAttribute('data-settling');
    });

    it('settles on a matching source that remounts in another container', async () => {
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames: FrameRequestCallback[] = [];
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        frames.push(callback);
        return frames.length;
      });
      const identity = {
        kind: Symbol.for('card'),
        previewKey: 'card-a',
        payload: { id: 'a' },
      };
      const source = createSource();
      const handle = createSyntheticPreview(source, identity, null);
      activeHandles.push(handle);
      const preview = createPreviewElement(120, 30, false);
      document.body.appendChild(preview.element);
      let finishAnimation: () => void;
      const finished = new Promise<void>((resolve) => {
        finishAnimation = resolve;
      });
      preview.element.getAnimations = () =>
        [
          {
            effect: { getTiming: () => ({ iterations: 1 }) },
            finished,
          },
        ] as unknown as Animation[];

      handle.setPreviewElement(preview);
      handle.markSourceDragging();
      handle.prepareForDrop();
      handle.destroy();
      source.remove();

      const destination = createSource();
      destination.getBoundingClientRect = () => new DOMRect(240, 160, 120, 30);
      // Kanban payload objects are recreated as the card mounts in its new column,
      // so the explicit preview key supplies the stable identity in that case.
      retargetEndingPreviewSource(destination, {
        kind: identity.kind,
        previewKey: identity.previewKey,
        payload: { id: 'a' },
      });

      expect(destination).toHaveAttribute('data-dragging');
      expect(destination).toHaveAttribute('data-settling');
      expect(source).not.toHaveAttribute('data-settling');
      frames.shift()!(0);
      expect(preview.element.style.translate).toBe('240px 160px');
      expect(preview.destroyed).toBe(false);

      finishAnimation!();
      await finished;
      await Promise.resolve();
      expect(preview.destroyed).toBe(true);
      expect(destination).not.toHaveAttribute('data-dragging');
      expect(destination).not.toHaveAttribute('data-settling');
    });

    it('does not retarget a settling source without an unambiguous identity', () => {
      const frames: FrameRequestCallback[] = [];
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        frames.push(callback);
        return frames.length;
      });
      const kind = Symbol.for('untitled-card');
      const source = createSource();
      const handle = createSyntheticPreview(
        source,
        { kind, previewKey: undefined, payload: undefined },
        null,
      );
      activeHandles.push(handle);
      const preview = createPreviewElement(120, 30, false);
      document.body.appendChild(preview.element);
      preview.element.getAnimations = () => [];

      handle.setPreviewElement(preview);
      handle.markSourceDragging();
      handle.prepareForDrop();
      handle.destroy();
      source.remove();

      const destination = createSource();
      retargetEndingPreviewSource(destination, {
        kind,
        previewKey: undefined,
        payload: undefined,
      });

      expect(destination).not.toHaveAttribute('data-dragging');
      expect(destination).not.toHaveAttribute('data-settling');
      frames.shift()!(0);
      expect(preview.destroyed).toBe(true);
    });

    it('destroys a settling clone before paint when no drop transition is authored', () => {
      const frames: FrameRequestCallback[] = [];
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        frames.push(callback);
        return frames.length;
      });
      const source = createSource();
      source.getBoundingClientRect = () => new DOMRect(20, 30, 100, 25);
      const handle = createHandle(source);
      const preview = createPreviewElement(100, 25, false);
      document.body.appendChild(preview.element);
      preview.element.getAnimations = () => [];

      handle.setPreviewElement(preview);
      handle.markSourceDragging();
      handle.prepareForDrop();
      handle.destroy();
      expect(preview.destroyed).toBe(false);

      frames.shift()!(0);
      expect(preview.destroyed).toBe(true);
      expect(source).not.toHaveAttribute('data-dragging');
      expect(source).not.toHaveAttribute('data-settling');
    });

    it('does not preserve a custom preview whose React content is ending', () => {
      const handle = createHandle(createSource());
      const preview = createPreviewElement(100, 25, true);
      handle.setPreviewElement(preview);
      handle.prepareForDrop();
      handle.destroy();

      expect(preview.destroyed).toBe(true);
    });
  });

  describe('getPreviewOffset', () => {
    it('starts at zero and follows setPreviewOffset', () => {
      const handle = createHandle(document.body);
      expect(handle.getPreviewOffset()).toEqual({ x: 0, y: 0 });

      handle.setPreviewElement(createPreviewElement());
      handle.setPreviewOffset({ x: 7, y: 8 });
      expect(handle.getPreviewOffset()).toEqual({ x: 7, y: 8 });
    });
  });
});

describe('preview modifiers', () => {
  it('skips an identical translate produced by a modifier', () => {
    const preview = createPreviewElement(50, 30);
    const handle = createHandle(document.body, [restrictToVerticalAxis]);
    handle.setPreviewElement(preview);
    const observer = new MutationObserver(() => {});
    observer.observe(preview.element, { attributes: true, attributeFilter: ['style'] });

    handle.update(100, 100);
    expect(observer.takeRecords()).toHaveLength(1);

    // The pointer moved, but the axis lock resolves to the existing position.
    handle.update(300, 100);
    expect(observer.takeRecords()).toHaveLength(0);

    handle.update(300, 150);
    expect(observer.takeRecords()).toHaveLength(1);
    observer.disconnect();
  });

  it('constrains the preview position, anchored at the first positioned frame', () => {
    const preview = createPreviewElement(50, 30);
    const handle = createHandle(document.body, [restrictToVerticalAxis]);
    handle.setPreviewElement(preview);

    // The first frame anchors the locked axis at x = 100.
    handle.update(100, 100);
    expect(preview.element.style.translate).toBe('100px 100px');

    // x is pinned to the anchor; y still follows the pointer.
    handle.update(400, 250);
    expect(preview.element.style.translate).toBe('100px 250px');
  });

  // The scale is measured on the first frame the host is *rendered*, not the first
  // frame outright: a consumer re-render can tear the host out momentarily (that is
  // what `ensureConnected` exists for), and a detached or hidden element resolves no
  // computed transforms — a measurement taken then would cache 1 for the rest of the
  // drag.
  it('waits for the preview to be rendered before measuring its scale', () => {
    const preview = createPreviewElement(50, 30);
    // jsdom lays nothing out, so its `getClientRects` is always empty; report the box
    // a browser would, but only once the element is connected — the detached phase
    // below relies on the empty list either way.
    preview.element.getClientRects = () =>
      (preview.element.isConnected ? [new DOMRect(0, 0, 50, 30)] : []) as unknown as DOMRectList;
    const seen: number[] = [];
    const handle = createHandle(document.body, [
      ({ point, scale }) => {
        seen.push(scale.x);
        return point;
      },
    ]);
    handle.setPreviewElement(preview);

    // Detached: the measurement must not run yet, and must not latch its answer.
    handle.update(100, 100);
    expect(seen.at(-1)).toBe(1);

    const parent = createSource();
    parent.style.transform = 'matrix(2, 0, 0, 2, 0, 0)';
    parent.appendChild(preview.element);

    handle.update(120, 120);
    expect(seen.at(-1)).toBe(2);
  });

  // Connected is not rendered: under `display: none` a browser resolves no computed
  // transforms (`transform` reads back as `none`), so a measurement taken there would
  // cache 1 for the rest of the drag. Only a browser can exercise this — jsdom has no
  // rendered-ness to withhold.
  it.skipIf(isJSDOM)('does not latch the scale while the preview host is hidden', () => {
    const preview = createPreviewElement(50, 30);
    const seen: number[] = [];
    const handle = createHandle(document.body, [
      ({ point, scale }) => {
        seen.push(scale.x);
        return point;
      },
    ]);
    handle.setPreviewElement(preview);

    const parent = createSource();
    parent.style.transform = 'matrix(2, 0, 0, 2, 0, 0)';
    parent.style.display = 'none';
    parent.appendChild(preview.element);

    // Hidden: connected, but nothing is rendered to measure.
    handle.update(100, 100);
    expect(seen.at(-1)).toBe(1);

    parent.style.display = '';
    handle.update(120, 120);
    expect(seen.at(-1)).toBe(2);
  });

  // A preview modifier is the same function as a root one, so it has to see the same key
  // state — otherwise the same modifier behaves differently depending on where it is
  // attached, which nothing in the API would explain.
  it('passes the modifier keys of the update through to the modifiers', () => {
    const preview = createPreviewElement(50, 30);
    const seen: boolean[] = [];
    const handle = createHandle(document.body, [
      ({ point, shiftKey }) => {
        seen.push(shiftKey);
        return point;
      },
    ]);
    handle.setPreviewElement(preview);

    handle.update(100, 100);
    expect(seen.at(-1)).toBe(false);

    handle.update(120, 120, { ctrlKey: false, shiftKey: true, altKey: false, metaKey: false });
    expect(seen.at(-1)).toBe(true);
  });

  it('applies modifiers in order, so a rect clamp contains an earlier modifier', () => {
    const preview = createPreviewElement(50, 30);
    const boundary = document.createElement('div');
    boundary.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
    const handle = createHandle(document.body, [
      () => ({ x: 500, y: 500 }),
      restrictToElement(boundary),
    ]);
    handle.setPreviewElement(preview);

    handle.update(50, 60);
    // The element clamp is the outer modifier: 200−50=150, 200−30=170.
    expect(preview.element.style.translate).toBe('150px 170px');
  });

  it('passes the preview-level context: point is the proposed top-left, input the cursor', () => {
    const source = createSource();
    const preview = createPreviewElement(50, 30);
    const contexts: Array<{
      point: DraggablePosition;
      initialPoint: DraggablePosition;
      input: DraggablePosition;
      previewOffset: DraggablePosition;
      sourceElement: HTMLElement;
      sourceRect: DOMRect;
      previewRect: DOMRect | null;
    }> = [];
    const handle = createHandle(source, [
      (context) => {
        contexts.push({
          point: { ...context.point },
          initialPoint: { ...context.initialPoint },
          input: { ...context.input },
          previewOffset: { ...context.previewOffset },
          sourceElement: context.sourceElement,
          sourceRect: context.sourceRect,
          previewRect: context.previewRect,
        });
        return context.point;
      },
    ]);
    handle.setPreviewElement(preview);
    handle.setPreviewOffset({ x: 10, y: 20 });
    handle.update(100, 200);

    expect(contexts).toHaveLength(1);
    const context = contexts[0];
    expect(context.point).toEqual({ x: 90, y: 180 });
    expect(context.input).toEqual({ x: 100, y: 200 });
    // `point` already is the preview's top-left, so the offset is zero here.
    expect(context.previewOffset).toEqual({ x: 0, y: 0 });
    expect(context.initialPoint).toEqual({ x: 90, y: 180 });
    expect(context.sourceElement).toBe(source);
    expect(context.sourceRect).toBe(preview.sourceRect);
    expect(context.previewRect?.width).toBe(50);
    expect(context.previewRect?.height).toBe(30);
  });

  it('re-anchors the modifier reference when the offset resolves mid-drag', () => {
    const preview = createPreviewElement(50, 30);
    const handle = createHandle(document.body, [restrictToVerticalAxis]);
    handle.setPreviewElement(preview);

    handle.update(100, 100);
    handle.update(400, 250);
    expect(preview.element.style.translate).toBe('100px 250px');

    // The offset callback resolving must reset the anchor: the lock pins to the
    // first proposal computed with the new offset, not to the stale x = 100.
    handle.setPreviewOffset({ x: 10, y: 20 });
    expect(preview.element.style.translate).toBe('390px 230px');

    handle.update(500, 300);
    expect(preview.element.style.translate).toBe('390px 280px');
  });

  it('leaves the frame unconstrained when a modifier throws', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const preview = createPreviewElement(50, 30);
    const handle = createHandle(document.body, [
      () => {
        throw new Error('broken modifier');
      },
    ]);
    handle.setPreviewElement(preview);

    expect(() => handle.update(123, 456)).not.toThrow();
    expect(preview.element.style.translate).toBe('123px 456px');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('leaving this move unconstrained'),
      expect.anything(),
      expect.any(Error),
    );
  });
});
