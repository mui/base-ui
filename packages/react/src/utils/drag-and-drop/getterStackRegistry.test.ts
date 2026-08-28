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
});
