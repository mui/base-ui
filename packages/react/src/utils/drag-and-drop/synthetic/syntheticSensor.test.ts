import { describe, it, expect, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { isJSDOM } from '#test-utils';
import { createDndRenderer } from '../../../../test/dndEngine';
import {
  createElement,
  flushRaf,
  mockElementFromPoint,
  registerCleanup,
  setupDragEngineTests,
  splitEnd,
} from '../../../../test/dnd';
import { cancelDrag } from '../cancelDrag';
import { WindowAnimationFrame } from '../../windowAnimationFrame';
import { dragSessionStore } from '../dragSessionStore';
import type { DraggableRootModifier } from '../../../draggable/root/DraggableRoot';
import type { DraggableTargetRecord } from '../../../draggable/target/DraggableTarget';
import { restrictToVerticalAxis } from '../dragModifiers';
import {
  dispatchTouchEvent,
  getTouchDownTarget,
  penDown,
  penMove,
  penUp,
  touchCancel,
  touchDown,
  touchMove,
  touchUp,
  dispatch,
} from '../../../../test/syntheticPointer';

setupDragEngineTests();

describe('syntheticDrag sensor', () => {
  const { renderDnd } = createDndRenderer();

  it('starts from a draggable registered inside a closed shadow root', async () => {
    const { engine } = await renderDnd();
    // Test document and closed-root arbitration together. A root-only fixture
    // can't show the outer capture listener claiming the retargeted host.
    engine.registerSource(createElement(), {});
    const host = createElement();
    const shadow = host.attachShadow({ mode: 'closed' });
    const source = document.createElement('div');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    shadow.appendChild(source);
    const onMoveStart = vi.fn();
    engine.registerSource(source, {
      activation: { pen: { type: 'immediate' } },
      onMoveStart,
    });

    penDown(source, 50, 50);
    await flushRaf();

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(source);
    act(() => cancelDrag());
  });

  it('starts from content slotted into a handle that wraps a slot', async () => {
    const { engine } = await renderDnd();
    const host = createElement();
    const shadow = host.attachShadow({ mode: 'open' });
    const source = document.createElement('div');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    const handle = document.createElement('div');
    handle.appendChild(document.createElement('slot'));
    source.appendChild(handle);
    shadow.appendChild(source);
    const slotted = document.createElement('span');
    host.appendChild(slotted);
    const onMoveStart = vi.fn();
    engine.registerSource(source, {
      handle,
      activation: { pen: { type: 'immediate' } },
      onMoveStart,
    });

    penDown(slotted, 50, 50);
    await flushRaf();

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    act(() => cancelDrag());
  });

  it('restores draggable="true" on a source that declared it', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    // A consumer's own `draggable="true"` (for its HTML5 drag integration) must
    // come back after the engine's temporary `draggable="false"`.
    el.setAttribute('draggable', 'true');
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveEnd,
    });

    // Pending abort. The default pen activation (5px distance) keeps the
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
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(el.getAttribute('draggable')).toBe('true');
  });

  it('runs the remaining pending and active cleanups after a listener removal throws', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    el.setAttribute('draggable', 'true');
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
    });

    penDown(el, 50, 50);
    const removePendingListener = vi
      .spyOn(window, 'removeEventListener')
      .mockImplementationOnce(() => {
        throw new Error('pending listener cleanup failed');
      });
    expect(() => act(() => cancelDrag())).toThrow('pending listener cleanup failed');
    expect(el.getAttribute('draggable')).toBe('true');
    removePendingListener.mockRestore();

    touchDown(el, 50, 50);
    await flushRaf();
    const removeActiveListener = vi
      .spyOn(document, 'removeEventListener')
      .mockImplementationOnce(() => {
        throw new Error('active listener cleanup failed');
      });
    expect(() => act(() => cancelDrag())).toThrow('active listener cleanup failed');
    expect(el.getAttribute('draggable')).toBe('true');
    expect(document.querySelector('[data-drag-preview]')).toBeNull();
    removeActiveListener.mockRestore();
  });

  it('pen activates after moving past the distance threshold', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    engine.registerSource(el, { onMoveStart });

    penDown(el, 50, 50);
    penMove(53, 53); // ~4.2px diagonal, under the 5px default
    await flushRaf();
    expect(onMoveStart).not.toHaveBeenCalled();

    penMove(60, 50); // 10px from the origin, past the 5px threshold
    await flushRaf();
    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onMoveStart.mock.calls[0][0].location.current.input.pointerType).toBe('pen');

    penUp(60, 50);
  });

  it('pen drop fires onMoveEnd with pointerType "pen"', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      // Use immediate so the test does not need to clear the distance
      // threshold first.
      activation: { pen: { type: 'immediate' } },
      onMoveEnd,
    });

    penDown(el, 50, 50);
    await flushRaf();
    penUp(120, 80);

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    const details = onMoveEnd.mock.calls[0][0];
    expect(details.location.current.input.pointerType).toBe('pen');
    expect(details.location.current.input.clientX).toBe(120);
    expect(details.location.current.input.clientY).toBe(80);
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
    engine.registerSource(el, {
      activation: { pen: { type: 'immediate' } },
    });

    penDown(el, 50, 50, 7);
    await flushRaf();

    // Capture is anchored on the body, never the dragged element, so the
    // gesture survives that element being unmounted mid-drag (live reorder,
    // virtualizer recycle). Pen has no implicit capture, so without this the
    // events would stop as soon as the stylus drifts off the target.
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
    engine.registerSource(el, {
      activation: { pen: { type: 'immediate' } },
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
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveEnd,
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
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('outside-release');
  });

  it('rethrows a non-DOMException from releasePointerCapture', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveEnd,
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

    // Only pointer capture `DOMException`s are expected there. Anything else is a
    // real bug and must surface as an uncaught error from the `pointerup`
    // listener.
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
    // The throw surfaces, but the drag still ends. The sensor ends the lifecycle
    // in a `finally`, so the end events still fire and a new drag can start.
    // Otherwise one throw in the sensor's teardown would leave `isActive()` true
    // for the rest of the page's life.
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(dragSessionStore.getSnapshot()).toBe(null);
  });

  it('keeps the drag alive after the dragged element is removed mid-gesture', async () => {
    const { engine } = await renderDnd();
    const src = createElement();
    const tgt = createElement();
    const onTargetChange = vi.fn();
    const onMoveEnd = vi.fn();
    const onDrop = vi.fn();
    engine.registerSource(src, {
      activation: { pen: { type: 'immediate' } },

      onMoveEnd: splitEnd(onDrop, onMoveEnd),
    });
    engine.registerTarget(tgt, {});
    engine.registerMonitor({ onTargetChange });

    const hit = { current: null as Element | null };
    mockElementFromPoint(() => hit.current);

    penDown(src, 50, 50, 7);
    await flushRaf();
    await flushRaf();
    const changesBefore = onTargetChange.mock.calls.length;

    // A live reorder or virtualizer unmounts the dragged element mid-drag.
    src.remove();

    // Capture is anchored on the body, so pointer events retarget there and
    // bubble to the document, where the active listeners are. The move is still
    // observed after the original target is detached. Dispatching on the
    // document mimics that routing.
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

    // The move was processed after the removal, and the engine re-resolved the
    // drop target under the new point.
    expect(onTargetChange.mock.calls.length).toBeGreaterThan(changesBefore);

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

    // The gesture completes as a real drop over the target, not a teardown.
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop.mock.calls[0][0].target.element).toBe(tgt);
  });

  it('lostpointercapture (a genuine OS hand-off) still cancels the drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { pen: { type: 'immediate' } },
      onMoveEnd,
    });

    penDown(el, 50, 50, 7);
    await flushRaf();

    dispatch(
      document.body,
      new PointerEvent('lostpointercapture', { pointerId: 7, bubbles: true }),
    );
    await flushRaf();

    // A later release does nothing, since the gesture is already torn down.
    penUp(50, 50, 7);

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].location.current.targets).toHaveLength(0);
    // A hand-off is a cancel, not a drop over nothing.
    expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('capture-lost');
  });

  it('lets pointerup win when body capture loss is delivered first', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { pen: { type: 'immediate' } },
      onMoveEnd,
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

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('outside-release');
  });

  // jsdom only. A real browser fires `blur` on the iframe window when the frame
  // is removed, and the sensor's blur listener ends the session, so the
  // detached-document branch can't be reached. jsdom fires no blur and keeps
  // the realm alive, which lets this test hold a session over a dead document.
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
      engine.registerSource(iframeEl, {
        activation: { mouse: { type: 'immediate' } },
        onMoveEnd: onIframeDragEnd,
      });

      const topEl = createElement();
      const onMoveStart = vi.fn();
      const onMoveEnd = vi.fn();
      engine.registerSource(topEl, {
        activation: { mouse: { type: 'immediate' } },
        onMoveStart,
        onMoveEnd,
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

      // ...then kill its browsing context. Every listener that could end the
      // gesture lived in the dead realm, so the session can't end on its own.
      iframe.remove();
      // jsdom keeps `defaultView` alive on a removed iframe's document; a real
      // browser nulls it, which is what the sensor's detached-document check reads.
      Object.defineProperty(iframeDoc, 'defaultView', { value: null, configurable: true });

      // The next pickup anywhere detects the dead session, cancels it, and lets
      // this pickup proceed instead of blocking the engine for good.
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
      expect(onIframeDragEnd.mock.calls[0][0].target).toBeNull();
      expect(onIframeDragEnd.mock.calls[0][0].reason).toBe('document-detached');
      expect(onMoveStart).toHaveBeenCalledTimes(1);
      expect(onMoveStart.mock.calls[0][0].source.element).toBe(topEl);

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
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
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
    const onMoveEnd = vi.fn();
    engine.registerSource(iframeEl, {
      activation: { mouse: { type: 'immediate' } },
      onMoveStart() {
        iframe.remove();
        if (isJSDOM) {
          Object.defineProperty(iframeDoc, 'defaultView', { value: null, configurable: true });
        }
      },
      onMoveEnd,
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

    expect(onMoveEnd).toHaveBeenCalledOnce();
    expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('document-detached');
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });

  it('ignores the spurious lostpointercapture fired by the capture redirect (touch/Android)', async () => {
    const { engine } = await renderDnd();
    const src = createElement();
    const tgt = createElement();
    const onMoveEnd = vi.fn();
    const onDrop = vi.fn();
    engine.registerSource(src, {
      activation: { touch: { type: 'immediate' } },

      onMoveEnd: splitEnd(onDrop, onMoveEnd),
    });
    engine.registerTarget(tgt, {});

    mockElementFromPoint(() => tgt);
    // jsdom has no real pointer capture. Keep the anchor's capture state false
    // so the event target alone distinguishes this redirect.
    const originalHas = document.body.hasPointerCapture;
    const originalRelease = document.body.releasePointerCapture;
    document.body.hasPointerCapture = (() => false) as typeof document.body.hasPointerCapture;
    document.body.releasePointerCapture = (() => {}) as typeof document.body.releasePointerCapture;
    registerCleanup(() => {
      document.body.hasPointerCapture = originalHas;
      document.body.releasePointerCapture = originalRelease;
    });

    touchDown(src, 50, 50, 7);
    await flushRaf();

    // Touch implicitly captures to the `pointerdown` element. The engine's
    // `setPointerCapture(body)` moves capture and makes that element fire
    // `lostpointercapture` right before the first move. The event targets the
    // original element, not the body anchor, so it must not cancel the drag.
    dispatch(src, new PointerEvent('lostpointercapture', { pointerId: 7, bubbles: true }));
    // A real capture loss cancels on the next frame, so let that frame run.
    await flushRaf();
    expect(onMoveEnd).not.toHaveBeenCalled();

    // The drag survives and drops normally over the target.
    touchUp(60, 60, 7);
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it('active-phase window blur cancels the drag and returns the engine to idle', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();

    dispatch(window, new Event('blur'));

    // Blur cancels the drag. `onMoveEnd` fires with a cancel reason and no
    // targets.
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].location.current.targets).toEqual([]);
    expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('window-blur');

    // The engine is idle again, so a fresh drag can start and drop.
    touchDown(el, 50, 50);
    await flushRaf();
    touchUp(60, 60);

    expect(onMoveEnd).toHaveBeenCalledTimes(2);
  });

  it('blocks native touch scrolling during a pen drag (Apple Pencil emits touch events)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerSource(el, { activation: { pen: { type: 'immediate' } } });

    penDown(el, 50, 50);
    await flushRaf();

    // Apple Pencil reports `pointerType: 'pen'`, but iOS still scrolls the page
    // through the touch events it synthesizes for it. The active `touchmove`
    // guard must cancel them as it does for a finger.
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
    engine.registerSource(pending, {});
    engine.registerSource(immediate, { activation: { touch: { type: 'immediate' } } });
    const root = document.documentElement;
    const previousTouchAction = root.style.touchAction;

    touchDown(pending, 50, 50);

    // A pending candidate must not block scrolling. A swipe may still become a
    // native scroll, which cancels the candidate through `pointercancel`, so the
    // gesture doesn't prevent `touchmove` or apply the root lock yet.
    const pendingScroll = new Event('touchmove', { bubbles: true, cancelable: true });
    dispatch(pending, pendingScroll);
    expect(pendingScroll.defaultPrevented).toBe(false);
    expect(root.style.touchAction).toBe(previousTouchAction);

    touchUp(50, 50);

    // Once a drag commits, the same `touchmove` is canceled and the root lock is
    // applied.
    touchDown(immediate, 50, 50);
    await flushRaf();
    const activeScroll = new Event('touchmove', { bubbles: true, cancelable: true });
    dispatch(immediate, activeScroll);
    expect(activeScroll.defaultPrevented).toBe(true);
    expect(root.style.touchAction).toBe('none');

    touchUp(50, 50);
  });

  it('prevents contextmenu after a touch drag candidate is cancelled by the browser', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const child = document.createElement('div');
    el.appendChild(child);
    engine.registerSource(el, {});

    touchDown(child, 50, 50);
    touchCancel();
    el.remove();

    // Pointer Events keep the original press target for `contextmenu`. Model
    // Android's delayed event after a virtualizer detached that target, so its
    // event path no longer reaches the window listener.
    const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
    dispatch(child, contextMenu);

    expect(contextMenu.defaultPrevented).toBe(true);
  });

  it('releases contextmenu suppression after a clean tap-release so a later long-press menu shows', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerSource(el, {});

    // A quick tap lifts before the press-hold activates, so no drag starts. A
    // clean `pointerup` can't trigger a browser `contextmenu`, so the pending
    // suppression must not linger and swallow a later deliberate long-press.
    touchDown(el, 50, 50);
    touchUp(50, 50);

    const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
    dispatch(el, contextMenu);

    expect(contextMenu.defaultPrevented).toBe(false);
  });

  it('keeps contextmenu suppressed after an active touch drag is cancelled by the browser', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerSource(el, { activation: { touch: { type: 'immediate' } } });

    touchDown(el, 50, 50);
    await flushRaf();
    touchCancel();

    // Android fires `pointercancel` and then the long-press `contextmenu`. The
    // suppression armed at `pointerdown` must survive the active teardown to
    // swallow it. The 1.5s timer disarms it afterwards.
    const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
    dispatch(el, contextMenu);
    expect(contextMenu.defaultPrevented).toBe(true);
  });

  it('releases contextmenu suppression after a clean touch drop', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerSource(el, { activation: { touch: { type: 'immediate' } } });

    touchDown(el, 50, 50);
    await flushRaf();
    // A clean finger lift can't make the browser fire `contextmenu`, so the
    // suppression must not linger and swallow a later deliberate long-press.
    touchUp(60, 60);

    const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
    dispatch(el, contextMenu);
    expect(contextMenu.defaultPrevented).toBe(false);
  });

  it('disarms the contextmenu suppression on its own after 1.5s (self-heal)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerSource(el, {});

    // The suppression timer schedules through the owner window's setTimeout, so
    // fake timers can expire it without waiting the real 1.5s.
    vi.useFakeTimers();
    try {
      // A browser cancellation keeps the suppression armed for Android's late
      // `contextmenu` (asserted by the sibling tests above)...
      touchDown(el, 50, 50);
      touchCancel();

      // ...but not past its window. After 1.5s it disarms itself, so a later
      // deliberate long-press menu shows again.
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
    engine.registerSource(el, { activation: { touch: { type: 'immediate' } } });

    vi.useFakeTimers();
    try {
      touchDown(child, 50, 50);
      // Expire the short post-cancel suppression first. The active phase's own
      // target listener must last for the whole drag.
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

  it('onBeforeMoveStart fires at activation commit with the pointer details', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const trigger = document.createElement('span');
    el.appendChild(trigger);
    const onBeforeMoveStart = vi.fn();
    const onMoveStart = vi.fn();
    engine.registerSource(el, { onBeforeMoveStart, onMoveStart });

    penDown(trigger, 50, 50);
    await flushRaf();
    // Not at `pointerdown`. The veto waits for the activation threshold.
    expect(onBeforeMoveStart).not.toHaveBeenCalled();

    penMove(60, 50); // 10px from the origin, past the 5px distance threshold
    await flushRaf();
    expect(onBeforeMoveStart).toHaveBeenCalledTimes(1);
    const [eventDetails] = onBeforeMoveStart.mock.calls[0];
    expect(eventDetails.source.element).toBe(el);
    expect(eventDetails.reason).toBe('pointer');
    expect(eventDetails.input.pointerType).toBe('pen');
    // The input is the activation point, not the press.
    expect(eventDetails.input.clientX).toBe(60);
    expect(eventDetails.input.clientY).toBe(50);
    expect(eventDetails.event).toBeInstanceOf(PointerEvent);
    expect(eventDetails.trigger).toBe(trigger);
    // Not canceled, so the drag started right after.
    expect(onMoveStart).toHaveBeenCalledTimes(1);

    penUp(60, 50);
  });

  it('onBeforeMoveStart canceling blocks the synthetic drag and frees the gesture', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    let block = true;
    const initialData: unknown[] = [];
    const canceledStates: boolean[] = [];
    engine.registerSource(el, {
      onBeforeMoveStart: (eventDetails) => {
        initialData.push(eventDetails.source.dragData);
        eventDetails.source.updateDragData({ offset: 12 });
        if (block) {
          canceledStates.push(eventDetails.isCanceled);
          eventDetails.cancel();
          canceledStates.push(eventDetails.isCanceled);
        }
      },
      activation: { touch: { type: 'immediate' } },
      onMoveStart,
    });

    touchDown(el, 50, 50);
    await flushRaf();
    expect(onMoveStart).not.toHaveBeenCalled();
    expect(canceledStates).toEqual([false, true]);
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
    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(initialData).toEqual([undefined, undefined]);

    touchUp(50, 50);
  });

  it('honors imperative cancellation inside onBeforeMoveStart and allows a later pickup', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    const initialData: unknown[] = [];
    let block = true;
    engine.registerSource(el, {
      activation: { pen: { type: 'immediate' } },
      onBeforeMoveStart: ({ source }) => {
        initialData.push(source.dragData);
        source.updateDragData({ offset: 12 });
        if (block) {
          engine.cancelDrag();
        }
      },
      onMoveStart,
    });

    penDown(el, 50, 50);
    expect(onMoveStart).not.toHaveBeenCalled();
    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(el.hasAttribute('draggable')).toBe(false);
    expect(el.hasAttribute('data-dragging')).toBe(false);
    penUp(50, 50);

    block = false;
    penDown(el, 50, 50);
    expect(onMoveStart).toHaveBeenCalledOnce();
    penUp(50, 50);
    expect(initialData).toEqual([undefined, undefined]);
  });

  it('a throwing onBeforeMoveStart tears the pending phase down', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    const initialData: unknown[] = [];
    let shouldThrow = true;
    engine.registerSource(el, () => ({
      onBeforeMoveStart: ({ source }) => {
        initialData.push(source.dragData);
        source.updateDragData({ offset: 12 });
        if (shouldThrow) {
          throw new Error('veto failed');
        }
      },
      activation: { touch: { type: 'immediate' } },
      onMoveStart,
    }));

    // The consumer's throw escapes the sensor after its cleanup ran and is
    // reported as an uncaught error from the `pointerdown` listener. Swallow the
    // window error event and its console report so the expected throw doesn't
    // fail the run.
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

    expect(onMoveStart).not.toHaveBeenCalled();
    // The pending phase was torn down before the rethrow, restoring the source.
    expect(el.hasAttribute('draggable')).toBe(false);

    // A later gesture can drag again, since nothing stayed armed.
    shouldThrow = false;
    touchDown(el, 50, 50);
    await flushRaf();
    expect(onMoveStart).toHaveBeenCalledTimes(1);

    touchUp(50, 50);
    expect(initialData).toEqual([undefined, undefined]);
  });

  it('a live registration getter throwing at activation tears the pending phase down', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    let throwOnNextRead = false;
    engine.registerSource(el, () => {
      if (throwOnNextRead) {
        throwOnNextRead = false;
        throw new Error('live getter failed');
      }
      return { onMoveStart };
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

    expect(onMoveStart).not.toHaveBeenCalled();
    expect(el.hasAttribute('draggable')).toBe(false);

    penDown(el, 50, 50);
    penMove(60, 50);
    await flushRaf();
    expect(onMoveStart).toHaveBeenCalledTimes(1);
    penUp(60, 50);
  });

  it('a handle getter throwing at activation tears the pending phase down', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const handle = document.createElement('span');
    el.appendChild(handle);
    const onMoveStart = vi.fn();
    let throwOnNextRead = false;
    engine.registerSource(el, {
      handle: () => {
        if (throwOnNextRead) {
          throwOnNextRead = false;
          throw new Error('handle getter failed');
        }
        return handle;
      },
      onMoveStart,
    });

    penDown(handle, 50, 50);
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

    expect(onMoveStart).not.toHaveBeenCalled();
    expect(el.hasAttribute('draggable')).toBe(false);

    penDown(handle, 50, 50);
    penMove(60, 50);
    await flushRaf();
    expect(onMoveStart).toHaveBeenCalledTimes(1);
    penUp(60, 50);
  });

  it('a throwing preview build tears the whole pickup down and frees the engine', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    let shouldThrow = true;
    engine.registerSource(el, () => ({
      activation: { touch: { type: 'immediate' } },
      preview: {
        render: () => {
          if (shouldThrow) {
            throw new Error('preview boom');
          }
          return null;
        },
      },
      onMoveStart,
    }));

    // The throw escapes the sensor after its cleanup ran and surfaces as an
    // uncaught error from the `pointerdown` listener. Swallow the window error
    // event and its console report so the expected throw doesn't fail the run.
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

    expect(onMoveStart).not.toHaveBeenCalled();
    // The aborted commit undid everything the pickup had acquired: the source's
    // reservation and the root scroll lock.
    expect(el.hasAttribute('draggable')).toBe(false);
    expect(document.documentElement.style.getPropertyValue('touch-action')).toBe('');
    expect(document.documentElement.style.getPropertyValue('user-select')).toBe('');

    // A later pickup still drags, since nothing stayed armed or locked.
    shouldThrow = false;
    touchDown(el, 50, 50);
    await flushRaf();
    expect(onMoveStart).toHaveBeenCalledTimes(1);

    touchUp(50, 50);
  });

  it('disabled never arms the pending phase', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    engine.registerSource(el, {
      disabled: true,
      activation: { touch: { type: 'immediate' } },
      onMoveStart,
    });

    touchDown(el, 50, 50);
    await flushRaf();

    expect(onMoveStart).not.toHaveBeenCalled();
    // No pending phase, so the source was never reserved.
    expect(el.hasAttribute('draggable')).toBe(false);
    // Unlike during a pending gesture, a long-press `contextmenu` isn't
    // suppressed either. The press behaves like an ordinary touch on a static
    // element.
    const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
    dispatch(el, contextMenu);
    expect(contextMenu.defaultPrevented).toBe(false);

    touchUp(50, 50);
  });

  it('disabled flipping on during the press aborts the commit', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    let disabled = false;
    engine.registerSource(el, () => ({ disabled, onMoveStart }));

    penDown(el, 50, 50);
    disabled = true;
    penMove(60, 50); // clears the threshold, but the commit re-checks `disabled`
    await flushRaf();

    expect(onMoveStart).not.toHaveBeenCalled();
    // The aborted commit tore the pending phase down.
    expect(el.hasAttribute('draggable')).toBe(false);

    penUp(60, 50);
  });

  it('unregistering during the press aborts the commit', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    const cleanup = engine.registerSource(el, { onMoveStart });

    penDown(el, 50, 50);
    // The draggable unregisters mid-press (unmount, feature flag flip). The
    // commit re-reads the registration and finds nothing to drag.
    cleanup();
    penMove(60, 50); // clears the threshold
    await flushRaf();

    expect(onMoveStart).not.toHaveBeenCalled();
    // The aborted commit tore the pending phase down, restoring the source.
    expect(el.hasAttribute('draggable')).toBe(false);

    penUp(60, 50);
  });

  it('a handle swapped away from the press target during the press aborts the commit', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const handleA = document.createElement('div');
    handleA.getBoundingClientRect = () => new DOMRect(0, 0, 20, 20);
    el.appendChild(handleA);
    const handleB = document.createElement('div');
    handleB.getBoundingClientRect = () => new DOMRect(20, 0, 20, 20);
    el.appendChild(handleB);
    const onMoveStart = vi.fn();
    let handle = handleA;
    engine.registerSource(el, () => ({ handle: () => handle, onMoveStart }));

    penDown(handleA, 10, 10);
    // The draggable swaps its handle during the press. The press that armed this
    // gesture isn't on the new handle, so the commit re-checks the handle, like
    // the `disabled` re-check above.
    handle = handleB;
    penMove(20, 10); // clears the threshold
    await flushRaf();

    expect(onMoveStart).not.toHaveBeenCalled();
    expect(el.hasAttribute('draggable')).toBe(false);

    penUp(20, 10);
  });

  it('touch pointerdown outside the drag handle does not start a drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const handle = document.createElement('div');
    handle.getBoundingClientRect = () => new DOMRect(0, 0, 20, 20);
    el.appendChild(handle);

    const onMoveStart = vi.fn();
    engine.registerSource(el, {
      handle: () => handle,
      activation: { touch: { type: 'immediate' } },
      onMoveStart,
    });

    touchDown(el, 100, 50); // target is el, not handle
    await flushRaf();
    expect(onMoveStart).not.toHaveBeenCalled();

    touchUp(100, 50);
  });

  it('a press inside a nested interactive control does not start a drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const input = document.createElement('input');
    el.appendChild(input);

    const onMoveStart = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveStart,
    });

    // Pressing an inline rename input and moving to select text must stay a text
    // selection. A drag would cancel it with `preventDefault()`.
    touchDown(input, 50, 50);
    await flushRaf();
    expect(onMoveStart).not.toHaveBeenCalled();
    touchUp(50, 50);

    // The draggable itself still picks up.
    touchDown(el, 50, 50);
    await flushRaf();
    expect(onMoveStart).toHaveBeenCalledTimes(1);
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
    const onMoveStart = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveStart,
    });

    touchDown(control, 50, 50);
    await flushRaf();

    expect(onMoveStart).not.toHaveBeenCalled();
    touchUp(50, 50);
  });

  it('a press on formatted text inside a nested contenteditable does not start a drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    const bold = document.createElement('b');
    bold.textContent = 'Bold';
    editor.appendChild(bold);
    el.appendChild(editor);

    const onMoveStart = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveStart,
    });

    // The interactive control is an ancestor of the press target, not the target
    // itself, so the walk has to climb through the `<b>` to find it.
    touchDown(bold, 50, 50);
    await flushRaf();
    expect(onMoveStart).not.toHaveBeenCalled();
    touchUp(50, 50);
  });

  it('a press on a disabled nested button still starts a drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const button = document.createElement('button');
    button.disabled = true;
    el.appendChild(button);

    const onMoveStart = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveStart,
    });

    // A disabled control handles no gesture, so the press belongs to the
    // draggable around it.
    touchDown(button, 50, 50);
    await flushRaf();
    expect(onMoveStart).toHaveBeenCalledTimes(1);
    act(() => cancelDrag());
    touchUp(50, 50);
  });

  it('a press inside a nested link does not start a drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const link = document.createElement('a');
    link.href = '/destination';
    el.appendChild(link);

    const onMoveStart = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveStart,
    });

    touchDown(link, 50, 50);
    await flushRaf();
    expect(onMoveStart).not.toHaveBeenCalled();
    touchUp(50, 50);

    touchDown(el, 50, 50);
    await flushRaf();
    expect(onMoveStart).toHaveBeenCalledTimes(1);
    act(() => cancelDrag());
    touchUp(50, 50);
  });

  it('a draggable whose handle is itself a button still picks up', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const handle = document.createElement('button');
    handle.getBoundingClientRect = () => new DOMRect(0, 0, 20, 20);
    el.appendChild(handle);

    const onMoveStart = vi.fn();
    engine.registerSource(el, {
      handle: () => handle,
      activation: { touch: { type: 'immediate' } },
      onMoveStart,
    });

    // The nested-control rule skips the pickup node itself. Otherwise a
    // `<button>` drag handle, a common pattern, could never start a drag.
    touchDown(handle, 10, 10);
    await flushRaf();
    expect(onMoveStart).toHaveBeenCalledTimes(1);

    act(() => cancelDrag());
    touchUp(10, 10);
  });

  it('a press on a disabled nested input still starts the drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const input = document.createElement('input');
    input.disabled = true;
    el.appendChild(input);

    const onMoveStart = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveStart,
    });

    // A disabled text field selects no text, so the press reaches the draggable.
    touchDown(input, 50, 50);
    await flushRaf();
    expect(onMoveStart).toHaveBeenCalledTimes(1);

    act(() => cancelDrag());
    touchUp(50, 50);
  });

  it('Escape cancels an active synthetic drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();

    dispatch(window, new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].location.current.targets).toEqual([]);
    expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('escape-key');
  });

  it('Tab cancels an active synthetic drag without consuming the key', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveEnd,
    });

    const onKeyDown = vi.fn();
    document.addEventListener('keydown', onKeyDown);
    registerCleanup(() => document.removeEventListener('keydown', onKeyDown));

    touchDown(el, 50, 50);
    await flushRaf();

    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    dispatch(document, tab);

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
    expect(onMoveEnd.mock.calls[0][0]).toEqual(
      expect.objectContaining({ reason: 'tab-key', event: tab }),
    );
    expect(tab.defaultPrevented).toBe(false);
    expect(onKeyDown).toHaveBeenCalledOnce();
  });

  it('the Escape that cancels a drag does not reach other listeners', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveEnd,
    });

    // A dialog-style consumer listens for Escape on the same document. The
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

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(escape.defaultPrevented).toBe(true);
    expect(overlayKeyDown).not.toHaveBeenCalled();

    // An Escape with no drag in progress propagates normally.
    dispatch(document, new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(overlayKeyDown).toHaveBeenCalledTimes(1);
  });

  it('Escape during the pending phase abandons the candidate before it activates', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    // Default pen activation is `distance: 5px`, so the gesture stays pending
    // until the stylus clears the threshold.
    engine.registerSource(el, { onMoveStart });

    penDown(el, 50, 50);
    dispatch(window, new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    // The pending phase was torn down, so the source is no longer reserved.
    expect(el.hasAttribute('draggable')).toBe(false);

    // The abandoned candidate can't activate later. Clearing the distance
    // threshold after Escape does nothing.
    penMove(60, 50);
    await flushRaf();
    expect(onMoveStart).not.toHaveBeenCalled();
  });

  it('a pending-phase pointermove with no buttons pressed abandons the candidate (missed release)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    engine.registerSource(el, { onMoveStart });

    penDown(el, 50, 50);

    // The stylus lifted without a `pointerup` or `pointercancel` reaching the
    // engine (the release happened over another window). This move clears the
    // 5px threshold, but `buttons === 0` means the press is already over, so it
    // must clear the candidate instead of activating it.
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

    expect(onMoveStart).not.toHaveBeenCalled();
    // Not left armed. The pending phase released the source it had reserved.
    expect(el.hasAttribute('draggable')).toBe(false);
    // Unlike a chorded release, the OS may still deliver this press's
    // long-press menu, so it stays suppressed.
    const contextMenu = new Event('contextmenu', { bubbles: true, cancelable: true });
    dispatch(el, contextMenu);
    expect(contextMenu.defaultPrevented).toBe(true);

    // A later move can't resurrect it either.
    penMove(80, 50);
    await flushRaf();
    expect(onMoveStart).not.toHaveBeenCalled();
  });

  it('suppresses the native dragstart a natively-draggable descendant starts from the same press', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    // `<img>` and `<a href>` are natively draggable, and `draggable="false"` on
    // the source doesn't cover a descendant. Without the `dragstart` block, a
    // native HTML5 drag would start from this press and race the pointer sensor.
    const img = document.createElement('img');
    el.appendChild(img);
    engine.registerSource(el, {});

    penDown(img, 50, 50, 7);

    const nativeDragStart = new Event('dragstart', { bubbles: true, cancelable: true });
    dispatch(img, nativeDragStart);

    expect(nativeDragStart.defaultPrevented).toBe(true);

    penUp(50, 50, 7);
  });

  it('locks the drag root while a drag is active and restores it on drop', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerSource(el, { activation: { touch: { type: 'immediate' } } });

    const root = document.documentElement;
    const previousTouchAction = root.style.touchAction;
    const previousUserSelect = root.style.userSelect;

    touchDown(el, 50, 50);
    await flushRaf();

    // The lock blocks native scroll and text selection for the whole gesture.
    // `touch-action` alone can't stop a selection drag, and `user-select` alone
    // can't stop the page from scrolling under a finger.
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
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();

    act(() => {
      cancelDrag();
    });
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('imperative-action');

    // Idle, so canceling again does nothing.
    act(() => {
      cancelDrag();
    });
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
  });

  it('anchors the source grab offset at the press, not the activation input', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const target = createElement({ top: 200 });
    const onDrop = vi.fn();
    engine.registerSource(el, {});
    engine.registerTarget(target, { snap: { x: 8 }, onDraggableDrop: onDrop });
    const spy = vi
      .spyOn(document, 'elementFromPoint')
      .mockImplementation((_x: number, y: number) => (y >= 200 ? target : null));
    registerCleanup(() => spy.mockRestore());

    // Press at x 30. The default 5px pen distance commits activation at x 40.
    // The grab offset must reflect the press, since the user took hold at 30 and
    // the threshold travel isn't part of the grab.
    penDown(el, 30, 50);
    penMove(40, 50);
    await flushRaf();
    penMove(95, 250);
    await flushRaf();
    penUp(95, 250);
    await flushRaf();

    expect(onDrop).toHaveBeenCalledTimes(1);
    const record = onDrop.mock.calls[0][0].currentTarget as DraggableTargetRecord;
    // Anchored at the press, (95 - 30) / 200 = 0.325, and the nearest of 8 steps
    // is 0.375. Anchored at activation, it would be (95 - 40) / 200 = 0.275,
    // which rounds to 0.25.
    expect(record.getSnappedLocalPoint({ anchor: 'source' }).x).toBe(0.375);
  });

  it('cancelDrag() during the pending phase abandons the candidate before it activates', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    const onMoveEnd = vi.fn();
    // Default pen activation is `distance: 5px`, so the gesture stays pending
    // until the stylus clears the threshold.
    engine.registerSource(el, { onMoveStart, onMoveEnd });

    penDown(el, 50, 50);
    act(() => {
      cancelDrag();
    });

    // Nothing activated, so no end event fires, but the candidate is gone. The
    // source is released and clearing the threshold does nothing. A consumer
    // that cancels when, say, a dialog opens must not see the next move start a
    // drag.
    expect(onMoveEnd).not.toHaveBeenCalled();
    expect(el.hasAttribute('draggable')).toBe(false);
    penMove(60, 50);
    await flushRaf();
    expect(onMoveStart).not.toHaveBeenCalled();
  });

  it('reports an outside release (not a cancel) when released outside any drop target', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();
    // Release over empty space. No drop target was ever entered.
    touchUp(60, 60);

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].location.current.targets).toEqual([]);
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('outside-release');
    expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
  });

  it('treats a pointermove with no buttons pressed as a cancel (missed release)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      modifiers: restrictToVerticalAxis,
      onMoveEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();

    // The button came up, but no `pointerup` or `pointercancel` reached the
    // engine (an OS pointer hand-off can swallow it). The next move reports
    // `buttons === 0`, which ends the drag as a cancel, since a release the
    // engine never saw isn't a deliberate drop.
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

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    const [details] = onMoveEnd.mock.calls[0];
    expect(details.target).toBeNull();
    expect(details.reason).toBe('missed-release');
    // Constrained like every reported input. The axis lock pins x at the
    // activation x, so the cancel doesn't report a raw coordinate the drag never
    // reported while live.
    expect(details.location.current.input.clientX).toBe(50);
    expect(details.location.current.input.clientY).toBe(60);
  });

  it('pointercancel reports the last good input, not its own (0,0) coordinates', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();
    touchMove(80, 90);
    await flushRaf();
    // `pointercancel` reports (0,0), so the sensor must use the last reported
    // input instead of snapping the cancel to the origin.
    touchCancel();

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    const [details] = onMoveEnd.mock.calls[0];
    expect(details.target).toBeNull();
    expect(details.reason).toBe('pointer-canceled');
    expect(details.location.current.input.clientX).toBe(80);
    expect(details.location.current.input.clientY).toBe(90);
  });

  it('visibility hidden cancels an active drag with the page-hidden reason', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    Object.defineProperty(document, 'hidden', {
      value: true,
      configurable: true,
    });
    try {
      const visibilityChange = new Event('visibilitychange');
      dispatch(document, visibilityChange);

      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      // Hiding the tab is a cancel, not a drop over nothing.
      expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
      expect(onMoveEnd.mock.calls[0][0]).toEqual(
        expect.objectContaining({ reason: 'page-hidden', event: visibilityChange }),
      );
    } finally {
      // Restore in `finally` so a failed assertion can't leave the document stuck
      // `hidden` and cascade into every later test. Deleting the own properties
      // exposes the real getters again.
      Reflect.deleteProperty(document, 'visibilityState');
      Reflect.deleteProperty(document, 'hidden');
    }
  });

  it('does not swallow the next click after a browser-canceled drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveEnd,
    });

    touchDown(el, 50, 50);
    await flushRaf();
    touchCancel();
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('pointer-canceled');

    // A canceled pointer produces no compatibility click, so the next click is a
    // real one and must reach the page.
    const onClick = vi.fn();
    document.addEventListener('click', onClick, true);
    registerCleanup(() => document.removeEventListener('click', onClick, true));
    dispatch(el, new MouseEvent('click', { detail: 1, bubbles: true, cancelable: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('reports a "touch" pointerType in the onMoveStart location for synthetic drags', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveStart,
    });

    touchDown(el, 10, 10);
    await flushRaf();

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    const details = onMoveStart.mock.calls[0][0];
    expect(details.location.current.input.pointerType).toBe('touch');

    touchUp(10, 10);
  });

  it('synthetic drag surfaces onMove to monitors', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMove = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
    });
    engine.registerMonitor({ onMove });

    touchDown(el, 10, 10);
    await flushRaf();

    touchMove(30, 30);
    await flushRaf();
    await flushRaf();

    // Check the position, not only that the monitor was called, since stale or
    // wrong coordinates would pass a bare `toHaveBeenCalled`. The call count
    // isn't checked, because the frame loop can re-resolve a stationary pointer.
    // The test checks the last event and that no event reports a point the
    // pointer never visited. The first event is the pickup-position resolve, at
    // 10,10.
    expect(onMove).toHaveBeenCalled();
    const sampled = ['10,10', '30,30'];
    for (const [details] of onMove.mock.calls) {
      const { clientX, clientY } = details.location.current.input;
      expect(sampled).toContain(`${clientX},${clientY}`);
    }
    const lastMonitorInput = onMove.mock.lastCall![0].location.current.input;
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
      const onMoveStart = vi.fn();
      engine.registerSource(el, {
        activation: { mouse: { type: 'immediate' } },
        onMoveStart,
      });

      dispatch(
        el,
        new PointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 10,
          clientY: 10,
          button,
          // The bitmask a real browser reports for this button held alone.
          // Neither signal indicates the primary button, so the press is
          // ignored instead of arming a gesture.
          buttons: button === 1 ? 4 : 2,
          bubbles: true,
          cancelable: true,
        }),
      );
      await flushRaf();

      expect(onMoveStart).not.toHaveBeenCalled();
    });

    it('a non-primary pointerup during the pending phase does not clear the candidate', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onMoveStart = vi.fn();
      // The default pen activation is a 5px distance, so the gesture stays pending.
      engine.registerSource(el, { onMoveStart });

      penDown(el, 50, 50);
      // A right-button release while the primary is still held. On `pointerup`,
      // `button` is the released button, so the press hasn't ended.
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
      expect(el.getAttribute('draggable')).toBe('false');

      // The candidate survived, so clearing the distance threshold still activates.
      penMove(60, 50);
      await flushRaf();
      expect(onMoveStart).toHaveBeenCalledTimes(1);

      penUp(60, 50);
    });

    it('a chorded primary release during the pending phase clears the candidate', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onMoveStart = vi.fn();
      engine.registerSource(el, { onMoveStart });

      penDown(el, 50, 50);
      // The primary button comes up while another is still held. The browser
      // reports a `pointermove` whose `buttons` lost the primary bit, never a
      // `pointerup` for button 0. The press is over, so the candidate must not
      // stay armed and block every later `pointerdown`.
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
      expect(onMoveStart).not.toHaveBeenCalled();

      // ...and a fresh pickup still drags.
      penDown(el, 50, 50);
      penMove(60, 50);
      await flushRaf();
      expect(onMoveStart).toHaveBeenCalledTimes(1);

      penUp(60, 50);
    });

    it('clears a pending gesture when pointerup misreports the released button', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onMoveStart = vi.fn();
      engine.registerSource(el, { onMoveStart });

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

      expect(onMoveStart).not.toHaveBeenCalled();
    });

    it('a secondary-button pointerup mid-drag does not end the drag', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onMoveEnd = vi.fn();
      engine.registerSource(el, {
        activation: { mouse: { type: 'immediate' } },
        onMoveEnd,
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

      // A right-click while the primary button is still held. `button` is the
      // released button, and only `0` drops. Without the check, this would end
      // the drag.
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

      expect(onMoveEnd).not.toHaveBeenCalled();

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

      expect(onMoveEnd).toHaveBeenCalledTimes(1);
    });

    it('keeps native drag suppressed through an ignored pointerup until the drag ends', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      el.setAttribute('draggable', 'true');
      const onMoveEnd = vi.fn();
      engine.registerSource(el, {
        activation: { mouse: { type: 'immediate' } },
        onMoveEnd,
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
      expect(el.getAttribute('draggable')).toBe('false');

      // Ignored like Safari's misreported quick release. The primary is still
      // held, so the drag stays live and must keep blocking the native drag.
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
      expect(onMoveEnd).not.toHaveBeenCalled();
      expect(el.getAttribute('draggable')).toBe('false');

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
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(el.getAttribute('draggable')).toBe('true');
    });

    it('drops when pointerup misreports the released button', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onMoveEnd = vi.fn();
      engine.registerSource(el, {
        activation: { mouse: { type: 'immediate' } },
        onMoveEnd,
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

      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('outside-release');
    });

    it('a chorded primary release mid-drag drops at that position (not a cancel)', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onMoveStart = vi.fn();
      const onMoveEnd = vi.fn();
      engine.registerSource(el, {
        activation: { mouse: { type: 'immediate' } },
        onMoveStart,
        onMoveEnd,
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
      expect(onMoveStart).toHaveBeenCalledTimes(1);

      // The primary button comes up while the right button is still held. The
      // browser reports a `pointermove` whose `buttons` lost the primary bit,
      // never a `pointerup` for button 0. The user released on purpose, so this
      // drops at that position instead of canceling.
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

      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      const [details] = onMoveEnd.mock.calls[0];
      // Released over empty space, so the drop has no target (`target` is
      // `null`). It is still a drop, not a cancel.
      expect(details.reason).toBe('outside-release');
      expect(details.target).toBeNull();
      expect(details.location.current.input.clientX).toBe(80);
      expect(details.location.current.input.clientY).toBe(90);

      // The gesture fully released the engine, so a fresh pickup starts and drops.
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
      expect(onMoveStart).toHaveBeenCalledTimes(2);

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
      expect(onMoveEnd).toHaveBeenCalledTimes(2);
    });
  });

  it.skipIf(isJSDOM)(
    'measures drop local points against the layout the drag was released over',
    async () => {
      const { engine } = await renderDnd();
      // A `[data-dragging]` rule that collapses the source pulls the target up
      // into its slot for the whole drag.
      const style = document.createElement('style');
      style.textContent = '.collapse-while-dragging[data-dragging] { display: none; }';
      document.head.append(style);
      const list = document.createElement('div');
      list.style.cssText = 'position: fixed; top: 0; left: 0; width: 100px; z-index: 1;';
      const source = document.createElement('div');
      source.className = 'collapse-while-dragging';
      source.style.height = '50px';
      const target = document.createElement('div');
      target.style.height = '50px';
      list.append(source, target);
      document.body.append(list);
      registerCleanup(() => {
        list.remove();
        style.remove();
      });

      const localPoints: Array<{ x: number; y: number }> = [];
      engine.registerSource(source, {
        activation: { touch: { type: 'immediate' } },
        // Custom content, whose host the engine removes as the drag ends.
        preview: { render: () => 'Preview' },
      });
      engine.registerTarget(target, {
        onDraggableDrop: (eventDetails) => {
          localPoints.push(eventDetails.target!.getLocalPoint());
        },
      });

      touchDown(source, 50, 25);
      await flushRaf();
      touchMove(50, 20);
      await flushRaf();
      touchUp(50, 20);

      // The pointer was 20px into the 50px target as it sat during the drag.
      expect(localPoints).toEqual([{ x: 0.5, y: 0.4 }]);
    },
  );

  it('ignores a second pointerdown while a drag is already active (multi-touch)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    const onMoveEnd = vi.fn();
    const onMove = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveStart,
      onMoveEnd,
    });
    engine.registerMonitor({ onMove });

    // First finger lands and immediately activates.
    touchDown(el, 50, 50, 1);
    await flushRaf();
    expect(onMoveStart).toHaveBeenCalledTimes(1);

    // A second finger lands on the same draggable. The active session ignores
    // it, so there is no second drag and no extra `onMoveStart`.
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
    expect(onMoveStart).toHaveBeenCalledTimes(1);

    // A move from the second finger must not update the drag, which tracks
    // `pointerId === 1`.
    const secondMove = new PointerEvent('pointermove', {
      pointerType: 'touch',
      pointerId: 2,
      clientX: 80,
      clientY: 80,
      buttons: 1,
      bubbles: true,
      cancelable: true,
    });
    dispatch(getTouchDownTarget(), secondMove);
    await flushRaf();
    await flushRaf();
    expect(
      onMove.mock.calls.map(([eventDetails]) => eventDetails.location.current.input.clientX),
    ).not.toContain(80);

    // Lifting the second finger must not end the drag, since its `pointerId` differs.
    const secondUp = new PointerEvent('pointerup', {
      pointerType: 'touch',
      pointerId: 2,
      clientX: 80,
      clientY: 80,
      bubbles: true,
      cancelable: true,
    });
    dispatch(getTouchDownTarget(), secondUp);
    expect(onMoveEnd).not.toHaveBeenCalled();

    // Lifting the original finger ends the drag at that finger's position, not
    // at the second finger's (80, 80).
    touchUp(50, 50, 1);

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    const dropInput = onMoveEnd.mock.calls[0][0].location.current.input;
    expect(dropInput.clientX).toBe(50);
    expect(dropInput.clientY).toBe(50);
  });

  it('does not end an active touch drag on a stray touchend (pointer stream owns termination)', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      activation: { touch: { type: 'immediate' } },
      onMoveEnd,
    });

    touchDown(el, 50, 50, 1);
    await flushRaf();

    // A second finger lifting inside the dragged element dispatches a `touchend`
    // for that finger. The drag follows the pointer stream (filtered by
    // `pointerId`), so a stray touch event must not end it at the wrong spot.
    dispatchTouchEvent('touchend', 80, 80);
    expect(onMoveEnd).not.toHaveBeenCalled();

    // The dragging finger's pointerup still ends the drag.
    touchUp(50, 50, 1);
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
  });

  it('routes a mouse pointerdown through the synthetic path', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onMoveStart = vi.fn();
    const onMoveEnd = vi.fn();
    engine.registerSource(el, {
      onMoveStart,
      onMoveEnd,
      activation: { mouse: { type: 'immediate' } },
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

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onMoveStart).toHaveBeenCalledWith(expect.objectContaining({ reason: 'pointer' }));
    expect(onMoveStart.mock.calls[0][0].location.current.input.pointerType).toBe('mouse');

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
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
  });

  describe('drag cursor', () => {
    /**
     * The cursor forced across the document while a drag is active, or `null`
     * when none is pinned. The engine keeps one scoped `html.baseui-dragging *`
     * rule and toggles the `baseui-dragging` class and the `--drag-cursor`
     * variable per drag, so the active cursor is read from the document root,
     * not from the stylesheet text.
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

    /** The lock waits for the frame after the lift (see `commitActivation`). */
    async function flushLockFrames(): Promise<void> {
      await flushRaf();
      await flushRaf();
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
      engine.registerSource(el, { activation: { mouse: { type: 'immediate' } } });

      expect(activeCursorRule()).toBeNull();

      mouseDown(el, 50, 50);
      await flushLockFrames();
      expect(activeCursorRule()).toBe('grabbing');

      mouseUp(el, 80, 80);
      expect(activeCursorRule()).toBeNull();
    });

    it('never pins the cursor for a drag that ends inside its own lift frame', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerSource(el, { activation: { mouse: { type: 'immediate' } } });

      // The lock is deferred a frame so its document-wide style invalidation
      // doesn't land on the frame that builds the clone. If the drag ends before
      // that frame, the callback must do nothing. Otherwise it applies after
      // teardown and `grabbing` stays on the page for good.
      mouseDown(el, 50, 50);
      mouseUp(el, 50, 50);
      await flushLockFrames();

      expect(activeCursorRule()).toBeNull();
    });

    it('does not let a stale cursor callback overwrite a newer drag', async () => {
      const { engine } = await renderDnd();
      const first = createElement();
      const second = createElement();
      engine.registerSource(first, {
        activation: { mouse: { type: 'immediate' } },
      });
      engine.registerSource(second, {
        dragCursor: 'move',
        activation: { mouse: { type: 'immediate' } },
      });

      // End the first drag and start the second before either deferred cursor
      // callback runs. The first callback must not lock its stale value over the
      // live session's custom cursor.
      mouseDown(first, 50, 50);
      mouseUp(first, 50, 50);
      mouseDown(second, 50, 50);
      await flushLockFrames();

      expect(activeCursorRule()).toBe('move');
      mouseUp(second, 50, 50);
    });

    it('clears the cursor when a drag is cancelled', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerSource(el, { activation: { mouse: { type: 'immediate' } } });

      mouseDown(el, 50, 50);
      await flushLockFrames();
      expect(activeCursorRule()).not.toBeNull();

      // Escape cancels the active drag.
      dispatch(window, new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(activeCursorRule()).toBeNull();
    });

    it('applies a custom dragCursor value', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerSource(el, {
        dragCursor: 'move',
        activation: { mouse: { type: 'immediate' } },
      });

      mouseDown(el, 50, 50);
      await flushLockFrames();
      expect(activeCursorRule()).toBe('move');

      mouseUp(el, 80, 80);
    });

    it('does not pin a cursor when dragCursor is false', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerSource(el, {
        dragCursor: false,
        activation: { mouse: { type: 'immediate' } },
      });

      mouseDown(el, 50, 50);
      await flushLockFrames();
      expect(activeCursorRule()).toBeNull();

      mouseUp(el, 80, 80);
    });

    it('does not pin a cursor during a touch drag (touch has no cursor)', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerSource(el, { activation: { touch: { type: 'immediate' } } });

      touchDown(el, 50, 50);
      await flushLockFrames();
      expect(activeCursorRule()).toBeNull();

      touchUp(50, 50);
    });

    it.skipIf(isJSDOM)('pins the cursor only after the frame that paints the lift', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerSource(el, { activation: { mouse: { type: 'immediate' } } });

      // The lock invalidates style for the whole document. A frame requested from
      // the pickup runs in the rendering update that paints the lift, so the lock
      // waits for the next one.
      mouseDown(el, 50, 50);
      await flushRaf();
      expect(activeCursorRule()).toBeNull();
      await flushRaf();
      expect(activeCursorRule()).toBe('grabbing');

      mouseUp(el, 80, 80);
    });

    it('cancels the deferred cursor frame when the drag ends before it runs', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerSource(el, { activation: { mouse: { type: 'immediate' } } });

      const requested: number[] = [];
      const canceled: number[] = [];
      const originalRequest = window.requestAnimationFrame;
      const originalCancel = window.cancelAnimationFrame;
      const request = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        const id = originalRequest.call(window, callback);
        requested.push(id);
        return id;
      });
      const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
        canceled.push(id);
        originalCancel.call(window, id);
      });
      registerCleanup(() => {
        request.mockRestore();
        cancel.mockRestore();
      });

      mouseDown(el, 50, 50);
      const pickupFrames = requested.slice();
      mouseUp(el, 50, 50);

      // Every frame the pickup requested belongs to the session, so its teardown
      // cancels them rather than leaving callbacks to run against an ended drag.
      expect(pickupFrames.length).toBeGreaterThan(0);
      expect(pickupFrames.filter((id) => !canceled.includes(id))).toEqual([]);
    });
  });

  // The active-phase frame re-resolves the drop target from the last pointer
  // sample. A stationary pointer must not keep re-resolving. Otherwise a reorder
  // that slides a new element under the old point re-fires `onMove`, the
  // consumer reorders again, and the loop runs away (biased forward and down-right).
  // Resolution only runs when the pointer moves or content scrolls.
  describe('idle-frame gating', () => {
    async function setupStationaryDrag() {
      const { engine } = await renderDnd();
      const src = createElement();
      const tgtA = createElement();
      const tgtB = createElement();
      const onTargetChange = vi.fn();
      engine.registerSource(src, { activation: { touch: { type: 'immediate' } } });
      engine.registerTarget(tgtA, {});
      engine.registerTarget(tgtB, {});
      engine.registerMonitor({ onTargetChange });

      const state = { hit: tgtA as Element };
      const efp = vi.fn(() => state.hit);
      mockElementFromPoint(efp);

      return { src, tgtA, tgtB, onTargetChange, efp, state };
    }

    it('does not re-resolve while the pointer is stationary and content shifts', async () => {
      const { src, tgtB, onTargetChange, efp, state } = await setupStationaryDrag();

      touchDown(src, 10, 10);
      await flushRaf();
      await flushRaf();

      const efpCalls = efp.mock.calls.length;
      const changes = onTargetChange.mock.calls.length;

      // Simulate a reorder sliding a new element under the stationary point.
      state.hit = tgtB;
      await flushRaf();
      await flushRaf();
      await flushRaf();

      // No pointer move and no scroll, so no re-resolution and no target-stack churn.
      expect(efp.mock.calls.length).toBe(efpCalls);
      expect(onTargetChange.mock.calls.length).toBe(changes);

      touchUp(10, 10);
    });

    it('re-resolves exactly once after a scroll while the pointer is stationary', async () => {
      const { src, tgtB, onTargetChange, efp, state } = await setupStationaryDrag();

      touchDown(src, 10, 10);
      await flushRaf();
      await flushRaf();

      const efpCalls = efp.mock.calls.length;
      const changes = onTargetChange.mock.calls.length;

      // Content scrolls a new element under the stationary point.
      state.hit = tgtB;
      dispatch(document, new Event('scroll'));
      await flushRaf();
      await flushRaf();

      // The scroll forced one re-resolution, which moved the target stack.
      expect(efp.mock.calls.length).toBe(efpCalls + 1);
      expect(onTargetChange.mock.calls.length).toBe(changes + 1);

      // The flag fires once. A later idle frame doesn't re-resolve.
      const efpAfterScroll = efp.mock.calls.length;
      await flushRaf();
      expect(efp.mock.calls.length).toBe(efpAfterScroll);

      touchUp(10, 10);
    });

    it.each([false, true])(
      're-resolves after a shadow scroll with nested roots: %s',
      async (nested) => {
        const { engine } = await renderDnd();
        const src = createElement();
        const host = createElement();
        const shadow = host.attachShadow({ mode: 'open' });
        const scroller = document.createElement('div');
        shadow.appendChild(scroller);
        const inner = document.createElement('div');
        inner.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
        if (nested) {
          const innerHost = document.createElement('div');
          scroller.appendChild(innerHost);
          innerHost.attachShadow({ mode: 'closed' }).appendChild(inner);
        } else {
          scroller.appendChild(inner);
        }
        const onDraggableEnter = vi.fn();
        engine.registerSource(src, { activation: { touch: { type: 'immediate' } } });
        engine.registerTarget(inner, { onDraggableEnter });

        const hit = { current: null as Element | null };
        mockElementFromPoint(() => hit.current);

        touchDown(src, 10, 10);
        await flushRaf();
        await flushRaf();
        expect(onDraggableEnter).not.toHaveBeenCalled();

        // Scrolling a container inside the shadow root slides the target under
        // the stationary pointer. `scroll` doesn't bubble and isn't composed, so
        // only the shadow root capture listener added at drag start sees it and
        // re-arms the resolution frame.
        hit.current = inner;
        dispatch(scroller, new Event('scroll'));
        await flushRaf();
        await flushRaf();

        expect(onDraggableEnter).toHaveBeenCalledTimes(1);

        touchUp(10, 10);
      },
    );

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
      const onDraggableEnter = vi.fn();
      engine.registerSource(src, { activation: { touch: { type: 'immediate' } } });

      const hit = { current: null as Element | null };
      mockElementFromPoint(() => hit.current);

      touchDown(src, 10, 10);
      await flushRaf();
      await flushRaf();

      engine.registerTarget(inner, { onDraggableEnter });
      await Promise.resolve();
      expect(onDraggableEnter).not.toHaveBeenCalled();

      hit.current = inner;
      dispatch(scroller, new Event('scroll'));
      await flushRaf();
      await flushRaf();

      expect(onDraggableEnter).toHaveBeenCalledOnce();

      touchUp(10, 10);
    });

    it('keeps watching a shadow root while any of its targets is still registered', async () => {
      // Watched roots are ref-counted per registration. One root holds many
      // targets, and only the last one leaving removes it. Releasing a sibling
      // must not stop the root from being watched.
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
      const onDraggableEnter = vi.fn();
      engine.registerSource(src, { activation: { touch: { type: 'immediate' } } });
      const releaseSibling = engine.registerTarget(sibling, {});
      engine.registerTarget(inner, { onDraggableEnter });

      // The sibling leaves before the drag starts, and `inner` is still in this root.
      releaseSibling();

      const hit = { current: null as Element | null };
      mockElementFromPoint(() => hit.current);

      touchDown(src, 10, 10);
      await flushRaf();
      await flushRaf();

      hit.current = inner;
      dispatch(scroller, new Event('scroll'));
      await flushRaf();
      await flushRaf();

      expect(onDraggableEnter).toHaveBeenCalledTimes(1);

      touchUp(10, 10);
    });

    it('re-resolves when the pointer actually moves', async () => {
      const { src, tgtB, onTargetChange, efp, state } = await setupStationaryDrag();

      touchDown(src, 10, 10);
      await flushRaf();
      await flushRaf();

      const efpCalls = efp.mock.calls.length;
      const changes = onTargetChange.mock.calls.length;

      // A real move opens the gate and re-resolves.
      state.hit = tgtB;
      touchMove(10, 40);
      await flushRaf();
      await flushRaf();

      expect(efp.mock.calls.length).toBeGreaterThan(efpCalls);
      expect(onTargetChange.mock.calls.length).toBe(changes + 1);

      touchUp(10, 40);
    });

    it('re-resolves on a move reporting the same coordinates as the previous one', async () => {
      const { src, tgtB, onTargetChange, efp, state } = await setupStationaryDrag();

      touchDown(src, 10, 10);
      await flushRaf();
      await flushRaf();

      const efpCalls = efp.mock.calls.length;
      const changes = onTargetChange.mock.calls.length;

      // The gate opens on pointer activity, not on a coordinate change. A browser
      // can report a move at the same coordinates as before (sub-pixel movement,
      // coalesced samples), and that is still a real move. It must re-resolve, or
      // a target that appeared under the pointer since the last frame would never
      // be entered.
      state.hit = tgtB;
      touchMove(10, 10);
      await flushRaf();
      await flushRaf();

      expect(efp.mock.calls.length).toBeGreaterThan(efpCalls);
      expect(onTargetChange.mock.calls.length).toBe(changes + 1);

      touchUp(10, 10);
    });
  });

  describe('modifiers', () => {
    /** Records the Shift state each application saw, and constrains nothing. */
    function makeShiftProbe(): { modifier: DraggableRootModifier; seen: boolean[] } {
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

    // A drag started with a modifier key already held starts constrained. The pickup
    // event's keys reach the first application at drag start, before any move.
    it('applies the modifiers with the pickup press keys already held', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const { modifier, seen } = makeShiftProbe();
      engine.registerSource(el, {
        activation: { touch: { type: 'immediate' } },
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
      engine.registerSource(el, {
        activation: { touch: { type: 'immediate' } },
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

    // A key-gated modifier has to engage while the pointer is still. Otherwise holding
    // the key does nothing until the user moves.
    it('re-applies when a modifier key changes with the pointer still', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const { modifier, seen } = makeShiftProbe();
      // Check both results of the key press: what the modifier received, and what the
      // frame reports. If the dispatch were skipped because the point didn't move, the
      // second would be stale while the first still looked right.
      const reported: Array<{ input: boolean; event: boolean; reason: string }> = [];
      engine.registerSource(el, {
        activation: { touch: { type: 'immediate' } },
        modifiers: modifier,
        onMove: (eventDetails) => {
          reported.push({
            input: eventDetails.location.current.input.shiftKey,
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
      // modifier change without another frame of delay.
      // The reported input and `eventDetails.event` both come from the key press, so
      // a consumer reading either sees Shift down.
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
      const onTargetChange = vi.fn();
      engine.registerSource(source, {
        activation: { touch: { type: 'immediate' } },
        modifiers: ({ point, shiftKey }) => (shiftKey ? { ...point, x: 100 } : point),
      });
      engine.registerTarget(targetA, {});
      engine.registerTarget(targetB, {});
      engine.registerMonitor({ onTargetChange });

      mockElementFromPoint((x) => (x === 100 ? targetB : targetA));

      touchDown(source, 10, 10);
      await flushRaf();
      onTargetChange.mockClear();

      pressKey('keydown', true);
      await flushRaf();

      expect(onTargetChange).toHaveBeenCalledOnce();
      const eventDetails = onTargetChange.mock.calls[0][0];
      expect(eventDetails.reason).toBe('modifier-key');
      expect(eventDetails.event).toBeInstanceOf(KeyboardEvent);

      touchUp(10, 10);
    });

    it('reports a frame driven only by a scroll as pointer movement', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onMove = vi.fn();
      engine.registerSource(el, { activation: { touch: { type: 'immediate' } }, onMove });

      touchDown(el, 50, 50);
      touchMove(60, 60);
      await flushRaf();
      const lastPointerMove = onMove.mock.lastCall?.[0].event;
      expect(lastPointerMove.type).toBe('pointermove');

      pressKey('keydown', true);
      await flushRaf();
      expect(onMove.mock.lastCall?.[0].reason).toBe('modifier-key');

      // Content scrolls under the still pointer, long after the key press. That
      // frame reports the pointer, not the old key event.
      dispatch(document, new Event('scroll'));
      await flushRaf();
      expect(onMove.mock.lastCall?.[0].reason).toBe('pointer');
      expect(onMove.mock.lastCall?.[0].event).toBe(lastPointerMove);

      // A key change and a scroll in the same frame report the key, whose event
      // carries the reported modifier flags.
      pressKey('keyup', false);
      dispatch(document, new Event('scroll'));
      await flushRaf();
      expect(onMove.mock.lastCall?.[0].reason).toBe('modifier-key');

      touchUp(60, 60);
    });

    it('reports page coordinates that follow a scroll under a still pointer', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onMove = vi.fn();
      engine.registerSource(el, { activation: { touch: { type: 'immediate' } }, onMove });

      touchDown(el, 50, 50);
      touchMove(60, 70);
      await flushRaf();

      const scrollX = window.scrollX + 30;
      const scrollY = window.scrollY + 100;
      for (const [property, value] of [
        ['scrollX', scrollX],
        ['scrollY', scrollY],
      ] as const) {
        const descriptor = Object.getOwnPropertyDescriptor(window, property);
        Object.defineProperty(window, property, { configurable: true, get: () => value });
        registerCleanup(() => {
          if (descriptor) {
            Object.defineProperty(window, property, descriptor);
          } else {
            Reflect.deleteProperty(window, property);
          }
        });
      }
      dispatch(document, new Event('scroll'));
      await flushRaf();

      const input = onMove.mock.lastCall?.[0].location.current.input;
      expect(input.pageX).toBe(60 + scrollX);
      expect(input.pageY).toBe(70 + scrollY);

      touchUp(60, 70);
    });

    it('does not re-apply for a key press that changes no modifier', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const { modifier, seen } = makeShiftProbe();
      engine.registerSource(el, {
        activation: { touch: { type: 'immediate' } },
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
      const onMoveStart = vi.fn();
      const onMove = vi.fn();
      engine.registerSource(el, {
        activation: { touch: { type: 'immediate' } },
        modifiers: restrictToVerticalAxis,
        onMoveStart,
      });
      engine.registerMonitor({ onMove });

      touchDown(el, 50, 50);
      await flushRaf();

      expect(onMoveStart).toHaveBeenCalledTimes(1);
      const startInput = onMoveStart.mock.calls[0][0].location.current.input;
      // Reference for the page-coordinate assertion below. The raw events share
      // one page/client offset, and `remapInput` must keep it by shifting `pageX`
      // as far as it shifted `clientX`.
      const pageDelta = startInput.pageX - startInput.clientX;

      touchMove(80, 90);
      await flushRaf();
      touchMove(120, 130);
      await flushRaf();
      // The sensor's frame resolves the move; `onMove` is dispatched from the
      // lifecycle's own frame after it.
      await flushRaf();

      expect(onMove).toHaveBeenCalled();
      for (const [details] of onMove.mock.calls) {
        const input = details.location.current.input;
        // The axis lock pins x at the activation x; y follows the pointer.
        expect(input.clientX).toBe(50);
        expect(input.pageX - input.clientX).toBe(pageDelta);
        expect(input.pageY - input.clientY).toBe(pageDelta);
      }
      const lastInput = onMove.mock.lastCall![0].location.current.input;
      expect(lastInput.clientY).toBe(130);

      touchUp(120, 130);
    });

    it('resolves the drop hit-test and the drop input at the constrained point', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const tgt = createElement();
      const onMoveEnd = vi.fn();
      const onDrop = vi.fn();
      engine.registerSource(el, {
        activation: { touch: { type: 'immediate' } },
        modifiers: restrictToVerticalAxis,
        onMoveEnd,
      });
      engine.registerTarget(tgt, { onDraggableDrop: onDrop });

      const efp = vi.fn(() => tgt);
      mockElementFromPoint(efp);

      touchDown(el, 50, 50);
      await flushRaf();
      // Release far to the right of the activation point. The drop must resolve
      // at the constrained x the drag reported, not the raw pointer x.
      touchUp(120, 80);

      expect(efp).toHaveBeenLastCalledWith(50, 80);
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      const dropInput = onMoveEnd.mock.calls[0][0].location.current.input;
      expect(dropInput.clientX).toBe(50);
      expect(dropInput.clientY).toBe(80);
    });

    it('contains a throwing modifier and commits the move unconstrained', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      const onMove = vi.fn();
      engine.registerSource(el, {
        activation: { touch: { type: 'immediate' } },
        modifiers: () => {
          throw new Error('modifier boom');
        },
      });
      engine.registerMonitor({ onMove });

      // The throw must be logged, not uncaught. An uncaught throw inside the
      // sensor's frame would leave the gesture stuck.
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        touchDown(el, 50, 50);
        await flushRaf();
        touchMove(80, 90);
        await flushRaf();
        // The sensor's frame resolves the move; `onMove` is dispatched from the
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
      expect(onMove).toHaveBeenCalled();
      const lastInput = onMove.mock.lastCall![0].location.current.input;
      expect(lastInput.clientX).toBe(80);
      expect(lastInput.clientY).toBe(90);
    });
  });

  it('does not suppress the context menu while a mouse button merely rests on a draggable', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    engine.registerSource(el, {});

    // Mouse activation is distance-based, so this stays pending while the button
    // is held. It must not swallow right-clicks across the document.
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

    // Once the drag runs, the suppression applies.
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

      engine.registerSource(source, {
        activation: { touch: { type: 'immediate' } },
        onMoveEnd(details) {
          if (details.reason !== 'drop') {
            return;
          }
          button.click();
        },
      });
      engine.registerTarget(target, {});
      mockElementFromPoint(() => target);

      touchDown(source, 50, 50);
      await flushRaf();
      touchUp(50, 50);

      expect(onButtonClick).toHaveBeenCalledOnce();
      expect(onOutsideClick).toHaveBeenCalledOnce();

      act(() => {
        source.dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }),
        );
      });
      expect(onOutsideClick).toHaveBeenCalledOnce();
    });

    it('swallows the compatibility click that follows a drag', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerSource(el, { activation: { touch: { type: 'immediate' } } });

      // An outside-press handler in the document capture phase, which the
      // retargeted click would otherwise reach.
      const outsidePress = vi.fn();
      document.addEventListener('click', outsidePress, { capture: true });
      registerCleanup(() => document.removeEventListener('click', outsidePress, true));

      touchDown(el, 50, 50);
      await flushRaf();
      touchUp(50, 50);

      act(() => {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
      });
      expect(outsidePress).not.toHaveBeenCalled();

      // The suppression runs once. The next click is a real one and must get through.
      act(() => {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
      });
      expect(outsidePress).toHaveBeenCalledTimes(1);
    });

    it('disarms itself after the click window when no click and no further gesture arrive', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerSource(el, { activation: { touch: { type: 'immediate' } } });

      const onClick = vi.fn();
      document.addEventListener('click', onClick, { capture: true });
      registerCleanup(() => document.removeEventListener('click', onClick, true));

      touchDown(el, 50, 50);
      await flushRaf();

      // Installed after the drag started. The suppression is armed in the
      // sensor's teardown, through the owner window's `setTimeout`.
      vi.useFakeTimers();
      try {
        touchUp(50, 50);

        vi.advanceTimersByTime(400);

        act(() => {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
        });
        expect(onClick).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it('keeps the click suppressed when Escape cancels a drag whose button is still held', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerSource(el, {});

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

      // Installed after the drag started. The suppression is armed in the
      // sensor's teardown, through the owner window's `setTimeout`.
      vi.useFakeTimers();
      try {
        // Escape cancels while the button is still down, so the sensor's own
        // listeners are gone and it never sees the release. The window must not
        // expire before the user lets go, or the drag turns into a click on the
        // control it was picked up from.
        dispatch(
          document,
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        );

        // Longer than the post-release window. The user has just pressed a key
        // mid-gesture, so holding this long is normal.
        vi.advanceTimersByTime(400);

        dispatch(
          document,
          new PointerEvent('pointerup', { pointerId: 1, clientX: 0, clientY: 40, bubbles: true }),
        );
        act(() => {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
        });

        expect(onClick).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('stops swallowing clicks once a never-released pointer outlives the held window', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerSource(el, { activation: { touch: { type: 'immediate' } } });

      const onClick = vi.fn();
      document.addEventListener('click', onClick, { capture: true });
      registerCleanup(() => document.removeEventListener('click', onClick, true));

      touchDown(el, 50, 50);
      await flushRaf();
      expect(dragSessionStore.getSnapshot()).not.toBe(null);

      // Installed after the drag started. The suppression's backstop timer is
      // scheduled at teardown, through the owner window's `setTimeout`.
      vi.useFakeTimers();
      try {
        // Torn down while the finger is still on the glass, so the suppression is
        // armed in held-pointer mode and waits for a release the page never sees
        // (an OS hand-off, a window torn down mid-gesture).
        dispatch(
          document,
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        );
        expect(dragSessionStore.getSnapshot()).toBe(null);

        vi.advanceTimersByTime(5000);

        // A click with no `pointerId` would be swallowed while the window is
        // armed, and nothing disarmed it. Only the backstop can let it through.
        const lateClick = new MouseEvent('click', {
          detail: 1,
          bubbles: true,
          cancelable: true,
        });
        act(() => {
          el.dispatchEvent(lateClick);
        });
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(lateClick.defaultPrevented).toBe(false);
      } finally {
        vi.useRealTimers();
        touchUp(50, 50);
      }
    });

    it('keeps the held-pointer suppression through a second finger tapping', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerSource(el, { activation: { touch: { type: 'immediate' } } });

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

      // A second finger taps elsewhere. It isn't a new gesture. The held finger
      // is the primary pointer, and its release can still produce the
      // compatibility click, so the tap must not disarm the window.
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
        detail: 1,
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
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
      });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not swallow a click from the next gesture when no compatibility click arrives', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerSource(el, { activation: { touch: { type: 'immediate' } } });

      const onClick = vi.fn();
      document.addEventListener('click', onClick, { capture: true });
      registerCleanup(() => document.removeEventListener('click', onClick, true));

      touchDown(el, 50, 50);
      await flushRaf();
      touchUp(50, 50);

      // No compatibility click follows. Browsers only fire one when the press and
      // release share a target, so a drag released over a different element, the
      // usual case on a canvas, produces none. The suppression must not stay armed
      // waiting for it.
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
        button.dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }),
        );
      });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not swallow a click after a press that never became a drag', async () => {
      const { engine } = await renderDnd();
      const el = createElement();
      engine.registerSource(el, {});

      const onClick = vi.fn();
      document.addEventListener('click', onClick, { capture: true });
      registerCleanup(() => document.removeEventListener('click', onClick, true));

      // Press and release with no movement is a plain click, which the docs say
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
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
      });

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  // The recipe from the testing guide, run as a consumer would copy it. `buttons`
  // is easy to leave off, and it fails in two different ways depending on which
  // event lacks it.
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
      engine.registerSource(source, {});

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

      // Several samples between two paints, as a high-rate pointer sends them.
      // At most the first one requests a frame (none if one is pending), and none
      // cancels a pending frame to request it again.
      pointerMove(60, 1);
      pointerMove(80, 1);
      pointerMove(100, 1);
      expect(cancelFrame).not.toHaveBeenCalled();
      expect(request.mock.calls.length).toBeLessThanOrEqual(1);

      pointerUp(100);
    });

    it('does not schedule another sensor frame after processing a move', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      engine.registerSource(source, {});

      pointerDown(source);
      pointerMove(40, 1);
      await flushRaf();
      await flushRaf();

      const request = vi.spyOn(WindowAnimationFrame.prototype, 'request');
      registerCleanup(() => request.mockRestore());
      pointerMove(60, 1);
      expect(request).toHaveBeenCalledTimes(1);
      await flushRaf();
      expect(request).toHaveBeenCalledTimes(1);

      pointerUp(60);
    });

    it('drops when every move carries buttons: 1', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onMoveEnd = vi.fn();
      engine.registerSource(source, { onMoveEnd });

      pointerDown(source);
      pointerMove(40, 1);
      pointerMove(120, 1);
      pointerUp(120);

      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      // jsdom cannot hit-test, so the drop resolves to no target rather than throwing.
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('outside-release');
    });

    it('never starts a drag when the move that would commit it omits buttons', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onMoveStart = vi.fn();
      const onMoveEnd = vi.fn();
      engine.registerSource(source, { onMoveStart, onMoveEnd });

      pointerDown(source);
      pointerMove(40, 0);
      pointerMove(120, 0);

      // The pending gesture is abandoned before it commits, so nothing fires, not
      // even a cancel.
      expect(onMoveStart).not.toHaveBeenCalled();
      expect(onMoveEnd).not.toHaveBeenCalled();
    });

    it('cancels with missed-release when buttons drops to 0 and no pointerup follows', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onMoveEnd = vi.fn();
      engine.registerSource(source, { onMoveEnd });

      pointerDown(source);
      pointerMove(40, 1);
      pointerMove(80, 0);
      await flushRaf();

      expect(onMoveEnd.mock.calls.map((call) => call[0].reason)).toEqual(['missed-release']);
    });

    it('drops when a buttons: 0 move immediately precedes pointerup', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onMoveEnd = vi.fn();
      engine.registerSource(source, { onMoveEnd });

      pointerDown(source);
      pointerMove(40, 1);
      pointerMove(80, 0);

      // A terminal pointerup queued in the same frame wins over the
      // missed-release fallback scheduled by the preceding move.
      pointerUp(80);
      await flushRaf();

      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('outside-release');
    });

    it('keeps dragging when a held-button move follows a transient buttons: 0 move', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onMoveEnd = vi.fn();
      engine.registerSource(source, { onMoveEnd });

      pointerDown(source);
      pointerMove(40, 1);
      pointerMove(80, 0);
      pointerMove(100, 1);
      await flushRaf();

      expect(onMoveEnd).not.toHaveBeenCalled();

      pointerUp(100);

      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('outside-release');
    });
  });
});
