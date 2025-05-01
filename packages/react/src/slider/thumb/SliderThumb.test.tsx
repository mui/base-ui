import * as React from 'react';
import { expect } from 'chai';
import { stub } from 'sinon';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { Slider } from '@base-ui-components/react/slider';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { isWebKit } from '../../utils/detectBrowser';

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

describe('<Slider.Thumb />', () => {
  const { render } = createRenderer();

  describeConformance(<Slider.Thumb />, () => ({
    render: (node) => {
      return render(<Slider.Root>{node}</Slider.Root>);
    },
    refInstanceof: window.HTMLDivElement,
  }));

  /**
   * Browser tests render with 1024px width by default, so most tests here set
   * the component to `width: 100px` to make the asserted values more readable.
   */
  describe.skipIf(isJSDOM || isWebKit() || typeof Touch === 'undefined')(
    'positioning styles',
    () => {
      describe('positions the thumb when dragged', () => {
        it('single thumb', async () => {
          const { getByTestId } = await render(
            <Slider.Root
              style={{
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

          expect(thumbStyles.getPropertyValue('left')).to.equal('200px');
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

          expect(computedStyles.thumb2.getPropertyValue('left')).to.equal('700px');
          fireEvent.touchEnd(
            document.body,
            createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]),
          );
          expect(computedStyles.thumb1.getPropertyValue('left')).to.equal('200px');
          expect(computedStyles.thumb2.getPropertyValue('left')).to.equal('700px');
        });

        it('thumbs cannot be dragged past each other', async () => {
          const { getByTestId } = await render(
            <Slider.Root
              defaultValue={[20, 40]}
              style={{
                width: '1000px',
              }}
            >
              <Slider.Control data-testid="control">
                <Slider.Track>
                  <Slider.Indicator />
                  <Slider.Thumb data-testid="thumb1" />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>,
          );

          const sliderControl = getByTestId('control');

          const computedStyles = getComputedStyle(getByTestId('thumb1'));

          stub(sliderControl, 'getBoundingClientRect').callsFake(
            () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
          );

          fireEvent.touchStart(
            sliderControl,
            createTouches([{ identifier: 1, clientX: 200, clientY: 0 }]),
          );
          fireEvent.touchMove(
            document.body,
            createTouches([{ identifier: 1, clientX: 600, clientY: 0 }]),
          );

          expect(computedStyles.getPropertyValue('left')).to.equal('400px');
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

      it('thumb should not go out of bounds when the controlled value goes out of bounds', async () => {
        function App() {
          const [val, setVal] = React.useState(50);
          return (
            <React.Fragment>
              <button onClick={() => setVal(119.9)}>max</button>
              <button onClick={() => setVal(-7.31)}>min</button>
              <Slider.Root
                value={val}
                onValueChange={setVal}
                min={0}
                max={100}
                style={{ width: '100px' }}
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
        const { user } = await render(<App />);

        const thumbStyles = getComputedStyle(screen.getByTestId('thumb'));
        expect(thumbStyles.getPropertyValue('left')).to.equal('50px');

        await user.click(screen.getByRole('button', { name: 'max' }));
        expect(thumbStyles.getPropertyValue('left')).to.equal('100px');

        await user.click(screen.getByRole('button', { name: 'min' }));
        expect(thumbStyles.getPropertyValue('left')).to.equal('0px');
      });
    },
  );
});
