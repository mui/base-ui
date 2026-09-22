import { describe, it, expect, vi } from 'vitest';
import { act, waitFor } from '@mui/internal-test-utils';
import { createDndRenderer, firePointer, isJSDOM } from '#test-utils';
import { registerCleanup, setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();

describe.skipIf(isJSDOM)('Draggable viewport scrolling in the browser', () => {
  const { renderDnd } = createDndRenderer();

  function element(style: string, parent = document.body): HTMLDivElement {
    const node = document.createElement('div');
    node.style.cssText = style;
    parent.appendChild(node);
    registerCleanup(() => node.remove());
    return node;
  }

  function start(source: HTMLElement) {
    act(() => {
      firePointer.down(source, {
        timeStamp: 100,
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
        buttons: 1,
        clientX: 310,
        clientY: 20,
      });
      firePointer.move(document.body, {
        timeStamp: 120,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
        clientX: 100,
        clientY: 190,
      });
    });
  }

  it('hits and drops onto content scrolled under a stationary pointer', async () => {
    const { engine } = await renderDnd();
    const source = element('position:fixed;left:300px;top:0;width:100px;height:50px');
    const viewport = element('position:fixed;left:0;top:0;width:200px;height:200px;overflow:auto');
    const content = element('height:600px;position:relative', viewport);
    const target = element('position:absolute;top:250px;width:200px;height:100px', content);
    const enter = vi.fn();
    const drop = vi.fn();
    engine.registerDraggable(source, { activation: { type: 'immediate' } });
    engine.registerAutoScroller(viewport, {});
    engine.registerDropTarget(target, { onDraggableEnter: enter, onDraggableDrop: drop });
    start(source);
    await waitFor(() => expect(enter).toHaveBeenCalledTimes(1));
    expect(viewport.scrollTop).toBeGreaterThan(0);
    act(() =>
      firePointer.up(document.body, {
        timeStamp: 1000,
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
        buttons: 0,
        clientX: 100,
        clientY: 190,
      }),
    );
    expect(drop).toHaveBeenCalledTimes(1);
    expect(drop.mock.calls[0][0].target.element).toBe(target);
  });

  it('hands scrolling to the outer viewport at the inner limit', async () => {
    const { engine } = await renderDnd();
    const source = element('position:fixed;left:300px;top:0;width:100px;height:50px');
    const outer = element('position:fixed;left:0;top:0;width:200px;height:200px;overflow:auto');
    const inner = element('width:200px;height:200px;overflow:auto', outer);
    element('height:220px', inner);
    element('height:400px', outer);
    engine.registerDraggable(source, { activation: { type: 'immediate' } });
    engine.registerAutoScroller(inner, {});
    engine.registerAutoScroller(outer, {});
    start(source);
    await waitFor(() => expect(outer.scrollTop).toBeGreaterThan(0));
    expect(inner.scrollTop).toBe(inner.scrollHeight - inner.clientHeight);
    engine.cancelDrag();
  });
});
