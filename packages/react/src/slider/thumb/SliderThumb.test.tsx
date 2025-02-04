import * as React from 'react';
import { expect } from 'chai';
import { stub } from 'sinon';
import { fireEvent } from '@mui/internal-test-utils';
import { Slider } from '@base-ui-components/react/slider';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { SliderRootContext } from '../root/SliderRootContext';
import { NOOP } from '../../utils/noop';

type Touches = Array<Pick<Touch, 'identifier' | 'clientX' | 'clientY'>>;

const GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL = {
  width: 1000,
  height: 10,
  bottom: 10,
  left: 0,
  x: 0,
  y: 0,
  top: 0,
  right: 0,
  toJSON() {},
};

function createTouches(touches: Touches) {
  return {
    changedTouches: touches.map(
      (touch) =>
        new Touch({
          target: document.body,
          ...touch,
        }),
    ),
  };
}

const testRootContext: SliderRootContext = {
  active: -1,
  commitValue: NOOP,
  dragging: false,
  disabled: false,
  getFingerState: () => ({
    value: 0,
    valueRescaled: 0,
    percentageValues: [0],
    thumbIndex: 0,
  }),
  handleInputChange: NOOP,
  largeStep: 10,
  lastChangedValueRef: { current: null },
  thumbMap: new Map(),
  max: 100,
  min: 0,
  minStepsBetweenValues: 0,
  name: '',
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
    filled: false,
    focused: false,
  },
  percentageValues: [0],
  registerSliderControl: NOOP,
  setActive: NOOP,
  setDragging: NOOP,
  setPercentageValues: NOOP,
  setThumbMap: NOOP,
  setValue: NOOP,
  step: 1,
  tabIndex: null,
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
    refInstanceof: window.HTMLDivElement,
  }));

  describe.skipIf(isJSDOM)('internal styles', () => {
    it('positions the thumb when the value changes', async () => {
      const { getByTestId } = await render(
        <Slider.Root
          style={{
            // browser tests render with 1024px width by default
            // this is just to make the values asserted more readable
            width: '1000px',
          }}
        >
          <Slider.Control data-testid="control">
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb data-testid="thumb" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>,
      );

      const sliderControl = getByTestId('control');

      const thumbStyles = getComputedStyle(getByTestId('thumb'));

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]),
      );
      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 199, clientY: 0 }]),
      );
      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 199, clientY: 0 }]),
      );

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 199, clientY: 0 }]),
      );

      expect(thumbStyles.getPropertyValue('left')).to.equal('199px');
      fireEvent.touchEnd(document.body, createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]));
      expect(thumbStyles.getPropertyValue('left')).to.equal('200px');
    });
  });
});
