import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { createRenderer } from '#test-utils';
import { useFloatingRootStore } from './useFloatingRootStore';
import type { FloatingRootStore } from './FloatingRootStore';

describe('useFloatingRootStore', () => {
  const { render } = createRenderer();

  function Test(props: { anchor: Element | null; onStore: (store: FloatingRootStore) => void }) {
    const store = useFloatingRootStore({ elements: { anchor: props.anchor } });
    props.onStore(store);
    return null;
  }

  it('follows the anchor when it changes after the first render', async () => {
    const first = document.createElement('button');
    const second = document.createElement('button');
    let store: FloatingRootStore | undefined;
    const onStore = (value: FloatingRootStore) => {
      store = value;
    };

    const { setProps } = await render(<Test anchor={first} onStore={onStore} />);
    expect(store?.select('anchor')).toBe(first);

    await setProps({ anchor: second });

    expect(store?.select('anchor')).toBe(second);
    expect(store?.select('anchorElement')).toBe(second);
  });
});
