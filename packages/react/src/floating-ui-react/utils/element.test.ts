import { afterEach, describe, expect, it } from 'vitest';
import { isEventTargetWithin } from './element';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('isEventTargetWithin', () => {
  it('treats a shadow-contained target as within when the event lacks composedPath', () => {
    const parent = document.createElement('div');
    const host = document.createElement('span');
    parent.appendChild(host);
    document.body.appendChild(parent);
    const inner = document.createElement('button');
    host.attachShadow({ mode: 'open' }).appendChild(inner);

    expect(parent.contains(inner)).toBe(false);

    const eventWithoutComposedPath = { target: inner } as unknown as Event;
    expect('composedPath' in eventWithoutComposedPath).toBe(false);
    expect(isEventTargetWithin(eventWithoutComposedPath, parent)).toBe(true);
  });

  it('returns false for an outside target when the event lacks composedPath', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const outside = document.createElement('button');
    document.body.appendChild(outside);

    const eventWithoutComposedPath = { target: outside } as unknown as Event;
    expect(isEventTargetWithin(eventWithoutComposedPath, parent)).toBe(false);
  });

  it('returns true for a light-DOM child when the event lacks composedPath', () => {
    const parent = document.createElement('div');
    const child = document.createElement('button');
    parent.appendChild(child);
    document.body.appendChild(parent);

    const eventWithoutComposedPath = { target: child } as unknown as Event;
    expect(isEventTargetWithin(eventWithoutComposedPath, parent)).toBe(true);
  });
});
