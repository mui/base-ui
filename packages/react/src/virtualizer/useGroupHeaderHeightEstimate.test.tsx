import * as React from 'react';
import { expect, describe, it, vi } from 'vitest';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { createRenderer } from '#test-utils';
import type { Group } from '../internals/resolveValueLabel';
import { useGroupedRowModels, useRowModels } from '../internals/virtualization/useRowModels';
import {
  useGroupHeaderHeightEstimate,
  type GroupHeaderHeightEstimate,
} from './useGroupHeaderHeightEstimate';

interface Item {
  id: string;
}

function createGroups(sizes: number[]): Group<Item>[] {
  let next = 0;
  return sizes.map((size, groupIndex) => ({
    height: (groupIndex + 1) * 10,
    items: Array.from({ length: size }, () => {
      const item = { id: `item-${next}` };
      next += 1;
      return item;
    }),
  }));
}

describe('useGroupHeaderHeightEstimate', () => {
  const { render } = createRenderer();

  let estimate: GroupHeaderHeightEstimate;

  function Probe(props: {
    estimatedGroupHeaderHeight?: number | ((group: Group<Item>, groupIndex: number) => number);
    groups: Group<Item>[];
    staticEstimatedItemHeight?: number | null;
  }) {
    const items = props.groups.flatMap((group) => group.items);
    const itemRows = useRowModels<Item>({ getItemKey: (item) => item.id, items });
    const grouped = useGroupedRowModels<Item>({
      getGroupKey: undefined,
      groups: props.groups,
      itemRows,
    });
    const resolved = useGroupHeaderHeightEstimate<Item>({
      estimatedGroupHeaderHeight: props.estimatedGroupHeaderHeight,
      grouped,
      groups: props.groups,
      staticEstimatedItemHeight:
        props.staticEstimatedItemHeight === undefined ? 20 : props.staticEstimatedItemHeight,
    });

    useIsoLayoutEffect(() => {
      estimate = resolved;
    });

    return null;
  }

  it('defaults to the static item estimate', async () => {
    await render(<Probe groups={createGroups([1, 1])} />);

    expect(estimate.getEstimatedGroupHeaderHeight(0)).toBe(20);
  });

  it('falls back to the library default when the item estimate is per item', async () => {
    await render(<Probe groups={createGroups([1, 1])} staticEstimatedItemHeight={null} />);

    expect(estimate.getEstimatedGroupHeaderHeight(0)).toBe(32);
  });

  it('uses a static header estimate as given, never below one pixel', async () => {
    await render(<Probe estimatedGroupHeaderHeight={0} groups={createGroups([1])} />);

    expect(estimate.getEstimatedGroupHeaderHeight(0)).toBe(1);
  });

  it('resolves a per-group estimate with the group and its index', async () => {
    const estimatedGroupHeaderHeight = vi.fn(
      (group: Group<Item>, groupIndex: number) => (group.height as number) + groupIndex,
    );
    const groups = createGroups([1, 1]);
    await render(<Probe estimatedGroupHeaderHeight={estimatedGroupHeaderHeight} groups={groups} />);

    expect(estimate.getEstimatedGroupHeaderHeight(0)).toBe(10);
    expect(estimate.getEstimatedGroupHeaderHeight(1)).toBe(21);
    expect(estimatedGroupHeaderHeight).toHaveBeenCalledTimes(2);
  });

  it('derives per-group estimates once per collection, not per callback identity', async () => {
    const groups = createGroups([1, 1]);
    const calls: number[] = [];
    function Test() {
      const [, rerender] = React.useReducer((value: number) => value + 1, 0);
      React.useEffect(() => {
        rerender();
      }, []);
      return (
        <Probe
          estimatedGroupHeaderHeight={(group) => {
            calls.push(1);
            return group.height as number;
          }}
          groups={groups}
        />
      );
    }

    await render(<Test />);

    expect(calls).toHaveLength(2);
  });

  it('derives the estimates again when the groups change but keep their shape', async () => {
    const groups = createGroups([1, 1]);
    const { setProps } = await render(
      <Probe estimatedGroupHeaderHeight={(group) => group.height as number} groups={groups} />,
    );

    expect(estimate.getEstimatedGroupHeaderHeight(0)).toBe(10);

    // Same keys, same items, so the grouped projection is kept; the estimate must still see the
    // new group objects.
    await setProps({ groups: groups.map((group) => ({ ...group, height: 200 })) });

    expect(estimate.getEstimatedGroupHeaderHeight(0)).toBe(200);
  });

  it('derives the estimates again after invalidation', async () => {
    let height = 10;
    const groups = createGroups([1]);
    const { setProps } = await render(
      <Probe estimatedGroupHeaderHeight={() => height} groups={groups} />,
    );

    expect(estimate.getEstimatedGroupHeaderHeight(0)).toBe(10);

    height = 50;
    estimate.invalidate();
    await setProps({ groups: [...groups] });

    expect(estimate.getEstimatedGroupHeaderHeight(0)).toBe(50);
  });
});
