import { expect, describe, it, afterEach, vi } from 'vitest';
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

    it('returns null for a detached node instead of falling back to the document element', () => {
      document.documentElement.classList.add('match');
      const element = document.createElement('div');

      expect(closest(element, '.match')).toBeNull();
      document.documentElement.classList.remove('match');
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

  describe('getTarget', () => {
    it('returns the composed-path target while the event is being dispatched', () => {
      const parent = document.createElement('div');
      const child = document.createElement('span');
      parent.appendChild(child);
      document.body.appendChild(parent);

      let target: EventTarget | null = null;
      parent.addEventListener('click', (event) => {
        target = getTarget(event);
      });
      child.dispatchEvent(new Event('click', { bubbles: true }));

      expect(target).toBe(child);
      parent.remove();
    });

    it('falls back to `target` once dispatch has completed', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      const event = new Event('click');
      element.dispatchEvent(event);

      expect(event.composedPath()).toHaveLength(0);
      expect(getTarget(event)).toBe(element);
      element.remove();
    });
  });
});
