import * as React from 'react';
import { expect, describe, it, vi } from 'vitest';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { createRenderer } from '#test-utils';
import type { Group } from '../resolveValueLabel';
import { useGroupedRowModels, useRowModels, type GroupedRows } from './useRowModels';

interface Item {
  id: string;
}

function createGroups(sizes: number[], keys?: string[]): Group<Item>[] {
  let next = 0;
  return sizes.map((size, groupIndex) => ({
    key: keys?.[groupIndex],
    items: Array.from({ length: size }, () => {
      const item = { id: `item-${next}` };
      next += 1;
      return item;
    }),
  }));
}

function flatten(groups: Group<Item>[]) {
  return groups.flatMap((group) => group.items);
}

describe('useGroupedRowModels', () => {
  const { render } = createRenderer();

  let grouped: GroupedRows<Item> | null;
  let itemRows: ReturnType<typeof useRowModels<Item>>;

  function Probe(props: {
    getGroupKey?: ((group: Group<Item>) => string | number) | undefined;
    groups: Group<Item>[] | undefined;
    items: Item[];
  }) {
    const rows = useRowModels<Item>({ getItemKey: (item) => item.id, items: props.items });
    const resolved = useGroupedRowModels<Item>({
      getGroupKey: props.getGroupKey,
      groups: props.groups,
      itemRows: rows,
    });

    useIsoLayoutEffect(() => {
      grouped = resolved;
      itemRows = rows;
    });

    return null;
  }

  it('returns null without groups', async () => {
    await render(<Probe groups={undefined} items={flatten(createGroups([2]))} />);

    expect(grouped).toBe(null);
  });

  it('interleaves a header before each group, empty groups included', async () => {
    const groups = createGroups([2, 0, 1]);
    await render(<Probe groups={groups} items={flatten(groups)} />);

    const projection = grouped!;
    expect(projection.rows.map((row) => row.id)).toEqual([
      'group-header:number:0',
      'string:item-0',
      'string:item-1',
      'group-header:number:1',
      'group-header:number:2',
      'string:item-2',
    ]);
    expect(projection.itemToRowIndex).toEqual([1, 2, 5]);
    expect(projection.itemCountBeforeRow).toEqual([0, 0, 1, 2, 2, 2, 3]);
    expect(projection.rowToGroupIndex).toEqual([0, 0, 0, 1, 2, 2]);
    expect(projection.groups.map((group) => group.itemStart)).toEqual([0, 2, 2]);
    expect(projection.groups.map((group) => group.itemEnd)).toEqual([2, 2, 3]);
    expect(projection.groups.map((group) => group.headerRowIndex)).toEqual([0, 3, 4]);
  });

  it('reuses the item rows by identity', async () => {
    const groups = createGroups([1, 1]);
    await render(<Probe groups={groups} items={flatten(groups)} />);

    expect(grouped!.rows[1]).toBe(itemRows[0]);
    expect(grouped!.rows[3]).toBe(itemRows[1]);
  });

  it('keys headers by the group key, keeping numbers and strings apart', async () => {
    const groups = createGroups([1, 1], ['1', 'x']);
    await render(
      <Probe
        getGroupKey={(group, ...rest) => (rest.length === 0 && group.key === '1' ? 1 : 'x')}
        groups={groups}
        items={flatten(groups)}
      />,
    );

    expect(grouped!.rows[0].id).toBe('group-header:number:1');
    expect(grouped!.rows[2].id).toBe('group-header:string:x');
  });

  it('keeps the projection when a fresh but equal partition arrives', async () => {
    const groups = createGroups([2, 1]);
    const items = flatten(groups);
    const { setProps } = await render(<Probe groups={groups} items={items} />);
    const first = grouped;

    await setProps({ groups: groups.map((group) => ({ ...group })) });

    expect(grouped).toBe(first);
  });

  it('assigns each group key an ordinal that survives reordering', async () => {
    const groups = createGroups([1, 1], ['a', 'b']);
    const getGroupKey = (group: Group<Item>) => group.key as string;
    const { setProps } = await render(
      <Probe getGroupKey={getGroupKey} groups={groups} items={flatten(groups)} />,
    );

    const ordinalOfB = grouped!.groups[1].ordinal;

    const reordered = [groups[1], groups[0]];
    await setProps({ groups: reordered, items: flatten(reordered) });

    expect(grouped!.groups[0].key).toBe('string:b');
    expect(grouped!.groups[0].ordinal).toBe(ordinalOfB);
  });

  it('warns about duplicate group keys', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const groups = createGroups([1, 1]);
      await render(<Probe getGroupKey={() => 'same'} groups={groups} items={flatten(groups)} />);

      expect(warnSpy.mock.calls.map(([message]) => String(message)).join('\n')).toContain(
        'duplicate group key `same`',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('falls back to the flat rows when the groups do not cover the items', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const groups = createGroups([2, 1]);
      await render(<Probe groups={groups} items={flatten(groups).slice(0, 2)} />);

      expect(grouped).toBe(null);
      expect(warnSpy.mock.calls.map(([message]) => String(message)).join('\n')).toContain(
        'describe different collections',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });
});
