import { expect } from 'vitest';
import { compareDocumentOrder } from './compareDocumentOrder';

describe('compareDocumentOrder', () => {
  it('orders nodes in the same tree', () => {
    const parent = document.createElement('div');
    const first = document.createElement('span');
    const second = document.createElement('span');
    parent.append(first, second);

    expect(compareDocumentOrder(first, second)).toBe(-1);
    expect(compareDocumentOrder(second, first)).toBe(1);
    expect(compareDocumentOrder(parent, first)).toBe(-1);
    expect(compareDocumentOrder(first, parent)).toBe(1);
  });

  it('returns zero for the same node', () => {
    const node = document.createElement('div');

    expect(compareDocumentOrder(node, node)).toBe(0);
  });

  it('returns zero for nodes in disconnected trees', () => {
    const firstHost = document.createElement('div');
    const secondHost = document.createElement('div');
    document.body.append(firstHost, secondHost);

    try {
      const first = document.createElement('span');
      const second = document.createElement('span');
      firstHost.attachShadow({ mode: 'open' }).append(first);
      secondHost.attachShadow({ mode: 'open' }).append(second);

      expect(compareDocumentOrder(first, second)).toBe(0);
      expect(compareDocumentOrder(second, first)).toBe(0);
    } finally {
      firstHost.remove();
      secondHost.remove();
    }
  });
});
