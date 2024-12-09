import * as React from 'react';
import { expect } from 'chai';
import { Slider } from '@base-ui-components/react/slider';
import { createRenderer, describeConformance } from '#test-utils';
import { SliderRootContext } from '../root/SliderRootContext';
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

describe('<Slider.Output />', () => {
  const { render } = createRenderer();

  describeConformance(<Slider.Output />, () => ({
    render: (node) => {
      return render(
        <SliderRootContext.Provider value={testRootContext}>{node}</SliderRootContext.Provider>,
      );
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
