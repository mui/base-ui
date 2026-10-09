import { expect, it } from 'vitest';
import type { PopupPositioningContext } from '../types';
import { PopupTreeStore } from './PopupTreeStore';

function createContext(open: boolean, floating: HTMLElement | null = null) {
  return {
    open,
    elements: { floating, domReference: null },
    dataRef: { current: {} },
  } as unknown as PopupPositioningContext;
}

it('answers queries about the nodes it holds', () => {
  const tree = new PopupTreeStore();
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
