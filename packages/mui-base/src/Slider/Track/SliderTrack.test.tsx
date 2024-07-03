import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Slider from '@base_ui/react/Slider';
import { SliderContext, type SliderContextValue } from '@base_ui/react/Slider';
import { describeConformance } from '../../../test/describeConformance';
import { IndexableMap } from '../../utils/IndexableMap';

const NOOP = () => {};

describe('<Slider.Track />', () => {
  const { render } = createRenderer();

  const testProviderValue: SliderContextValue = {
    active: -1,
    areValuesEqual: () => true,
    axis: 'horizontal',
    changeValue: NOOP,
    compoundParentContext: {
      registerItem: () => ({ deregister: () => {}, index: 0 }),
      getRegisteredItemCount: () => 1,
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
    subitems: new IndexableMap(),
    values: [0],
  };

  describeConformance(<Slider.Track />, () => ({
    inheritComponent: 'span',
    render: (node) => {
      const { container, ...other } = render(
        <SliderContext.Provider value={testProviderValue}>{node}</SliderContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLSpanElement,
  }));
});
