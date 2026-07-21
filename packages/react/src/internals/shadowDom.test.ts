import { expect } from 'vitest';
import { precedes } from './shadowDom';

describe('precedes', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('orders siblings in the same tree', () => {
    const first = document.createElement('span');
    const second = document.createElement('span');
    container.append(first, second);

    expect(precedes(first, second)).toBe(true);
    expect(precedes(second, first)).toBe(false);
  });

  it('returns false for the same node', () => {
    const node = document.createElement('span');
    container.append(node);

    expect(precedes(node, node)).toBe(false);
  });

  it('orders a node in a shadow tree against a light DOM sibling of its host', () => {
    const host = document.createElement('div');
    const after = document.createElement('span');
    container.append(host, after);
    const inner = document.createElement('span');
    host.attachShadow({ mode: 'open' }).append(inner);

    expect(precedes(inner, after)).toBe(true);
    expect(precedes(after, inner)).toBe(false);
  });

  it('orders nodes in different shadow trees by their hosts', () => {
    const hostA = document.createElement('div');
    const hostB = document.createElement('div');
    container.append(hostA, hostB);
    const innerA = document.createElement('span');
    const innerB = document.createElement('span');
    hostA.attachShadow({ mode: 'open' }).append(innerA);
    hostB.attachShadow({ mode: 'open' }).append(innerB);

    expect(precedes(innerA, innerB)).toBe(true);
    expect(precedes(innerB, innerA)).toBe(false);
  });

  it('places a host before its own shadow content', () => {
    const host = document.createElement('div');
    container.append(host);
    const inner = document.createElement('span');
    host.attachShadow({ mode: 'open' }).append(inner);

    expect(precedes(host, inner)).toBe(true);
    expect(precedes(inner, host)).toBe(false);
  });

  it('orders nodes across nested shadow trees', () => {
    const outerHost = document.createElement('div');
    container.append(outerHost);
    const outerRoot = outerHost.attachShadow({ mode: 'open' });

    const innerHost = document.createElement('div');
    const sibling = document.createElement('span');
    outerRoot.append(innerHost, sibling);

    const deep = document.createElement('span');
    innerHost.attachShadow({ mode: 'open' }).append(deep);

    expect(precedes(deep, sibling)).toBe(true);
    expect(precedes(sibling, deep)).toBe(false);
  });

  it('orders shadow content in the same shadow root', () => {
    const host = document.createElement('div');
    container.append(host);
    const root = host.attachShadow({ mode: 'open' });
    const first = document.createElement('span');
    const second = document.createElement('span');
    root.append(first, second);

    expect(precedes(first, second)).toBe(true);
    expect(precedes(second, first)).toBe(false);
  });
});
