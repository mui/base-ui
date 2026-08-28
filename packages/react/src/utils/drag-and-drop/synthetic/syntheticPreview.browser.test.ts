import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isJSDOM } from '#test-utils';
import { flushRaf } from '../../../../test/dnd';
import { createClonedDragPreviewElement } from './cloneDragPreview';
import { createSyntheticPreview } from './syntheticPreview';

describe.skipIf(isJSDOM)('syntheticPreview drop transition', () => {
  const animationsFlag = globalThis as { BASE_UI_ANIMATIONS_DISABLED?: boolean | undefined };

  beforeAll(() => {
    animationsFlag.BASE_UI_ANIMATIONS_DISABLED = false;
  });

  afterAll(() => {
    animationsFlag.BASE_UI_ANIMATIONS_DISABLED = true;
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
