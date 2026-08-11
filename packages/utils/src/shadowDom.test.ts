import { expect, vi } from 'vitest';
import { closest, getTarget } from './shadowDom';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('shadow DOM utilities', () => {
  describe('closest', () => {
    it('finds an ancestor across nested shadow roots from a non-Element node', () => {
      const button = document.createElement('button');
      const outerHost = document.createElement('span');
      const innerHost = document.createElement('span');
      const target = document.createTextNode('target');

      document.body.appendChild(button);
      button.appendChild(outerHost);
      outerHost.attachShadow({ mode: 'open' }).appendChild(innerHost);
      innerHost.attachShadow({ mode: 'open' }).appendChild(target);

      expect(closest(target, 'button')).toBe(button);
    });

    it('follows the composed tree through slots', () => {
      const host = document.createElement('span');
      const target = document.createElement('span');
      const shadowAncestor = document.createElement('div');
      const slot = document.createElement('slot');

      shadowAncestor.dataset.testid = 'shadow-ancestor';
      shadowAncestor.appendChild(slot);
      host.attachShadow({ mode: 'open' }).appendChild(shadowAncestor);
      host.appendChild(target);
      document.body.appendChild(host);

      expect(closest(target, '[data-testid="shadow-ancestor"]')).toBe(shadowAncestor);
    });

    it('preserves native selector validation', () => {
      const element = document.createElement('div');

      expect(() => closest(element, '[')).toThrow();
    });

    it('finds an interactive ancestor outside a composed event target shadow root', () => {
      const button = document.createElement('button');
      let matchedElement: Element | null = null;
      const listener = vi.fn((event: PointerEvent) => {
        matchedElement = closest(getTarget(event) as Node, 'button');
      });
      const host = document.createElement('span');
      const target = document.createElement('span');

      document.body.appendChild(button);
      button.appendChild(host);
      host.attachShadow({ mode: 'open' }).appendChild(target);
      button.addEventListener('pointerdown', listener);

      target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));

      expect(listener).toHaveBeenCalledOnce();
      expect(matchedElement).toBe(button);
    });
  });
});
