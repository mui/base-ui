import * as React from 'react';
import { expect } from 'vitest';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { createRenderer } from '#test-utils';
import { useRowModels } from '../internals/virtualization/useRowModels';
import { useItemHeightEstimate, type ItemHeightEstimate } from './useItemHeightEstimate';

interface Item {
  id: string;
  height: number;
}

function createItems(heights: number[]) {
  return heights.map((height, index) => ({ id: `item-${index}`, height }));
}

describe('useItemHeightEstimate', () => {
  const { render } = createRenderer();

  let estimate: ItemHeightEstimate;

  function Probe(props: {
    estimatedItemHeight?: number | ((item: Item, index: number) => number);
    items: Item[];
  }) {
    const rows = useRowModels<Item>({ getItemKey: (item) => item.id, items: props.items });
    const resolved = useItemHeightEstimate<Item>({
      estimatedItemHeight: props.estimatedItemHeight,
      items: props.items,
      rows,
    });

    useIsoLayoutEffect(() => {
      estimate = resolved;
    });

    return null;
  }

  it('assumes a default height when no estimate is given', async () => {
    await render(<Probe items={createItems([10, 20])} />);

    expect(estimate.staticEstimatedItemHeight).toBe(32);
    expect(estimate.defaultEstimatedItemHeight).toBe(32);
    expect(estimate.getEstimatedItemHeight(0)).toBe(32);
  });

  it('applies a constant estimate to every row', async () => {
    await render(<Probe estimatedItemHeight={50} items={createItems([10, 20, 30])} />);

    expect(estimate.staticEstimatedItemHeight).toBe(50);
    expect(estimate.defaultEstimatedItemHeight).toBe(50);
    expect(estimate.getEstimatedItemHeight(2)).toBe(50);
  });

  it('never estimates a row below one pixel', async () => {
    await render(<Probe estimatedItemHeight={0} items={createItems([10])} />);

    expect(estimate.defaultEstimatedItemHeight).toBe(1);
    expect(estimate.getEstimatedItemHeight(0)).toBe(1);
  });

  it('resolves a per-item estimate against each row', async () => {
    await render(
      <Probe estimatedItemHeight={(item) => item.height} items={createItems([10, 20, 30])} />,
    );

    // Only a collection-wide estimate can be refined into a running average.
    expect(estimate.staticEstimatedItemHeight).toBe(null);
    expect(estimate.getEstimatedItemHeight(0)).toBe(10);
    expect(estimate.getEstimatedItemHeight(2)).toBe(30);
    // A row this collection does not have.
    expect(estimate.getEstimatedItemHeight(5)).toBe(1);
  });

  it('falls back to one pixel for an empty collection with a per-item estimate', async () => {
    await render(<Probe estimatedItemHeight={(item) => item.height} items={[]} />);

    expect(estimate.defaultEstimatedItemHeight).toBe(1);
  });

  it('does not re-derive per-item estimates while the collection is unchanged', async () => {
    const items = createItems([10, 20, 30]);
    const estimateItemHeight = vi.fn((item: Item) => item.height);
    const { setProps } = await render(
      <Probe estimatedItemHeight={estimateItemHeight} items={items} />,
    );

    expect(estimateItemHeight).toHaveBeenCalledTimes(3);

    // A new array holding the same items describes the same collection, so nothing is re-derived.
    await setProps({ items: [...items] });

    expect(estimateItemHeight).toHaveBeenCalledTimes(3);
  });

  it('keeps the resolved estimates when a replacement collection is just as tall', async () => {
    const estimateItemHeight = vi.fn((item: Item) => item.height);
    const { setProps } = await render(
      <Probe estimatedItemHeight={estimateItemHeight} items={createItems([10, 20, 30])} />,
    );

    const initialEstimate = estimate.getEstimatedItemHeight;

    await setProps({ items: createItems([10, 20, 30]) });

    // The estimates were derived again for the new items, but they resolved to the same heights,
    // and a re-derived set of equal numbers is not a geometry change for the engine to rehydrate.
    expect(estimateItemHeight).toHaveBeenCalledTimes(6);
    expect(estimate.getEstimatedItemHeight).toBe(initialEstimate);

    await setProps({ items: createItems([10, 20, 99]) });

    expect(estimate.getEstimatedItemHeight).not.toBe(initialEstimate);
    expect(estimate.getEstimatedItemHeight(2)).toBe(99);
  });

  it('re-derives per-item estimates after an invalidation', async () => {
    const items = createItems([10, 20, 30]);
    const estimateItemHeight = vi.fn((item: Item) => item.height);
    const { setProps } = await render(
      <Probe estimatedItemHeight={estimateItemHeight} items={items} />,
    );

    expect(estimateItemHeight).toHaveBeenCalledTimes(3);

    estimate.invalidate();
    await setProps({ items: [...items] });

    expect(estimateItemHeight).toHaveBeenCalledTimes(6);
  });
});
