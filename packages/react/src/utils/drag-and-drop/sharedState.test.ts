import { describe, it, expect, vi, afterEach } from 'vitest';
import { isJSDOM } from '#test-utils';
import { getSharedSlot } from './sharedState';
import { createKind } from './dragKind';
import { createRegisterSource } from './useRegisterSource';
import { registerTarget } from './registrations';
import {
  createElement,
  dragEnter,
  drop,
  lift,
  registerCleanup,
  setupDragEngineTests,
} from '../../../test/dnd';

setupDragEngineTests();

describe('getSharedSlot', () => {
  it('uses a versioned cross-bundle protocol key', () => {
    const root = globalThis as Record<symbol, unknown>;
    getSharedSlot('sharedState.test.protocol', () => ({}));
    expect(root[Symbol.for('@base-ui/react/drag-and-drop/v1')]).toBeDefined();
    expect(root[Symbol.for('@base-ui/react/drag-and-drop')]).toBeUndefined();
  });

  it('returns the first slot for a name, never re-running the factory', () => {
    const first = getSharedSlot<{ value: number }>('sharedState.test.identity', () => ({
      value: 1,
    }));
    const second = getSharedSlot<{ value: number }>('sharedState.test.identity', () => ({
      value: 2,
    }));
    expect(second).toBe(first);
    expect(second.value).toBe(1);
  });
});

describe('separate copies of the engine', () => {
  afterEach(() => {
    vi.resetModules();
  });

  // An app can bundle the engine twice, for example through a plugin that ships
  // its own copy. Each fresh import below evaluates a whole new module graph,
  // like a second bundle, and only the shared slots connect the copies. jsdom
  // only, because browser mode serves every import from one module graph.
  it.skipIf(!isJSDOM)(
    'drops a source registered through one copy onto a target registered through another',
    async () => {
      vi.resetModules();
      const copyA = await import('./useRegisterSource');
      vi.resetModules();
      const copyB = await import('./registrations');
      // Neither copy is the one this file imported.
      expect(copyA.createRegisterSource).not.toBe(createRegisterSource);
      expect(copyB.registerTarget).not.toBe(registerTarget);

      const kind = createKind('shared-card');
      const source = createElement();
      const target = createElement();
      const onDraggableDrop = vi.fn();
      const registerSource = copyA.createRegisterSource(
        () => ({}) as never,
        () => ({}) as never,
      );
      registerCleanup(registerSource(source, () => ({ kind })));
      registerCleanup(copyB.registerTarget(target, () => ({ accept: kind, onDraggableDrop })));

      await lift(source);
      await dragEnter(target);
      drop(target);

      expect(onDraggableDrop).toHaveBeenCalledTimes(1);
      expect(onDraggableDrop.mock.calls[0][0].currentTarget.element).toBe(target);
    },
  );
});
