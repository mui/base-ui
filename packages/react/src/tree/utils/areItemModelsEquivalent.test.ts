import { describe, it, expect } from 'vitest';
import { createStandardTreeItemCollection } from '../items/itemCollection';
import { areItemModelsEquivalent } from './areItemModelsEquivalent';

const readers = createStandardTreeItemCollection<any>(undefined);

describe('areItemModelsEquivalent', () => {
  // Model metadata may link objects in any shape. The hierarchy compared through
  // `children` stays acyclic, but the metadata must not keep the walk going.
  it('compares cyclic metadata that pairs one object with several copies', () => {
    const actual: Record<string, unknown> = { id: 'x' };
    actual.next = actual;
    const first: Record<string, unknown> = { id: 'x' };
    const second: Record<string, unknown> = { id: 'x', next: first };
    first.next = second;
    const item = (meta: object) => ({ id: 'item', label: 'Item', meta });

    expect(areItemModelsEquivalent([item(actual)], [item(first)], readers)).toBe(true);
    expect(
      areItemModelsEquivalent([item(actual)], [item({ id: 'x', next: { id: 'y' } })], readers),
    ).toBe(false);
  });

  const KEY = Symbol('label');
  it.each([
    ['an array', (label: string) => Object.assign(['payload'], { [KEY]: label })],
    ['a date', (label: string) => Object.assign(new Date(0), { label })],
  ])('compares the fields of %s', (_, create) => {
    const item = (label: string) => ({ id: 'file', label: 'File', data: create(label) });

    expect(areItemModelsEquivalent([item('Old')], [item('Old')], readers)).toBe(true);
    expect(areItemModelsEquivalent([item('Old')], [item('New')], readers)).toBe(false);
  });

  class Zone {
    #name: string;

    constructor(name: string) {
      this.#name = name;
    }

    getName() {
      return this.#name;
    }
  }
  // Its prototype ends the chain, like `Object.prototype` does.
  class DetachedZone extends Zone {}
  Object.setPrototypeOf(DetachedZone.prototype, null);
  class ZonedDate extends Date {
    #zone: string;

    constructor(zone: string) {
      super(0);
      this.#zone = zone;
    }

    getZone() {
      return this.#zone;
    }
  }
  class OwnedArray extends Array<string> {
    #owner: string;

    constructor(owner: string) {
      super();
      this.#owner = owner;
      this.push('payload');
    }

    getOwner() {
      return this.#owner;
    }
  }
  it.each([
    ['a class', (state: string) => new Zone(state)],
    ['a class without Object.prototype', (state: string) => new DetachedZone(state)],
    ['a date subclass', (state: string) => new ZonedDate(state)],
    ['an array subclass', (state: string) => new OwnedArray(state)],
  ])('compares an instance of %s by identity, as its state can be private', (_, create) => {
    const item = (data: object) => ({ id: 'file', label: 'File', data });
    const data = create('UTC');

    expect(areItemModelsEquivalent([item(data)], [item(data)], readers)).toBe(true);
    expect(areItemModelsEquivalent([item(create('UTC'))], [item(create('Paris'))], readers)).toBe(
      false,
    );
  });

  it('compares a link to another item through the item it pairs with', () => {
    class Node {
      children?: Node[];

      link?: Node;

      constructor(
        public id: string,
        public label: string,
      ) {}
    }
    const folder = (linkToParent: boolean) => {
      const parent = new Node('folder', 'Folder');
      const child = new Node('file', 'File');
      parent.children = [child];
      child.link = linkToParent ? parent : child;
      return [parent];
    };

    expect(areItemModelsEquivalent(folder(true), folder(true), readers)).toBe(true);
    expect(areItemModelsEquivalent(folder(true), folder(false), readers)).toBe(false);
  });

  it('compares plain metadata that claims to be a date by content', () => {
    const item = (value: number) => ({
      id: 'file',
      label: 'File',
      tagged: { [Symbol.toStringTag]: 'Date', value },
    });

    expect(areItemModelsEquivalent([item(0)], [item(0)], readers)).toBe(true);
    expect(areItemModelsEquivalent([item(0)], [item(1)], readers)).toBe(false);
  });

  it('compares class instances through the collection readers', () => {
    class File {
      #label: string;

      constructor(
        public id: string,
        label: string,
        public children?: File[],
      ) {
        this.#label = label;
      }

      getLabel() {
        return this.#label;
      }
    }
    const fileReaders = { ...readers, itemToStringLabel: (file: File) => file.getLabel() };
    const folder = (childLabel: string) => [
      new File('folder', 'Folder', [new File('file', childLabel)]),
    ];

    expect(areItemModelsEquivalent(folder('Old'), folder('Old'), fileReaders)).toBe(true);
    expect(areItemModelsEquivalent(folder('Old'), folder('New'), fileReaders)).toBe(false);
  });
});
