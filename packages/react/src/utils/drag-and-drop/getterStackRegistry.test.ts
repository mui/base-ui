import { describe, expect, it, vi } from 'vitest';
import { createGetterStackRegistry } from './getterStackRegistry';

describe('createGetterStackRegistry', () => {
  it('keeps a reentrant registration that uses the same getter', () => {
    const entries = new Map<object, Array<() => void>>();
    const onFirstAdd = vi.fn();
    const registry = createGetterStackRegistry({ entries, onFirstAdd });
    const element = {};
    const getter = () => {};

    registry.add(element, getter);
    registry.remove(element, getter, () => {
      registry.add(element, getter);
    });

    expect(registry.getActive(element)).toBe(getter);
    expect(entries.get(element)).toEqual([getter]);
    expect(onFirstAdd).toHaveBeenCalledTimes(2);
  });

  it('promotes the survivor when the active hold is removed, running beforeDelete', () => {
    const entries = new Map<object, Array<() => void>>();
    const onLastRemove = vi.fn();
    const registry = createGetterStackRegistry({ entries, onLastRemove });
    const element = {};
    const first = () => {};
    const second = () => {};
    const beforeDelete = vi.fn();

    registry.add(element, first);
    registry.add(element, second);
    expect(registry.getActive(element)).toBe(second);

    const removedEntirely = registry.remove(element, second, beforeDelete);

    expect(removedEntirely).toBe(false);
    // The element stays registered, but its effective parameters changed.
    expect(beforeDelete).toHaveBeenCalledTimes(1);
    expect(onLastRemove).not.toHaveBeenCalled();
    expect(registry.getActive(element)).toBe(first);
    expect(entries.get(element)).toEqual([first]);
  });

  it('removes a non-last hold by identity without touching the active getter', () => {
    const entries = new Map<object, Array<() => void>>();
    const onLastRemove = vi.fn();
    const registry = createGetterStackRegistry({ entries, onLastRemove });
    const element = {};
    const first = () => {};
    const second = () => {};
    const beforeDelete = vi.fn();

    registry.add(element, first);
    registry.add(element, second);

    const removedEntirely = registry.remove(element, first, beforeDelete);

    expect(removedEntirely).toBe(false);
    // The active getter did not change, so nothing needs refreshing.
    expect(beforeDelete).not.toHaveBeenCalled();
    expect(onLastRemove).not.toHaveBeenCalled();
    expect(registry.getActive(element)).toBe(second);
    expect(entries.get(element)).toEqual([second]);
  });

  it('runs onLastRemove before beforeDelete, both while the entry is still readable', () => {
    const entries = new Map<object, Array<() => void>>();
    const order: string[] = [];
    const element = {};
    const getter = () => {};
    const registry = createGetterStackRegistry({
      entries,
      onLastRemove: () => {
        order.push('onLastRemove');
        expect(registry.getActive(element)).toBe(getter);
      },
    });

    registry.add(element, getter);
    const removedEntirely = registry.remove(element, getter, () => {
      order.push('beforeDelete');
      expect(registry.getActive(element)).toBe(getter);
    });

    expect(removedEntirely).toBe(true);
    expect(order).toEqual(['onLastRemove', 'beforeDelete']);
    expect(registry.getActive(element)).toBeUndefined();
    expect(entries.has(element)).toBe(false);
  });
});
