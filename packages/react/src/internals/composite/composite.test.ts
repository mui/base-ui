import { expect, vi, describe, it } from 'vitest';
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

    it('aligns right and left edges in LTR when overflowing horizontally', () => {
      const scrollContainer = document.createElement('div');
      const element = document.createElement('div');
      const scrollTo = vi.fn();

      scrollContainer.style.scrollPaddingLeft = '5px';
      scrollContainer.style.scrollPaddingRight = '10px';
      element.style.scrollMarginLeft = '8px';
      element.style.scrollMarginRight = '12px';
      scrollContainer.appendChild(element);
      document.body.appendChild(scrollContainer);

      Object.defineProperties(scrollContainer, {
        clientWidth: { value: 100 },
        scrollWidth: { value: 300 },
        scrollLeft: { value: 20, writable: true },
        scrollTop: { value: 0 },
        scrollTo: { value: scrollTo },
      });
      Object.defineProperties(element, {
        offsetLeft: { value: 90, writable: true },
        offsetWidth: { value: 30 },
        offsetParent: { value: scrollContainer },
        scrollTo: { value: vi.fn() },
      });

      scrollIntoViewIfNeeded(scrollContainer, element, 'ltr', 'horizontal');
      expect(scrollTo).toHaveBeenLastCalledWith({
        left: 42,
        top: 0,
        behavior: 'auto',
      });

      (element as { offsetLeft: number }).offsetLeft = 20;
      scrollIntoViewIfNeeded(scrollContainer, element, 'ltr', 'horizontal');
      expect(scrollTo).toHaveBeenLastCalledWith({
        left: 7,
        top: 0,
        behavior: 'auto',
      });

      scrollContainer.remove();
    });

    it('aligns top and bottom edges when overflowing vertically', () => {
      const scrollContainer = document.createElement('div');
      const element = document.createElement('div');
      const scrollTo = vi.fn();

      scrollContainer.style.scrollPaddingTop = '6px';
      scrollContainer.style.scrollPaddingBottom = '10px';
      element.style.scrollMarginTop = '4px';
      element.style.scrollMarginBottom = '8px';
      scrollContainer.appendChild(element);
      document.body.appendChild(scrollContainer);

      Object.defineProperties(scrollContainer, {
        clientHeight: { value: 100 },
        scrollHeight: { value: 300 },
        scrollLeft: { value: 0 },
        scrollTop: { value: 50, writable: true },
        scrollTo: { value: scrollTo },
      });
      Object.defineProperties(element, {
        offsetTop: { value: 40, writable: true },
        offsetHeight: { value: 25 },
        offsetParent: { value: scrollContainer },
        scrollTo: { value: vi.fn() },
      });

      scrollIntoViewIfNeeded(scrollContainer, element, 'ltr', 'vertical');
      expect(scrollTo).toHaveBeenLastCalledWith({
        left: 0,
        top: 30,
        behavior: 'auto',
      });

      (element as { offsetTop: number }).offsetTop = 130;
      scrollIntoViewIfNeeded(scrollContainer, element, 'ltr', 'vertical');
      expect(scrollTo).toHaveBeenLastCalledWith({
        left: 0,
        top: 73,
        behavior: 'auto',
      });

      scrollContainer.remove();
    });
  });
});
