import { describe, it, expect } from 'vitest';
import type { DragSource, DropTargetRecord } from '../../types/drag';
import { anyDragKind, createGlobalKind, createKind, matchesAccept } from './dragKind';

function sourceOfKind(kind: symbol): DragSource<unknown> {
  return {
    element: document.createElement('div'),
    kind,
    dragHandle: null,
    payload: undefined,
  };
}

function recordOfKind(kind: symbol | undefined): DropTargetRecord<unknown> {
  return {
    element: document.createElement('div'),
    kind,
    payload: undefined,
    getLocalPoint: () => ({ x: 0, y: 0 }),
    getSnappedLocalPoint: () => ({ x: 0, y: 0 }),
  };
}

describe('createKind', () => {
  it('keeps the name it was created with', () => {
    expect(createKind('card').name).toBe('card');
  });

  it('gives separately created kinds with the same name different identities', () => {
    expect(createKind('card').id).not.toBe(createKind<{ id: string }>('card').id);
  });

  it('gives kinds with different labels different identities', () => {
    expect(createKind('card').id).not.toBe(createKind('column').id);
  });

  it('does not collide with a plain interned symbol of the same label', () => {
    expect(createKind('card').id).not.toBe(Symbol.for('card'));
  });

  describe('matches', () => {
    it('matches a source of that kind', () => {
      const card = createKind('card');
      expect(card.matches(sourceOfKind(card.id))).toBe(true);
    });

    it('rejects a source of another kind', () => {
      const card = createKind('card');
      expect(card.matches(sourceOfKind(createKind('column').id))).toBe(false);
    });

    it('matches a drop target record of that kind', () => {
      const slot = createKind('slot');
      expect(slot.matches(recordOfKind(slot.id))).toBe(true);
      expect(slot.matches(recordOfKind(createKind('trash').id))).toBe(false);
    });

    it('rejects a record from a target registered without a kind', () => {
      expect(createKind('slot').matches(recordOfKind(undefined))).toBe(false);
    });
  });
});

describe('createGlobalKind', () => {
  it('keeps the key it was created with', () => {
    expect(createGlobalKind('myapp/card').name).toBe('myapp/card');
  });

  it('resolves two kinds with the same key to the same identity', () => {
    expect(createGlobalKind('myapp/card').id).toBe(
      createGlobalKind<{ id: string }>('myapp/card').id,
    );
  });

  it('does not collide with a local kind of the same name', () => {
    expect(createGlobalKind('myapp/card').id).not.toBe(createKind('myapp/card').id);
  });

  it('requires a namespaced key', () => {
    expect(() => createGlobalKind('card')).toThrowError(
      'Base UI: createGlobalKind requires a namespaced key.',
    );
    expect(() => createGlobalKind('/card')).toThrowError(
      'Base UI: createGlobalKind requires a namespaced key.',
    );
    expect(() => createGlobalKind('myapp/')).toThrowError(
      'Base UI: createGlobalKind requires a namespaced key.',
    );
    expect(() => createGlobalKind('myapp//')).toThrowError(
      'Base UI: createGlobalKind requires a namespaced key.',
    );
  });
});

describe('matchesAccept', () => {
  const card = createKind('card');
  const column = createKind('column');

  it('accepts any source when `accept` is omitted', () => {
    expect(matchesAccept(undefined, sourceOfKind(card.id))).toBe(true);
  });

  it('matches a single kind', () => {
    expect(matchesAccept(card, sourceOfKind(card.id))).toBe(true);
    expect(matchesAccept(card, sourceOfKind(column.id))).toBe(false);
  });

  it('matches any kind in an array', () => {
    expect(matchesAccept([card, column], sourceOfKind(column.id))).toBe(true);
    expect(matchesAccept([card, column], sourceOfKind(createKind('row').id))).toBe(false);
  });

  it('accepts nothing when the array is empty', () => {
    expect(matchesAccept([], sourceOfKind(card.id))).toBe(false);
  });

  it('accepts every source through the catch-all sentinel', () => {
    // The explicit opt-in that replaces the old permissive default, so a drop
    // target taking every drag on the page is something you can grep for.
    expect(matchesAccept(anyDragKind, sourceOfKind(card.id))).toBe(true);
    expect(matchesAccept(anyDragKind, sourceOfKind(column.id))).toBe(true);
  });

  it('accepts every source when the catch-all appears in an array', () => {
    expect(matchesAccept([card, anyDragKind], sourceOfKind(column.id))).toBe(true);
  });

  it('gives the catch-all an identity no consumer kind can collide with', () => {
    // `createKind('any')` is a normal kind and must stay distinct from the sentinel.
    expect(anyDragKind.id).not.toBe(createKind('any').id);
    expect(matchesAccept(createKind('any'), sourceOfKind(card.id))).toBe(false);
  });
});
