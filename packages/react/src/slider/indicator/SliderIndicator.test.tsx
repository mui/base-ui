import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';
import { createRenderer, describeConformance } from '#test-utils';
import { SliderRootContext } from '../root/SliderRootContext';
import { NOOP } from '../../utils/noop';

const testRootContext: SliderRootContext = {
  active: -1,
  handleInputChange: NOOP,
  direction: 'ltr',
  dragging: false,
  disabled: false,
  getFingerState: () => ({
    value: 0,
    closestThumbIndex: 0,
    percentageValue: 0,
  }),
  setValue: NOOP,
  largeStep: 10,
  thumbMap: new Map(),
  max: 100,
  min: 0,
  minStepsBetweenValues: 0,
  onValueCommitted: NOOP,
  orientation: 'horizontal',
  state: {
    activeThumbIndex: -1,
    disabled: false,
    dragging: false,
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
  registerSliderControl: NOOP,
  setActive: NOOP,
  setDragging: NOOP,
  setThumbMap: NOOP,
  step: 1,
  thumbRefs: { current: [] },
  values: [0],
};

describe('<Slider.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Slider.Indicator />, () => ({
    render: (node) => {
      return render(
        <SliderRootContext.Provider value={testRootContext}>{node}</SliderRootContext.Provider>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
