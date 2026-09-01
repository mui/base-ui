import { expect, describe, it } from 'vitest';
import { getTarget } from './shadowDom';

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
