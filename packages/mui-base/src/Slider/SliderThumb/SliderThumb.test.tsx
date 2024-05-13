import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Slider from '@base_ui/react/Slider';
import { SliderProvider, type SliderProviderValue } from '@base_ui/react/Slider';
import { describeConformance } from '../../../test/describeConformance';

const NOOP = () => {};

describe('<Slider.Thumb />', () => {
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
      newValuePercent: 0,
    }),
    handleValueChange: NOOP,
    isRtl: false,
    largeStep: 10,
    max: 100,
    min: 0,
    open: -1,
    orientation: 'horizontal',
    ownerState: {
      activeThumbIndex: -1,
      disabled: false,
      dragging: false,
      isRtl: false,
      min: 0,
      max: 100,
      orientation: 'horizontal',
      step: 1,
      values: [0],
    },
    percentageValues: [0],
    scale: (val) => val,
    setActive: NOOP,
    setDragging: NOOP,
    setOpen: NOOP,
    setValueState: NOOP,
    step: 1,
    subitems: new Map(),
    values: [0],
  };

  describeConformance(<Slider.Thumb />, () => ({
    inheritComponent: 'span',
    render: (node) => {
      const { container, ...other } = render(
        <SliderProvider value={testProviderValue}>{node}</SliderProvider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLSpanElement,
    skip: [
      'reactTestRenderer', // Need to be wrapped with SliderProvider
      'propsSpread', // TODO: fix after relocating the <input/>
      'renderProp', // TODO: fix after relocating the <input/>
    ],
  }));
});
