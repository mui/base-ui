import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { isJSDOM } from '#test-utils';
import { flushRaf, registerCleanup, setupDragEngineTests } from '../../../test/dnd';
import { setupPlugin as setupPluginBase } from '../../../test/dndCollection';
import { dragSessionStore } from './dragSessionStore';

setupDragEngineTests();

function setupPlugin(...args: Parameters<typeof setupPluginBase>) {
  const result = setupPluginBase(...args);
  registerCleanup(result.cleanup);
  return result;
}

function fixedElement(css: string): HTMLDivElement {
  const element = document.createElement('div');
  element.style.cssText = `position: fixed; ${css}`;
  return element;
}

function pointer(
  target: EventTarget,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  clientX: number,
  clientY: number,
): void {
  act(() => {
    target.dispatchEvent(
      new PointerEvent(type, {
        pointerType: 'mouse',
        pointerId: 1,
        clientX,
        clientY,
        button: 0,
        buttons: type === 'pointerup' ? 0 : 1,
        bubbles: true,
        cancelable: true,
        composed: true,
      }),
    );
  });
}

async function movePointer(clientX: number, clientY: number): Promise<void> {
  pointer(document, 'pointermove', clientX, clientY);
  await flushRaf();
  await flushRaf();
  await flushRaf();
}

describe.skipIf(isJSDOM)('useDraggableCollection browser geometry', () => {
  it('routes through the innermost nested collection with a real preview and RTL geometry', async () => {
    const outerRoot = fixedElement('left: 20px; top: 20px; width: 340px; height: 260px;');
    const source = fixedElement('left: 40px; top: 50px; width: 100px; height: 50px;');
    const innerRoot = fixedElement('left: 170px; top: 110px; width: 170px; height: 120px;');
    const target = fixedElement('left: 200px; top: 140px; width: 110px; height: 50px;');
    target.style.direction = 'rtl';
    innerRoot.appendChild(target);
    outerRoot.append(source, innerRoot);
    document.body.appendChild(outerRoot);
    registerCleanup(() => outerRoot.remove());

    const outerRootDrop = vi.fn();
    const previewRender = vi.fn(() => <span>Card preview</span>);
    const outer = setupPlugin(
      { onRootDrop: outerRootDrop, dragPreview: { render: previewRender } },
      { knownItemIds: ['a'] },
    );
    const onInsert = vi.fn();
    const inner = setupPlugin({ onInsert, orientation: 'horizontal' }, { knownItemIds: ['b'] });
    outer.plugin.setupRoot(outerRoot);
    outer.plugin.setupItem('a', source);
    inner.plugin.setupRoot(innerRoot);
    inner.plugin.setupItem('b', target);
    expect(document.elementFromPoint(295, 165)).toBe(target);

    pointer(source, 'pointerdown', 70, 70);
    // The right side is "before" in RTL. This uses the browser's real
    // elementFromPoint result; the generated preview sits above it but is inert.
    await movePointer(295, 165);
    expect(inner.lastState()).toEqual(
      expect.objectContaining({ dropTargetItemId: 'b', dropPosition: 'before' }),
    );
    pointer(document, 'pointerup', 295, 165);

    expect(previewRender).toHaveBeenCalled();
    expect(onInsert).toHaveBeenCalledWith(
      expect.objectContaining({ target: { itemId: 'b', position: 'before' } }),
    );
    expect(outerRootDrop).not.toHaveBeenCalled();
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });

  it('does not fall through to the collection root inside the source footprint', async () => {
    const root = fixedElement('left: 20px; top: 20px; width: 260px; height: 180px;');
    const source = fixedElement('left: 50px; top: 60px; width: 120px; height: 60px;');
    root.appendChild(source);
    document.body.appendChild(root);
    registerCleanup(() => root.remove());
    const onRootDrop = vi.fn();
    const collection = setupPlugin({ onRootDrop }, { knownItemIds: ['a'] });
    collection.plugin.setupRoot(root);
    collection.plugin.setupItem('a', source);

    pointer(source, 'pointerdown', 70, 80);
    await movePointer(82, 80);
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(source);
    pointer(document, 'pointerup', 82, 80);

    expect(onRootDrop).not.toHaveBeenCalled();
    expect(dragSessionStore.getSnapshot()).toBeNull();
  });
});
