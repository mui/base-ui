import { afterEach, describe, it, expect, vi } from 'vitest';
import { isJSDOM } from '#test-utils';
import { createDragPreview, createRootDragStore, retargetPreviewSource } from './syntheticPreview';
import type {
  DragPreview,
  PreviewAttachSettings,
  SyntheticPreviewSourceIdentity,
} from './syntheticPreview';
import { restrictToVerticalAxis } from '../dragModifiers';
import type { DraggableInput, DraggablePosition } from '../../../draggable/DraggableProvider';

const INPUT: DraggableInput = {
  button: 0,
  buttons: 1,
  clientX: 0,
  clientY: 0,
  pageX: 0,
  pageY: 0,
  pointerType: 'mouse',
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  metaKey: false,
};

// Teardown runs in `afterEach` so a failed assertion can't skip it and leak state,
// such as `data-dragging` on a source, into later tests.
const activeHandles: DragPreview[] = [];
const attachedElements: HTMLElement[] = [];

/** An identity no remounted source matches, so settling previews never retarget. */
const UNMATCHED_IDENTITY = {
  kind: Symbol('test-source'),
  previewKey: undefined,
  payload: undefined,
};

/** A `<div>` appended to the body and removed in `afterEach`. jsdom doesn't lay out. */
function createElement(rect = new DOMRect(0, 0, 0, 0)): HTMLElement {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => rect;
  document.body.appendChild(element);
  attachedElements.push(element);
  return element;
}

/** A preview picked up at `press`, queued for `afterEach` destruction. */
function createHandle(
  source: HTMLElement,
  options: { identity?: SyntheticPreviewSourceIdentity; press?: DraggablePosition } = {},
): DragPreview {
  const press = options.press ?? { x: 0, y: 0 };
  const input = { ...INPUT, clientX: press.x, clientY: press.y };
  const sourceRect = source.getBoundingClientRect();
  const handle = createDragPreview(source, options.identity ?? UNMATCHED_IDENTITY, {
    sourceRect,
    sourceSize: { width: sourceRect.width, height: sourceRect.height },
    input,
    pressInput: input,
  });
  activeHandles.push(handle);
  return handle;
}

const POINTER: PreviewAttachSettings = { offset: 'pointer', modifiers: undefined };

/** Give `element` a running `translate` transition that resolves with `finish`. */
function mockDropTransition(element: HTMLElement) {
  element.style.transitionProperty = 'translate';
  element.style.transitionDuration = '200ms';
  let finish!: () => void;
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  element.getAnimations = () =>
    [{ effect: { getTiming: () => ({ iterations: 1 }) }, finished }] as unknown as Animation[];
  return {
    async finish() {
      finish();
      await finished;
      await Promise.resolve();
    },
  };
}

/** Queue `requestAnimationFrame` callbacks so a test steps each frame by hand. */
function queueAnimationFrames(): FrameRequestCallback[] {
  const frames: FrameRequestCallback[] = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.push(callback);
    return frames.length;
  });
  return frames;
}

