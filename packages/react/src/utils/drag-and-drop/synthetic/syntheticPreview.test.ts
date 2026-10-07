import { afterEach, describe, it, expect, vi } from 'vitest';
import { isJSDOM } from '#test-utils';
import { createSyntheticPreview, retargetEndingPreviewSource } from './syntheticPreview';
import { restrictToVerticalAxis } from '../dragModifiers';
import type { DraggablePosition } from '../../../draggable/DraggableProvider';
import type { DragPreviewElementHandle } from './cloneDragPreview';

/**
 * A stand-in for the element the engine builds next to the drag source. jsdom
 * doesn't lay out, so the size reads the modifiers depend on are stubbed.
 */
function createPreviewElement(
  width = 0,
  height = 0,
): DragPreviewElementHandle & { destroyed: boolean } {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => new DOMRect(0, 0, width, height);
  const sourceRect = new DOMRect(0, 0, width, height);
  return {
    element,
    anchor: { sourceRect, sourceScale: { x: 1, y: 1 }, hosts: [], inContainer: false, slot: null },
    destroyed: false,
    setPosition(x, y) {
      element.style.translate = `${x}px ${y}px`;
    },
    ensureConnected() {},
    updateContentStyle() {},
    prepareForDrop() {},
    destroy() {
      this.destroyed = true;
      element.remove();
    },
  };
}

// Teardown runs in `afterEach`, not at the end of each test, so a failed assertion
// cannot skip cleanup and break later tests (a leaked `data-dragging` on
// `document.body`, a handle left alive).
const activeHandles: Array<{ end(drop: boolean): void }> = [];
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

/**
 * Queue `requestAnimationFrame` callbacks instead of running them, so a test steps
 * each frame by hand. `afterEach` restores the real `requestAnimationFrame`.
 */
function queueAnimationFrames(): FrameRequestCallback[] {
  const frames: FrameRequestCallback[] = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.push(callback);
    return frames.length;
  });
  return frames;
}

