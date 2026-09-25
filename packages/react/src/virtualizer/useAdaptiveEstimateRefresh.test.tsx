import * as React from 'react';
import { expect, describe, it, vi } from 'vitest';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { createRenderer } from '#test-utils';
import { advanceReactClock } from '../../test/advanceReactClock';
import { useRowModels } from '../internals/virtualization/useRowModels';
import {
  useAdaptiveEstimate,
  useAdaptiveEstimateRefresh,
  type AdaptiveEstimate,
} from './useAdaptiveEstimate';
import { SCROLL_IDLE_MS, type ScrollGesture } from './useScrollGesture';

const idleGesture = {
  isScrolling: () => false,
  isScrollbarDrag: () => false,
} as unknown as ScrollGesture;

describe('useAdaptiveEstimateRefresh', () => {
  const { clock, render } = createRenderer({ clockOptions: { shouldAdvanceTime: true } });

  clock.withFakeTimers();

  let adaptive: AdaptiveEstimate;

  function Probe(props: {
    items: string[];
    measuredHeight: number;
    rowsMeta: object;
    settleGeometry: () => void;
  }) {
    const rows = useRowModels<string>({ getItemKey: undefined, items: props.items });
    const resolved = useAdaptiveEstimate({ rows, staticEstimatedItemHeight: 32 });
    const { measuredHeight } = props;

    useAdaptiveEstimateRefresh({
      adaptive: resolved,
      defaultEstimatedItemHeight: 32,
      demoteRowHeight: () => {},
      gesture: idleGesture,
      readMeasuredHeight: () => measuredHeight,
      readMeasuredHeights: function* readMeasuredHeights() {
        for (const row of rows) {
          yield [row.id, measuredHeight] as [React.Key, number];
        }
      },
      renderContext: { firstRowIndex: 0, lastRowIndex: rows.length },
      rows,
      rowsMeta: props.rowsMeta,
      settleGeometry: props.settleGeometry,
    });

    useIsoLayoutEffect(() => {
      adaptive = resolved;
    });

    return null;
  }

  it('announces an exhausted refinement once, and refines once samples suffice', async () => {
    const settleGeometry = vi.fn();
    const { setProps } = await render(
      <Probe
        items={['a', 'b']}
        measuredHeight={20}
        rowsMeta={{}}
        settleGeometry={settleGeometry}
      />,
    );

    // Two rows, both measured and sampled, are one short of an average: nothing on hand can
    // refine the estimate, which is said once.
    await advanceReactClock(clock, SCROLL_IDLE_MS);
    expect(adaptive.isRefinementExhausted()).toBe(true);
    expect(adaptive.readEstimate()).toBe(null);
    expect(settleGeometry).toHaveBeenCalledTimes(1);

    // The geometry that announcement republished re-arms the settled pass, which must not say it
    // again — or the two would take turns for ever.
    await setProps({ rowsMeta: {} });
    await advanceReactClock(clock, SCROLL_IDLE_MS);
    expect(settleGeometry).toHaveBeenCalledTimes(1);

    // A third row brings a third sample, and with it an average.
    await setProps({ items: ['a', 'b', 'c'], rowsMeta: {} });
    await advanceReactClock(clock, SCROLL_IDLE_MS);
    expect(adaptive.isRefinementExhausted()).toBe(false);
    expect(adaptive.readEstimate()).toBe(20);
    expect(settleGeometry).toHaveBeenCalledTimes(2);
  });
});
