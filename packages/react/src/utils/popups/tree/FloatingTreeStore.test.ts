import { expect, it } from 'vitest';
import type { FloatingNodeSnapshot } from '../floating-root/types';
import { FloatingTreeStore } from './FloatingTreeStore';

function createContext(open: boolean, floating: HTMLElement | null = null) {
  return {
    open,
    elements: { floating, domReference: null },
    dataRef: { current: {} },
  } satisfies FloatingNodeSnapshot;
}

it('answers queries about the nodes it holds', () => {
  const tree = new FloatingTreeStore();
  const floating = document.createElement('div');
  const target = document.createElement('span');
  floating.appendChild(target);
  const root = { id: 'root', parentId: null, context: createContext(true) };
  const child = { id: 'child', parentId: 'root', context: createContext(true, floating) };
  tree.addNode(root);
  tree.addNode(child);

  expect(tree.getNode('child')).toBe(child);
  expect(tree.descendants('root')).toEqual([child]);
  expect(tree.ancestors('child')).toEqual([root]);
  expect(tree.hasOpenDescendant('root')).toBe(true);
  expect(tree.hasBlockingChild('root', 'escapeKey')).toBe(true);
  expect(tree.descendantContains('root', target)).toBe(true);
  expect(tree.contains(target)).toBe(true);

  tree.removeNode(child);

  expect(tree.getNode('child')).toBeUndefined();
  expect(tree.hasOpenDescendant('root')).toBe(false);
  expect(tree.contains(target)).toBe(false);
});
