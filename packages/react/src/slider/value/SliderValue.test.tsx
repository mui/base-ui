import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Slider } from '@base-ui-components/react/slider';
import { createRenderer, describeConformance } from '#test-utils';
import { SliderRootContext } from '../root/SliderRootContext';
import { NOOP } from '../../utils/noop';

const testRootContext: SliderRootContext<any> = {
  active: -1,
  handleInputChange: NOOP,
  dragging: false,
  disabled: false,
  getFingerState: () => ({
    value: 0,
    valueRescaled: 0,
    percentageValues: [0],
    thumbIndex: 0,
  }),
  setValue: NOOP,
  largeStep: 10,
  lastChangedValueRef: { current: null },
  thumbMap: new Map(),
  max: 100,
  min: 0,
  minStepsBetweenValues: 0,
  name: '',
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
  setPercentageValues: NOOP,
  setThumbMap: NOOP,
  step: 1,
  tabIndex: null,
  thumbRefs: { current: [] },
  values: [0],
};

describe('<Slider.Value />', () => {
  const { render } = createRenderer();

  describeConformance(<Slider.Value />, () => ({
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
        <Slider.Value data-testid="output" />
      </Slider.Root>,
    );
    const sliderValue = getByTestId('output');

    expect(sliderValue).to.have.text('40');
  });

  it('renders a range', async () => {
    const { getByTestId } = await render(
      <Slider.Root defaultValue={[40, 65]}>
        <Slider.Value data-testid="output" />
      </Slider.Root>,
    );
    const sliderValue = getByTestId('output');

    expect(sliderValue).to.have.text('40 – 65');
  });

  it('renders all thumb values', async () => {
    const { getByTestId } = await render(
      <Slider.Root defaultValue={[40, 60, 80, 95]}>
        <Slider.Value data-testid="output" />
      </Slider.Root>,
    );
    const sliderValue = getByTestId('output');

    expect(sliderValue).to.have.text('40 – 60 – 80 – 95');
  });

  describe('prop: children', () => {
    it('accepts a render function', async () => {
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      };
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v);
      }
      const renderSpy = spy();
      await render(
        <Slider.Root defaultValue={[40, 60]} format={format}>
          <Slider.Value data-testid="output">{renderSpy}</Slider.Value>
        </Slider.Root>,
      );

      expect(renderSpy.lastCall.args[0]).to.deep.equal([formatValue(40), formatValue(60)]);
      expect(renderSpy.lastCall.args[1]).to.deep.equal([40, 60]);
    });
  });
});
