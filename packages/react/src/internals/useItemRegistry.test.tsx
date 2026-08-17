import { expect } from 'vitest';
import * as React from 'react';
import { createRenderer } from '#test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useItemRegistry } from './useItemRegistry';

describe('useItemRegistry', () => {
  const { render } = createRenderer();

  it('publishes one immutable snapshot for all registrations in a commit', async () => {
    const snapshots: ReadonlyMap<string, string>[] = [];

    function Item(props: { id: string; registerItem: (id: string, value: string) => () => void }) {
      const { id, registerItem } = props;

      useIsoLayoutEffect(() => registerItem(id, id), [id, registerItem]);
      return null;
    }

    function App(props: { items: string[] }) {
      const [registeredItems, registerItem] = useItemRegistry<string, string>();
      snapshots.push(registeredItems);

      return props.items.map((item) => <Item key={item} id={item} registerItem={registerItem} />);
    }

    const { setProps } = await render(<App items={['a', 'b', 'c']} />, { strict: false });

    expect(snapshots.map((snapshot) => Array.from(snapshot.keys()))).toEqual([[], ['a', 'b', 'c']]);

    await setProps({ items: ['b', 'd'] });

    expect(Array.from(snapshots.at(-1)?.keys() ?? [])).toEqual(['b', 'd']);
    expect(Array.from(snapshots[1].keys())).toEqual(['a', 'b', 'c']);
  });
});
