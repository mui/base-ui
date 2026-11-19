import { describe, expect, it } from 'vitest';
import { isEventTargetWithin } from './element';

describe('isEventTargetWithin', () => {
  it('treats a shadow-contained target as within when the event lacks composedPath', () => {
    const parent = document.createElement('div');
    const host = document.createElement('span');
    parent.appendChild(host);
    const inner = document.createElement('button');
    host.attachShadow({ mode: 'open' }).appendChild(inner);

    expect(parent.contains(inner)).toBe(false);

    const eventWithoutComposedPath = { target: inner } as unknown as Event;
    expect(isEventTargetWithin(eventWithoutComposedPath, parent)).toBe(true);
  });

  it('returns false for an outside target when the event lacks composedPath', () => {
    const parent = document.createElement('div');
    const outside = document.createElement('button');

    const eventWithoutComposedPath = { target: outside } as unknown as Event;
    expect(isEventTargetWithin(eventWithoutComposedPath, parent)).toBe(false);
  });

  it('returns true for a light-DOM child when the event lacks composedPath', () => {
    const parent = document.createElement('div');
    const child = document.createElement('button');
    parent.appendChild(child);

    const eventWithoutComposedPath = { target: child } as unknown as Event;
    expect(isEventTargetWithin(eventWithoutComposedPath, parent)).toBe(true);
  });
});