afterEach(() => {
  // `destroy()` is idempotent (asserted below), so re-destroying a handle a
  // test already tore down is safe.
  while (activeHandles.length > 0) {
    activeHandles.pop()!.end(false);
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
        handle.end(false);
        return point;
      },
    ]);
    const preview = createPreviewElement(120, 30);
    handle.setPreviewElement(preview);
    handle.update(20, 20);
    expect(preview.destroyed).toBe(true);
    expect(preview.element.style.translate).toBe('');
  });

  it('marks the source as dragging, and clears it on destroy', () => {
    const source = createSource();
    const handle = createHandle(source);

    // Not on creation. The preview is measured from the source first, so a
    // `[data-dragging]` rule that resizes or hides it cannot corrupt the geometry.
    expect(source).not.toHaveAttribute('data-dragging');
    handle.markSourceDragging();
    expect(source).toHaveAttribute('data-dragging');

    handle.end(false);
    expect(source).not.toHaveAttribute('data-dragging');
  });

  it('moves data-dragging to the new node when a virtualizer remounts the source', () => {
    const oldNode = createSource();
    const newNode = createSource();
    const handle = createHandle(oldNode);
    handle.markSourceDragging();

    handle.retargetSource(newNode);

    // A CSS-only `[data-dragging]` dim would otherwise stop applying the moment the
    // row was recycled, while `Draggable.Root`'s `dragging` kept tracking it.
    expect(oldNode).not.toHaveAttribute('data-dragging');
    expect(newNode).toHaveAttribute('data-dragging');

    handle.end(false);
    expect(newNode).not.toHaveAttribute('data-dragging');
  });

  describe('setPreviewElement', () => {
    it('exposes the adopted preview element and destroys it when the preview is torn down', () => {
      const handle = createHandle(document.body);
      const preview = createPreviewElement();
      handle.setPreviewElement(preview);
      expect(handle.getPreviewElement()).toBe(preview);
      handle.end(false);
      expect(handle.getPreviewElement()).toBeNull();
      expect(preview.destroyed).toBe(true);
    });

    it('re-anchors the preview when the offset is resolved after its content renders', () => {
      // A `Draggable.Preview` with an offset callback can only be measured once its
      // content has been copied in, which is after the engine placed it.
      const handle = createHandle(document.body);
      const preview = createPreviewElement();
      handle.setPreviewElement(preview);
      handle.update(100, 200);
      expect(preview.element.style.translate).toBe('100px 200px');

      handle.setPreviewOffset({ x: 10, y: 20 });
      // Re-anchored without waiting for another pointer move.
      expect(preview.element.style.translate).toBe('90px 180px');
    });

    it('keeps a cloned preview mounted through its authored drop transition', async () => {
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames = queueAnimationFrames();
      const source = createSource();
      source.getBoundingClientRect = () => new DOMRect(40, 50, 120, 30);
      const handle = createHandle(source);
      const preview = createPreviewElement(120, 30);
      // The authored ending transition that animates the move to the source.
      preview.element.style.transitionProperty = 'translate';
      preview.element.style.transitionDuration = '200ms';
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
      handle.end(true);

      expect(source).toHaveAttribute('data-dragging');
      expect(source).toHaveAttribute('data-settling');
      expect(preview.destroyed).toBe(false);

      frames.shift()!(0);
      expect(preview.element).toHaveAttribute('data-ending-style');
      expect(preview.element.style.translate).toBe('40px 50px');
      expect(preview.destroyed).toBe(false);

      finishAnimation!();
      await finished;
      await Promise.resolve();
      expect(preview.destroyed).toBe(true);
      expect(source).not.toHaveAttribute('data-dragging');
      expect(source).not.toHaveAttribute('data-settling');
    });

    it('ends in place when no translate transition animates the move', async () => {
      // A fade-only ending would otherwise jump to the source on its first frame
      // and fade there.
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames = queueAnimationFrames();
      const source = createSource();
      source.getBoundingClientRect = () => new DOMRect(40, 50, 120, 30);
      const handle = createHandle(source);
      const preview = createPreviewElement(120, 30);
      preview.element.style.transitionProperty = 'opacity, translate';
      preview.element.style.transitionDuration = '200ms, 0s';
      document.body.appendChild(preview.element);
      let finishAnimation: () => void;
      const finished = new Promise<void>((resolve) => {
        finishAnimation = resolve;
      });
      preview.element.getAnimations = () =>
        [{ effect: { getTiming: () => ({ iterations: 1 }) }, finished }] as unknown as Animation[];

      handle.setPreviewElement(preview);
      handle.update(300, 400);
      handle.markSourceDragging();
      handle.end(true);
      frames.shift()!(0);

      expect(preview.element.style.translate).toBe('300px 400px');
      expect(preview.destroyed).toBe(false);
      finishAnimation!();
      await finished;
      await Promise.resolve();
      expect(preview.destroyed).toBe(true);
    });

    it('runs the ending in place when the source is gone', async () => {
      // A drop that remounts the item without a matching identity leaves nothing to
      // move onto, but an ending fade still runs.
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames = queueAnimationFrames();
      const source = createSource();
      const handle = createHandle(source);
      const preview = createPreviewElement(120, 30);
      preview.element.style.transitionProperty = 'translate';
      preview.element.style.transitionDuration = '200ms';
      document.body.appendChild(preview.element);
      const finished = new Promise<void>(() => {});
      preview.element.getAnimations = () =>
        [{ effect: { getTiming: () => ({ iterations: 1 }) }, finished }] as unknown as Animation[];

      handle.setPreviewElement(preview);
      handle.update(300, 400);
      handle.markSourceDragging();
      handle.end(true);
      source.remove();
      frames.shift()!(0);

      expect(preview.element.style.translate).toBe('300px 400px');
      expect(preview.destroyed).toBe(false);
    });

    it('marks the ending preview when the release dropped on a target', () => {
      const frames = queueAnimationFrames();
      const outside = createHandle(createSource());
      const returning = createPreviewElement(120, 30);
      document.body.appendChild(returning.element);
      outside.setPreviewElement(returning);
      outside.end(true);
      frames.shift()!(0);
      expect(returning.element).toHaveAttribute('data-ending-style');
      expect(returning.element).not.toHaveAttribute('data-dropped');

      const onTarget = createHandle(createSource());
      const dropped = createPreviewElement(120, 30);
      document.body.appendChild(dropped.element);
      onTarget.setPreviewElement(dropped);
      onTarget.end(true);
      // The lifecycle resolves the drop after the sensor released the preview, but
      // before the ending's first frame, which applies both attributes together.
      onTarget.markDropped();
      expect(dropped.element).not.toHaveAttribute('data-ending-style');
      frames.shift()!(0);
      expect(dropped.element).toHaveAttribute('data-ending-style');
      expect(dropped.element).toHaveAttribute('data-dropped');
    });

    it.each(['duration', 'iterations'])('ignores animations with infinite %s', (property) => {
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames = queueAnimationFrames();
      const source = createSource();
      const handle = createHandle(source);
      const preview = createPreviewElement(120, 30);
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
      handle.end(true);
      frames.shift()!(0);
      expect(preview.destroyed).toBe(true);
      expect(source).not.toHaveAttribute('data-dragging');
    });

    it('cleans up a settling preview whose animation stays paused', () => {
      vi.useFakeTimers();
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames = queueAnimationFrames();
      const source = createSource();
      source.getBoundingClientRect = () => new DOMRect(40, 50, 120, 30);
      const handle = createHandle(source);
      const preview = createPreviewElement(120, 30);
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
      handle.end(true);
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
      const frames = queueAnimationFrames();
      const identity = {
        kind: Symbol.for('card'),
        previewKey: 'card-a',
        payload: { id: 'a' },
      };
      const source = createSource();
      const handle = createSyntheticPreview(source, identity, null);
      activeHandles.push(handle);
      const preview = createPreviewElement(120, 30);
      preview.element.style.transitionProperty = 'translate';
      preview.element.style.transitionDuration = '200ms';
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
      handle.end(true);
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
      const frames = queueAnimationFrames();
      const kind = Symbol.for('untitled-card');
      const source = createSource();
      const handle = createSyntheticPreview(
        source,
        { kind, previewKey: undefined, payload: undefined },
        null,
      );
      activeHandles.push(handle);
      const preview = createPreviewElement(120, 30);
      document.body.appendChild(preview.element);
      preview.element.getAnimations = () => [];

      handle.setPreviewElement(preview);
      handle.markSourceDragging();
      handle.end(true);
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

    it('finishes settling on the first frame when animations are disabled', () => {
      const frames = queueAnimationFrames();
      const source = createSource();
      const handle = createHandle(source);
      const preview = createPreviewElement(100, 25);
      document.body.appendChild(preview.element);
      handle.setPreviewElement(preview);
      handle.end(true);

      expect(preview.destroyed).toBe(false);
      expect(source).toHaveAttribute('data-settling');
      frames.shift()!(0);
      expect(preview.element).toHaveAttribute('data-ending-style');
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

  // Connected does not mean rendered. Under `display: none`, a browser resolves no
  // computed transforms (`transform` reads back as `none`), so a measurement there
  // would cache 1 for the rest of the drag. Only a browser can test this, since
  // jsdom renders nothing.
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

    // Connected but hidden, so nothing is rendered to measure.
    handle.update(100, 100);
    expect(seen.at(-1)).toBe(1);

    parent.style.display = '';
    handle.update(120, 120);
    expect(seen.at(-1)).toBe(2);
  });

  // A preview modifier has the same signature as a root modifier, so it must see the
  // same key state. Otherwise one modifier would behave differently depending on
  // where it is attached.
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
    expect(context.sourceRect).toBe(preview.anchor.sourceRect);
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

    // A resolved offset callback must reset the anchor. The lock pins to the first
    // proposal computed with the new offset, not to the stale x = 100.
    handle.setPreviewOffset({ x: 10, y: 20 });
    expect(preview.element.style.translate).toBe('390px 230px');

    handle.update(500, 300);
    expect(preview.element.style.translate).toBe('390px 280px');
  });
});
