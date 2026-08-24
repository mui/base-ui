import { describe, it, expect, vi } from 'vitest';
import { installDndPolyfill } from '../../../test/dndPolyfill';
import { applySourceSizeVars, resolveDragPreviewOffset } from './customDragPreview';

installDndPolyfill();

describe('resolveDragPreviewOffset', () => {
  const params = {
    container: document.createElement('div'),
    sourceRect: new DOMRect(40, 80, 120, 60),
    input: {
      button: 0,
      buttons: 1,
      clientX: 55,
      clientY: 95,
      pageX: 55,
      pageY: 95,
      pointerType: 'mouse',
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    } as const,
  };

  it('passes a fixed DragPosition through unchanged', () => {
    expect(resolveDragPreviewOffset({ x: 7, y: 11 }, params)).toEqual({ x: 7, y: 11 });
  });

  it("resolves the 'source' preset to keep the pointer at its grab point", () => {
    // input − sourceRect top-left: { 55 − 40, 95 − 80 }.
    expect(resolveDragPreviewOffset('source', params)).toEqual({ x: 15, y: 15 });
  });

  it("resolves the 'pointer' preset to put the preview's top-left under the pointer", () => {
    expect(resolveDragPreviewOffset('pointer', params)).toEqual({ x: 0, y: 0 });
  });

  it('invokes a callback with the params and returns its result', () => {
    const callback = vi.fn(() => ({ x: 3, y: 4 }));
    expect(resolveDragPreviewOffset(callback, params)).toEqual({ x: 3, y: 4 });
    expect(callback).toHaveBeenCalledWith(params);
  });

  it("defaults to 'source' when the offset is undefined", () => {
    // A cloned preview has to lift off the
    // element without shifting under the pointer.
    expect(resolveDragPreviewOffset(undefined, params)).toEqual({ x: 15, y: 15 });
  });
});

describe('applySourceSizeVars', () => {
  it('sets --drag-source-width/height from the source rect', () => {
    const container = document.createElement('div');
    applySourceSizeVars(container, new DOMRect(40, 80, 120, 60));

    expect(container.style.getPropertyValue('--drag-source-width')).toBe('120px');
    expect(container.style.getPropertyValue('--drag-source-height')).toBe('60px');
  });
});
