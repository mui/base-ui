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

  describe.skipIf(isJSDOM)('positioning styles', () => {
    describe('positions the thumb when dragged', () => {
      it('single thumb', async () => {
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
        fireEvent.touchEnd(
          document.body,
          createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]),
        );
        expect(thumbStyles.getPropertyValue('left')).to.equal('200px');
      });

      it('multiple thumbs', async () => {
        const { getByTestId, getAllByTestId } = await render(
          <Slider.Root
            defaultValue={[20, 40]}
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
                <Slider.Thumb data-testid="thumb" />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>,
        );

        const sliderControl = getByTestId('control');

        const computedStyles = {
          thumb1: getComputedStyle(getAllByTestId('thumb')[0]),
          thumb2: getComputedStyle(getAllByTestId('thumb')[1]),
        };

        stub(sliderControl, 'getBoundingClientRect').callsFake(
          () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
        );

        fireEvent.touchStart(
          sliderControl,
          createTouches([{ identifier: 1, clientX: 400, clientY: 0 }]),
        );
        fireEvent.touchMove(
          document.body,
          createTouches([{ identifier: 1, clientX: 699, clientY: 0 }]),
        );
        fireEvent.touchMove(
          document.body,
          createTouches([{ identifier: 1, clientX: 699, clientY: 0 }]),
        );

        fireEvent.touchMove(
          document.body,
          createTouches([{ identifier: 1, clientX: 699, clientY: 0 }]),
        );

        expect(computedStyles.thumb2.getPropertyValue('left')).to.equal('699px');
        fireEvent.touchEnd(
          document.body,
          createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]),
        );
        expect(computedStyles.thumb1.getPropertyValue('left')).to.equal('200px');
        expect(computedStyles.thumb2.getPropertyValue('left')).to.equal('700px');
      });
    });

    describe('positions the thumb when the controlled value changes externally', () => {
      it('single thumb', async () => {
        function App() {
          const [val, setVal] = React.useState(20);
          return (
            <React.Fragment>
              <button onClick={() => setVal(55)} />
              <Slider.Root
                value={val}
                onValueChange={(newVal) => setVal(newVal as number)}
                style={{
                  // browser tests render with 1024px width by default
                  // this is just to make the values asserted more readable
                  width: '100px',
                }}
              >
                <Slider.Control data-testid="control">
                  <Slider.Track>
                    <Slider.Indicator />
                    <Slider.Thumb data-testid="thumb" />
                  </Slider.Track>
                </Slider.Control>
              </Slider.Root>
            </React.Fragment>
          );
        }
        const { getByTestId, getByRole } = await render(<App />);

        const thumbStyles = getComputedStyle(getByTestId('thumb'));
        expect(thumbStyles.getPropertyValue('left')).to.equal('20px');

        fireEvent.click(getByRole('button'));
        expect(thumbStyles.getPropertyValue('left')).to.equal('55px');
      });

      it('multiple thumbs', async () => {
        function App() {
          const [val, setVal] = React.useState([20, 50]);
          return (
            <React.Fragment>
              <button onClick={() => setVal([33, 72])} />
              <Slider.Root
                value={val}
                onValueChange={(newVal) => setVal(newVal as number[])}
                style={{
                  // browser tests render with 1024px width by default
                  // this is just to make the values asserted more readable
                  width: '100px',
                }}
              >
                <Slider.Control data-testid="control">
                  <Slider.Track>
                    <Slider.Indicator />
                    <Slider.Thumb data-testid="thumb" />
                    <Slider.Thumb data-testid="thumb" />
                  </Slider.Track>
                </Slider.Control>
              </Slider.Root>
            </React.Fragment>
          );
        }
        const { getAllByTestId, getByRole } = await render(<App />);

        const computedStyles = {
          thumb1: getComputedStyle(getAllByTestId('thumb')[0]),
          thumb2: getComputedStyle(getAllByTestId('thumb')[1]),
        };

        expect(computedStyles.thumb1.getPropertyValue('left')).to.equal('20px');
        expect(computedStyles.thumb2.getPropertyValue('left')).to.equal('50px');

        fireEvent.click(getByRole('button'));
        expect(computedStyles.thumb1.getPropertyValue('left')).to.equal('33px');
        expect(computedStyles.thumb2.getPropertyValue('left')).to.equal('72px');
      });
    });
  });
});
