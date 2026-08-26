import { describe, it, expect, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer, isJSDOM } from '#test-utils';
import {
  createElement,
  flushRaf,
  registerCleanup,
  setupDragEngineTests,
} from '../../../../test/dnd';
import { cancelDrag } from '../cancelDrag';
import { dragSessionStore } from '../dragSessionStore';
import type { DragModifier, DropTargetRecord } from '../../../types/drag';
import { restrictToVerticalAxis } from '../dragModifiers';
import * as syntheticSensor from './syntheticSensor';
import {
  dispatchTouchEvent,
  getTouchDownTarget,
  penCancel,
  penDown,
  penMove,
  penUp,
  resetTouchTarget,
  touchCancel,
  touchDown,
  touchMove,
  touchUp,
} from '../../../../test/syntheticPointer';

setupDragEngineTests({
  extraAfterEach: () => {
    syntheticSensor.resetForTests();
    resetTouchTarget();
  },
});

/**
 * Dispatch `event` on `target` inside `act`. The mounted `Draggable.PreviewProvider`
 * subscribes to the drag session store, so a raw dispatch that starts, moves, or
 * ends a drag would re-render React outside `act`.
 */
function dispatch(target: EventTarget, event: Event): void {
  act(() => {
    target.dispatchEvent(event);
  });
}

