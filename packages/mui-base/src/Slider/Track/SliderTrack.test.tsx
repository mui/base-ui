import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Slider from '@base_ui/react/Slider';
import { SliderProvider, type SliderProviderValue } from '@base_ui/react/Slider';
import { describeConformance } from '../../../test/describeConformance';

const NOOP = () => {};

describe('<Slider.Track />', () => {
  const { render } = createRenderer();

  const testProviderValue: SliderProviderValue = {
    active: -1,
    areValuesEqual: () => true,
    axis: 'horizontal',
    changeValue: NOOP,
    compoundComponentContextValue: {
      registerItem: () => ({ id: 0, deregister: () => {} }),
      getItemIndex: () => 0,
      totalSubitemCount: 1,
    },
    dragging: false,
    disabled: false,
    getFingerNewValue: () => ({
      newValue: 0,
      activeIndex: 0,
      newPercentageValue: 0,
    }),
    handleValueChange: NOOP,
    direction: 'ltr',
    largeStep: 10,
    max: 100,
    min: 0,
    minStepsBetweenValues: 0,
    orientation: 'horizontal',
    ownerState: {
      activeThumbIndex: -1,
      disabled: false,
      dragging: false,
      direction: 'ltr',
      max: 100,
      min: 0,
      minStepsBetweenValues: 0,
      orientation: 'horizontal',
      step: 1,
      values: [0],
    },
    percentageValues: [0],
    registerSliderControl: NOOP,
    setActive: NOOP,
    setDragging: NOOP,
    setValueState: NOOP,
    step: 1,
    subitems: new Map(),
    values: [0],
  };

  describeConformance(<Slider.Track />, () => ({
    render: (node) => {
      const { container, ...other } = render(
        <SliderProvider value={testProviderValue}>{node}</SliderProvider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLSpanElement,
  }));
});
