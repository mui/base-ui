import { expect, test } from 'vitest';
import type { FloatingContext } from '../floating-root/types';
import {
  descendantContains,
  getNode,
  getNodeAncestors,
  getNodeChildren,
  hasBlockingChild,
  hasOpenDescendant,
  treeContains,
} from './nodes';

const contextOpen = { open: true } as FloatingContext;
const contextClosed = { open: false } as FloatingContext;

test('getNodeChildren returns an array of children, ignoring closed ones when onlyOpenChildren=true', () => {
  expect(
    getNodeChildren(
      [
        { id: '0', parentId: null, context: contextOpen },
        { id: '1', parentId: '0', context: contextOpen },
        { id: '2', parentId: '1', context: contextOpen },
        { id: '3', parentId: '1', context: contextOpen },
        { id: '4', parentId: '1', context: contextClosed },
      ],
      '0',
      true,
    ),
  ).toEqual([
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextOpen },
    { id: '3', parentId: '1', context: contextOpen },
  ]);
});

test('getNodeChildren returns an array of children, including closed ones when onlyOpenChildren=false', () => {
  expect(
    getNodeChildren(
      [
        { id: '0', parentId: null, context: contextOpen },
        { id: '1', parentId: '0', context: contextOpen },
        { id: '2', parentId: '1', context: contextOpen },
        { id: '3', parentId: '1', context: contextOpen },
        { id: '4', parentId: '1', context: contextClosed },
      ],
      '0',
      false,
    ),
  ).toEqual([
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextOpen },
    { id: '3', parentId: '1', context: contextOpen },
    { id: '4', parentId: '1', context: contextClosed },
  ]);
});

test('getNodeChildren handles deep parent structures correctly (onlyOpenChildren=true)', () => {
  const nodes = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextClosed },
    { id: '3', parentId: '2', context: contextOpen },
    { id: '4', parentId: '2', context: contextClosed },
    { id: '5', parentId: '0', context: contextOpen },
    { id: '6', parentId: '5', context: contextOpen },
  ];

  expect(getNodeChildren(nodes, '0', true)).toEqual([
    { id: '1', parentId: '0', context: contextOpen },
    { id: '3', parentId: '2', context: contextOpen },
    { id: '5', parentId: '0', context: contextOpen },
    { id: '6', parentId: '5', context: contextOpen },
  ]);
});

test('getNodeChildren includes open descendants behind contextless intermediary nodes', () => {
  const nodes = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0' },
    { id: '2', parentId: '1', context: contextOpen },
  ];

  expect(getNodeChildren(nodes, '0', true)).toEqual([
    { id: '2', parentId: '1', context: contextOpen },
  ]);
});

test('getNodeChildren handles deep parent structures correctly (onlyOpenChildren=false)', () => {
  const nodes = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextClosed },
    { id: '3', parentId: '2', context: contextOpen },
    { id: '4', parentId: '2', context: contextClosed },
    { id: '5', parentId: '0', context: contextOpen },
    { id: '6', parentId: '5', context: contextOpen },
  ];

  expect(getNodeChildren(nodes, '0', false)).toEqual([
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextClosed },
    { id: '3', parentId: '2', context: contextOpen },
    { id: '4', parentId: '2', context: contextClosed },
    { id: '5', parentId: '0', context: contextOpen },
    { id: '6', parentId: '5', context: contextOpen },
  ]);
});

test('getNodeAncestors returns an array of ancestors', () => {
  expect(
    getNodeAncestors(
      [
        { id: '0', parentId: null },
        { id: '1', parentId: '0' },
        { id: '2', parentId: '1' },
      ],
      '2',
    ),
  ).toEqual([
    { id: '1', parentId: '0' },
    { id: '0', parentId: null },
  ]);
});

function createContext(
  open: boolean,
  options: { floating?: HTMLElement; data?: FloatingContext['dataRef']['current'] } = {},
) {
  return {
    open,
    elements: { floating: options.floating ?? null, domReference: null },
    dataRef: { current: options.data ?? {} },
  } as unknown as FloatingContext;
}

test('getNode returns the node with the given id', () => {
  const nodes = [
    { id: '0', parentId: null },
    { id: '1', parentId: '0' },
  ];

  expect(getNode(nodes, '1')).toBe(nodes[1]);
  expect(getNode(nodes, 'missing')).toBeUndefined();
  expect(getNode(nodes, undefined)).toBeUndefined();
});

test('hasOpenDescendant finds open descendants behind closed and contextless nodes', () => {
  const nodes = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0', context: contextClosed },
    { id: '2', parentId: '1' },
    { id: '3', parentId: '2', context: contextOpen },
    { id: '4', parentId: null, context: contextOpen },
    { id: '5', parentId: '4', context: contextClosed },
  ];

  expect(hasOpenDescendant(nodes, '0')).toBe(true);
  expect(hasOpenDescendant(nodes, '4')).toBe(false);
  expect(hasOpenDescendant(nodes, '3')).toBe(false);
});

test('hasBlockingChild is true for an open descendant that does not let the dismissal bubble', () => {
  const nodes = [
    { id: '0', parentId: null, context: contextOpen },
    {
      id: '1',
      parentId: '0',
      context: createContext(true, {
        data: { __escapeKeyBubbles: false, __outsidePressBubbles: true },
      }),
    },
  ];

  expect(hasBlockingChild(nodes, '0', 'escapeKey')).toBe(true);
  expect(hasBlockingChild(nodes, '0', 'outsidePress')).toBe(false);
});

test('hasBlockingChild ignores closed descendants and treats an unset flag as blocking', () => {
  const closedBlocking = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0', context: createContext(false, { data: {} }) },
  ];
  const openUnset = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0', context: createContext(true, { data: {} }) },
  ];

  expect(hasBlockingChild(closedBlocking, '0', 'escapeKey')).toBe(false);
  expect(hasBlockingChild(openUnset, '0', 'escapeKey')).toBe(true);
});

test('descendantContains checks open descendants, or all of them when onlyOpen is false', () => {
  const openFloating = document.createElement('div');
  const closedFloating = document.createElement('div');
  const target = document.createElement('span');
  const closedTarget = document.createElement('span');
  openFloating.appendChild(target);
  closedFloating.appendChild(closedTarget);
  const nodes = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0', context: createContext(true, { floating: openFloating }) },
    { id: '2', parentId: '0', context: createContext(false, { floating: closedFloating }) },
  ];

  expect(descendantContains(nodes, '0', target)).toBe(true);
  expect(descendantContains(nodes, '0', closedTarget)).toBe(false);
  expect(descendantContains(nodes, '0', closedTarget, false)).toBe(true);
  expect(descendantContains(nodes, '1', target)).toBe(false);
});

test('treeContains checks every node that has a context, open or not', () => {
  const floating = document.createElement('div');
  const target = document.createElement('span');
  floating.appendChild(target);
  const nodes = [
    { id: '0', parentId: null },
    { id: '1', parentId: '0', context: createContext(false, { floating }) },
  ];

  expect(treeContains(nodes, target)).toBe(true);
  expect(treeContains(nodes, document.createElement('span'))).toBe(false);
});
