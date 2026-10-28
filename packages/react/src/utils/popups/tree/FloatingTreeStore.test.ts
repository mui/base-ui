import { expect, it } from 'vitest';
import type { FloatingNodeInteraction, FloatingNodeSnapshot, FloatingNodeType } from '../types';
import { FloatingTreeStore } from './FloatingTreeStore';

function createContext(
  open: boolean,
  options: { floating?: HTMLElement; interaction?: FloatingNodeInteraction } = {},
) {
  return {
    open,
    elements: { floating: options.floating ?? null, domReference: null },
    rootStore: { context: options.interaction ?? {} },
  } satisfies FloatingNodeSnapshot;
}

function createTree(nodes: Array<FloatingNodeType>) {
  const tree = new FloatingTreeStore();
  nodes.forEach((node) => tree.addNode(node));
  return tree;
}

it('answers queries about the nodes it holds', () => {
  const tree = new FloatingTreeStore();
  const floating = document.createElement('div');
  const target = document.createElement('span');
  floating.appendChild(target);
  const root = { id: 'root', parentId: null, context: createContext(true) };
  const child = { id: 'child', parentId: 'root', context: createContext(true, { floating }) };
  tree.addNode(root);
  tree.addNode(child);

  expect(tree.getNode('child')).toBe(child);
  expect(tree.descendants('root')).toEqual([child]);
  expect(tree.ancestors('child')).toEqual([root]);
  expect(tree.hasBlockingChild('root', 'escapeKey')).toBe(true);
  expect(tree.descendantContains('root', target)).toBe(true);
  expect(tree.contains(target)).toBe(true);

  tree.removeNode(child);

  expect(tree.getNode('child')).toBeUndefined();
  expect(tree.descendants('root')).toEqual([]);
  expect(tree.contains(target)).toBe(false);
});

const contextOpen = createContext(true);
const contextClosed = createContext(false);

it('descendants returns an array of descendants, ignoring closed ones when onlyOpen=true', () => {
  expect(
    createTree([
      { id: '0', parentId: null, context: contextOpen },
      { id: '1', parentId: '0', context: contextOpen },
      { id: '2', parentId: '1', context: contextOpen },
      { id: '3', parentId: '1', context: contextOpen },
      { id: '4', parentId: '1', context: contextClosed },
    ]).descendants('0', true),
  ).toEqual([
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextOpen },
    { id: '3', parentId: '1', context: contextOpen },
  ]);
});

it('descendants returns an array of descendants, including closed ones when onlyOpen=false', () => {
  expect(
    createTree([
      { id: '0', parentId: null, context: contextOpen },
      { id: '1', parentId: '0', context: contextOpen },
      { id: '2', parentId: '1', context: contextOpen },
      { id: '3', parentId: '1', context: contextOpen },
      { id: '4', parentId: '1', context: contextClosed },
    ]).descendants('0', false),
  ).toEqual([
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextOpen },
    { id: '3', parentId: '1', context: contextOpen },
    { id: '4', parentId: '1', context: contextClosed },
  ]);
});

it('descendants handles deep parent structures correctly (onlyOpen=true)', () => {
  const nodes = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextClosed },
    { id: '3', parentId: '2', context: contextOpen },
    { id: '4', parentId: '2', context: contextClosed },
    { id: '5', parentId: '0', context: contextOpen },
    { id: '6', parentId: '5', context: contextOpen },
  ];

  expect(createTree(nodes).descendants('0', true)).toEqual([
    { id: '1', parentId: '0', context: contextOpen },
    { id: '3', parentId: '2', context: contextOpen },
    { id: '5', parentId: '0', context: contextOpen },
    { id: '6', parentId: '5', context: contextOpen },
  ]);
});

it('descendants includes open descendants behind contextless intermediary nodes', () => {
  const nodes = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0' },
    { id: '2', parentId: '1', context: contextOpen },
  ];

  expect(createTree(nodes).descendants('0', true)).toEqual([
    { id: '2', parentId: '1', context: contextOpen },
  ]);
});

it('descendants handles deep parent structures correctly (onlyOpen=false)', () => {
  const nodes = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextClosed },
    { id: '3', parentId: '2', context: contextOpen },
    { id: '4', parentId: '2', context: contextClosed },
    { id: '5', parentId: '0', context: contextOpen },
    { id: '6', parentId: '5', context: contextOpen },
  ];

  expect(createTree(nodes).descendants('0', false)).toEqual([
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextClosed },
    { id: '3', parentId: '2', context: contextOpen },
    { id: '4', parentId: '2', context: contextClosed },
    { id: '5', parentId: '0', context: contextOpen },
    { id: '6', parentId: '5', context: contextOpen },
  ]);
});

it('ancestors returns an array of ancestors', () => {
  expect(
    createTree([
      { id: '0', parentId: null },
      { id: '1', parentId: '0' },
      { id: '2', parentId: '1' },
    ]).ancestors('2'),
  ).toEqual([
    { id: '1', parentId: '0' },
    { id: '0', parentId: null },
  ]);
});

it('getNode returns the node with the given id', () => {
  const nodes = [
    { id: '0', parentId: null },
    { id: '1', parentId: '0' },
  ];

  expect(createTree(nodes).getNode('1')).toBe(nodes[1]);
  expect(createTree(nodes).getNode('missing')).toBeUndefined();
  expect(createTree(nodes).getNode(undefined)).toBeUndefined();
});

it('hasBlockingChild is true for an open descendant that does not let the dismissal bubble', () => {
  const nodes = [
    { id: '0', parentId: null, context: contextOpen },
    {
      id: '1',
      parentId: '0',
      context: createContext(true, {
        interaction: { escapeKeyBubbles: false, outsidePressBubbles: true },
      }),
    },
  ];

  expect(createTree(nodes).hasBlockingChild('0', 'escapeKey')).toBe(true);
  expect(createTree(nodes).hasBlockingChild('0', 'outsidePress')).toBe(false);
});

it('hasBlockingChild ignores closed descendants and treats an unset flag as blocking', () => {
  const closedBlocking = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0', context: createContext(false, { interaction: {} }) },
  ];
  const openUnset = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0', context: createContext(true, { interaction: {} }) },
  ];

  expect(createTree(closedBlocking).hasBlockingChild('0', 'escapeKey')).toBe(false);
  expect(createTree(openUnset).hasBlockingChild('0', 'escapeKey')).toBe(true);
});

it('descendantContains checks open descendants, or all of them when onlyOpen is false', () => {
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

  expect(createTree(nodes).descendantContains('0', target)).toBe(true);
  expect(createTree(nodes).descendantContains('0', closedTarget)).toBe(false);
  expect(createTree(nodes).descendantContains('0', closedTarget, false)).toBe(true);
  expect(createTree(nodes).descendantContains('1', target)).toBe(false);
});

it('contains checks every node that has a context, open or not', () => {
  const floating = document.createElement('div');
  const target = document.createElement('span');
  floating.appendChild(target);
  const nodes = [
    { id: '0', parentId: null },
    { id: '1', parentId: '0', context: createContext(false, { floating }) },
  ];

  expect(createTree(nodes).contains(target)).toBe(true);
  expect(createTree(nodes).contains(document.createElement('span'))).toBe(false);
});
