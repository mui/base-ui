import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isJSDOM } from '#test-utils';
import { flushRaf } from '../../../../test/dnd';
import { createClonedDragPreviewElement } from './cloneDragPreview';
import { createSyntheticPreview } from './syntheticPreview';

describe.skipIf(isJSDOM)('syntheticPreview drop transition', () => {
  const animationsFlag = globalThis as { BASE_UI_ANIMATIONS_DISABLED?: boolean | undefined };

  beforeEach(() => {
    animationsFlag.BASE_UI_ANIMATIONS_DISABLED = false;
  });

  afterEach(() => {
    animationsFlag.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  it.each([
    { scale: '1.2', rotate: 'none', zoom: '1' },
    { scale: 'none', rotate: '30deg', zoom: '1' },
    { scale: '1.2', rotate: 'none', zoom: '0.5' },
  ])('settles on the transformed source: %j', async ({ scale, rotate, zoom }) => {
    const style = document.createElement('style');
    style.textContent =
      '.settling-transform[data-drag-preview][data-ending-style] { transition: translate 100s linear; }';
    document.head.appendChild(style);
    const parent = document.createElement('div');
    parent.style.zoom = zoom;
    const source = document.createElement('div');
    source.className = 'settling-transform';
    Object.assign(source.style, {
      position: 'fixed',
      left: '100px',
      top: '100px',
      width: '120px',
      height: '30px',
      scale,
      rotate,
      transformOrigin: '20px 10px',
    });
    parent.appendChild(source);
    document.body.appendChild(parent);
    const clone = createClonedDragPreviewElement(source, null)!;
    const preview = createSyntheticPreview(source);
    try {
      preview.setPreviewElement(clone);
      preview.update(300, 300);
      preview.markSourceDragging();
      clone.element.getBoundingClientRect();
      preview.prepareForDrop();
      preview.destroy();
      await flushRaf();
      const animations = clone.element.getAnimations();
      expect(animations.length).toBeGreaterThan(0);
      for (const animation of animations) {
        animation.pause();
        animation.currentTime = 99999;
      }
      const actual = clone.element.getBoundingClientRect();
      const expected = source.getBoundingClientRect();
      expect(actual.left).toBeCloseTo(expected.left, 1);
      expect(actual.top).toBeCloseTo(expected.top, 1);
      for (const animation of animations) {
        animation.finish();
      }
      await Promise.allSettled(animations.map((animation) => animation.finished));
    } finally {
      clone.destroy();
      parent.remove();
      style.remove();
    }
  });

  it('keeps a clone mounted until its real CSS transition finishes', async () => {
    const style = document.createElement('style');
    style.textContent = `
      .settling-preview[data-drag-preview][data-ending-style] {
        transition: translate 100ms linear;
      }
    `;
    document.head.appendChild(style);

    const source = document.createElement('div');
    source.className = 'settling-preview';
    Object.assign(source.style, {
      position: 'fixed',
      left: '10px',
      top: '20px',
      width: '100px',
      height: '40px',
    });
    document.body.appendChild(source);

    try {
      const clone = createClonedDragPreviewElement(source, null);
      expect(clone).not.toBeNull();

      const preview = createSyntheticPreview(source);
      preview.setPreviewElement(clone);
      preview.update(10, 20);
      preview.markSourceDragging();

      source.style.left = '210px';
      preview.prepareForDrop();
      preview.destroy();

      expect(clone!.element).toHaveAttribute('data-ending-style');
      expect(clone!.element.isConnected).toBe(true);

      await flushRaf();
      expect(clone!.element.style.translate).toBe('210px 20px');
      const animations = clone!.element.getAnimations();
      expect(animations.length).toBeGreaterThan(0);

      await Promise.allSettled(animations.map((animation) => animation.finished));
      await Promise.resolve();
      expect(clone!.element.isConnected).toBe(false);
      expect(source).not.toHaveAttribute('data-dragging');
    } finally {
      style.remove();
      source.remove();
    }
  });
});
