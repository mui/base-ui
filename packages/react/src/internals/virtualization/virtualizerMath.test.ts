import { expect } from 'vitest';
import {
  getOffsetForIndex,
  getVirtualizerMeasurements,
  getVirtualizerRange,
} from './virtualizerMath';

describe('virtualizer math', () => {
  it('builds measurements from estimates, measurements, and padding', () => {
    const { measurements, totalSize } = getVirtualizerMeasurements({
      count: 4,
      estimateSize: 10,
      measuredSizes: new Map([[1, 20]]),
      paddingStart: 5,
      paddingEnd: 7,
    });

    expect(measurements).toEqual([
      { index: 0, start: 5, size: 10, end: 15 },
      { index: 1, start: 15, size: 20, end: 35 },
      { index: 2, start: 35, size: 10, end: 45 },
      { index: 3, start: 45, size: 10, end: 55 },
    ]);
    expect(totalSize).toBe(62);
  });

  it('calculates the visible range with overscan', () => {
    const { measurements } = getVirtualizerMeasurements({
      count: 10,
      estimateSize: 10,
    });

    expect(
      getVirtualizerRange({
        measurements,
        scrollOffset: 35,
        viewportSize: 20,
        overscan: 1,
      }),
    ).toEqual({ startIndex: 2, endIndex: 6 });
  });

  it('renders an initial overscanned range before the viewport is measured', () => {
    const { measurements } = getVirtualizerMeasurements({
      count: 10,
      estimateSize: 10,
    });

    expect(
      getVirtualizerRange({
        measurements,
        scrollOffset: 0,
        viewportSize: 0,
        overscan: 3,
      }),
    ).toEqual({ startIndex: 0, endIndex: 3 });
  });

  it('calculates scroll offsets for index alignment', () => {
    const { measurements, totalSize } = getVirtualizerMeasurements({
      count: 10,
      estimateSize: 10,
    });

    expect(
      getOffsetForIndex({
        measurements,
        totalSize,
        index: 5,
        align: 'start',
        scrollOffset: 0,
        viewportSize: 30,
      }),
    ).toBe(50);

    expect(
      getOffsetForIndex({
        measurements,
        totalSize,
        index: 5,
        align: 'end',
        scrollOffset: 0,
        viewportSize: 30,
      }),
    ).toBe(30);

    expect(
      getOffsetForIndex({
        measurements,
        totalSize,
        index: 5,
        align: 'center',
        scrollOffset: 0,
        viewportSize: 30,
      }),
    ).toBe(40);
  });

  it('keeps nearest alignment stable when the item is already visible', () => {
    const { measurements, totalSize } = getVirtualizerMeasurements({
      count: 10,
      estimateSize: 10,
    });

    expect(
      getOffsetForIndex({
        measurements,
        totalSize,
        index: 4,
        align: 'nearest',
        scrollOffset: 30,
        viewportSize: 30,
      }),
    ).toBe(30);
  });
});
