import { describe, it, expect, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer } from '#test-utils';
import { flushRaf, registerCleanup, setupDragEngineTests } from '../../../test/dnd';
import { dragSessionStore } from './dragSessionStore';

setupDragEngineTests();

/**
 * Mount an iframe and return its document/window. The sensors bind their
 * listeners per owner document, so registering a draggable inside the iframe
 * must install (and later remove) listeners there, not on the top window.
 */
function createIframeRealm(): { doc: Document; win: Window } {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  registerCleanup(() => iframe.remove());
  const doc = iframe.contentDocument!;
  const win = iframe.contentWindow!;
  // jsdom documents don't implement elementFromPoint; the sensors call it on the
  // owner document during pickup (mirrors the stub the polyfill installs on the
  // top document).
  doc.elementFromPoint = () => null;
  return { doc, win };
}

function createIframeElement(doc: Document): HTMLElement {
  const el = doc.createElement('div');
  el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
  doc.body.appendChild(el);
  return el;
}

/** Dispatch a mouse pointer event inside `act` so store-driven re-renders flush. */
function dispatchPointer(
  target: EventTarget,
  type: string,
  x: number,
  y: number,
  buttons: { button: number; buttons: number },
): void {
  act(() => {
    target.dispatchEvent(
      new PointerEvent(type, {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: x,
        clientY: y,
        button: buttons.button,
        buttons: buttons.buttons,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
}

function callsOfType(spy: { mock: { calls: unknown[][] } }, type: 'pointerdown'): number {
  return spy.mock.calls.filter(([eventType]) => eventType === type).length;
}

describe('documentBinding', () => {
  const { renderDnd } = createDndRenderer();

  it('pointer pickup works for a draggable registered in an iframe document', async () => {
    const { engine } = await renderDnd();
    const { doc } = createIframeRealm();
    const el = createIframeElement(doc);
    const onDragStart = vi.fn();
    engine.registerDraggable(el, { onDragStart });

    // Press, then move past the 5px mouse activation distance.
    dispatchPointer(el, 'pointerdown', 0, 0, { button: 0, buttons: 1 });
    dispatchPointer(el, 'pointermove', 6, 0, { button: -1, buttons: 1 });
    await flushRaf();

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart.mock.calls[0][0].source.element).toBe(el);

    dispatchPointer(el, 'pointerup', 6, 0, { button: 0, buttons: 0 });
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });

  it('ref-counts the per-document listeners and removes them with the last holder', async () => {
    const { engine } = await renderDnd();
    const { doc, win } = createIframeRealm();
    const addSpy = vi.spyOn(win, 'addEventListener');
    const removeSpy = vi.spyOn(win, 'removeEventListener');
    const first = createIframeElement(doc);
    const second = createIframeElement(doc);

    const cleanupFirst = engine.registerDraggable(first, {});
    // Documents keep a capture path for light DOM plus a bubble fallback for
    // events deliberately deferred to an inner closed-shadow binding.
    expect(callsOfType(addSpy, 'pointerdown')).toBe(2);

    // A second draggable in the same document reuses the installed listeners.
    const cleanupSecond = engine.registerDraggable(second, {});
    expect(callsOfType(addSpy, 'pointerdown')).toBe(2);

    // Releasing a non-last holder keeps the listeners installed.
    cleanupFirst();
    expect(callsOfType(removeSpy, 'pointerdown')).toBe(0);

    // The last holder tears them down.
    cleanupSecond();
    expect(callsOfType(removeSpy, 'pointerdown')).toBe(2);
  });

  it('walks the composed path only once a shadow root is bound', async () => {
    const { engine } = await renderDnd();
    const { doc, win } = createIframeRealm();
    const addSpy = vi.spyOn(win, 'addEventListener');
    const el = createIframeElement(doc);
    engine.registerDraggable(el, {});
    const pointerListeners = addSpy.mock.calls
      .filter(([type]) => type === 'pointerdown')
      .map(([, listener]) => listener as EventListener);
    expect(pointerListeners).toHaveLength(2);

    // The window wrappers see every press on the page; with nothing bound in a
    // shadow tree there is no path to check, so none is materialized.
    const event = new Event('pointerdown');
    const composedPath = vi.spyOn(event, 'composedPath');
    pointerListeners.forEach((listener) => listener(event));
    expect(composedPath).not.toHaveBeenCalled();

    const host = createIframeElement(doc);
    const shadow = host.attachShadow({ mode: 'closed' });
    const inner = doc.createElement('div');
    shadow.appendChild(inner);
    engine.registerDraggable(inner, {});

    composedPath.mockReturnValue([host]);
    pointerListeners.forEach((listener) => listener(event));
    expect(composedPath).toHaveBeenCalledTimes(2);
  });
});
