import { expect } from 'vitest';
import { isRenderableNode } from './isRenderableNode';

describe('isRenderableNode', () => {
  it('treats renderable primitives as content', () => {
    expect(isRenderableNode(0)).toBe(true);
    expect(isRenderableNode(0n)).toBe(true);
    expect(isRenderableNode(Number.NaN)).toBe(true);
    expect(isRenderableNode('text')).toBe(true);
  });

  it('treats non-rendering values as empty', () => {
    expect(isRenderableNode(null)).toBe(false);
    expect(isRenderableNode(undefined)).toBe(false);
    expect(isRenderableNode(true)).toBe(false);
    expect(isRenderableNode(false)).toBe(false);
    expect(isRenderableNode('')).toBe(false);
  });

  it('recurses into arrays', () => {
    expect(isRenderableNode([])).toBe(false);
    expect(isRenderableNode([null, undefined, false])).toBe(false);
    expect(isRenderableNode([null, 0])).toBe(true);
  });
});
