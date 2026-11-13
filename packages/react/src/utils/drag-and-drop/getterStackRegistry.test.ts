import { describe, expect, it, vi } from 'vitest';
import { createGetterStackRegistry } from './getterStackRegistry';

describe('createGetterStackRegistry', () => {
  it('promotes the survivor and reports the change when the active hold is removed', () => {
    const entries = new Map<object, Array<() => void>>();
    const onLastRemove = vi.fn();
    const registry = createGetterStackRegistry({ entries, onLastRemove });
    const element = {};
    const first = () => {};
    const second = () => {};

    registry.add(element, first);
    registry.add(element, second);
    expect(registry.getActive(element)).toBe(second);

    // The element stays registered, but its effective parameters changed.
    expect(registry.remove(element, second)).toBe(true);
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

    registry.add(element, first);
    registry.add(element, second);

    // The active getter did not change, so nothing needs refreshing.
    expect(registry.remove(element, first)).toBe(false);
    expect(onLastRemove).not.toHaveBeenCalled();
    expect(registry.getActive(element)).toBe(second);
    expect(entries.get(element)).toEqual([second]);
  });
});
