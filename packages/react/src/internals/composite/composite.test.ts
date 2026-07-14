import { expect, vi } from 'vitest';
import { scrollIntoViewIfNeeded } from './composite';

describe('Composite', () => {
  describe('scrollIntoViewIfNeeded', () => {
    it('uses the left scroll margin when checking left overflow in RTL', () => {
      const scrollContainer = document.createElement('div');
      const element = document.createElement('div');
      const scrollTo = vi.fn();

      element.style.scrollMarginLeft = '20px';
      scrollContainer.appendChild(element);
      // `getComputedStyle` only resolves styles for elements attached to the document.
      document.body.appendChild(scrollContainer);

      Object.defineProperties(scrollContainer, {
        clientWidth: { value: 100 },
        scrollWidth: { value: 200 },
        scrollLeft: { value: 0 },
        scrollTop: { value: 0 },
        scrollTo: { value: scrollTo },
      });
      Object.defineProperties(element, {
        offsetLeft: { value: 10 },
        offsetWidth: { value: 10 },
        offsetParent: { value: scrollContainer },
        scrollTo: { value: vi.fn() },
      });

      scrollIntoViewIfNeeded(scrollContainer, element, 'rtl', 'horizontal');

      expect(scrollTo).toHaveBeenCalledWith({
        left: -10,
        top: 0,
        behavior: 'auto',
      });

      scrollContainer.remove();
    });
  });
});
