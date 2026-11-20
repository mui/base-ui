import { describe, it, expect, afterEach } from 'vitest';
import { findScrollContainer } from './findScrollContainer';

const created: HTMLElement[] = [];

function makeEl(overflow?: { overflowY?: string; overflowX?: string }): HTMLDivElement {
  const el = document.createElement('div');
  if (overflow?.overflowY != null) {
    el.style.overflowY = overflow.overflowY;
  }
  if (overflow?.overflowX != null) {
    el.style.overflowX = overflow.overflowX;
  }
  created.push(el);
  return el;
}

afterEach(() => {
  for (const el of created) {
    el.remove();
  }
  created.length = 0;
});

describe('findScrollContainer', () => {
  it('returns the nearest scrollable ancestor', () => {
    const outer = makeEl({ overflowY: 'auto' });
    const middle = makeEl();
    const inner = makeEl();
    outer.appendChild(middle);
    middle.appendChild(inner);
    document.body.appendChild(outer);

    expect(findScrollContainer(inner)).toBe(outer);
  });

  it('picks the nearest scrollable when multiple ancestors are scrollable', () => {
    const outer = makeEl({ overflowY: 'auto' });
    const inner = makeEl({ overflowY: 'scroll' });
    const leaf = makeEl();
    outer.appendChild(inner);
    inner.appendChild(leaf);
    document.body.appendChild(outer);

    expect(findScrollContainer(leaf)).toBe(inner);
  });

  it('returns the start element itself when it is scrollable', () => {
    // The walk must include `start`, not skip to its parent.
    const outer = makeEl();
    const scrollable = makeEl({ overflowY: 'auto' });
    outer.appendChild(scrollable);
    document.body.appendChild(outer);

    expect(findScrollContainer(scrollable)).toBe(scrollable);
  });

  it('falls back to documentElement when no ancestor is scrollable', () => {
    const el = makeEl();
    document.body.appendChild(el);

    const result = findScrollContainer(el);
    // jsdom uses documentElement as the scrollingElement fallback.
    expect(result === document.scrollingElement || result === document.documentElement).toBe(true);
  });

  it('treats overflow-x: auto as scrollable', () => {
    const outer = makeEl({ overflowX: 'auto' });
    const leaf = makeEl();
    outer.appendChild(leaf);
    document.body.appendChild(outer);

    expect(findScrollContainer(leaf)).toBe(outer);
  });

  it('treats overflow-x: scroll as scrollable', () => {
    const outer = makeEl({ overflowX: 'scroll' });
    const leaf = makeEl();
    outer.appendChild(leaf);
    document.body.appendChild(outer);

    expect(findScrollContainer(leaf)).toBe(outer);
  });

  it('does not treat overflow: hidden as scrollable', () => {
    const outer = makeEl({ overflowY: 'hidden' });
    const leaf = makeEl();
    outer.appendChild(leaf);
    document.body.appendChild(outer);

    const result = findScrollContainer(leaf);
    expect(result).not.toBe(outer);
    expect(result === document.scrollingElement || result === document.documentElement).toBe(true);
  });

  it('crosses shadow-root boundaries to find a scrollable host', () => {
    const host = makeEl({ overflowY: 'auto' });
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('div');
    shadow.appendChild(inner);

    expect(findScrollContainer(inner)).toBe(host);
  });
});