afterEach(() => {
  // `end` is a no-op on a destroyed handle, so ending one a test already tore
  // down is safe.
  while (activeHandles.length > 0) {
    activeHandles.pop()!.end(false);
  }
  while (attachedElements.length > 0) {
    attachedElements.pop()!.remove();
  }
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** The identity of a root's source, for the tests of its drag. */
function rootIdentity(owner = createRootDragStore()) {
  return { kind: Symbol.for('root-test'), previewKey: undefined, payload: { id: 'a' }, owner };
}

describe('syntheticPreview', () => {
  describe('root drag', () => {
    it('marks the source and publishes the dragging phase to its root until the drag ends', () => {
      const identity = rootIdentity();
      const source = createElement();
      const handle = createHandle(source, { identity });

      expect(source).toHaveAttribute('data-dragging');
      expect(identity.owner.state).toEqual({ phase: 'dragging', preview: handle });

      handle.end(false);
      expect(source).not.toHaveAttribute('data-dragging');
      expect(identity.owner.state).toEqual({ phase: 'idle', preview: null });
    });

    it('publishes the idle phase once the preview is torn down, so a positioner unmounting on it leaves no copy', () => {
      const identity = rootIdentity();
      const handle = createHandle(createElement(), { identity });
      const positioner = createElement();
      const detach = handle.attach(positioner, null, POINTER);
      handle.update(100, 200);
      // As `Draggable.Root` does when it renders the idle phase: its positioner unmounts.
      const onIdle = vi.fn(() => {
        detach();
        positioner.remove();
      });
      identity.owner.subscribe((drag) => {
        if (drag.phase === 'idle') {
          onIdle();
        }
      });

      handle.end(false);

      expect(onIdle).toHaveBeenCalledTimes(1);
      expect(handle.getPreviewElement()).toBeNull();
      expect(document.body.children).toHaveLength(attachedElements.length - 1);
    });

    it('moves the drag to a node its root swaps in mid-drag, keeping the root drag', () => {
      const identity = rootIdentity();
      const oldNode = createElement();
      const handle = createHandle(oldNode, { identity });
      const drag = identity.owner.state;
      const newNode = createElement();
      oldNode.remove();

      retargetPreviewSource(newNode, { ...identity, payload: undefined });

      // A CSS-only `[data-dragging]` dim would otherwise stop applying the moment the
      // row was recycled.
      expect(oldNode).not.toHaveAttribute('data-dragging');
      expect(newNode).toHaveAttribute('data-dragging');
      // The root renders nothing new for its own node swap.
      expect(identity.owner.state).toBe(drag);

      handle.end(false);
      expect(newNode).not.toHaveAttribute('data-dragging');
    });

    it('hands the drag over to a root that remounts mid-drag with the same payload', () => {
      const first = rootIdentity();
      const oldNode = createElement();
      const handle = createHandle(oldNode, { identity: first });
      oldNode.remove();

      const second = { ...first, owner: createRootDragStore() };
      const newNode = createElement();
      retargetPreviewSource(newNode, second);

      expect(first.owner.state).toEqual({ phase: 'idle', preview: null });
      expect(second.owner.state).toEqual({ phase: 'dragging', preview: handle });
      expect(newNode).toHaveAttribute('data-dragging');

      handle.end(false);
      expect(second.owner.state).toEqual({ phase: 'idle', preview: null });
    });
  });

  it('has no element until a positioner attaches', () => {
    const handle = createHandle(createElement());
    handle.update(100, 200);
    expect(handle.getPreviewElement()).toBeNull();

    const positioner = createElement();
    handle.attach(positioner, null, POINTER);
    expect(handle.getPreviewElement()).toBe(positioner);
    // Placed at the latest pointer position right away.
    expect(positioner.style.translate).toBe('100px 200px');
  });

  it.each([
    { name: "'source'", offset: 'source' as const, expected: '90px 190px' },
    { name: "'pointer'", offset: 'pointer' as const, expected: '100px 200px' },
    { name: 'a position', offset: { x: 5, y: 10 }, expected: '95px 190px' },
    { name: 'a function', offset: () => ({ x: 1, y: 2 }), expected: '99px 198px' },
  ])('places the preview at the $name offset', ({ offset, expected }) => {
    // Pressed 10px into a source at (40, 70).
    const handle = createHandle(createElement(new DOMRect(40, 70, 100, 30)), {
      press: { x: 50, y: 80 },
    });
    const positioner = createElement();
    handle.attach(positioner, null, { offset, modifiers: undefined });
    handle.update(100, 200);
    expect(positioner.style.translate).toBe(expected);
  });

  it('positions the preview inside the positioner, not the positioner itself', () => {
    const handle = createHandle(createElement(new DOMRect(40, 70, 100, 30)), {
      press: { x: 50, y: 80 },
    });
    // A table header row sits above the row preview.
    const positioner = createElement(new DOMRect(0, 0, 100, 60));
    const content = createElement(new DOMRect(0, 30, 100, 30));
    handle.attach(positioner, content, { offset: 'source', modifiers: undefined });
    handle.update(50, 80);
    // The row lands on the source, so the positioner sits one header higher.
    expect(positioner.style.translate).toBe('40px 40px');
  });

  it('passes the preview element to an offset function', () => {
    const offset = vi.fn(() => ({ x: 0, y: 0 }));
    const handle = createHandle(createElement());
    const content = createElement();
    handle.attach(createElement(), content, { offset, modifiers: undefined });
    expect(offset).toHaveBeenCalledWith(expect.objectContaining({ element: content }));
  });

  it('falls back to the source offset when an offset function throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handle = createHandle(createElement(new DOMRect(40, 70, 100, 30)), {
      press: { x: 50, y: 80 },
    });
    const positioner = createElement();
    handle.attach(positioner, null, {
      offset: () => {
        throw new Error('boom');
      },
      modifiers: undefined,
    });
    handle.update(100, 200);
    expect(positioner.style.translate).toBe('90px 190px');
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it('leaves a copy in place when the positioner unmounts mid-drag', () => {
    const handle = createHandle(createElement());
    const parent = createElement();
    const positioner = document.createElement('div');
    positioner.textContent = 'Preview';
    parent.appendChild(positioner);
    const detach = handle.attach(positioner, null, POINTER);
    handle.update(100, 200);

    detach();
    positioner.remove();

    const copy = handle.getPreviewElement()!;
    expect(copy).not.toBe(positioner);
    expect(copy.parentElement).toBe(parent);
    expect(copy).toHaveTextContent('Preview');
    // It keeps following the pointer.
    handle.update(150, 250);
    expect(copy.style.translate).toBe('150px 250px');

    handle.end(false);
    expect(copy.isConnected).toBe(false);
  });

  it('re-homes the copy when its parent is removed with the positioner', async () => {
    const handle = createHandle(createElement());
    const portal = createElement();
    const positioner = document.createElement('div');
    portal.appendChild(positioner);
    const detach = handle.attach(positioner, null, POINTER);

    detach();
    portal.remove();
    await Promise.resolve();

    expect(handle.getPreviewElement()?.parentElement).toBe(document.body);
  });

  it('re-homes the copy in the shadow root its removed portal was in', async () => {
    const handle = createHandle(createElement());
    const shadowRoot = createElement().attachShadow({ mode: 'open' });
    const portal = document.createElement('div');
    shadowRoot.appendChild(portal);
    const positioner = document.createElement('div');
    portal.appendChild(positioner);
    const detach = handle.attach(positioner, null, POINTER);

    detach();
    portal.remove();
    await Promise.resolve();

    expect(handle.getPreviewElement()?.parentNode).toBe(shadowRoot);
  });

  it('re-homes the copy when an ancestor is removed after it was left in place', async () => {
    const handle = createHandle(createElement());
    const panel = createElement();
    const parent = document.createElement('div');
    panel.appendChild(parent);
    const positioner = document.createElement('div');
    parent.appendChild(positioner);
    const detach = handle.attach(positioner, null, POINTER);
    detach();
    positioner.remove();
    await Promise.resolve();
    const copy = handle.getPreviewElement()!;
    expect(copy.parentElement).toBe(parent);

    // As when a later commit replaces the panel, with the pointer still.
    panel.remove();
    await Promise.resolve();

    expect(copy.parentElement).toBe(document.body);
  });

  it('swaps the copy for a positioner that attaches again', () => {
    const handle = createHandle(createElement());
    const first = createElement();
    const detach = handle.attach(first, null, { offset: { x: 5, y: 5 }, modifiers: undefined });
    handle.update(100, 200);
    detach();
    first.remove();
    const copy = handle.getPreviewElement()!;

    // The remounted root renders a new positioner. The offset resolved on the first
    // attach stays, so the preview doesn't jump.
    const second = createElement();
    handle.attach(second, null, POINTER);
    expect(copy.isConnected).toBe(false);
    expect(handle.getPreviewElement()).toBe(second);
    expect(second.style.translate).toBe('95px 195px');
  });

  it('leaves no copy when the positioner unmounts after the drag ended', () => {
    const handle = createHandle(createElement());
    const positioner = createElement();
    const detach = handle.attach(positioner, null, POINTER);
    handle.end(false);
    detach();
    expect(handle.getPreviewElement()).toBeNull();
    expect(document.body.children).toHaveLength(attachedElements.length);
  });

  describe('drop', () => {
    it('keeps the preview mounted and its root settling through its authored drop transition', async () => {
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames = queueAnimationFrames();
      const identity = rootIdentity();
      const source = createElement(new DOMRect(40, 50, 120, 30));
      const handle = createHandle(source, { identity });
      const positioner = createElement();
      const transition = mockDropTransition(positioner);

      handle.attach(positioner, null, POINTER);
      handle.end(true);

      expect(source).toHaveAttribute('data-dragging');
      expect(source).toHaveAttribute('data-settling');
      expect(identity.owner.state).toEqual({ phase: 'settling', preview: handle });

      frames.shift()!(0);
      expect(positioner).toHaveAttribute('data-ending-style');
      expect(positioner.style.translate).toBe('40px 50px');
      expect(identity.owner.state.phase).toBe('settling');

      await transition.finish();
      expect(handle.getPreviewElement()).toBeNull();
      expect(identity.owner.state).toEqual({ phase: 'idle', preview: null });
      expect(source).not.toHaveAttribute('data-dragging');
      expect(source).not.toHaveAttribute('data-settling');
    });

    it('ends in place when no translate transition animates the move', () => {
      // A fade-only ending would otherwise jump to the source on its first frame
      // and fade there.
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames = queueAnimationFrames();
      const handle = createHandle(createElement(new DOMRect(40, 50, 120, 30)));
      const positioner = createElement();
      mockDropTransition(positioner);
      positioner.style.transitionProperty = 'opacity, translate';
      positioner.style.transitionDuration = '200ms, 0s';

      handle.attach(positioner, null, POINTER);
      handle.update(300, 400);
      handle.end(true);
      frames.shift()!(0);

      expect(positioner.style.translate).toBe('300px 400px');
      expect(handle.getPreviewElement()).toBe(positioner);
    });

    it('runs the ending in place when the source is gone', () => {
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames = queueAnimationFrames();
      const source = createElement(new DOMRect(40, 50, 120, 30));
      const handle = createHandle(source);
      const positioner = createElement();
      mockDropTransition(positioner);

      handle.attach(positioner, null, POINTER);
      handle.update(300, 400);
      handle.end(true);
      source.remove();
      frames.shift()!(0);

      expect(positioner.style.translate).toBe('300px 400px');
      expect(handle.getPreviewElement()).toBe(positioner);
    });

    it('marks the preview and its content when the release dropped on a target', () => {
      const frames = queueAnimationFrames();
      const outside = createHandle(createElement());
      const returning = createElement();
      outside.attach(returning, null, POINTER);
      outside.end(true);
      frames.shift()!(0);
      expect(returning).toHaveAttribute('data-ending-style');
      expect(returning).not.toHaveAttribute('data-dropped');

      const onTarget = createHandle(createElement());
      const positioner = createElement();
      const content = createElement();
      onTarget.attach(positioner, content, POINTER);
      onTarget.end(true);
      // The lifecycle resolves the drop after the sensor released the preview, but
      // before the ending's first frame, which applies both attributes together.
      onTarget.markDropped();
      expect(positioner).not.toHaveAttribute('data-ending-style');
      frames.shift()!(0);
      for (const element of [positioner, content]) {
        expect(element).toHaveAttribute('data-ending-style');
        expect(element).toHaveAttribute('data-dropped');
      }
    });

    it('hides a positioner that attaches once the ending started, until it detaches', () => {
      const frames = queueAnimationFrames();
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const handle = createHandle(createElement());
      const positioner = createElement();
      mockDropTransition(positioner);
      handle.attach(positioner, null, POINTER);
      handle.end(true);
      frames.shift()!(0);

      const late = createElement();
      const detach = handle.attach(late, null, POINTER);
      expect(late.style.visibility).toBe('hidden');
      expect(handle.getPreviewElement()).toBe(positioner);

      // Shown again if a new drag of the same item attaches it.
      detach();
      expect(late.style.visibility).toBe('');
    });

    it.each(['duration', 'iterations'])('ignores animations with infinite %s', (property) => {
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames = queueAnimationFrames();
      const source = createElement();
      const handle = createHandle(source);
      const positioner = createElement();
      positioner.getAnimations = () =>
        [
          {
            effect: { getTiming: () => ({ duration: 100, iterations: 1, [property]: Infinity }) },
            finished: new Promise<void>(() => {}),
          },
        ] as unknown as Animation[];
      handle.attach(positioner, null, POINTER);
      handle.end(true);
      frames.shift()!(0);
      expect(handle.getPreviewElement()).toBeNull();
      expect(source).not.toHaveAttribute('data-dragging');
    });

    it('cleans up a settling preview whose animation stays paused', () => {
      vi.useFakeTimers();
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames = queueAnimationFrames();
      const source = createElement(new DOMRect(40, 50, 120, 30));
      const handle = createHandle(source);
      const positioner = createElement();
      positioner.getAnimations = () =>
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

      handle.attach(positioner, null, POINTER);
      handle.end(true);
      frames.shift()!(0);

      expect(handle.getPreviewElement()).toBe(positioner);
      vi.advanceTimersByTime(999);
      expect(handle.getPreviewElement()).toBe(positioner);
      vi.advanceTimersByTime(1);
      expect(handle.getPreviewElement()).toBeNull();
      expect(source).not.toHaveAttribute('data-dragging');
      expect(source).not.toHaveAttribute('data-settling');
    });

    it('settles on a matching root that remounts in another container', async () => {
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      const frames = queueAnimationFrames();
      const identity = {
        kind: Symbol.for('card'),
        previewKey: 'card-a',
        payload: { id: 'a' },
        owner: createRootDragStore(),
      };
      const source = createElement();
      const handle = createHandle(source, { identity });
      const positioner = createElement();
      const transition = mockDropTransition(positioner);

      handle.attach(positioner, null, POINTER);
      handle.end(true);
      source.remove();

      const destination = createElement(new DOMRect(240, 160, 120, 30));
      const owner = createRootDragStore();
      // Kanban payload objects are recreated as the card mounts in its new column,
      // so the explicit preview key supplies the stable identity in that case.
      retargetPreviewSource(destination, {
        kind: identity.kind,
        previewKey: identity.previewKey,
        payload: { id: 'a' },
        owner,
      });

      expect(destination).toHaveAttribute('data-dragging');
      expect(destination).toHaveAttribute('data-settling');
      expect(source).not.toHaveAttribute('data-settling');
      expect(identity.owner.state).toEqual({ phase: 'idle', preview: null });
      expect(owner.state).toEqual({ phase: 'settling', preview: handle });
      frames.shift()!(0);
      expect(positioner.style.translate).toBe('240px 160px');

      await transition.finish();
      expect(handle.getPreviewElement()).toBeNull();
      expect(destination).not.toHaveAttribute('data-dragging');
      expect(destination).not.toHaveAttribute('data-settling');
    });

    it('does not retarget a settling source without an unambiguous identity', () => {
      const frames = queueAnimationFrames();
      const kind = Symbol.for('untitled-card');
      const source = createElement();
      const handle = createHandle(source, {
        identity: { kind, previewKey: undefined, payload: undefined },
      });
      handle.attach(createElement(), null, POINTER);
      handle.end(true);
      source.remove();

      const destination = createElement();
      retargetPreviewSource(destination, { kind, previewKey: undefined, payload: undefined });

      expect(destination).not.toHaveAttribute('data-dragging');
      expect(destination).not.toHaveAttribute('data-settling');
      frames.shift()!(0);
      expect(handle.getPreviewElement()).toBeNull();
    });

    it('finishes settling on the first frame when animations are disabled', () => {
      const frames = queueAnimationFrames();
      const source = createElement();
      const handle = createHandle(source);
      const positioner = createElement();
      handle.attach(positioner, null, POINTER);
      handle.end(true);

      expect(source).toHaveAttribute('data-settling');
      frames.shift()!(0);
      expect(positioner).toHaveAttribute('data-ending-style');
      expect(handle.getPreviewElement()).toBeNull();
      expect(source).not.toHaveAttribute('data-settling');
    });
  });
});

describe('preview modifiers', () => {
  function attachWithModifiers(
    handle: DragPreview,
    modifiers: PreviewAttachSettings['modifiers'],
    content = createElement(new DOMRect(0, 0, 50, 30)),
  ) {
    handle.attach(content, null, { offset: 'pointer', modifiers });
    return content;
  }

  it('constrains the preview position, anchored at the first positioned frame', () => {
    const handle = createHandle(createElement());
    const positioner = attachWithModifiers(handle, restrictToVerticalAxis);

    // The first frame anchors the locked axis at x = 100.
    handle.update(100, 100);
    expect(positioner.style.translate).toBe('100px 100px');

    handle.update(400, 250);
    expect(positioner.style.translate).toBe('100px 250px');
  });

  // Under `display: none`, a browser resolves no computed transforms, so measuring
  // there would cache a scale of 1 for the rest of the drag. Browser only, since
  // jsdom renders nothing.
  it.skipIf(isJSDOM)('does not latch the scale while the preview host is hidden', () => {
    const seen: number[] = [];
    const handle = createHandle(createElement());
    const parent = createElement();
    parent.style.transform = 'matrix(2, 0, 0, 2, 0, 0)';
    parent.style.display = 'none';
    const positioner = document.createElement('div');
    parent.appendChild(positioner);
    handle.attach(positioner, null, {
      offset: 'pointer',
      modifiers: ({ point, scale }) => {
        seen.push(scale.x);
        return point;
      },
    });

    // Connected but hidden, so nothing is rendered to measure.
    handle.update(100, 100);
    expect(seen.at(-1)).toBe(1);

    parent.style.display = '';
    handle.update(120, 120);
    expect(seen.at(-1)).toBe(2);
  });

  // A preview modifier has the same signature as a root modifier, so it must see the
  // same key state, or one modifier would behave differently depending on where it's attached.
  it('passes the modifier keys of the update through to the modifiers', () => {
    const seen: boolean[] = [];
    const handle = createHandle(createElement());
    attachWithModifiers(handle, ({ point, shiftKey }) => {
      seen.push(shiftKey);
      return point;
    });

    handle.update(100, 100);
    expect(seen.at(-1)).toBe(false);

    handle.update(120, 120, { ctrlKey: false, shiftKey: true, altKey: false, metaKey: false });
    expect(seen.at(-1)).toBe(true);
  });

  it('passes the preview-level context: point is the proposed top-left, input the cursor', () => {
    const source = createElement(new DOMRect(0, 0, 50, 30));
    const contexts: Array<{
      point: DraggablePosition;
      initialPoint: DraggablePosition;
      input: DraggablePosition;
      previewOffset: DraggablePosition;
      sourceElement: HTMLElement;
      sourceRect: DOMRect;
      previewRect: DOMRect | null;
    }> = [];
    const handle = createHandle(source);
    handle.attach(createElement(), createElement(new DOMRect(0, 0, 50, 30)), {
      offset: { x: 10, y: 20 },
      modifiers: (context) => {
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
    });
    handle.update(100, 200);

    expect(contexts).toHaveLength(1);
    const context = contexts[0];
    expect(context.point).toEqual({ x: 90, y: 180 });
    expect(context.input).toEqual({ x: 100, y: 200 });
    // `point` already is the preview's top-left, so the offset is zero here.
    expect(context.previewOffset).toEqual({ x: 0, y: 0 });
    expect(context.initialPoint).toEqual({ x: 90, y: 180 });
    expect(context.sourceElement).toBe(source);
    expect(context.sourceRect).toBe(handle.sourceRect);
    // The rect of the `Draggable.Preview`, the box the user sees.
    expect(context.previewRect?.width).toBe(50);
    expect(context.previewRect?.height).toBe(30);
  });
});
