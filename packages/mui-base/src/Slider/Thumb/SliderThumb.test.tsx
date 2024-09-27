import * as React from 'react';
import * as Slider from '@base_ui/react/Slider';
import { createRenderer, describeConformance } from '#test-utils';
import { SliderContext } from '../Root/SliderContext';
import { NOOP } from '../../utils/noop';
import type { SliderRoot } from '../Root/SliderRoot';

const testRootContext: SliderRoot.Context = {
  active: -1,
  areValuesEqual: () => true,
  axis: 'horizontal',
  changeValue: NOOP,
  direction: 'ltr',
  dragging: false,
  disabled: false,
  getFingerNewValue: () => ({
    newValue: 0,
    activeIndex: 0,
    newPercentageValue: 0,
  }),
  handleValueChange: NOOP,
  largeStep: 10,
  inputIdMap: new Map(),
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
    valid: null,
    dirty: false,
    touched: false,
  },
  percentageValues: [0],
  registerInputId: () => ({
    deregister: NOOP,
  }),
  registerSliderControl: NOOP,
  setActive: NOOP,
  setDragging: NOOP,
  setValueState: NOOP,
  step: 1,
  thumbRefs: { current: [] },
  values: [0],
};

describe('<Slider.Thumb />', () => {
  const { render } = createRenderer();

  describeConformance(<Slider.Thumb />, () => ({
    render: (node) => {
      return render(
        <SliderContext.Provider value={testRootContext}>{node}</SliderContext.Provider>,
      );
    },
    refInstanceof: window.HTMLSpanElement,
  }));
});
