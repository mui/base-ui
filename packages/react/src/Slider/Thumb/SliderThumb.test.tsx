import * as React from 'react';
import { Slider } from '@base-ui-components/react/Slider';
import { createRenderer, describeConformance } from '#test-utils';
import { SliderRootContext } from '../Root/SliderRootContext';
import { NOOP } from '../../utils/noop';

const testRootContext: SliderRootContext = {
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
        <SliderRootContext.Provider value={testRootContext}>{node}</SliderRootContext.Provider>,
      );
    },
    refInstanceof: window.HTMLSpanElement,
  }));
});