describe('syntheticDrag sensor', () => {
  const { renderDnd } = createDndRenderer();

  it('pen pointerdown alone does not start a drag — distance activation defers', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, { onDragStart });

    penDown(el, 50, 50);
    await flushRaf();

    // Default pen activation is `distance: 5px`; no movement → no drag.
    expect(onDragStart).not.toHaveBeenCalled();
    // Source is reserved while a pending pen session is alive: the engine
    // flips `draggable="false"` to keep a native HTML5 hand-off (which iPadOS
    // Safari triggers from a long-press) from racing the synthetic gesture.
    expect(el.getAttribute('draggable')).toBe('false');

    penUp(50, 50);
    // The attribute is restored to its prior value (absent) once the gesture
    // ends.
    expect(el.hasAttribute('draggable')).toBe(false);
  });

  it('starts from a draggable registered inside a closed shadow root', async () => {
    const { engine } = await renderDnd();
    // Exercise document + closed-root arbitration together. A root-only fixture
    // cannot expose the outer capture listener claiming the retargeted host.
    engine.registerDraggable(createElement(), {});
    const host = createElement();
    const shadow = host.attachShadow({ mode: 'closed' });
    const source = document.createElement('div');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    shadow.appendChild(source);
    const onDragStart = vi.fn();
    engine.registerDraggable(source, {
      pointerActivation: { pen: { type: 'immediate' } },
      onDragStart,
    });

    penDown(source, 50, 50);
    await flushRaf();

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(source);
    act(() => cancelDrag());
  });

  it('restores draggable="true" on a source that declared it', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    // A consumer-declared `draggable="true"` (their own HTML5 drag integration)
    // must come back after the engine's temporary `draggable="false"` reservation.
    el.setAttribute('draggable', 'true');
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    // Pending abort: the default pen activation (5px distance) keeps the
    // gesture pending, and Escape abandons the candidate.
    penDown(el, 50, 50);
    expect(el.getAttribute('draggable')).toBe('false');
    dispatch(window, new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(el.getAttribute('draggable')).toBe('true');

    // Escape-canceled active drag.
    touchDown(el, 50, 50);
    await flushRaf();
    expect(el.getAttribute('draggable')).toBe('false');
    dispatch(window, new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(el.getAttribute('draggable')).toBe('true');
  });

  it('runs the remaining pending and active cleanups after a listener removal throws', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    el.setAttribute('draggable', 'true');
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
    });

    penDown(el, 50, 50);
    const removePendingListener = vi
      .spyOn(window, 'removeEventListener')
      .mockImplementationOnce(() => {
        throw new Error('pending listener cleanup failed');
      });
    expect(() => act(() => syntheticSensor.cancelActiveDrag())).toThrow(
      'pending listener cleanup failed',
    );
    expect(el.getAttribute('draggable')).toBe('true');
    removePendingListener.mockRestore();

    touchDown(el, 50, 50);
    await flushRaf();
    const removeActiveListener = vi
      .spyOn(document, 'removeEventListener')
      .mockImplementationOnce(() => {
        throw new Error('active listener cleanup failed');
      });
    expect(() => act(() => syntheticSensor.cancelActiveDrag())).toThrow(
      'active listener cleanup failed',
    );
    expect(el.getAttribute('draggable')).toBe('true');
    expect(document.querySelector('[data-drag-preview]')).toBeNull();
    removeActiveListener.mockRestore();
  });

  it('pen activates after moving past the distance threshold', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, { onDragStart });

    penDown(el, 50, 50);
    penMove(53, 53); // ~4.2px diagonal — under the 5px default
    await flushRaf();
    expect(onDragStart).not.toHaveBeenCalled();

    penMove(60, 50); // 10px from origin — clears 5px threshold
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart.mock.calls[0][0].location.current.input.pointerType).toBe('pen');

    penUp(60, 50);
  });

  it('pen drop fires onDragEnd with pointerType "pen"', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      // Use immediate so the test does not need to clear the distance
      // threshold first.
      pointerActivation: { pen: { type: 'immediate' } },
      onDragEnd,
    });

    penDown(el, 50, 50);
    await flushRaf();
    penUp(120, 80);

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    const payload = onDragEnd.mock.calls[0][0];
    expect(payload.location.current.input.pointerType).toBe('pen');
    expect(payload.location.current.input.clientX).toBe(120);
    expect(payload.location.current.input.clientY).toBe(80);
  });

  it('pen activation calls setPointerCapture on the document body, not the dragged element', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const setPointerCapture = vi.fn();
    const elSetPointerCapture = vi.fn();
    el.setPointerCapture = elSetPointerCapture;
    const original = document.body.setPointerCapture;
    document.body.setPointerCapture = setPointerCapture;
    registerCleanup(() => {
      document.body.setPointerCapture = original;
    });
    engine.registerDraggable(el, {
      pointerActivation: { pen: { type: 'immediate' } },
    });

    penDown(el, 50, 50, 7);
    await flushRaf();

    // Capture is anchored on the body, never the dragged element, so the
    // gesture survives that element being unmounted mid-drag (live reorder,
    // virtualizer recycle). Pen has no implicit capture, so without this the
    // stream would stop the moment the stylus tip drifts off the target.
    expect(setPointerCapture).toHaveBeenCalledWith(7);
    expect(elSetPointerCapture).not.toHaveBeenCalled();

    penUp(50, 50, 7);
  });

  it('releases pointer capture from the body anchor when an active drag ends', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    // Stub the pointer-capture API jsdom omits, on the body (the capture
    // anchor). The engine only calls `releasePointerCapture` when
    // `hasPointerCapture` reports the pointer is captured, so report capture
    // once it has been set.
    let captured = false;
    const setPointerCapture = vi.fn(() => {
      captured = true;
    });
    const releasePointerCapture = vi.fn(() => {
      captured = false;
    });
    const body = document.body;
    const originalSet = body.setPointerCapture;
    const originalRelease = body.releasePointerCapture;
    const originalHas = body.hasPointerCapture;
    body.setPointerCapture = setPointerCapture;
    body.releasePointerCapture = releasePointerCapture;
    body.hasPointerCapture = () => captured;
    registerCleanup(() => {
      body.setPointerCapture = originalSet;
      body.releasePointerCapture = originalRelease;
      body.hasPointerCapture = originalHas;
    });
    engine.registerDraggable(el, {
      pointerActivation: { pen: { type: 'immediate' } },
    });

    penDown(el, 50, 50, 7);
    await flushRaf();
    expect(setPointerCapture).toHaveBeenCalledWith(7);

    penUp(80, 80, 7);

    // Ending the gesture must release the capture it took for the same pointer.
    expect(releasePointerCapture).toHaveBeenCalledWith(7);
  });

  it('swallows the DOMException a stale releasePointerCapture throws, so the drop still lands', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    const body = document.body;
    const originalHas = body.hasPointerCapture;
    const originalRelease = body.releasePointerCapture;
    body.hasPointerCapture = (() => true) as typeof body.hasPointerCapture;
    body.releasePointerCapture = (() => {
      // What a browser throws when the pointer is no longer active or capture
      // was already released by the OS or a sibling listener.
      throw new DOMException('no capture', 'InvalidStateError');
    }) as typeof body.releasePointerCapture;
    registerCleanup(() => {
      body.hasPointerCapture = originalHas;
      body.releasePointerCapture = originalRelease;
    });

    touchDown(el, 50, 50);
    await flushRaf();
    touchUp(60, 60);

    // The teardown swallowed the capture-release error and completed the drop.
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(false);
  });

  it('rethrows a non-DOMException from releasePointerCapture', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    const body = document.body;
    const originalHas = body.hasPointerCapture;
    const originalRelease = body.releasePointerCapture;
    body.hasPointerCapture = (() => true) as typeof body.hasPointerCapture;
    body.releasePointerCapture = (() => {
      throw new Error('capture boom');
    }) as typeof body.releasePointerCapture;
    registerCleanup(() => {
      body.hasPointerCapture = originalHas;
      body.releasePointerCapture = originalRelease;
    });

    touchDown(el, 50, 50);
    await flushRaf();

    // Only pointer-capture DOMExceptions are expected there; anything else is a
    // real bug that must surface (as an uncaught error from the pointerup
    // listener) rather than be silently swallowed.
    const onError = vi.fn((event: Event) => event.preventDefault());
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.addEventListener('error', onError);
    try {
      touchUp(60, 60);
    } finally {
      window.removeEventListener('error', onError);
      consoleErrorSpy.mockRestore();
    }

    expect(onError).toHaveBeenCalled();
    // The throw surfaces, but it does not cost the drag its ending: the sensor
    // ends the lifecycle in a `finally`, so the terminal events still go out and
    // the engine is startable again. Without that, one throw out of the sensor's
    // own teardown would leave `canStart()` false for the rest of the page's life.
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(dragSessionStore.getSnapshot()).toBe(null);
  });

  it('keeps the drag alive after the dragged element is removed mid-gesture', async () => {
    const { engine } = await renderDnd();
    const src = createElement();
    const tgt = createElement();
    const onDropTargetChange = vi.fn();
    const onDragEnd = vi.fn();
    const onDrop = vi.fn();
    engine.registerDraggable(src, {
      pointerActivation: { pen: { type: 'immediate' } },
      onDragEnd,
      onDrop,
    });
    engine.registerDropTarget(tgt, {});
    engine.registerMonitor({ onDropTargetChange });

    const originalEFP = document.elementFromPoint;
    const hit = { current: null as Element | null };
    document.elementFromPoint = (() => hit.current) as typeof document.elementFromPoint;
    registerCleanup(() => {
      document.elementFromPoint = originalEFP;
    });

    penDown(src, 50, 50, 7);
    await flushRaf();
    await flushRaf();
    const changesBefore = onDropTargetChange.mock.calls.length;

    // A live reorder / virtualizer unmounts the dragged element mid-drag.
    src.remove();

    // Capture is anchored on the body, so the pointer stream retargets there and
    // bubbles to the document — where the active-phase listeners now live — so
    // the move is still observed even though the original target is detached.
    // Dispatching on the document mimics that routing. (With the old
    // target-bound listeners this move would be lost and the drag frozen.)
    hit.current = tgt;
    dispatch(
      document,
      new PointerEvent('pointermove', {
        pointerType: 'pen',
        pointerId: 7,
        clientX: 120,
        clientY: 80,
        // Held button during an active drag; a `buttons === 0` move is a release.
        buttons: 1,
        bubbles: true,
      }),
    );
    await flushRaf();
    await flushRaf();

    // The move was processed after the removal: the engine re-resolved the drop
    // target under the new point.
    expect(onDropTargetChange.mock.calls.length).toBeGreaterThan(changesBefore);

    dispatch(
      document,
      new PointerEvent('pointerup', {
        pointerType: 'pen',
        pointerId: 7,
        clientX: 120,
        clientY: 80,
        bubbles: true,
      }),
    );

    // And the gesture completes as a real drop over the target, not a teardown.
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop.mock.calls[0][0].dropTarget.element).toBe(tgt);
  });

  it('lostpointercapture (a genuine OS hand-off) still cancels the drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { pen: { type: 'immediate' } },
      onDragEnd,
    });

    penDown(el, 50, 50, 7);
    await flushRaf();

    dispatch(
      document.body,
      new PointerEvent('lostpointercapture', { pointerId: 7, bubbles: true }),
    );
    await flushRaf();

    // A later release is a no-op: the gesture is already torn down.
    penUp(50, 50, 7);

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].location.current.dropTargets).toHaveLength(0);
    // A hand-off is a cancel, not a drop over nothing.
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
  });

  it('lets pointerup win when body capture loss is delivered first', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { pen: { type: 'immediate' } },
      onDragEnd,
    });

    penDown(el, 50, 50, 7);
    await flushRaf();

    dispatch(
      document.body,
      new PointerEvent('lostpointercapture', { pointerId: 7, bubbles: true }),
    );
    dispatch(
      document.body,
      new PointerEvent('pointerup', {
        pointerType: 'pen',
        pointerId: 7,
        clientX: 60,
        clientY: 60,
        button: 0,
        buttons: 0,
        bubbles: true,
        cancelable: true,
      }),
    );
    await flushRaf();

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(false);
  });

  // jsdom-only: a real browser fires `blur` on the iframe window when the frame
  // is removed, and the sensor's own blur listener ends the session there — so
  // the detached-document branch is unreachable and there is nothing to assert.
  // jsdom fires no such blur and keeps the realm alive, which is what lets this
  // test hold a session over a dead document.
  it.skipIf(!isJSDOM)(
    'recovers from a drag stranded in a detached document (iframe removed mid-drag)',
    async () => {
      const { engine } = await renderDnd();
      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      registerCleanup(() => iframe.remove());
      const iframeDoc = iframe.contentDocument!;
      // jsdom documents don't implement elementFromPoint (see documentBinding tests).
      iframeDoc.elementFromPoint = () => null;
      const iframeEl = iframeDoc.createElement('div');
      iframeEl.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      iframeDoc.body.appendChild(iframeEl);
      const onIframeDragEnd = vi.fn();
      engine.registerDraggable(iframeEl, {
        pointerActivation: { mouse: { type: 'immediate' } },
        onDragEnd: onIframeDragEnd,
      });

      const topEl = createElement();
      const onDragStart = vi.fn();
      const onDragEnd = vi.fn();
      engine.registerDraggable(topEl, {
        pointerActivation: { mouse: { type: 'immediate' } },
        onDragStart,
        onDragEnd,
      });

      // Start a pointer drag inside the iframe...
      dispatch(
        iframeEl,
        new PointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 10,
          clientY: 10,
          button: 0,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
      await flushRaf();

      // ...then kill its browsing context. Every listener that could terminate the
      // gesture lived in the dead realm, so the session can never end on its own.
      iframe.remove();
      // jsdom keeps `defaultView` alive on a removed iframe's document; a real
      // browser nulls it, which is what the sensor's detached-document check reads.
      Object.defineProperty(iframeDoc, 'defaultView', { value: null, configurable: true });

      // The next pickup anywhere detects the dead session, cancels it, and lets
      // this pickup proceed rather than wedging the engine shut forever.
      dispatch(
        topEl,
        new PointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 2,
          clientX: 50,
          clientY: 50,
          button: 0,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
      await flushRaf();

      expect(onIframeDragEnd).toHaveBeenCalledTimes(1);
      expect(onIframeDragEnd.mock.calls[0][0].canceled).toBe(true);
      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDragStart.mock.calls[0][0].source.element).toBe(topEl);

      // The fresh drag completes normally.
      dispatch(
        topEl,
        new PointerEvent('pointerup', {
          pointerType: 'mouse',
          pointerId: 2,
          clientX: 60,
          clientY: 60,
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(onDragEnd).toHaveBeenCalledTimes(1);
    },
  );

  it('cancels when a start handler detaches the source document', async () => {
    const { engine } = await renderDnd();
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    registerCleanup(() => iframe.remove());
    const iframeDoc = iframe.contentDocument!;
    iframeDoc.elementFromPoint = () => null;
    const iframeEl = iframeDoc.createElement('div');
    iframeEl.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    iframeDoc.body.appendChild(iframeEl);
    const onDragEnd = vi.fn();
    engine.registerDraggable(iframeEl, {
      pointerActivation: { mouse: { type: 'immediate' } },
      onDragStart() {
        iframe.remove();
        if (isJSDOM) {
          Object.defineProperty(iframeDoc, 'defaultView', { value: null, configurable: true });
        }
      },
      onDragEnd,
    });

    dispatch(
      iframeEl,
      new PointerEvent('pointerdown', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 10,
        clientY: 10,
        button: 0,
        buttons: 1,
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(onDragEnd).toHaveBeenCalledOnce();
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
    expect(onDragEnd.mock.calls[0][1].reason).toBe('document-detached');
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });

  it('ignores the spurious lostpointercapture fired by the capture redirect (touch/Android)', async () => {
    const { engine } = await renderDnd();
    const src = createElement();
    const tgt = createElement();
    const onDragEnd = vi.fn();
    const onDrop = vi.fn();
    engine.registerDraggable(src, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
      onDrop,
    });
    engine.registerDropTarget(tgt, {});

    const originalEFP = document.elementFromPoint;
    document.elementFromPoint = (() => tgt) as typeof document.elementFromPoint;
    // jsdom has no real pointer capture. Keep the anchor's capture state false
    // to ensure the event target is what distinguishes this redirect.
    const originalHas = document.body.hasPointerCapture;
    const originalRelease = document.body.releasePointerCapture;
    document.body.hasPointerCapture = (() => false) as typeof document.body.hasPointerCapture;
    document.body.releasePointerCapture = (() => {}) as typeof document.body.releasePointerCapture;
    registerCleanup(() => {
      document.elementFromPoint = originalEFP;
      document.body.hasPointerCapture = originalHas;
      document.body.releasePointerCapture = originalRelease;
    });

    touchDown(src, 50, 50, 7);
    await flushRaf();

    // Touch implicitly captures to the pointerdown element; the engine's
    // `setPointerCapture(body)` redirect transfers it and makes that element fire
    // `lostpointercapture` right before the first move. The event belongs to the
    // original element, not the body anchor, so this must NOT cancel the drag.
    dispatch(src, new PointerEvent('lostpointercapture', { pointerId: 7, bubbles: true }));
    expect(onDragEnd).not.toHaveBeenCalled();

    // The drag survives and drops normally over the target.
    touchUp(60, 60, 7);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it('active-phase window blur cancels the drag and returns the engine to idle', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();

    dispatch(window, new Event('blur'));

    // Blur ends the drag with cancel semantics: onDragEnd fires canceled, with no targets.
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].location.current.dropTargets).toEqual([]);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);

    // The engine is idle again, so a fresh drag can start and drop.
    touchDown(el, 50, 50);
    await flushRaf();
    touchUp(60, 60);

    expect(onDragEnd).toHaveBeenCalledTimes(2);
  });

  it('blocks native touch scrolling during a pen drag (Apple Pencil emits touch events)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, { pointerActivation: { pen: { type: 'immediate' } } });

    penDown(el, 50, 50);
    await flushRaf();

    // Apple Pencil reports `pointerType: 'pen'` but iOS still drives page scroll
    // through the touch event stream it synthesizes for it; the active-phase
    // `touchmove` guard must cancel it just as it does for a finger.
    const nativeScroll = new Event('touchmove', { bubbles: true, cancelable: true });
    dispatch(el, nativeScroll);
    expect(nativeScroll.defaultPrevented).toBe(true);

    penUp(50, 50);
  });

  it('leaves native touch scrolling alone during the pending phase', async () => {
    const { engine } = await renderDnd();
    const pending = createElement();
    const immediate = createElement();
    // Default touch activation is a 250ms press-hold, so the gesture stays pending.
    engine.registerDraggable(pending, {});
    engine.registerDraggable(immediate, { pointerActivation: { touch: { type: 'immediate' } } });
    const root = document.documentElement;
    const previousTouchAction = root.style.touchAction;

    touchDown(pending, 50, 50);

    // A pending candidate must stay scroll-friendly: a swipe may still become a
    // native scroll (which cancels the candidate via `pointercancel`), so the
    // gesture neither prevents `touchmove` nor applies the root lock yet.
    const pendingScroll = new Event('touchmove', { bubbles: true, cancelable: true });
    dispatch(pending, pendingScroll);
    expect(pendingScroll.defaultPrevented).toBe(false);
    expect(root.style.touchAction).toBe(previousTouchAction);

    touchUp(50, 50);

    // Contrast with the active phase: once a drag commits, the same touchmove is
    // canceled and the root lock is applied.
    touchDown(immediate, 50, 50);
    await flushRaf();
    const activeScroll = new Event('touchmove', { bubbles: true, cancelable: true });
    dispatch(immediate, activeScroll);
    expect(activeScroll.defaultPrevented).toBe(true);
    expect(root.style.touchAction).toBe('none');

    touchUp(50, 50);
  });

  it('pen pointercancel cancels an active drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { pen: { type: 'immediate' } },
      onDragEnd,
    });

    penDown(el, 50, 50);
    await flushRaf();
    penCancel();

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].location.current.dropTargets).toEqual([]);
    // A browser cancellation is a cancel, not a drop over nothing.
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
  });

  it('prevents contextmenu after a touch drag candidate is cancelled by the browser', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const child = document.createElement('div');
    el.appendChild(child);
    engine.registerDraggable(el, {});

    touchDown(child, 50, 50);
    touchCancel();
    el.remove();

    // Pointer Events preserves the causal target for `contextmenu`. Model the
    // delayed Android event after a virtualizer detached that target, whose event
    // path can no longer reach the window listener.
    const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
    dispatch(child, contextMenu);

    expect(contextMenu.defaultPrevented).toBe(true);
  });

  it('releases contextmenu suppression after a clean tap-release so a later long-press menu shows', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, {});

    // Quick tap: press then lift before the press-hold activates (no drag). A
    // clean pointerup can't trigger a browser contextmenu, so the pending-phase
    // suppression must NOT linger and swallow a deliberate long-press afterwards.
    touchDown(el, 50, 50);
    touchUp(50, 50);

    const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
    dispatch(el, contextMenu);

    expect(contextMenu.defaultPrevented).toBe(false);
  });

  it('keeps contextmenu suppressed after an active touch drag is cancelled by the browser', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, { pointerActivation: { touch: { type: 'immediate' } } });

    touchDown(el, 50, 50);
    await flushRaf();
    touchCancel();

    // Android fires `pointercancel` and *then* the long-press `contextmenu`; the
    // suppression armed at pointerdown must survive the active-phase teardown to
    // swallow it (the 1.5s timer self-heals it afterwards).
    const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
    dispatch(el, contextMenu);
    expect(contextMenu.defaultPrevented).toBe(true);
  });

  it('releases contextmenu suppression after a clean touch drop', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, { pointerActivation: { touch: { type: 'immediate' } } });

    touchDown(el, 50, 50);
    await flushRaf();
    // A clean finger-lift can't make the browser fire a contextmenu, so the
    // suppression must not linger and swallow a deliberate long-press afterwards.
    touchUp(60, 60);

    const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
    dispatch(el, contextMenu);
    expect(contextMenu.defaultPrevented).toBe(false);
  });

  it('disarms the contextmenu suppression on its own after 1.5s (self-heal)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, {});

    // The suppression timer schedules through the owner window's setTimeout, so
    // fake timers can expire it without waiting the real 1.5s.
    vi.useFakeTimers();
    try {
      // A browser cancellation keeps the suppression armed for Android's late
      // `contextmenu` (asserted by the sibling tests above)...
      touchDown(el, 50, 50);
      touchCancel();

      // ...but the safety net must not outlive its window: after 1.5s it
      // disarms itself, so a later deliberate long-press menu shows again.
      vi.advanceTimersByTime(1500);

      const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
      dispatch(el, contextMenu);
      expect(contextMenu.defaultPrevented).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the original touch target armed throughout a live drag after it is detached', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const child = document.createElement('div');
    el.appendChild(child);
    engine.registerDraggable(el, { pointerActivation: { touch: { type: 'immediate' } } });

    vi.useFakeTimers();
    try {
      touchDown(child, 50, 50);
      // Expire the short post-cancellation safety net first. The active phase's
      // own target listener must last for the full drag, however long it runs.
      vi.advanceTimersByTime(1500);
      el.remove();

      const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
      dispatch(child, contextMenu);

      expect(contextMenu.defaultPrevented).toBe(true);
    } finally {
      touchCancel();
      vi.useRealTimers();
    }
  });

  it('onBeforeDragStart fires at activation commit with the pointer details', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const trigger = document.createElement('span');
    el.appendChild(trigger);
    const onBeforeDragStart = vi.fn();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, { onBeforeDragStart, onDragStart });

    penDown(trigger, 50, 50);
    await flushRaf();
    // Not at pointerdown: the veto waits for the activation modifier.
    expect(onBeforeDragStart).not.toHaveBeenCalled();

    penMove(60, 50); // 10px from origin — clears the 5px distance threshold
    await flushRaf();
    expect(onBeforeDragStart).toHaveBeenCalledTimes(1);
    const [parameters, eventDetails] = onBeforeDragStart.mock.calls[0];
    expect(parameters.element).toBe(el);
    expect(eventDetails.reason).toBe('pointer');
    expect(eventDetails.event).toBeInstanceOf(PointerEvent);
    expect(eventDetails.trigger).toBe(trigger);
    // Not canceled, so the drag started right after.
    expect(onDragStart).toHaveBeenCalledTimes(1);

    penUp(60, 50);
  });

  it('onBeforeDragStart canceling blocks the synthetic drag and frees the gesture', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    let block = true;
    engine.registerDraggable(el, {
      onBeforeDragStart: (_, eventDetails) => {
        if (block) {
          eventDetails.cancel();
        }
      },
      pointerActivation: { touch: { type: 'immediate' } },
      onDragStart,
    });

    touchDown(el, 50, 50);
    await flushRaf();
    expect(onDragStart).not.toHaveBeenCalled();
    // The canceled commit tore the pending phase down and restored the source's
    // `draggable` attribute.
    expect(el.hasAttribute('draggable')).toBe(false);
    const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
    dispatch(el, contextMenu);
    expect(contextMenu.defaultPrevented).toBe(false);

    // A later gesture is unaffected once the consumer allows dragging again.
    block = false;
    touchDown(el, 50, 50);
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);

    touchUp(50, 50);
  });

  it('a throwing onBeforeDragStart tears the pending phase down', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    let shouldThrow = true;
    engine.registerDraggable(el, () => ({
      onBeforeDragStart: () => {
        if (shouldThrow) {
          throw new Error('veto failed');
        }
      },
      pointerActivation: { touch: { type: 'immediate' } },
      onDragStart,
    }));

    // The consumer throw escapes the sensor (after its cleanup ran) and is
    // reported as an uncaught error from the pointerdown listener; swallow both
    // the window-level error event and its console report so the expected throw
    // doesn't fail the run.
    const onError = (event: Event) => event.preventDefault();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.addEventListener('error', onError);
    try {
      touchDown(el, 50, 50);
    } finally {
      window.removeEventListener('error', onError);
      consoleErrorSpy.mockRestore();
    }
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
    // The pending phase was torn down before the rethrow, restoring the source.
    expect(el.hasAttribute('draggable')).toBe(false);

    // A later gesture can drag again: nothing stayed armed.
    shouldThrow = false;
    touchDown(el, 50, 50);
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);

    touchUp(50, 50);
  });

  it('a live registration getter throwing at activation tears the pending phase down', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    let throwOnNextRead = false;
    engine.registerDraggable(el, () => {
      if (throwOnNextRead) {
        throwOnNextRead = false;
        throw new Error('live getter failed');
      }
      return { onDragStart };
    });

    penDown(el, 50, 50);
    throwOnNextRead = true;
    const onError = (event: Event) => event.preventDefault();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.addEventListener('error', onError);
    try {
      penMove(60, 50);
    } finally {
      window.removeEventListener('error', onError);
      consoleErrorSpy.mockRestore();
    }
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
    expect(el.hasAttribute('draggable')).toBe(false);

    penDown(el, 50, 50);
    penMove(60, 50);
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);
    penUp(60, 50);
  });

  it('a throwing preview build tears the whole pickup down and frees the engine', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    let shouldThrow = true;
    engine.registerDraggable(el, () => ({
      pointerActivation: { touch: { type: 'immediate' } },
      dragPreview: {
        render: () => {
          if (shouldThrow) {
            throw new Error('preview boom');
          }
          return null;
        },
      },
      onDragStart,
    }));

    // The throw escapes the sensor (after its cleanup ran) and surfaces as an
    // uncaught error from the pointerdown listener; swallow the window-level
    // error event and its console report so the expected throw doesn't fail the run.
    const onError = (event: Event) => event.preventDefault();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.addEventListener('error', onError);
    try {
      touchDown(el, 50, 50);
    } finally {
      window.removeEventListener('error', onError);
      consoleErrorSpy.mockRestore();
    }
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
    // The aborted commit undid everything the pickup had acquired: the source's
    // reservation and the root scroll lock.
    expect(el.hasAttribute('draggable')).toBe(false);
    expect(document.documentElement.style.getPropertyValue('touch-action')).toBe('');
    expect(document.documentElement.style.getPropertyValue('user-select')).toBe('');

    // A later pickup still drags: nothing stayed armed or locked.
    shouldThrow = false;
    touchDown(el, 50, 50);
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);

    touchUp(50, 50);
  });

  it('disabled never arms the pending phase', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, {
      disabled: true,
      pointerActivation: { touch: { type: 'immediate' } },
      onDragStart,
    });

    touchDown(el, 50, 50);
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
    // No pending phase: the source was never reserved.
    expect(el.hasAttribute('draggable')).toBe(false);
    // A long-press contextmenu is not suppressed either, unlike during a pending
    // gesture: the press behaves like an ordinary touch on a static element.
    const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
    dispatch(el, contextMenu);
    expect(contextMenu.defaultPrevented).toBe(false);

    touchUp(50, 50);
  });

  it('disabled flipping on during the press aborts the commit', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    let disabled = false;
    engine.registerDraggable(el, () => ({ disabled, onDragStart }));

    penDown(el, 50, 50);
    disabled = true;
    penMove(60, 50); // clears the threshold, but the commit re-checks `disabled`
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
    // The aborted commit tore the pending phase down.
    expect(el.hasAttribute('draggable')).toBe(false);

    penUp(60, 50);
  });

  it('unregistering during the press aborts the commit', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    const cleanup = engine.registerDraggable(el, { onDragStart });

    penDown(el, 50, 50);
    // The draggable unregisters mid-press (unmount, feature flag flip); the
    // commit re-reads the registration and finds nothing to drag.
    cleanup();
    penMove(60, 50); // clears the threshold
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
    // The aborted commit tore the pending phase down, restoring the source.
    expect(el.hasAttribute('draggable')).toBe(false);

    penUp(60, 50);
  });

  it('a dragHandle swapped away from the press target during the press aborts the commit', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const handleA = document.createElement('div');
    handleA.getBoundingClientRect = () => new DOMRect(0, 0, 20, 20);
    el.appendChild(handleA);
    const handleB = document.createElement('div');
    handleB.getBoundingClientRect = () => new DOMRect(20, 0, 20, 20);
    el.appendChild(handleB);
    const onDragStart = vi.fn();
    let handle = handleA;
    engine.registerDraggable(el, () => ({ dragHandle: () => handle, onDragStart }));

    penDown(handleA, 10, 10);
    // The draggable swaps its handle during the press: the press that armed this
    // gesture was never on the handle that now governs it, so the commit
    // re-checks the handle gate (mirroring the `disabled` re-check above).
    handle = handleB;
    penMove(20, 10); // clears the threshold
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
    expect(el.hasAttribute('draggable')).toBe(false);

    penUp(20, 10);
  });

  it('touch pointerdown outside the drag handle does not start a drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const handle = document.createElement('div');
    handle.getBoundingClientRect = () => new DOMRect(0, 0, 20, 20);
    el.appendChild(handle);

    const onDragStart = vi.fn();
    engine.registerDraggable(el, {
      dragHandle: () => handle,
      pointerActivation: { touch: { type: 'immediate' } },
      onDragStart,
    });

    touchDown(el, 100, 50); // target is el, not handle
    await flushRaf();
    expect(onDragStart).not.toHaveBeenCalled();

    touchUp(100, 50);
  });

  it('a press inside a nested interactive control does not start a drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const input = document.createElement('input');
    el.appendChild(input);

    const onDragStart = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragStart,
    });

    // Pressing an inline rename input and moving to select text must stay a text
    // selection: the drag would `preventDefault()` it away.
    touchDown(input, 50, 50);
    await flushRaf();
    expect(onDragStart).not.toHaveBeenCalled();
    touchUp(50, 50);

    // The draggable itself still picks up.
    touchDown(el, 50, 50);
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);
    act(() => cancelDrag());
    touchUp(50, 50);
  });

  it.each([
    ['role button', () => Object.assign(document.createElement('div'), { role: 'button' })],
    ['role checkbox', () => Object.assign(document.createElement('div'), { role: 'checkbox' })],
    ['label', () => document.createElement('label')],
    ['summary', () => document.createElement('summary')],
    ['media controls', () => Object.assign(document.createElement('audio'), { controls: true })],
    [
      'focusable custom control',
      () => Object.assign(document.createElement('div'), { tabIndex: 0 }),
    ],
  ])('a press inside a nested %s does not start a drag', async (_name, createControl) => {
    const { engine } = await renderDnd();
    const el = createElement();
    const control = createControl();
    el.appendChild(control);
    const onDragStart = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragStart,
    });

    touchDown(control, 50, 50);
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
    touchUp(50, 50);
  });

  it('a press inside a nested link does not start a drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const link = document.createElement('a');
    link.href = '/destination';
    el.appendChild(link);

    const onDragStart = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragStart,
    });

    touchDown(link, 50, 50);
    await flushRaf();
    expect(onDragStart).not.toHaveBeenCalled();
    touchUp(50, 50);

    touchDown(el, 50, 50);
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);
    act(() => cancelDrag());
    touchUp(50, 50);
  });

  it('a draggable whose handle is itself a button still picks up', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const handle = document.createElement('button');
    handle.getBoundingClientRect = () => new DOMRect(0, 0, 20, 20);
    el.appendChild(handle);

    const onDragStart = vi.fn();
    engine.registerDraggable(el, {
      dragHandle: () => handle,
      pointerActivation: { touch: { type: 'immediate' } },
      onDragStart,
    });

    // The nested-control rule excludes the pickup node itself, or the common
    // `<button>` drag handle would be permanently inert.
    touchDown(handle, 10, 10);
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);

    act(() => cancelDrag());
    touchUp(10, 10);
  });

  it('a press on a disabled nested control still starts the drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const button = document.createElement('button');
    button.disabled = true;
    el.appendChild(button);

    const onDragStart = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragStart,
    });

    // A disabled control owns no gesture of its own, so it stays transparent.
    touchDown(button, 50, 50);
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);

    act(() => cancelDrag());
    touchUp(50, 50);
  });

  it('Escape cancels an active synthetic drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();

    dispatch(window, new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].location.current.dropTargets).toEqual([]);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
    expect(onDragEnd.mock.calls[0][1].reason).toBe('escape-key');
  });

  it('Tab cancels an active synthetic drag without consuming the key', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    const onKeyDown = vi.fn();
    document.addEventListener('keydown', onKeyDown);
    registerCleanup(() => document.removeEventListener('keydown', onKeyDown));

    touchDown(el, 50, 50);
    await flushRaf();

    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    dispatch(document, tab);

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
    expect(onDragEnd.mock.calls[0][1]).toEqual(
      expect.objectContaining({ reason: 'tab-key', event: tab }),
    );
    expect(tab.defaultPrevented).toBe(false);
    expect(onKeyDown).toHaveBeenCalledOnce();
  });

  it.each([
    [
      'pointer-canceled',
      (el: HTMLElement) =>
        dispatch(el, new PointerEvent('pointercancel', { pointerId: 1, bubbles: true })),
    ],
    ['window-blur', () => dispatch(window, new FocusEvent('blur'))],
    ['imperative-action', () => cancelDrag()],
  ])('names %s as the drag end reason', async (expected, endTheDrag) => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();
    act(() => endTheDrag(el));

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][1].reason).toBe(expected);
  });

  it('the Escape that cancels a drag does not reach other listeners', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    // A dialog-style consumer listening for Escape on the same document: the
    // keypress that cancels a drag must not also dismiss the overlay.
    const overlayKeyDown = vi.fn();
    document.addEventListener('keydown', overlayKeyDown);
    registerCleanup(() => document.removeEventListener('keydown', overlayKeyDown));

    touchDown(el, 50, 50);
    await flushRaf();
    // Dispatched on the document so it traverses the sensor's window-level
    // capture listener first, like a real keypress bubbling from the page.
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    dispatch(document, escape);

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(escape.defaultPrevented).toBe(true);
    expect(overlayKeyDown).not.toHaveBeenCalled();

    // An Escape with no drag in progress propagates normally.
    dispatch(document, new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(overlayKeyDown).toHaveBeenCalledTimes(1);
  });

  it('Escape during the pending phase abandons the candidate before it activates', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    // Default pen activation is `distance: 5px`, so the gesture stays pending
    // until the stylus clears the threshold.
    engine.registerDraggable(el, { onDragStart });

    penDown(el, 50, 50);
    dispatch(window, new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    // The pending phase was torn down: the source is no longer reserved.
    expect(el.hasAttribute('draggable')).toBe(false);

    // And the abandoned candidate cannot activate later — clearing the distance
    // threshold after Escape does nothing.
    penMove(60, 50);
    await flushRaf();
    expect(onDragStart).not.toHaveBeenCalled();
  });

  it('a pending-phase pointermove with no buttons pressed abandons the candidate (missed release)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, { onDragStart });

    penDown(el, 50, 50);

    // The stylus lifted without a terminating pointerup/pointercancel reaching
    // the engine (the release happened over another window). This move clears
    // the 5px threshold, but `buttons === 0` means the press is already over,
    // so it must clean the candidate up rather than activate it.
    dispatch(
      getTouchDownTarget(),
      new PointerEvent('pointermove', {
        pointerType: 'pen',
        pointerId: 1,
        clientX: 60,
        clientY: 50,
        buttons: 0,
        bubbles: true,
        cancelable: true,
      }),
    );
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
    // Not left armed: the pending phase released the source it had reserved.
    expect(el.hasAttribute('draggable')).toBe(false);

    // A later move can't resurrect it either.
    penMove(80, 50);
    await flushRaf();
    expect(onDragStart).not.toHaveBeenCalled();
  });

  it('suppresses the native dragstart a natively-draggable descendant starts from the same press', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    // `<img>` and `<a href>` are natively draggable, and `draggable="false"` on
    // the source doesn't cover a descendant — so the native HTML5 drag would
    // otherwise start from this press and race the pointer sensor.
    const img = document.createElement('img');
    el.appendChild(img);
    engine.registerDraggable(el, {});

    penDown(img, 50, 50, 7);

    const nativeDragStart = new Event('dragstart', { bubbles: true, cancelable: true });
    dispatch(img, nativeDragStart);

    expect(nativeDragStart.defaultPrevented).toBe(true);

    penUp(50, 50, 7);
  });

  it('prevents contextmenu during a live drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    // Mouse: no post-gesture contextmenu suppression is armed for it (that net
    // is touch/pen only), so this exercises the active phase's own listener.
    engine.registerDraggable(el, { pointerActivation: { mouse: { type: 'immediate' } } });

    dispatch(
      el,
      new PointerEvent('pointerdown', {
        pointerType: 'mouse',
        pointerId: 9,
        clientX: 50,
        clientY: 50,
        button: 0,
        buttons: 1,
        bubbles: true,
        cancelable: true,
      }),
    );
    await flushRaf();

    // A right-click mid-drag must not open the browser menu on top of the drag.
    const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
    dispatch(el, contextMenu);
    expect(contextMenu.defaultPrevented).toBe(true);

    dispatch(
      el,
      new PointerEvent('pointerup', {
        pointerType: 'mouse',
        pointerId: 9,
        clientX: 50,
        clientY: 50,
        bubbles: true,
        cancelable: true,
      }),
    );
  });

  it('locks the drag root while a drag is active and restores it on drop', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, { pointerActivation: { touch: { type: 'immediate' } } });

    const root = document.documentElement;
    const previousTouchAction = root.style.touchAction;
    const previousUserSelect = root.style.userSelect;

    touchDown(el, 50, 50);
    await flushRaf();

    // The lock blocks native scroll and text selection for the whole gesture;
    // `touch-action` alone can't stop a selection drag, and `user-select` alone
    // can't stop the page scrolling under a finger.
    expect(root.style.touchAction).toBe('none');
    expect(root.style.userSelect).toBe('none');

    touchUp(60, 60);

    // Restored to the page's own values, not blanked.
    expect(root.style.touchAction).toBe(previousTouchAction);
    expect(root.style.userSelect).toBe(previousUserSelect);
  });

  it('cancelDrag() cancels an active pointer drag and is a no-op when idle', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();

    act(() => {
      cancelDrag();
    });
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);

    // Idle: cancelling again does nothing.
    act(() => {
      cancelDrag();
    });
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('anchors the source grab offset at the press, not the activation input', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const target = createElement({ top: 200 });
    const onDrop = vi.fn();
    engine.registerDraggable(el, {});
    engine.registerDropTarget(target, { snap: { x: 8 }, onDrop });
    const spy = vi
      .spyOn(document, 'elementFromPoint')
      .mockImplementation((_x: number, y: number) => (y >= 200 ? target : null));
    registerCleanup(() => spy.mockRestore());

    // Press at x 30; the default 5px pen distance commits activation at x 40.
    // The grab offset must reflect the press: the user took hold at 30, and the
    // threshold travel is not part of where they grabbed.
    penDown(el, 30, 50);
    penMove(40, 50);
    await flushRaf();
    penMove(95, 250);
    await flushRaf();
    penUp(95, 250);
    await flushRaf();

    expect(onDrop).toHaveBeenCalledTimes(1);
    const record = onDrop.mock.calls[0][0].self as DropTargetRecord;
    // Press-anchored: (95 − 30) / 200 = 0.325 → nearest of 8 steps is 0.375.
    // Activation-anchored would read (95 − 40) / 200 = 0.275 → 0.25.
    expect(record.getSnappedLocalPoint({ anchor: 'source' }).x).toBe(0.375);
  });

  it('cancelDrag() during the pending phase abandons the candidate before it activates', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    // Default pen activation is `distance: 5px`, so the gesture stays pending
    // until the stylus clears the threshold.
    engine.registerDraggable(el, { onDragStart, onDragEnd });

    penDown(el, 50, 50);
    act(() => {
      cancelDrag();
    });

    // Nothing had activated, so no terminal event fires, but the candidate is
    // gone: the source is released and clearing the threshold does nothing. A
    // consumer cancelling on, say, a dialog opening must not have the gesture
    // start a drag on the next move anyway.
    expect(onDragEnd).not.toHaveBeenCalled();
    expect(el.hasAttribute('draggable')).toBe(false);
    penMove(60, 50);
    await flushRaf();
    expect(onDragStart).not.toHaveBeenCalled();
  });

  it('reports an outside release (not canceled) when released outside any drop target', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();
    // Release over empty space — no drop target was ever entered.
    touchUp(60, 60);

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].location.current.dropTargets).toEqual([]);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(false);
    expect(onDragEnd.mock.calls[0][0].dropTarget).toBeNull();
  });

  it('treats a pointermove with no buttons pressed as a cancel (missed release)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      modifiers: restrictToVerticalAxis,
      onDragEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();

    // The button came up but no terminating pointerup/pointercancel reached the
    // engine (an OS pointer hand-off can swallow it). The next move reports
    // buttons === 0, which ends the drag so it can't stick — as a cancel, since
    // a release the engine never saw isn't a deliberate drop.
    dispatch(
      getTouchDownTarget(),
      new PointerEvent('pointermove', {
        pointerType: 'touch',
        pointerId: 1,
        clientX: 60,
        clientY: 60,
        buttons: 0,
        bubbles: true,
        cancelable: true,
      }),
    );
    await flushRaf();

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    const payload = onDragEnd.mock.calls[0][0];
    expect(payload.canceled).toBe(true);
    // Constrained like every reported input: the axis lock pins x at the
    // activation x, so the cancel doesn't leak a raw coordinate the drag never
    // reported while it was live.
    expect(payload.location.current.input.clientX).toBe(50);
    expect(payload.location.current.input.clientY).toBe(60);
  });

  it('pointercancel cancels the active drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();
    touchCancel();

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    // A browser cancellation is a cancel, not a drop over nothing.
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
  });

  it('pointercancel reports the last good input, not its own (0,0) coordinates', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();
    touchMove(80, 90);
    await flushRaf();
    // `pointercancel` carries (0,0) coordinates; the sensor must fall back to
    // the last reported input rather than snap the cancel to the origin.
    touchCancel();

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    const payload = onDragEnd.mock.calls[0][0];
    expect(payload.canceled).toBe(true);
    expect(payload.location.current.input.clientX).toBe(80);
    expect(payload.location.current.input.clientY).toBe(90);
  });

  it('visibility hidden cancels an active drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    try {
      dispatch(document, new Event('visibilitychange'));

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      // Hiding the tab is a cancel, not a drop over nothing.
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
    } finally {
      // Restore in `finally` so a failed assertion can't leave the document stuck
      // `hidden` and cascade into every later test.
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
    }
  });

  it('pointerup invokes the drop lifecycle', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();
    touchUp(120, 80);

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    const dropPayload = onDragEnd.mock.calls[0][0];
    expect(dropPayload.location.current.input.clientX).toBe(120);
    expect(dropPayload.location.current.input.clientY).toBe(80);
  });

  it('payload pointerType is "touch" for synthetic drags', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragStart,
    });

    touchDown(el, 10, 10);
    await flushRaf();

    expect(onDragStart).toHaveBeenCalledTimes(1);
    const payload = onDragStart.mock.calls[0][0];
    expect(payload.location.current.input.pointerType).toBe('touch');

    touchUp(10, 10);
  });

  it('synthetic drag surfaces onDrag to monitors', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDrag = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
    });
    engine.registerMonitor({ onDrag });

    touchDown(el, 10, 10);
    await flushRaf();

    touchMove(30, 30);
    await flushRaf();
    await flushRaf();

    // Pin the position, not just the fact of the call: a monitor fed stale or
    // wrong coordinates would sail through a bare `toHaveBeenCalled`. The call
    // count is deliberately not pinned — the sensor's frame loop can re-resolve
    // a stationary pointer, so the last delivered event is asserted, plus the
    // invariant that no event reports a point the pointer never visited. (The
    // first delivered event is the pickup-position resolve, at 10,10.)
    expect(onDrag).toHaveBeenCalled();
    const sampled = ['10,10', '30,30'];
    for (const [payload] of onDrag.mock.calls) {
      const { clientX, clientY } = payload.location.current.input;
      expect(sampled).toContain(`${clientX},${clientY}`);
    }
    const lastMonitorInput = onDrag.mock.lastCall![0].location.current.input;
    expect(lastMonitorInput.clientX).toBe(30);
    expect(lastMonitorInput.clientY).toBe(30);

    touchUp(30, 30);
  });

  describe('pointer button guards', () => {
    it.each([
      ['middle', 1],
      ['secondary', 2],
    ])('a %s-button pointerdown never arms a gesture', async (_name, button) => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onDragStart = vi.fn();
      engine.registerDraggable(el, {
        pointerActivation: { mouse: { type: 'immediate' } },
        onDragStart,
      });

      dispatch(
        el,
        new PointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 10,
          clientY: 10,
          button,
          // The bitmask a real browser reports for this button held alone —
          // neither signal indicates the primary button, so the press is
          // ignored rather than arming a gesture the user never asked for.
          buttons: button === 1 ? 4 : 2,
          bubbles: true,
          cancelable: true,
        }),
      );
      await flushRaf();

      expect(onDragStart).not.toHaveBeenCalled();
    });

    it('a non-primary pointerup during the pending phase does not clear the candidate', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onDragStart = vi.fn();
      // Default pen activation: 5px distance, so the gesture stays pending.
      engine.registerDraggable(el, { onDragStart });

      penDown(el, 50, 50);
      // A right-button release while the primary is still held: on `pointerup`,
      // `button` is the released button, so this is not the end of the press.
      dispatch(
        getTouchDownTarget(),
        new PointerEvent('pointerup', {
          pointerType: 'pen',
          pointerId: 1,
          clientX: 50,
          clientY: 50,
          button: 2,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );

      // The candidate survived: clearing the distance threshold still activates.
      penMove(60, 50);
      await flushRaf();
      expect(onDragStart).toHaveBeenCalledTimes(1);

      penUp(60, 50);
    });

    it('a chorded primary release during the pending phase clears the candidate', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onDragStart = vi.fn();
      engine.registerDraggable(el, { onDragStart });

      penDown(el, 50, 50);
      // The primary button comes up while another is still held: the browser
      // reports it as a pointermove whose `buttons` lost the primary bit, never
      // a `pointerup` for button 0. The press is over, so the candidate must
      // not linger armed (it would block every future pointerdown).
      dispatch(
        getTouchDownTarget(),
        new PointerEvent('pointermove', {
          pointerType: 'pen',
          pointerId: 1,
          clientX: 50,
          clientY: 50,
          buttons: 2,
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(el.hasAttribute('draggable')).toBe(false);

      // The abandoned candidate cannot activate later...
      penMove(60, 50);
      await flushRaf();
      expect(onDragStart).not.toHaveBeenCalled();

      // ...and a fresh pickup still drags.
      penDown(el, 50, 50);
      penMove(60, 50);
      await flushRaf();
      expect(onDragStart).toHaveBeenCalledTimes(1);

      penUp(60, 50);
    });

    it('clears a pending gesture when pointerup misreports the released button', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onDragStart = vi.fn();
      engine.registerDraggable(el, { onDragStart });

      penDown(el, 50, 50);
      dispatch(
        getTouchDownTarget(),
        new PointerEvent('pointerup', {
          pointerType: 'pen',
          pointerId: 1,
          clientX: 50,
          clientY: 50,
          button: -1,
          buttons: 0,
          bubbles: true,
          cancelable: true,
        }),
      );

      penMove(60, 50);
      await flushRaf();

      expect(onDragStart).not.toHaveBeenCalled();
    });

    it('a secondary-button pointerup mid-drag does not end the drag', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onDragEnd = vi.fn();
      engine.registerDraggable(el, {
        pointerActivation: { mouse: { type: 'immediate' } },
        onDragEnd,
      });

      dispatch(
        el,
        new PointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 10,
          clientY: 10,
          button: 0,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
      await flushRaf();

      // A right-click while the primary button is still held: `button` is the
      // released button, so only `0` drops. Without the guard this would
      // spuriously end the drag.
      dispatch(
        el,
        new PointerEvent('pointerup', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 10,
          clientY: 10,
          button: 2,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
      await flushRaf();

      expect(onDragEnd).not.toHaveBeenCalled();

      // The primary release still drops, so the drag was live all along.
      dispatch(
        el,
        new PointerEvent('pointerup', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 10,
          clientY: 10,
          button: 0,
          buttons: 0,
          bubbles: true,
          cancelable: true,
        }),
      );
      await flushRaf();

      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });

    it('drops when pointerup misreports the released button', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onDragEnd = vi.fn();
      engine.registerDraggable(el, {
        pointerActivation: { mouse: { type: 'immediate' } },
        onDragEnd,
      });

      dispatch(
        el,
        new PointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 10,
          clientY: 10,
          button: 0,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
      await flushRaf();

      dispatch(
        el,
        new PointerEvent('pointerup', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 20,
          clientY: 20,
          button: -1,
          buttons: 0,
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(false);
    });

    it('a chorded primary release mid-drag drops at that position (not a cancel)', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onDragStart = vi.fn();
      const onDragEnd = vi.fn();
      engine.registerDraggable(el, {
        pointerActivation: { mouse: { type: 'immediate' } },
        onDragStart,
        onDragEnd,
      });

      dispatch(
        el,
        new PointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 10,
          clientY: 10,
          button: 0,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
      await flushRaf();
      expect(onDragStart).toHaveBeenCalledTimes(1);

      // The primary button comes up while the right button is still held: the
      // browser reports it as a pointermove whose `buttons` lost the primary
      // bit, never a `pointerup` for button 0. The user deliberately released,
      // so this is a drop at that position — not a cancel.
      dispatch(
        el,
        new PointerEvent('pointermove', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 80,
          clientY: 90,
          buttons: 2,
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      const payload = onDragEnd.mock.calls[0][0];
      // Released over empty space, so the drop lands on no target (`dropTarget`
      // is `null`) — crucially not canceled.
      expect(payload.canceled).toBe(false);
      expect(payload.dropTarget).toBeNull();
      expect(payload.location.current.input.clientX).toBe(80);
      expect(payload.location.current.input.clientY).toBe(90);

      // The gesture fully released the engine: a fresh pickup starts and drops.
      dispatch(
        el,
        new PointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 20,
          clientY: 20,
          button: 0,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
      await flushRaf();
      expect(onDragStart).toHaveBeenCalledTimes(2);

      dispatch(
        el,
        new PointerEvent('pointerup', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 30,
          clientY: 30,
          button: 0,
          buttons: 0,
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(onDragEnd).toHaveBeenCalledTimes(2);
    });
  });

  it('drop target onDrop fires when pointerup is over a registered drop target', async () => {
    const { engine } = await renderDnd();
    const src = createElement();
    const tgt = createElement();

    const onDrop = vi.fn();
    engine.registerDraggable(src, {
      pointerActivation: { touch: { type: 'immediate' } },
    });
    engine.registerDropTarget(tgt, { onDrop });

    // Route elementFromPoint → drop target so the synthetic path sees it.
    const originalEFP = document.elementFromPoint;
    document.elementFromPoint = () => tgt;

    try {
      touchDown(src, 10, 10);
      await flushRaf();
      touchMove(50, 50);
      await flushRaf();
      touchUp(50, 50);

      expect(onDrop).toHaveBeenCalledTimes(1);
    } finally {
      document.elementFromPoint = originalEFP;
    }
  });

  it('ignores a second pointerdown while a drag is already active (multi-touch)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragStart,
      onDragEnd,
    });

    // First finger lands and immediately activates.
    touchDown(el, 50, 50, 1);
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);

    // Second finger lands on the same draggable. The active session should
    // ignore it: no second drag, no extra onDragStart fires.
    const secondFinger = new PointerEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 2,
      clientX: 60,
      clientY: 60,
      button: 0,
      buttons: 1,
      bubbles: true,
      cancelable: true,
    });
    dispatch(el, secondFinger);
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);

    // Pointer move from the second finger must NOT update the drag (which
    // tracks pointerId === 1).
    const secondMove = new PointerEvent('pointermove', {
      pointerType: 'touch',
      pointerId: 2,
      clientX: 80,
      clientY: 80,
      bubbles: true,
      cancelable: true,
    });
    dispatch(getTouchDownTarget(), secondMove);

    // Lifting the SECOND finger must not end the drag — pointerId mismatch.
    const secondUp = new PointerEvent('pointerup', {
      pointerType: 'touch',
      pointerId: 2,
      clientX: 80,
      clientY: 80,
      bubbles: true,
      cancelable: true,
    });
    dispatch(getTouchDownTarget(), secondUp);
    expect(onDragEnd).not.toHaveBeenCalled();

    // Ending the original finger ends the drag, at that finger's position — not
    // at the second finger's (80, 80).
    touchUp(50, 50, 1);

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    const dropInput = onDragEnd.mock.calls[0][0].location.current.input;
    expect(dropInput.clientX).toBe(50);
    expect(dropInput.clientY).toBe(50);
  });

  it('does not end an active touch drag on a stray touchend (pointer stream owns termination)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    touchDown(el, 50, 50, 1);
    await flushRaf();

    // A second finger lifting inside the dragged element dispatches a `touchend`
    // for that finger. The drag follows the pointer stream (filtered by
    // `pointerId`), so a stray touch event must not end it at the wrong spot.
    dispatchTouchEvent('touchend', 80, 80);
    expect(onDragEnd).not.toHaveBeenCalled();

    // The dragging finger's pointerup still ends the drag.
    touchUp(50, 50, 1);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('drops correctly when pointerup fires outside the original drop target (off-window)', async () => {
    const { engine } = await renderDnd();
    const src = createElement();
    const onDragEnd = vi.fn();
    engine.registerDraggable(src, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragEnd,
    });

    // Force `elementFromPoint` to return null — mimics a pointerup whose
    // coordinates fall outside the document (browser tab boundary, OS
    // gesture, etc.).
    const originalEFP = document.elementFromPoint;
    document.elementFromPoint = () => null;

    try {
      touchDown(src, 10, 10);
      await flushRaf();
      touchMove(20, 20);
      await flushRaf();

      // pointerup with a target-less elementFromPoint result must still
      // fire `onDragEnd` (cancel-shaped: dropTargets empty), not leave the
      // engine stuck.
      touchUp(-50, -50);

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      const payload = onDragEnd.mock.calls[0][0];
      expect(payload.location.current.dropTargets).toEqual([]);
    } finally {
      document.elementFromPoint = originalEFP;
    }
  });

  it('routes a mouse pointerdown through the synthetic path', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    engine.registerDraggable(el, {
      onDragStart,
      onDragEnd,
      pointerActivation: { mouse: { type: 'immediate' } },
    });

    // Explicit `immediate` activation, so pointerdown commits the drag at once.
    const mouse = new PointerEvent('pointerdown', {
      pointerType: 'mouse',
      pointerId: 9,
      clientX: 50,
      clientY: 50,
      button: 0,
      buttons: 1,
      bubbles: true,
      cancelable: true,
    });
    dispatch(el, mouse);
    await flushRaf();

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(onDragStart.mock.calls[0][0].location.current.input.pointerType).toBe('mouse');

    // Pointerup on the original target ends the drag via the synthetic path.
    dispatch(
      el,
      new PointerEvent('pointerup', {
        pointerType: 'mouse',
        pointerId: 9,
        clientX: 80,
        clientY: 80,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('completes a real mouse drop over a target despite the trailing lostpointercapture', async () => {
    const { engine } = await renderDnd();
    const src = createElement();
    const tgt = createElement();

    const sourceOnDrop = vi.fn();
    const targetOnDrop = vi.fn();
    engine.registerDraggable(src, {
      onDragEnd: sourceOnDrop,
      pointerActivation: { mouse: { type: 'immediate' } },
    });
    engine.registerDropTarget(tgt, { onDrop: targetOnDrop });

    // Resolve the pointer to the drop target throughout the gesture.
    const originalEFP = document.elementFromPoint;
    document.elementFromPoint = () => tgt;

    try {
      dispatch(
        src,
        new PointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 9,
          clientX: 10,
          clientY: 10,
          button: 0,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
      await flushRaf();

      // A real browser releases pointer capture implicitly on button-up, firing
      // `lostpointercapture` right after the `pointerup`. The pointerup must win
      // (drop), and the trailing capture-release must no-op on the already-ended
      // session rather than turn the completed drop into a cancel.
      dispatch(
        src,
        new PointerEvent('pointerup', {
          pointerType: 'mouse',
          pointerId: 9,
          clientX: 50,
          clientY: 50,
          bubbles: true,
          cancelable: true,
        }),
      );
      dispatch(window, new PointerEvent('lostpointercapture', { pointerId: 9, bubbles: true }));

      expect(targetOnDrop).toHaveBeenCalledTimes(1);
      expect(sourceOnDrop).toHaveBeenCalledTimes(1);
      const payload = sourceOnDrop.mock.calls[0][0];
      expect(payload.canceled).toBe(false);
      expect(payload.dropTarget?.element).toBe(tgt);
      expect(payload.location.current.dropTargets).toHaveLength(1);
      expect(payload.location.current.dropTargets[0].element).toBe(tgt);
    } finally {
      document.elementFromPoint = originalEFP;
    }
  });

  describe('drag cursor', () => {
    /**
     * The cursor forced across the document while a drag is active, or `null`
     * when none is pinned. The engine keeps one scoped `html.baseui-dragging *`
     * rule injected and toggles the `baseui-dragging` class plus the
     * `--drag-cursor` variable per drag, so the active cursor is read off the
     * document root rather than from the (persistent) stylesheet text.
     */
    function activeCursorRule(): string | null {
      const root = document.documentElement;
      if (!root.classList.contains('baseui-dragging')) {
        return null;
      }
      return root.style.getPropertyValue('--drag-cursor') || null;
    }

    function mouseDown(target: EventTarget, x: number, y: number): void {
      dispatch(
        target,
        new PointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 9,
          clientX: x,
          clientY: y,
          button: 0,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
    }

    function mouseUp(target: EventTarget, x: number, y: number): void {
      dispatch(
        target,
        new PointerEvent('pointerup', {
          pointerType: 'mouse',
          pointerId: 9,
          clientX: x,
          clientY: y,
          bubbles: true,
          cancelable: true,
        }),
      );
    }

    it('pins "grabbing" across the document during a mouse drag and clears it on drop', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, { pointerActivation: { mouse: { type: 'immediate' } } });

      expect(activeCursorRule()).toBeNull();

      mouseDown(el, 50, 50);
      await flushRaf();
      expect(activeCursorRule()).toBe('grabbing');

      mouseUp(el, 80, 80);
      expect(activeCursorRule()).toBeNull();
    });

    it('never pins the cursor for a drag that ends inside its own lift frame', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, { pointerActivation: { mouse: { type: 'immediate' } } });

      // The lock is deferred a frame so its document-wide style invalidation does
      // not land on the frame that builds the clone. A drag that is over before
      // that frame runs must make the callback a no-op — otherwise it applies
      // after teardown and `grabbing` stays pinned over the page for good.
      mouseDown(el, 50, 50);
      mouseUp(el, 50, 50);
      await flushRaf();
      await flushRaf();

      expect(activeCursorRule()).toBeNull();
    });

    it('does not let a stale cursor callback overwrite a newer drag', async () => {
      const { engine } = await renderDnd();
      const first = createElement();
      const second = createElement();
      engine.registerDraggable(first, {
        pointerActivation: { mouse: { type: 'immediate' } },
      });
      engine.registerDraggable(second, {
        dragCursor: 'move',
        pointerActivation: { mouse: { type: 'immediate' } },
      });

      // End the first drag and start the second before either deferred cursor
      // callback runs. The first callback must not lock its stale value over the
      // live session's custom cursor.
      mouseDown(first, 50, 50);
      mouseUp(first, 50, 50);
      mouseDown(second, 50, 50);
      await flushRaf();

      expect(activeCursorRule()).toBe('move');
      mouseUp(second, 50, 50);
    });

    it('clears the cursor when a drag is cancelled', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, { pointerActivation: { mouse: { type: 'immediate' } } });

      mouseDown(el, 50, 50);
      await flushRaf();
      expect(activeCursorRule()).not.toBeNull();

      // Escape cancels the active drag.
      dispatch(window, new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(activeCursorRule()).toBeNull();
    });

    it('applies a custom dragCursor value', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, {
        dragCursor: 'move',
        pointerActivation: { mouse: { type: 'immediate' } },
      });

      mouseDown(el, 50, 50);
      await flushRaf();
      expect(activeCursorRule()).toBe('move');

      mouseUp(el, 80, 80);
    });

    it('does not pin a cursor when dragCursor is false', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, {
        dragCursor: false,
        pointerActivation: { mouse: { type: 'immediate' } },
      });

      mouseDown(el, 50, 50);
      await flushRaf();
      expect(activeCursorRule()).toBeNull();

      mouseUp(el, 80, 80);
    });

    it('does not pin a cursor during a touch drag (touch has no cursor)', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, { pointerActivation: { touch: { type: 'immediate' } } });

      touchDown(el, 50, 50);
      await flushRaf();
      expect(activeCursorRule()).toBeNull();

      touchUp(50, 50);
    });
  });

  // The active-phase rAF re-resolves the drop target from the *last* pointer
  // sample every frame. A stationary pointer must not keep re-resolving:
  // otherwise a reorder sliding a new element under the stale point re-fires
  // onDrag → consumer reorder → runaway (forward/down-right biased). Resolution
  // is gated on real change — the pointer moving, or content scrolling.
  describe('idle-frame gating', () => {
    async function setupStationaryDrag() {
      const { engine } = await renderDnd();
      const src = createElement();
      const tgtA = createElement();
      const tgtB = createElement();
      const onDropTargetChange = vi.fn();
      engine.registerDraggable(src, { pointerActivation: { touch: { type: 'immediate' } } });
      engine.registerDropTarget(tgtA, {});
      engine.registerDropTarget(tgtB, {});
      engine.registerMonitor({ onDropTargetChange });

      const originalEFP = document.elementFromPoint;
      const state = { hit: tgtA as Element };
      const efp = vi.fn(() => state.hit);
      document.elementFromPoint = efp as typeof document.elementFromPoint;
      registerCleanup(() => {
        document.elementFromPoint = originalEFP;
      });

      return { src, tgtA, tgtB, onDropTargetChange, efp, state };
    }

    it('does not re-resolve while the pointer is stationary and content shifts', async () => {
      const { src, tgtB, onDropTargetChange, efp, state } = await setupStationaryDrag();

      touchDown(src, 10, 10);
      await flushRaf();
      await flushRaf();

      const efpCalls = efp.mock.calls.length;
      const changes = onDropTargetChange.mock.calls.length;

      // Simulate a reorder sliding a new element under the *stationary* point.
      state.hit = tgtB;
      await flushRaf();
      await flushRaf();
      await flushRaf();

      // No pointer move, no scroll → no re-resolution, no target-stack churn.
      expect(efp.mock.calls.length).toBe(efpCalls);
      expect(onDropTargetChange.mock.calls.length).toBe(changes);

      touchUp(10, 10);
    });

    it('re-resolves exactly once after a scroll while the pointer is stationary', async () => {
      const { src, tgtB, onDropTargetChange, efp, state } = await setupStationaryDrag();

      touchDown(src, 10, 10);
      await flushRaf();
      await flushRaf();

      const efpCalls = efp.mock.calls.length;
      const changes = onDropTargetChange.mock.calls.length;

      // Content scrolls a new element under the stationary point.
      state.hit = tgtB;
      dispatch(document, new Event('scroll'));
      await flushRaf();
      await flushRaf();

      // The scroll forced one re-resolution, which moved the target stack.
      expect(efp.mock.calls.length).toBe(efpCalls + 1);
      expect(onDropTargetChange.mock.calls.length).toBe(changes + 1);

      // The flag is single-shot: a later idle frame does not re-resolve again.
      const efpAfterScroll = efp.mock.calls.length;
      await flushRaf();
      expect(efp.mock.calls.length).toBe(efpAfterScroll);

      touchUp(10, 10);
    });

    it('re-resolves exactly once after notifyExternalScroll() while the pointer is stationary', async () => {
      const { src, tgtB, onDropTargetChange, efp, state } = await setupStationaryDrag();

      touchDown(src, 10, 10);
      await flushRaf();
      await flushRaf();

      const efpCalls = efp.mock.calls.length;
      const changes = onDropTargetChange.mock.calls.length;

      // A scroll inside a shadow root doesn't compose, so the document capture
      // listener never sees it; the auto-scroller reports it through this hook.
      state.hit = tgtB;
      syntheticSensor.notifyExternalScroll();
      await flushRaf();
      await flushRaf();

      expect(efp.mock.calls.length).toBe(efpCalls + 1);
      expect(onDropTargetChange.mock.calls.length).toBe(changes + 1);

      touchUp(10, 10);
    });

    it('notifyExternalScroll() is a no-op with no active pointer drag', () => {
      expect(() => syntheticSensor.notifyExternalScroll()).not.toThrow();
    });

    it('re-resolves after a scroll inside a shadow root holding a drop target', async () => {
      const { engine } = await renderDnd();
      const src = createElement();
      const host = createElement();
      const shadow = host.attachShadow({ mode: 'open' });
      const scroller = document.createElement('div');
      shadow.appendChild(scroller);
      const inner = document.createElement('div');
      inner.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      scroller.appendChild(inner);
      const onDragEnter = vi.fn();
      engine.registerDraggable(src, { pointerActivation: { touch: { type: 'immediate' } } });
      engine.registerDropTarget(inner, { onDragEnter });

      const originalEFP = document.elementFromPoint;
      const hit = { current: null as Element | null };
      document.elementFromPoint = (() => hit.current) as typeof document.elementFromPoint;
      registerCleanup(() => {
        document.elementFromPoint = originalEFP;
      });

      touchDown(src, 10, 10);
      await flushRaf();
      await flushRaf();
      expect(onDragEnter).not.toHaveBeenCalled();

      // Scrolling a container inside the shadow root slides the target under
      // the stationary pointer. `scroll` is neither bubbling nor composed, so
      // only the per-shadow-root capture listener installed at drag start can
      // observe it and re-arm the resolution frame.
      hit.current = inner;
      dispatch(scroller, new Event('scroll'));
      await flushRaf();
      await flushRaf();

      expect(onDragEnter).toHaveBeenCalledTimes(1);

      touchUp(10, 10);
    });

    it('watches a shadow root whose first drop target registers during the drag', async () => {
      const { engine } = await renderDnd();
      const src = createElement();
      const host = createElement();
      const shadow = host.attachShadow({ mode: 'open' });
      const scroller = document.createElement('div');
      const inner = document.createElement('div');
      inner.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      scroller.appendChild(inner);
      shadow.appendChild(scroller);
      const onDragEnter = vi.fn();
      engine.registerDraggable(src, { pointerActivation: { touch: { type: 'immediate' } } });

      const originalEFP = document.elementFromPoint;
      const hit = { current: null as Element | null };
      document.elementFromPoint = (() => hit.current) as typeof document.elementFromPoint;
      registerCleanup(() => {
        document.elementFromPoint = originalEFP;
      });

      touchDown(src, 10, 10);
      await flushRaf();
      await flushRaf();

      engine.registerDropTarget(inner, { onDragEnter });
      await Promise.resolve();
      expect(onDragEnter).not.toHaveBeenCalled();

      hit.current = inner;
      dispatch(scroller, new Event('scroll'));
      await flushRaf();
      await flushRaf();

      expect(onDragEnter).toHaveBeenCalledOnce();

      touchUp(10, 10);
    });

    it('keeps watching a shadow root while any of its targets is still registered', async () => {
      // The set of watched roots is ref-counted per registration: one root holds
      // many targets, and only the last one leaving retires it. Releasing a
      // sibling must not stop the root from being watched.
      const { engine } = await renderDnd();
      const src = createElement();
      const host = createElement();
      const shadow = host.attachShadow({ mode: 'open' });
      const scroller = document.createElement('div');
      shadow.appendChild(scroller);
      const inner = document.createElement('div');
      inner.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      const sibling = document.createElement('div');
      scroller.append(inner, sibling);
      const onDragEnter = vi.fn();
      engine.registerDraggable(src, { pointerActivation: { touch: { type: 'immediate' } } });
      const releaseSibling = engine.registerDropTarget(sibling, {});
      engine.registerDropTarget(inner, { onDragEnter });

      // The sibling goes before the drag starts; `inner` still lives in this root.
      releaseSibling();

      const originalEFP = document.elementFromPoint;
      const hit = { current: null as Element | null };
      document.elementFromPoint = (() => hit.current) as typeof document.elementFromPoint;
      registerCleanup(() => {
        document.elementFromPoint = originalEFP;
      });

      touchDown(src, 10, 10);
      await flushRaf();
      await flushRaf();

      hit.current = inner;
      dispatch(scroller, new Event('scroll'));
      await flushRaf();
      await flushRaf();

      expect(onDragEnter).toHaveBeenCalledTimes(1);

      touchUp(10, 10);
    });

    it('re-resolves when the pointer actually moves', async () => {
      const { src, tgtB, onDropTargetChange, efp, state } = await setupStationaryDrag();

      touchDown(src, 10, 10);
      await flushRaf();
      await flushRaf();

      const efpCalls = efp.mock.calls.length;
      const changes = onDropTargetChange.mock.calls.length;

      // A genuine move opens the gate and re-resolves.
      state.hit = tgtB;
      touchMove(10, 40);
      await flushRaf();
      await flushRaf();

      expect(efp.mock.calls.length).toBeGreaterThan(efpCalls);
      expect(onDropTargetChange.mock.calls.length).toBe(changes + 1);

      touchUp(10, 40);
    });

    it('re-resolves on a move reporting the same coordinates as the previous one', async () => {
      const { src, tgtB, onDropTargetChange, efp, state } = await setupStationaryDrag();

      touchDown(src, 10, 10);
      await flushRaf();
      await flushRaf();

      const efpCalls = efp.mock.calls.length;
      const changes = onDropTargetChange.mock.calls.length;

      // Gating is on pointer *activity*, not on a coordinate delta: a browser
      // can report a move at the coordinates it last reported (sub-pixel
      // movement, coalesced samples), and that is still a genuine move. It must
      // re-resolve, or a target that appeared under the pointer since the last
      // frame would never be entered.
      state.hit = tgtB;
      touchMove(10, 10);
      await flushRaf();
      await flushRaf();

      expect(efp.mock.calls.length).toBeGreaterThan(efpCalls);
      expect(onDropTargetChange.mock.calls.length).toBe(changes + 1);

      touchUp(10, 10);
    });
  });

  describe('modifiers', () => {
    /** Records the Shift state each application saw, and constrains nothing. */
    function makeShiftProbe(): { modifier: DragModifier; seen: boolean[] } {
      const seen: boolean[] = [];
      return {
        seen,
        modifier: ({ point, shiftKey }) => {
          seen.push(shiftKey);
          return point;
        },
      };
    }

    function pressKey(type: 'keydown' | 'keyup', shiftKey: boolean): void {
      dispatch(window, new KeyboardEvent(type, { key: 'Shift', shiftKey, bubbles: true }));
    }

    /** `touchMove`, but carrying a modifier key the shared helper has no argument for. */
    function touchMoveWithShift(x: number, y: number): void {
      dispatch(
        getTouchDownTarget(),
        new PointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
          clientX: x,
          clientY: y,
          buttons: 1,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    }

    /** `touchDown`, but carrying a modifier key the shared helper has no argument for. */
    function touchDownWithShift(el: HTMLElement, x: number, y: number): void {
      dispatch(
        el,
        new PointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
          clientX: x,
          clientY: y,
          button: 0,
          buttons: 1,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    }

    // A drag begun with a modifier already held starts constrained: the pickup event's
    // keys reach the very first application, at drag start, before any move.
    it('applies the modifiers with the pickup press keys already held', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const { modifier, seen } = makeShiftProbe();
      engine.registerDraggable(el, {
        pointerActivation: { touch: { type: 'immediate' } },
        modifiers: modifier,
      });

      touchDownWithShift(el, 50, 50);
      expect(seen[0]).toBe(true);

      await flushRaf();
      touchUp(50, 50);
    });

    it('reports the modifier keys held by the event that produced the move', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const { modifier, seen } = makeShiftProbe();
      engine.registerDraggable(el, {
        pointerActivation: { touch: { type: 'immediate' } },
        modifiers: modifier,
      });

      touchDown(el, 50, 50);
      await flushRaf();
      expect(seen.at(-1)).toBe(false);

      touchMoveWithShift(60, 60);
      await flushRaf();
      expect(seen.at(-1)).toBe(true);

      touchUp(60, 60);
    });

    // A key-gated modifier has to engage while the pointer is standing still, or holding
    // the key does nothing until the user happens to move — which is not what holding a
    // key down looks like.
    it('re-applies when a modifier key changes with the pointer still', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const { modifier, seen } = makeShiftProbe();
      // Both halves of what the press produces: what the modifier was handed, and what
      // the frame goes on to report. A dispatch skipped because the point did not move
      // would leave the second stale while the first still looked right.
      const reported: Array<{ input: boolean; event: boolean; reason: string }> = [];
      engine.registerDraggable(el, {
        pointerActivation: { touch: { type: 'immediate' } },
        modifiers: modifier,
        onDrag: ({ location }, eventDetails) => {
          reported.push({
            input: location.current.input.shiftKey,
            event: eventDetails.event.shiftKey,
            reason: eventDetails.reason,
          });
        },
      });

      touchDown(el, 50, 50);
      await flushRaf();
      const applicationsBeforeKey = seen.length;
      expect(seen.at(-1)).toBe(false);

      pressKey('keydown', true);
      await flushRaf();
      expect(seen.length).toBeGreaterThan(applicationsBeforeKey);
      expect(seen.at(-1)).toBe(true);
      // The sensor frame also flushes its lifecycle update, so consumers see the
      // modifier change without another frame of latency.
      // The two agree: the reported input and `eventDetails.event` both come from the
      // press, so a consumer reading either sees Shift down.
      expect(reported.at(-1)).toEqual({ input: true, event: true, reason: 'modifier-key' });

      pressKey('keyup', false);
      await flushRaf();
      expect(seen.at(-1)).toBe(false);
      expect(reported.at(-1)).toEqual({ input: false, event: false, reason: 'modifier-key' });

      touchMove(60, 60);
      await flushRaf();
      expect(reported.at(-1)?.reason).toBe('pointer');

      touchUp(60, 60);
    });

    it('reports a modifier-key reason when a key-driven frame changes targets', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const targetA = createElement();
      const targetB = createElement();
      const onDropTargetChange = vi.fn();
      engine.registerDraggable(source, {
        pointerActivation: { touch: { type: 'immediate' } },
        modifiers: ({ point, shiftKey }) => (shiftKey ? { ...point, x: 100 } : point),
      });
      engine.registerDropTarget(targetA, {});
      engine.registerDropTarget(targetB, {});
      engine.registerMonitor({ onDropTargetChange });

      const originalEFP = document.elementFromPoint;
      document.elementFromPoint = ((x: number) =>
        x === 100 ? targetB : targetA) as typeof document.elementFromPoint;
      registerCleanup(() => {
        document.elementFromPoint = originalEFP;
      });

      touchDown(source, 10, 10);
      await flushRaf();
      onDropTargetChange.mockClear();

      pressKey('keydown', true);
      await flushRaf();

      expect(onDropTargetChange).toHaveBeenCalledOnce();
      const eventDetails = onDropTargetChange.mock.calls[0][1];
      expect(eventDetails.reason).toBe('modifier-key');
      expect(eventDetails.event).toBeInstanceOf(KeyboardEvent);

      touchUp(10, 10);
    });

    it('does not re-apply for a key press that changes no modifier', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const { modifier, seen } = makeShiftProbe();
      engine.registerDraggable(el, {
        pointerActivation: { touch: { type: 'immediate' } },
        modifiers: modifier,
      });

      touchDown(el, 50, 50);
      await flushRaf();
      const applications = seen.length;

      // Typing during a drag must not cost a frame per keystroke.
      dispatch(window, new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      await flushRaf();
      expect(seen).toHaveLength(applications);

      touchUp(50, 50);
    });

    it('constrains every reported input, shifting pageX by the same delta as clientX', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      engine.registerDraggable(el, {
        pointerActivation: { touch: { type: 'immediate' } },
        modifiers: restrictToVerticalAxis,
        onDragStart,
      });
      engine.registerMonitor({ onDrag });

      touchDown(el, 50, 50);
      await flushRaf();

      expect(onDragStart).toHaveBeenCalledTimes(1);
      const startInput = onDragStart.mock.calls[0][0].location.current.input;
      // The reference the page-coordinate assertion below compares against: the
      // raw events all share one page/client delta, and `remapInput` must
      // preserve it by shifting pageX exactly as far as it shifted clientX.
      const pageDelta = startInput.pageX - startInput.clientX;

      touchMove(80, 90);
      await flushRaf();
      touchMove(120, 130);
      await flushRaf();
      // The sensor's frame resolves the move; `onDrag` is dispatched from the
      // lifecycle's own frame after it.
      await flushRaf();

      expect(onDrag).toHaveBeenCalled();
      for (const [payload] of onDrag.mock.calls) {
        const input = payload.location.current.input;
        // The axis lock pins x at the activation x; y follows the pointer.
        expect(input.clientX).toBe(50);
        expect(input.pageX - input.clientX).toBe(pageDelta);
        expect(input.pageY - input.clientY).toBe(pageDelta);
      }
      const lastInput = onDrag.mock.lastCall![0].location.current.input;
      expect(lastInput.clientY).toBe(130);

      touchUp(120, 130);
    });

    it('resolves the drop hit-test and the drop input at the constrained point', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const tgt = createElement();
      const onDragEnd = vi.fn();
      const onDrop = vi.fn();
      engine.registerDraggable(el, {
        pointerActivation: { touch: { type: 'immediate' } },
        modifiers: restrictToVerticalAxis,
        onDragEnd,
      });
      engine.registerDropTarget(tgt, { onDrop });

      const originalEFP = document.elementFromPoint;
      const efp = vi.fn(() => tgt);
      document.elementFromPoint = efp as typeof document.elementFromPoint;
      registerCleanup(() => {
        document.elementFromPoint = originalEFP;
      });

      touchDown(el, 50, 50);
      await flushRaf();
      // Release far to the right of the activation point: the drop must resolve
      // at the constrained x the drag reported all along, not the raw pointer x.
      touchUp(120, 80);

      expect(efp).toHaveBeenLastCalledWith(50, 80);
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      const dropInput = onDragEnd.mock.calls[0][0].location.current.input;
      expect(dropInput.clientX).toBe(50);
      expect(dropInput.clientY).toBe(80);
    });

    it('contains a throwing modifier and commits the move unconstrained', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onDrag = vi.fn();
      engine.registerDraggable(el, {
        pointerActivation: { touch: { type: 'immediate' } },
        modifiers: () => {
          throw new Error('modifier boom');
        },
      });
      engine.registerMonitor({ onDrag });

      // The throw must be contained (logged, not uncaught): an uncaught throw
      // inside the sensor's frame would strand the whole gesture.
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        touchDown(el, 50, 50);
        await flushRaf();
        touchMove(80, 90);
        await flushRaf();
        // The sensor's frame resolves the move; `onDrag` is dispatched from the
        // lifecycle's own frame after it.
        await flushRaf();
        touchUp(80, 90);

        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(String(consoleErrorSpy.mock.calls[0][0])).toMatch(
          /^Base UI: a drag "modifiers" function threw/,
        );
      } finally {
        consoleErrorSpy.mockRestore();
      }

      // The drag proceeded, with each move committed unconstrained.
      expect(onDrag).toHaveBeenCalled();
      const lastInput = onDrag.mock.lastCall![0].location.current.input;
      expect(lastInput.clientX).toBe(80);
      expect(lastInput.clientY).toBe(90);
    });

    it('anchors an axis lock at the activation point, not the pointerdown point', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      // Default pen activation is `distance: 5px`, so the drag activates on the
      // move that clears the threshold — at (60, 50), not the (50, 50) press.
      engine.registerDraggable(el, {
        modifiers: restrictToVerticalAxis,
        onDragStart,
      });
      engine.registerMonitor({ onDrag });

      penDown(el, 50, 50);
      penMove(60, 50); // 10px from origin — clears the 5px threshold
      await flushRaf();
      expect(onDragStart).toHaveBeenCalledTimes(1);
      // The session's first input is the (constrained) activation point.
      expect(onDragStart.mock.calls[0][0].location.current.input.clientX).toBe(60);

      penMove(100, 90);
      await flushRaf();
      await flushRaf(); // see the pageX test: `onDrag` lands a frame later

      // Every move stays pinned to the activation x (60), not the press x (50).
      expect(onDrag).toHaveBeenCalled();
      for (const [payload] of onDrag.mock.calls) {
        expect(payload.location.current.input.clientX).toBe(60);
      }
      const lastInput = onDrag.mock.lastCall![0].location.current.input;
      expect(lastInput.clientY).toBe(90);

      penUp(100, 90);
    });
  });

  it('does not suppress the context menu while a mouse button merely rests on a draggable', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerDraggable(el, {});

    // Mouse activation is distance-based, so this stays `pending` for as long as
    // the button is held — it must not swallow right-click document-wide.
    dispatch(
      el,
      new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 0,
        clientY: 0,
        button: 0,
        buttons: 1,
        bubbles: true,
        cancelable: true,
      }),
    );

    const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    dispatch(el, menu);
    expect(menu.defaultPrevented).toBe(false);

    // Once the drag actually runs, the suppression is right.
    dispatch(
      document,
      new PointerEvent('pointermove', {
        pointerId: 1,
        clientX: 0,
        clientY: 40,
        buttons: 1,
        bubbles: true,
      }),
    );
    await flushRaf();

    const menuDuringDrag = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    dispatch(el, menuDuringDrag);
    expect(menuDuringDrag.defaultPrevented).toBe(true);

    act(() => cancelDrag());
  });

  describe('post-drag click', () => {
    it('allows a programmatic click from onDrop and still swallows the compatibility click', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement();
      const button = document.createElement('button');
      document.body.appendChild(button);
      registerCleanup(() => button.remove());
      const onButtonClick = vi.fn();
      button.addEventListener('click', onButtonClick);
      registerCleanup(() => button.removeEventListener('click', onButtonClick));
      const onOutsideClick = vi.fn();
      document.addEventListener('click', onOutsideClick, { capture: true });
      registerCleanup(() => document.removeEventListener('click', onOutsideClick, true));

      engine.registerDraggable(source, {
        pointerActivation: { touch: { type: 'immediate' } },
        onDrop() {
          button.click();
        },
      });
      engine.registerDropTarget(target, {});
      const originalEFP = document.elementFromPoint;
      document.elementFromPoint = () => target;
      registerCleanup(() => {
        document.elementFromPoint = originalEFP;
      });

      touchDown(source, 50, 50);
      await flushRaf();
      touchUp(50, 50);

      expect(onButtonClick).toHaveBeenCalledOnce();
      expect(onOutsideClick).toHaveBeenCalledOnce();

      act(() => {
        source.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
      expect(onOutsideClick).toHaveBeenCalledOnce();
    });

    it('swallows the compatibility click that follows a drag', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, { pointerActivation: { touch: { type: 'immediate' } } });

      // An outside-press dismisser: document-level, capture — exactly what the
      // retargeted click would otherwise reach.
      const outsidePress = vi.fn();
      document.addEventListener('click', outsidePress, { capture: true });
      registerCleanup(() => document.removeEventListener('click', outsidePress, true));

      touchDown(el, 50, 50);
      await flushRaf();
      touchUp(50, 50);

      act(() => {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
      expect(outsidePress).not.toHaveBeenCalled();

      // One shot only: the next click is a real one and must get through.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
      expect(outsidePress).toHaveBeenCalledTimes(1);
    });

    it('disarms itself after the click window when no click and no further gesture arrive', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, { pointerActivation: { touch: { type: 'immediate' } } });

      const onClick = vi.fn();
      document.addEventListener('click', onClick, { capture: true });
      registerCleanup(() => document.removeEventListener('click', onClick, true));

      touchDown(el, 50, 50);
      await flushRaf();
      touchUp(50, 50);

      // Real timers: the suppression is armed from the sensor's own teardown, so
      // fake timers would have to be installed before the drag — and the rAF stub
      // this file's `flushRaf` drives is itself a `setTimeout`.
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });

      act(() => {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('keeps the click suppressed when Escape cancels a drag whose button is still held', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, {});

      const onClick = vi.fn();
      document.addEventListener('click', onClick, { capture: true });
      registerCleanup(() => document.removeEventListener('click', onClick, true));

      dispatch(
        el,
        new PointerEvent('pointerdown', {
          pointerId: 1,
          clientX: 0,
          clientY: 0,
          button: 0,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
      dispatch(
        document,
        new PointerEvent('pointermove', {
          pointerId: 1,
          clientX: 0,
          clientY: 40,
          buttons: 1,
          bubbles: true,
        }),
      );
      await flushRaf();
      expect(dragSessionStore.getSnapshot()).not.toBe(null);

      // Escape cancels while the button is still down, so the sensor's own
      // listeners are gone and it never sees the release. The window must not
      // expire before the user lets go, or the drag turns into a click on the
      // control it was picked up from.
      dispatch(
        document,
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );

      // Longer than the post-release window: the user has just pressed a key
      // mid-gesture, so holding this long is the normal case.
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });

      dispatch(
        document,
        new PointerEvent('pointerup', { pointerId: 1, clientX: 0, clientY: 40, bubbles: true }),
      );
      act(() => {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });

      expect(onClick).not.toHaveBeenCalled();
    });

    it('keeps the held-pointer suppression through a second finger tapping', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, { pointerActivation: { touch: { type: 'immediate' } } });

      const onClick = vi.fn();
      document.addEventListener('click', onClick, { capture: true });
      registerCleanup(() => document.removeEventListener('click', onClick, true));

      touchDown(el, 50, 50);
      await flushRaf();

      // Torn down while the finger is still on the glass, so the suppression is
      // armed in held-pointer mode.
      dispatch(
        document,
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );

      // A second finger taps elsewhere. It is not a new gesture: the held
      // finger's eventual release can still synthesize the compatibility click
      // (it is the primary pointer), so the tap must not disarm the window.
      dispatch(
        document,
        new PointerEvent('pointerdown', {
          pointerId: 2,
          pointerType: 'touch',
          isPrimary: false,
          clientX: 200,
          clientY: 200,
          bubbles: true,
        }),
      );
      dispatch(
        document,
        new PointerEvent('pointerup', {
          pointerId: 2,
          pointerType: 'touch',
          isPrimary: false,
          clientX: 200,
          clientY: 200,
          bubbles: true,
        }),
      );

      const secondPointerClick = new PointerEvent('click', {
        pointerId: 2,
        pointerType: 'touch',
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        document.body.dispatchEvent(secondPointerClick);
      });
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(secondPointerClick.defaultPrevented).toBe(false);

      // The original finger lifts; its compatibility click must still be eaten.
      touchUp(50, 50);
      act(() => {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not swallow a click from the next gesture when no compatibility click arrives', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, { pointerActivation: { touch: { type: 'immediate' } } });

      const onClick = vi.fn();
      document.addEventListener('click', onClick, { capture: true });
      registerCleanup(() => document.removeEventListener('click', onClick, true));

      touchDown(el, 50, 50);
      await flushRaf();
      touchUp(50, 50);

      // No compatibility click follows: browsers only fire one when the press and
      // release share a target, so a drag released over a different element — the
      // normal case on a canvas — produces none. The suppression must not sit armed
      // waiting for a click that will never come.
      const button = createElement();
      dispatch(
        button,
        new PointerEvent('pointerdown', {
          pointerId: 2,
          clientX: 300,
          clientY: 300,
          button: 0,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
      dispatch(
        document,
        new PointerEvent('pointerup', { pointerId: 2, clientX: 300, clientY: 300, bubbles: true }),
      );
      act(() => {
        button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not swallow a click after a press that never became a drag', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerDraggable(el, {});

      const onClick = vi.fn();
      document.addEventListener('click', onClick, { capture: true });
      registerCleanup(() => document.removeEventListener('click', onClick, true));

      // Press and release with no movement: a plain click, which the docs promise
      // reaches the element underneath.
      dispatch(
        el,
        new PointerEvent('pointerdown', {
          pointerId: 1,
          clientX: 0,
          clientY: 0,
          button: 0,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
      dispatch(
        document,
        new PointerEvent('pointerup', { pointerId: 1, clientX: 0, clientY: 0, bubbles: true }),
      );
      act(() => {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  // The recipe the testing guide publishes, driven exactly as a consumer would
  // copy it. `buttons` is the part that is easy to leave off, and getting it
  // wrong fails in two different ways depending on when it goes missing.
  describe('the documented pointer-drag recipe', () => {
    function pointerDown(el: HTMLElement) {
      dispatch(
        el,
        new PointerEvent('pointerdown', {
          pointerId: 1,
          clientX: 0,
          clientY: 0,
          button: 0,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
    }

    function pointerMove(clientY: number, buttons: number) {
      dispatch(
        document,
        new PointerEvent('pointermove', {
          pointerId: 1,
          clientX: 0,
          clientY,
          buttons,
          bubbles: true,
        }),
      );
    }

    function pointerUp(clientY: number) {
      dispatch(
        document,
        new PointerEvent('pointerup', {
          pointerId: 1,
          clientX: 0,
          clientY,
          button: 0,
          buttons: 0,
          bubbles: true,
        }),
      );
    }

    it('coalesces held-button moves into the pending frame without re-requesting it', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      engine.registerDraggable(source, {});

      pointerDown(source);
      pointerMove(40, 1);
      await flushRaf();
      expect(dragSessionStore.getSnapshot()).not.toBeNull();

      const request = vi.spyOn(window, 'requestAnimationFrame');
      const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame');
      registerCleanup(() => {
        request.mockRestore();
        cancelFrame.mockRestore();
      });

      // Several samples between two paints, as a high-rate pointer delivers
      // them: at most the first one requests a frame (none, if one is already
      // pending), and none of them cancels a pending one to re-request it.
      pointerMove(60, 1);
      pointerMove(80, 1);
      pointerMove(100, 1);
      expect(cancelFrame).not.toHaveBeenCalled();
      expect(request.mock.calls.length).toBeLessThanOrEqual(1);

      pointerUp(100);
    });

    it('drops when every move carries buttons: 1', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onDragEnd = vi.fn();
      engine.registerDraggable(source, { onDragEnd });

      pointerDown(source);
      pointerMove(40, 1);
      pointerMove(120, 1);
      pointerUp(120);

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      // jsdom cannot hit-test, so the drop resolves to no target rather than throwing.
      expect(onDragEnd.mock.calls[0][1].reason).toBe('outside-release');
    });

    it('never starts a drag when the move that would commit it omits buttons', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onDragStart = vi.fn();
      const onDragEnd = vi.fn();
      engine.registerDraggable(source, { onDragStart, onDragEnd });

      pointerDown(source);
      pointerMove(40, 0);
      pointerMove(120, 0);

      // The pending gesture is abandoned before it commits, so nothing fires at
      // all — not even a cancel.
      expect(onDragStart).not.toHaveBeenCalled();
      expect(onDragEnd).not.toHaveBeenCalled();
    });

    it('cancels with missed-release when buttons drops to 0 and no pointerup follows', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onDragEnd = vi.fn();
      engine.registerDraggable(source, { onDragEnd });

      pointerDown(source);
      pointerMove(40, 1);
      pointerMove(80, 0);
      await flushRaf();

      expect(onDragEnd.mock.calls.map((call) => call[1].reason)).toEqual(['missed-release']);
    });

    it('drops when a buttons: 0 move immediately precedes pointerup', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onDragEnd = vi.fn();
      engine.registerDraggable(source, { onDragEnd });

      pointerDown(source);
      pointerMove(40, 1);
      pointerMove(80, 0);

      // A terminal pointerup queued in the same frame wins over the
      // missed-release fallback scheduled by the preceding move.
      pointerUp(80);
      await flushRaf();

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(false);
    });

    it('keeps dragging when a held-button move follows a transient buttons: 0 move', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onDragEnd = vi.fn();
      engine.registerDraggable(source, { onDragEnd });

      pointerDown(source);
      pointerMove(40, 1);
      pointerMove(80, 0);
      pointerMove(100, 1);
      await flushRaf();

      expect(onDragEnd).not.toHaveBeenCalled();

      pointerUp(100);

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd.mock.calls[0][0].canceled).toBe(false);
    });
  });
});
