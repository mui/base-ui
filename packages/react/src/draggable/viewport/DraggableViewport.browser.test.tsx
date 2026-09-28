import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { describe, it, expect, vi } from 'vitest';
import { act, waitFor } from '@mui/internal-test-utils';
import { createDndRenderer, firePointer, isJSDOM } from '#test-utils';
import { registerCleanup, setupDragEngineTests, flushRaf } from '../../../test/dnd';

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

  it.each([
    ['column-reverse', 'ltr', 'horizontal-tb'],
    ['column-reverse', 'rtl', 'horizontal-tb'],
    ['row-reverse', 'ltr', 'horizontal-tb'],
    ['row-reverse', 'rtl', 'horizontal-tb'],
    ['column-reverse', 'ltr', 'vertical-rl'],
    ['column-reverse', 'rtl', 'vertical-lr'],
    ['row-reverse', 'ltr', 'vertical-rl'],
    ['row-reverse', 'rtl', 'vertical-lr'],
  ])(
    'scrolls both ways in a %s container with %s direction and %s writing mode',
    async (flexDirection, direction, writingMode) => {
      const { engine } = await renderDnd();
      const source = element('position:fixed;left:300px;top:0;width:100px;height:50px');
      const viewport = element(
        `position:fixed;left:0;top:0;width:200px;height:200px;overflow:auto;display:flex;flex-direction:${flexDirection};direction:${direction};writing-mode:${writingMode}`,
      );
      element('height:1000px;width:1000px;flex-shrink:0', viewport);
      engine.registerSource(source, { activation: { type: 'immediate' } });
      engine.registerViewport(viewport, {});
      start(source);
      const verticalWriting = writingMode !== 'horizontal-tb';
      const vertical = (flexDirection === 'column-reverse') !== verticalWriting;
      const offset = () => (vertical ? viewport.scrollTop : viewport.scrollLeft);
      function move(coordinate: number) {
        act(() =>
          firePointer.move(document.body, {
            timeStamp: 200,
            pointerId: 1,
            pointerType: 'mouse',
            buttons: 1,
            clientX: vertical ? 100 : coordinate,
            clientY: vertical ? coordinate : 100,
          }),
        );
      }
      let negativeOrigin: boolean;
      if (verticalWriting) {
        negativeOrigin = vertical ? direction === 'ltr' : writingMode === 'vertical-lr';
      } else {
        negativeOrigin = vertical || direction === 'ltr';
      }
      move(negativeOrigin ? 10 : 190);
      await waitFor(() => expect(Math.abs(offset())).toBeGreaterThan(0));
      const scrolledTo = Math.abs(offset());
      move(negativeOrigin ? 190 : 10);
      await waitFor(() => expect(Math.abs(offset())).toBeLessThan(scrolledTo));
      act(() => engine.cancelDrag());
    },
  );

  it('refreshes horizontal flow when the dir attribute changes during a drag', async () => {
    const { engine } = await renderDnd();
    const source = element('position:fixed;left:300px;top:0;width:100px;height:50px');
    const viewport = element('position:fixed;left:0;top:0;width:200px;height:200px;overflow:auto');
    element('width:1000px;height:100px', viewport);
    engine.registerSource(source, { activation: { type: 'immediate' } });
    engine.registerViewport(viewport, {});
    start(source);
    act(() =>
      firePointer.move(document.body, {
        timeStamp: 200,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
        clientX: 10,
        clientY: 100,
      }),
    );
    await flushRaf();
    await flushRaf();
    expect(viewport.scrollLeft).toBe(0);
    act(() => {
      viewport.dir = 'rtl';
    });
    await waitFor(() => expect(viewport.scrollLeft).toBeLessThan(0));
    act(() => engine.cancelDrag());
  });

  it('scrolls outside a component viewport, stops beyond the margin, and cancels cleanly', async () => {
    const onDragScroll = vi.fn();
    const { engine } = await renderDnd(
      <Draggable.Viewport
        data-testid="overflow-viewport"
        overflowMargin={{ bottom: 80 }}
        onDragScroll={onDragScroll}
        style={{ position: 'fixed', left: 0, top: 0, width: 200, height: 200, overflow: 'auto' }}
      >
        <div style={{ height: 1000 }} />
      </Draggable.Viewport>,
    );
    const viewport = document.querySelector<HTMLElement>('[data-testid="overflow-viewport"]')!;
    const source = element('position:fixed;left:300px;top:0;width:100px;height:50px');
    engine.registerSource(source, { activation: { type: 'immediate' } });
    start(source);
    function move(y: number) {
      act(() =>
        firePointer.move(document.body, {
          timeStamp: 200,
          pointerId: 1,
          pointerType: 'mouse',
          buttons: 1,
          clientX: 100,
          clientY: y,
        }),
      );
    }
    move(100);
    await flushRaf();
    await flushRaf();
    await flushRaf();
    move(250);
    await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    expect(
      onDragScroll.mock.calls.some(([eventDetails]) => eventDetails.input.clientY === 250),
    ).toBe(true);
    move(281);
    await flushRaf();
    await flushRaf();
    await flushRaf();
    const stoppedAt = viewport.scrollTop;
    await flushRaf();
    await flushRaf();
    expect(viewport.scrollTop).toBe(stoppedAt);
    move(250);
    await flushRaf();
    await flushRaf();
    await flushRaf();
    expect(viewport.scrollTop).toBe(stoppedAt);
    move(100);
    await flushRaf();
    await flushRaf();
    await flushRaf();
    move(250);
    await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(stoppedAt));
    act(() => engine.cancelDrag());
    const canceledAt = viewport.scrollTop;
    await flushRaf();
    await flushRaf();
    expect(viewport.scrollTop).toBe(canceledAt);
  });

  it.each(['class', 'data-scroll-locked'])(
    'stops and resumes margin scrolling when an ancestor %s attribute changes',
    async (attribute) => {
      const style = document.createElement('style');
      style.textContent =
        '.scroll-locked > *, [data-scroll-locked] > * { overflow: hidden !important; }';
      document.head.appendChild(style);
      registerCleanup(() => style.remove());
      // Once hidden, the viewport no longer scrolls, which the engine reports.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      registerCleanup(() => warnSpy.mockRestore());
      const { engine } = await renderDnd();
      const source = element('position:fixed;left:300px;top:0;width:100px;height:50px');
      const ancestor = element('');
      const viewport = element(
        'position:fixed;left:0;top:0;width:200px;height:200px;overflow:auto',
        ancestor,
      );
      element('height:1000px', viewport);
      engine.registerSource(source, { activation: { type: 'immediate' } });
      engine.registerViewport(viewport, { overflowMargin: { bottom: 80 } });
      start(source);
      await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
      // Below the viewport, so the pointer is over neither it nor its ancestor.
      act(() =>
        firePointer.move(document.body, {
          timeStamp: 200,
          pointerId: 1,
          pointerType: 'mouse',
          buttons: 1,
          clientX: 100,
          clientY: 250,
        }),
      );
      const enteredMarginAt = viewport.scrollTop;
      await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(enteredMarginAt));

      act(() => {
        ancestor.setAttribute(attribute, 'scroll-locked');
      });
      await flushRaf();
      const lockedAt = viewport.scrollTop;
      await flushRaf();
      await flushRaf();
      await flushRaf();
      expect(viewport.scrollTop).toBe(lockedAt);
      act(() => ancestor.removeAttribute(attribute));
      await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(lockedAt));
      act(() => engine.cancelDrag());
    },
  );

  it.each([
    ['a wrapper', (from: HTMLElement): ParentNode => from],
    ['a shadow root', (from: HTMLElement): ParentNode => from.attachShadow({ mode: 'open' })],
  ])(
    'stops scrolling when a new ancestor hides the overflow of a viewport moved out of %s',
    async (_, getContainer) => {
      const style = document.createElement('style');
      style.textContent = '.scroll-locked > * { overflow: hidden !important; }';
      document.head.appendChild(style);
      registerCleanup(() => style.remove());
      // Once hidden, the viewport no longer scrolls, which the engine reports.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      registerCleanup(() => warnSpy.mockRestore());
      const { engine } = await renderDnd();
      const source = element('position:fixed;left:300px;top:0;width:100px;height:50px');
      const from = element('');
      const to = element('');
      const viewport = document.createElement('div');
      viewport.style.cssText = 'position:fixed;left:0;top:0;width:200px;height:200px;overflow:auto';
      getContainer(from).appendChild(viewport);
      registerCleanup(() => viewport.remove());
      element('height:1000px', viewport);
      engine.registerSource(source, { activation: { type: 'immediate' } });
      engine.registerViewport(viewport, {});
      start(source);
      await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));

      // Moving the viewport resets its scroll position.
      act(() => {
        to.appendChild(viewport);
      });
      await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));

      act(() => {
        to.className = 'scroll-locked';
      });
      await flushRaf();
      const lockedAt = viewport.scrollTop;
      await flushRaf();
      await flushRaf();
      await flushRaf();
      expect(viewport.scrollTop).toBe(lockedAt);
      act(() => engine.cancelDrag());
    },
  );

  it('scrolls an outer viewport containing the pointer before an inner overflow margin', async () => {
    const { engine } = await renderDnd();
    const source = element('position:fixed;left:300px;top:0;width:100px;height:50px');
    const outer = element('position:fixed;left:0;top:0;width:200px;height:200px;overflow:auto');
    const inner = element('width:200px;height:100px;overflow:auto', outer);
    element('height:1000px', inner);
    element('height:1000px', outer);
    engine.registerSource(source, { activation: { type: 'immediate' } });
    engine.registerViewport(inner, { overflowMargin: { bottom: 120 } });
    engine.registerViewport(outer, {});
    start(source);
    await waitFor(() => expect(outer.scrollTop).toBeGreaterThan(0));
    expect(inner.scrollTop).toBe(0);
    act(() => engine.cancelDrag());
  });

  it('hits and drops onto content scrolled under a stationary pointer', async () => {
    const { engine } = await renderDnd();
    const source = element('position:fixed;left:300px;top:0;width:100px;height:50px');
    const viewport = element('position:fixed;left:0;top:0;width:200px;height:200px;overflow:auto');
    const content = element('height:600px;position:relative', viewport);
    const target = element('position:absolute;top:250px;width:200px;height:100px', content);
    const enter = vi.fn();
    const drop = vi.fn();
    engine.registerSource(source, { activation: { type: 'immediate' } });
    engine.registerViewport(viewport, {});
    engine.registerTarget(target, { onDraggableEnter: enter, onDraggableDrop: drop });
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
    engine.registerSource(source, { activation: { type: 'immediate' } });
    engine.registerViewport(inner, {});
    engine.registerViewport(outer, {});
    start(source);
    await waitFor(() => expect(outer.scrollTop).toBeGreaterThan(0));
    expect(inner.scrollTop).toBe(inner.scrollHeight - inner.clientHeight);
    engine.cancelDrag();
  });
});
