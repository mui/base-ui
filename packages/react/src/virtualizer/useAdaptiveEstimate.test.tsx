import * as React from 'react';
import { expect } from 'vitest';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { createRenderer } from '#test-utils';
import type { VirtualizerItemRowModel, VirtualizerRow } from '../internals/virtualization/types';
import { useRowModels } from '../internals/virtualization/useRowModels';
import { useAdaptiveEstimate, type AdaptiveEstimate } from './useAdaptiveEstimate';

describe('useAdaptiveEstimate', () => {
  const { render } = createRenderer();

  let adaptive: AdaptiveEstimate;
  let rows: VirtualizerRow<VirtualizerItemRowModel<string>>[];

  function Probe(props: { items: string[]; staticEstimatedItemHeight?: number | null }) {
    const resolvedRows = useRowModels<string>({ getItemKey: undefined, items: props.items });
    const resolved = useAdaptiveEstimate({
      rows: resolvedRows,
      staticEstimatedItemHeight:
        props.staticEstimatedItemHeight === undefined ? 32 : props.staticEstimatedItemHeight,
    });

    useIsoLayoutEffect(() => {
      adaptive = resolved;
      rows = resolvedRows;
    });

    return null;
  }

  it('refines only a collection-wide estimate', async () => {
    const { setProps } = await render(<Probe items={['a', 'b']} />);

    expect(adaptive.enabled).toBe(true);

    await setProps({ staticEstimatedItemHeight: null });

    // A per-item estimate encodes knowledge a global average would override.
    expect(adaptive.enabled).toBe(false);
  });

  it('keeps the samples when the collection is unchanged', async () => {
    const items = ['a', 'b', 'c'];
    const { setProps } = await render(<Probe items={items} />);

    await setProps({ items: [...items] });

    expect(adaptive.invalidated).toBe(false);
  });

  it('keeps the samples when the collection is filtered down', async () => {
    const { setProps } = await render(<Probe items={['a', 'b', 'c']} />);

    await setProps({ items: ['b'] });

    expect(adaptive.invalidated).toBe(false);
  });

  it('keeps the samples when the collection grows', async () => {
    const { setProps } = await render(<Probe items={['a', 'b']} />);

    await setProps({ items: ['a', 'b', 'c', 'd'] });

    expect(adaptive.invalidated).toBe(false);
  });

  it('drops the samples when the collection is replaced entirely', async () => {
    const { setProps } = await render(<Probe items={['a', 'b', 'c']} />);

    await setProps({ items: ['x', 'y', 'z'] });

    expect(adaptive.invalidated).toBe(true);
  });

  it('drops the samples when a replacement collection only partly overlaps', async () => {
    const { setProps } = await render(<Probe items={['a', 'b', 'c']} />);

    // Adding and removing IDs in the same update is a partial replacement, even though `c` keeps
    // the two collections overlapping.
    await setProps({ items: ['c', 'x', 'y'] });

    expect(adaptive.invalidated).toBe(true);
  });

  it('drops the samples when the estimate itself changes', async () => {
    const { setProps } = await render(<Probe items={['a', 'b', 'c']} />);

    await setProps({ staticEstimatedItemHeight: 64 });

    expect(adaptive.invalidated).toBe(true);
  });

  it('forgets which rows were measured only when the samples are dropped', async () => {
    const { setProps } = await render(<Probe items={['a', 'b', 'c']} />);

    const measuredRowId = rows[0].id;
    adaptive.markMeasured(measuredRowId);

    await setProps({ items: ['a', 'b'] });

    expect(adaptive.isMeasured(measuredRowId)).toBe(true);

    await setProps({ items: ['x', 'y'] });

    expect(adaptive.isMeasured(measuredRowId)).toBe(false);
  });

  it('forgets which rows were measured on request', async () => {
    await render(<Probe items={['a', 'b', 'c']} />);

    const measuredRowId = rows[0].id;
    adaptive.markMeasured(measuredRowId);
    adaptive.reset();

    expect(adaptive.isMeasured(measuredRowId)).toBe(false);
    expect(adaptive.readEstimate()).toBe(null);
  });
});
