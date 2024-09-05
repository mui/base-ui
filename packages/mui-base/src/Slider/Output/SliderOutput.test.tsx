import * as React from 'react';
import { expect } from 'chai';
import * as Slider from '@base_ui/react/Slider';
import { createRenderer, describeConformance } from '#test-utils';
import { SliderProvider } from '../Root/SliderProvider';

const NOOP = () => {};

describe('<Slider.Output />', () => {
  const { render } = createRenderer();

  const testProviderValue: SliderProvider.Value = {
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
      valid: null,
      dirty: false,
      touched: false,
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

  describeConformance(<Slider.Output />, () => ({
    render: (node) => {
      return render(<SliderProvider value={testProviderValue}>{node}</SliderProvider>);
    },
    refInstanceof: window.HTMLOutputElement,
  }));

  it('renders a single value', async () => {
    const { getByTestId } = await render(
      <Slider.Root defaultValue={40}>
        <Slider.Output data-testid="output" />
      </Slider.Root>,
    );
    const sliderOutput = getByTestId('output');

    expect(sliderOutput).to.have.text('40');
  });

  it('renders a range', async () => {
    const { getByTestId } = await render(
      <Slider.Root defaultValue={[40, 65]}>
        <Slider.Output data-testid="output" />
      </Slider.Root>,
    );
    const sliderOutput = getByTestId('output');

    expect(sliderOutput).to.have.text('40 – 65');
  });

  it('renders all thumb values', async () => {
    const { getByTestId } = await render(
      <Slider.Root defaultValue={[40, 60, 80, 95]}>
        <Slider.Output data-testid="output" />
      </Slider.Root>,
    );
    const sliderOutput = getByTestId('output');

    expect(sliderOutput).to.have.text('40 – 60 – 80 – 95');
  });
});
