import * as React from 'react';
import { expect } from 'vitest';
import { hasRenderableChildren, isRenderableNode } from './isRenderableNode';

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
    expect(isRenderableNode([[null]])).toBe(false);
    expect(isRenderableNode([[0]])).toBe(true);
  });
});

describe('hasRenderableChildren', () => {
  it('requires an element whose children are renderable', () => {
    expect(hasRenderableChildren(React.createElement('div', null, 'text'))).toBe(true);
    expect(hasRenderableChildren(React.createElement('div', null, 0))).toBe(true);
    expect(hasRenderableChildren(React.createElement('div'))).toBe(false);
    expect(hasRenderableChildren(React.createElement('div', null, []))).toBe(false);
    expect(hasRenderableChildren(null)).toBe(false);
    expect(hasRenderableChildren('text')).toBe(false);
  });
});
