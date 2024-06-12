import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import * as Slider from '@base_ui/react/Slider';
import { SliderProvider, type SliderProviderValue } from '@base_ui/react/Slider';
import { describeConformance } from '../../../test/describeConformance';

const NOOP = () => {};

describe('<Slider.Output />', () => {
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
    isRtl: false,
    largeStep: 10,
    max: 100,
    min: 0,
    minDifferenceBetweenValues: 1,
    open: -1,
    orientation: 'horizontal',
    ownerState: {
      activeThumbIndex: -1,
      disabled: false,
      dragging: false,
      isRtl: false,
      max: 100,
      min: 0,
      minDifferenceBetweenValues: 1,
      orientation: 'horizontal',
      step: 1,
      values: [0],
    },
    percentageValues: [0],
    registerSliderTrack: NOOP,
    scale: (val) => val,
    setActive: NOOP,
    setDragging: NOOP,
    setOpen: NOOP,
    setValueState: NOOP,
    step: 1,
    subitems: new Map(),
    values: [0],
  };

  describeConformance(<Slider.Output />, () => ({
    inheritComponent: 'output',
    render: (node) => {
      const { container, ...other } = render(
        <SliderProvider value={testProviderValue}>{node}</SliderProvider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLOutputElement,
    skip: [
      'reactTestRenderer', // Need to be wrapped with SliderProvider
    ],
  }));

  it('renders a single value', () => {
    const { getByTestId } = render(
      <Slider.Root defaultValue={40}>
        <Slider.Output data-testid="output" />
      </Slider.Root>,
    );
    const sliderOutput = getByTestId('output');

    expect(sliderOutput).to.have.text('40');
  });

  it('renders a range', () => {
    const { getByTestId } = render(
      <Slider.Root defaultValue={[40, 65]}>
        <Slider.Output data-testid="output" />
      </Slider.Root>,
    );
    const sliderOutput = getByTestId('output');

    expect(sliderOutput).to.have.text('40 – 65');
  });

  it('renders all thumb values', () => {
    const { getByTestId } = render(
      <Slider.Root defaultValue={[40, 60, 80, 95]}>
        <Slider.Output data-testid="output" />
      </Slider.Root>,
    );
    const sliderOutput = getByTestId('output');

    expect(sliderOutput).to.have.text('40 – 60 – 80 – 95');
  });
});
