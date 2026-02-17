import { expect } from 'chai';
import * as React from 'react';
import { spy, stub } from 'sinon';
import { expect as expectVitest, vi } from 'vitest';
import { act, flushMicrotasks, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { DirectionProvider, type TextDirection } from '@base-ui/react/direction-provider';
import { Field } from '@base-ui/react/field';
import { Slider } from '@base-ui/react/slider';
import { Form } from '@base-ui/react/form';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { isWebKit } from '@base-ui/utils/detectBrowser';
import { REASONS } from '../../utils/reasons';
import {
  ARROW_RIGHT,
  ARROW_LEFT,
  ARROW_UP,
  ARROW_DOWN,
  HOME,
  END,
} from '../../composite/composite';
import type { Orientation } from '../../utils/types';
import type { SliderRoot } from './SliderRoot';
import { createTouches, getHorizontalSliderRect } from '../utils/test-utils';

const USD_NUMBER_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
};

function TestSlider(props: SliderRoot.Props) {
  return (
    <Slider.Root data-testid="root" {...props}>
      <Slider.Value data-testid="value" />
      <Slider.Control data-testid="control">
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb data-testid="thumb" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}

function TestRangeSlider(props: SliderRoot.Props) {
  return (
    <Slider.Root data-testid="root" {...props}>
      <Slider.Value data-testid="value" />
      <Slider.Control data-testid="control">
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb index={0} data-testid="thumb" />
          <Slider.Thumb index={1} data-testid="thumb" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}

function TestMultiThumbSlider(props: SliderRoot.Props) {
  return (
    <Slider.Root data-testid="root" {...props}>
      <Slider.Value data-testid="value" />
      <Slider.Control data-testid="control">
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb index={0} data-testid="thumb" />
          <Slider.Thumb index={1} data-testid="thumb" />
          <Slider.Thumb index={2} data-testid="thumb" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}

describe.skipIf(typeof Touch === 'undefined')('<Slider.Root />', () => {
  beforeAll(function beforeHook() {
    // PointerEvent not fully implemented in jsdom, causing
    // fireEvent.pointer* to ignore options
    // https://github.com/jsdom/jsdom/issues/2527
    (window as any).PointerEvent = window.MouseEvent;
  });

  const { render } = createRenderer();

  describeConformance(<Slider.Root defaultValue={50} />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it.skipIf(isWebKit)('should not break when initial value is out of range', async () => {
    await render(<TestRangeSlider value={[19, 41]} min={20} max={40} />);

    const sliderControl = screen.getByTestId('control');

    stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

    fireEvent.touchStart(
      sliderControl,
      createTouches([{ identifier: 1, clientX: 100, clientY: 0 }]),
    );

    fireEvent.touchMove(document.body, createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]));
  });

  describe('ARIA attributes', () => {
    it('it has the correct aria attributes', async () => {
      await render(
        <Slider.Root defaultValue={30} aria-labelledby="labelId" data-testid="root">
          <Slider.Value />
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>,
      );

      const root = screen.getByTestId('root');
      const slider = screen.getByRole('slider');

      expect(slider.tagName).to.equal('INPUT');

      expect(root).to.have.attribute('aria-labelledby', 'labelId');

      expect(slider).to.have.attribute('aria-valuenow', '30');
      expect(slider).to.have.attribute('aria-orientation', 'horizontal');
      expect(slider).to.have.attribute('aria-labelledby', 'labelId');
      expect(slider).to.have.attribute('step', '1');
    });

    it('should update aria-valuenow', async () => {
      await render(<TestSlider defaultValue={50} />);
      const slider = screen.getByRole('slider');

      await act(async () => {
        slider.focus();
      });

      fireEvent.change(slider, { target: { value: '51' } });
      expect(slider).to.have.attribute('aria-valuenow', '51');

      fireEvent.keyDown(slider, { key: ARROW_RIGHT });
      expect(slider).to.have.attribute('aria-valuenow', '52');
    });

    it('should set default aria-valuetext on range slider thumbs', async () => {
      await render(<TestRangeSlider defaultValue={[44, 50]} />);

      const [thumb1, thumb2] = screen.getAllByTestId('thumb');

      expect(thumb1.querySelector('input')).to.have.attribute('aria-valuetext', '44 start range');
      expect(thumb2.querySelector('input')).to.have.attribute('aria-valuetext', '50 end range');
    });
  });

  describe.skipIf(isJSDOM || isWebKit)('rtl', () => {
    it('should handle RTL', async () => {
      const handleValueChange = spy((newValue) => newValue);

      await render(
        <div dir="rtl">
          <DirectionProvider direction="rtl">
            <TestSlider value={30} onValueChange={handleValueChange} />
          </DirectionProvider>
        </div>,
      );

      const sliderControl = screen.getByTestId('control');
      const sliderThumb = screen.getByTestId('thumb');
      expect(sliderThumb.style.insetInlineStart).to.equal('30%');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]),
      );

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 22, clientY: 0 }]),
      );

      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.firstCall.returnValue).to.equal(80);
      expect(handleValueChange.lastCall.returnValue).to.equal(78);
    });
  });

  describe('prop: disabled', () => {
    it('should render data-disabled on all subcomponents', async () => {
      await render(
        <Slider.Root defaultValue={30} disabled data-testid="root">
          <Slider.Value data-testid="value" />
          <Slider.Control data-testid="control">
            <Slider.Track data-testid="track">
              <Slider.Indicator data-testid="indicator" />
              <Slider.Thumb data-testid="thumb" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>,
      );

      const root = screen.getByTestId('root');
      const value = screen.getByTestId('value');
      const control = screen.getByTestId('control');
      const track = screen.getByTestId('track');
      const indicator = screen.getByTestId('indicator');
      const thumb = screen.getByTestId('thumb');

      [root, value, control, track, indicator, thumb].forEach((subcomponent) => {
        expect(subcomponent).to.have.attribute('data-disabled', '');
      });
    });

    // TODO: Don't skip once a fix for https://github.com/jsdom/jsdom/issues/3029 is released.
    it.skipIf(isJSDOM || isWebKit)(
      'should not respond to drag events after becoming disabled',
      async () => {
        const { setProps } = await render(
          <TestSlider defaultValue={0} data-testid="slider-root" />,
        );

        const sliderControl = screen.getByTestId('control');

        stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);
        fireEvent.touchStart(
          sliderControl,
          createTouches([{ identifier: 1, clientX: 21, clientY: 0 }]),
        );

        const thumb = screen.getByRole('slider');

        expect(thumb).to.have.attribute('aria-valuenow', '21');
        expect(thumb).toHaveFocus();

        await setProps({ disabled: true });
        expect(thumb).not.toHaveFocus();
        // expect(thumb).not.to.have.class(classes.active);

        fireEvent.touchMove(
          sliderControl,
          createTouches([{ identifier: 1, clientX: 30, clientY: 0 }]),
        );

        expect(thumb).to.have.attribute('aria-valuenow', '21');
      },
    );

    // TODO: Don't skip once a fix for https://github.com/jsdom/jsdom/issues/3029 is released.
    it.skipIf(isJSDOM || isWebKit)('should not respond to drag events if disabled', async () => {
      await render(<TestSlider defaultValue={21} data-testid="slider-root" disabled />);

      const thumb = screen.getByRole('slider');
      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 21, clientY: 0 }]),
      );

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 30, clientY: 0 }]),
      );

      fireEvent.touchEnd(
        document.body,
        createTouches([{ identifier: 1, clientX: 30, clientY: 0 }]),
      );

      expect(thumb).to.have.attribute('aria-valuenow', '21');
    });
  });

  describe('prop: orientation', () => {
    it('sets the `aria-orientation` attribute', async () => {
      await render(<TestSlider orientation="vertical" />);

      const sliderRoot = screen.getByRole('slider');
      expect(sliderRoot).to.have.attribute('aria-orientation', 'vertical');
    });

    it('sets the data-orientation attribute', async () => {
      await render(<TestSlider />);

      const sliderRoot = screen.getByRole('group');
      expect(sliderRoot).to.have.attribute('data-orientation', 'horizontal');
      const sliderControl = screen.getByTestId('control');
      expect(sliderControl).to.have.attribute('data-orientation', 'horizontal');
      const sliderOutput = screen.getByTestId('value');
      expect(sliderOutput).to.have.attribute('data-orientation', 'horizontal');
    });

    it.skipIf(isJSDOM || !/WebKit/.test(window.navigator.userAgent))(
      'does not set the orientation via appearance for WebKit browsers',
      async () => {
        await render(<TestSlider orientation="vertical" />);

        const slider = screen.getByRole('slider');

        expect(slider).to.have.property('tagName', 'INPUT');
        expect(slider).to.have.property('type', 'range');
        // Only relevant to implementations using `input[type="range"]` with implicit `[role="slider"]`
        // We're not setting this by default because it changes horizontal keyboard navigation in WebKit: https://issues.chromium.org/issues/40739626
        expect(slider).not.toHaveComputedStyle({ webkitAppearance: 'slider-vertical' });
      },
    );

    it.skipIf(isJSDOM || isWebKit)('should report the right position', async () => {
      const handleValueChange = spy();

      await render(
        <TestSlider orientation="vertical" defaultValue={20} onValueChange={handleValueChange} />,
      );

      const sliderControl = screen.getByTestId('control');
      stub(sliderControl, 'getBoundingClientRect').callsFake(() => ({
        width: 10,
        height: 100,
        bottom: 100,
        left: 0,
        x: 0,
        y: 0,
        top: 0,
        right: 10,
        toJSON() {},
      }));

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 0, clientY: 20 }]),
      );
      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 0, clientY: 22 }]),
      );

      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[0][0]).to.equal(80);
      expect(handleValueChange.args[1][0]).to.equal(78);
    });
  });

  describe('prop: step', () => {
    it('supports non-integer values', async () => {
      await render(
        <React.Fragment>
          <TestSlider value={51.1} min={-100} max={100} step={0.00000001} />
          <TestSlider value={0.00000005} min={-100} max={100} step={0.00000001} />
          <TestSlider value={1e-7} min={-100} max={100} step={0.00000001} />
        </React.Fragment>,
      );
      const [slider1, slider2, slider3] = screen.getAllByRole('slider');

      expect(slider1).to.have.attribute('aria-valuenow', '51.1');
      expect(slider2).to.have.attribute('aria-valuenow', '5e-8');
      expect(slider3).to.have.attribute('aria-valuenow', '1e-7');
    });

    it.skipIf(isJSDOM || isWebKit)('should round value to step precision', async () => {
      await render(<TestSlider defaultValue={0.2} min={0} max={1} step={0.1} />);

      const slider = screen.getByRole('slider');

      await act(async () => {
        slider.focus();
      });

      const sliderControl = screen.getByTestId('control');
      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      await act(async () => {
        slider.focus();
      });

      expect(slider).to.have.attribute('aria-valuenow', '0.2');

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]),
      );

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 80, clientY: 0 }]),
      );
      expect(slider).to.have.attribute('aria-valuenow', '0.8');

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 40, clientY: 0 }]),
      );
      expect(slider).to.have.attribute('aria-valuenow', '0.4');
    });

    it.skipIf(isJSDOM || isWebKit)(
      'should not fail to round value to step precision when step is very small',
      async () => {
        await render(
          <TestSlider defaultValue={0.00000002} min={0} max={0.0000001} step={0.00000001} />,
        );

        const slider = screen.getByRole('slider');

        await act(async () => {
          slider.focus();
        });

        const sliderControl = screen.getByTestId('control');
        stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

        await act(async () => {
          slider.focus();
        });

        expect(slider).to.have.attribute('aria-valuenow', '2e-8');

        fireEvent.touchStart(
          sliderControl,
          createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]),
        );

        fireEvent.touchMove(
          document.body,
          createTouches([{ identifier: 1, clientX: 80, clientY: 0 }]),
        );
        expect(slider).to.have.attribute('aria-valuenow', '8e-8');
      },
    );

    it.skipIf(isJSDOM || isWebKit)(
      'should not fail to round value to step precision when step is very small and negative',
      async () => {
        await render(
          <TestSlider defaultValue={-0.00000002} min={-0.0000001} max={0} step={0.00000001} />,
        );

        const slider = screen.getByRole('slider');

        await act(async () => {
          slider.focus();
        });

        const sliderControl = screen.getByTestId('control');
        stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

        await act(async () => {
          slider.focus();
        });

        expect(slider).to.have.attribute('aria-valuenow', '-2e-8');

        fireEvent.touchStart(
          sliderControl,
          createTouches([{ identifier: 1, clientX: 80, clientY: 0 }]),
        );

        fireEvent.touchMove(
          document.body,
          createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]),
        );
        expect(slider).to.have.attribute('aria-valuenow', '-8e-8');
      },
    );
  });

  describe('prop: max', () => {
    it('sets the max attribute on the input', async () => {
      await render(<TestSlider defaultValue={150} step={100} max={750} />);
      expect(screen.getByRole('slider')).to.have.attribute('max', '750');
    });

    it('should not go more than the max', async () => {
      const { user } = await render(<TestSlider defaultValue={100} step={100} max={200} />);

      const slider = screen.getByRole('slider');

      await user.keyboard('[Tab]');

      await user.keyboard(`[${ARROW_RIGHT}]`);
      expect(slider).to.have.attribute('aria-valuenow', '200');
      await user.keyboard(`[${ARROW_RIGHT}]`);
      expect(slider).to.have.attribute('aria-valuenow', '200');
    });

    it.skipIf(isJSDOM || isWebKit)('should reach right edge value', async () => {
      await render(<TestSlider defaultValue={90} min={6} max={108} step={10} />);

      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      const slider = screen.getByRole('slider');
      await act(async () => {
        slider.focus();
      });

      expect(slider).to.have.attribute('aria-valuenow', '90');

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]),
      );

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 100, clientY: 0 }]),
      );
      expect(slider).to.have.attribute('aria-valuenow', '106');

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 200, clientY: 0 }]),
      );
      expect(slider).to.have.attribute('aria-valuenow', '106');

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 50, clientY: 0 }]),
      );
      expect(slider).to.have.attribute('aria-valuenow', '56');

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: -100, clientY: 0 }]),
      );
      expect(slider).to.have.attribute('aria-valuenow', '6');
    });
  });

  describe('prop: min', () => {
    it('sets the min attribute on the input', async () => {
      await render(<TestSlider defaultValue={150} step={100} min={150} max={200} />);
      expect(screen.getByRole('slider')).to.have.attribute('min', '150');
    });

    it('should use min as the step origin', async () => {
      await render(<TestSlider defaultValue={150} step={100} max={750} min={150} />);

      const slider = screen.getByRole('slider');
      await act(async () => {
        slider.focus();
      });

      expect(slider).to.have.attribute('aria-valuenow', '150');
    });

    it('should not go less than the min', async () => {
      const { user } = await render(<TestSlider defaultValue={1} step={1} min={0} />);
      const slider = screen.getByRole('slider');

      await user.keyboard('[Tab]');

      await user.keyboard(`[${ARROW_LEFT}]`);
      expect(slider).to.have.attribute('aria-valuenow', '0');
      await user.keyboard(`[${ARROW_LEFT}]`);
      expect(slider).to.have.attribute('aria-valuenow', '0');
    });
  });

  describe('prop: minStepsBetweenValues', () => {
    it('should enforce a minimum difference between range slider values', async () => {
      const handleValueChange = spy();

      const { user } = await render(
        <TestRangeSlider
          onValueChange={handleValueChange}
          defaultValue={[44, 50]}
          step={2}
          minStepsBetweenValues={2}
        />,
      );

      await user.keyboard('[Tab]');

      await user.keyboard(`[${ARROW_UP}]`);
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal([46, 50]);
      await user.keyboard(`[${ARROW_UP}]`);
      expect(handleValueChange.callCount).to.equal(1);

      await user.keyboard('[Tab]');

      await user.keyboard(`[${ARROW_UP}]`);
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal([46, 52]);
      await user.keyboard(`[${ARROW_DOWN}]`);
      await user.keyboard(`[${ARROW_DOWN}]`);
      expect(handleValueChange.callCount).to.equal(3);
      expect(handleValueChange.args[2][0]).to.deep.equal([46, 50]);
    });
  });

  describe('prop: onValueCommitted', () => {
    it('single value', async () => {
      const handleValueCommitted = spy((newValue: number, eventDetails) => ({
        newValue,
        reason: eventDetails.reason,
      }));

      await render(
        <Slider.Root onValueCommitted={handleValueCommitted} defaultValue={0}>
          <Slider.Control data-testid="control">
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>,
      );

      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      const slider = screen.getByRole('slider');

      fireEvent.pointerDown(sliderControl, {
        buttons: 1,
        clientX: 10,
      });
      fireEvent.pointerUp(sliderControl, {
        buttons: 1,
        clientX: 10,
      });

      expect(handleValueCommitted.callCount).to.equal(1);
      expect(handleValueCommitted.lastCall.returnValue.newValue).to.equal(10);
      expect(handleValueCommitted.lastCall.returnValue.reason).to.equal(REASONS.trackPress);

      await act(async () => {
        slider.focus();
      });

      fireEvent.change(slider, { target: { value: 23 } });
      expect(handleValueCommitted.callCount).to.equal(2);
      expect(handleValueCommitted.lastCall.returnValue.reason).to.equal(REASONS.inputChange);
    });

    it('array value', async () => {
      const handleValueCommitted = spy((newValue: number[], eventDetails) => ({
        newValue,
        reason: eventDetails.reason,
      }));

      await render(
        <Slider.Root onValueCommitted={handleValueCommitted} defaultValue={[10, 20]}>
          <Slider.Control data-testid="control">
            <Slider.Thumb index={0} />
            <Slider.Thumb index={1} />
          </Slider.Control>
        </Slider.Root>,
      );

      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      const [thumb1, thumb2] = screen.getAllByRole('slider');

      fireEvent.pointerDown(thumb2, {
        buttons: 1,
        clientX: 20,
      });

      fireEvent.pointerMove(thumb2, {
        buttons: 1,
        clientX: 30,
      });

      expect(handleValueCommitted.callCount).to.equal(0);

      fireEvent.pointerUp(thumb2, {
        buttons: 1,
        clientX: 30,
      });

      expect(handleValueCommitted.callCount).to.equal(1);
      expect(handleValueCommitted.lastCall.returnValue.reason).to.equal(REASONS.drag);

      await act(async () => {
        thumb1.focus();
      });

      fireEvent.change(thumb1, { target: { value: 23 } });
      expect(handleValueCommitted.callCount).to.equal(2);
      expect(handleValueCommitted.lastCall.returnValue.reason).to.equal(REASONS.inputChange);
    });
  });

  describe('events', () => {
    it.skipIf(isJSDOM)('should call handlers', async () => {
      const handleValueChange = spy();
      const handleValueCommitted = spy();

      await render(
        <TestSlider
          onValueChange={handleValueChange}
          onValueCommitted={handleValueCommitted}
          value={0}
        />,
      );

      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      const slider = screen.getByRole('slider');

      fireEvent.pointerDown(sliderControl, {
        buttons: 1,
        clientX: 10,
      });
      fireEvent.pointerUp(sliderControl, {
        buttons: 1,
        clientX: 10,
      });

      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.equal(10);
      expect(handleValueChange.args[0][1].activeThumbIndex).to.equal(0);
      expect(handleValueCommitted.callCount).to.equal(1);
      expect(handleValueCommitted.args[0][0]).to.equal(10);
      expect(handleValueCommitted.args[0][1].reason).to.equal(REASONS.trackPress);

      await act(async () => {
        slider.focus();
      });

      fireEvent.change(slider, { target: { value: 23 } });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueCommitted.callCount).to.equal(2);
      expect(handleValueCommitted.args[1][1].reason).to.equal(REASONS.inputChange);
    });

    it.skipIf(isJSDOM || isWebKit)('should support touch events', async () => {
      const handleValueChange = spy();

      await render(
        <TestRangeSlider
          defaultValue={[20, 30]}
          style={{ width: '100px' }}
          onValueChange={handleValueChange}
        />,
      );

      const sliderControl = screen.getByTestId('control');
      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]),
      );

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 21, clientY: 0 }]),
      );

      fireEvent.touchEnd(
        document.body,
        createTouches([{ identifier: 1, clientX: 21, clientY: 0 }]),
      );

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 21, clientY: 0 }]),
      );

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 22, clientY: 0 }]),
      );

      fireEvent.touchEnd(
        document.body,
        createTouches([{ identifier: 1, clientX: 22, clientY: 0 }]),
      );

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 22, clientY: 0 }]),
      );

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 22.1, clientY: 0 }]),
      );

      fireEvent.touchEnd(
        document.body,
        createTouches([{ identifier: 1, clientX: 22.1, clientY: 0 }]),
      );

      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[0][0]).to.deep.equal([21, 30]);
      expect(handleValueChange.args[1][0]).to.deep.equal([22, 30]);
    });

    it.skipIf(isJSDOM || isWebKit)(
      'should only listen to changes from the same touchpoint',
      async () => {
        const handleValueChange = spy();
        const handleValueCommitted = spy();

        await render(
          <TestSlider
            onValueChange={handleValueChange}
            onValueCommitted={handleValueCommitted}
            value={0}
          />,
        );

        const sliderControl = screen.getByTestId('control');

        stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

        fireEvent.touchStart(
          sliderControl,
          createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]),
        );
        expect(handleValueChange.callCount).to.equal(0);
        expect(handleValueCommitted.callCount).to.equal(0);

        fireEvent.touchStart(
          document.body,
          createTouches([{ identifier: 2, clientX: 40, clientY: 0 }]),
        );
        expect(handleValueChange.callCount).to.equal(0);
        expect(handleValueCommitted.callCount).to.equal(0);

        fireEvent.touchMove(
          document.body,
          createTouches([{ identifier: 1, clientX: 1, clientY: 0 }]),
        );
        expect(handleValueChange.callCount).to.equal(1);
        expect(handleValueCommitted.callCount).to.equal(0);

        fireEvent.touchMove(
          document.body,
          createTouches([{ identifier: 2, clientX: 41, clientY: 0 }]),
        );
        expect(handleValueChange.callCount).to.equal(1);
        expect(handleValueCommitted.callCount).to.equal(0);

        fireEvent.touchEnd(
          document.body,
          createTouches([{ identifier: 1, clientX: 2, clientY: 0 }]),
        );
        expect(handleValueChange.callCount).to.equal(1);
        expect(handleValueCommitted.callCount).to.equal(1);
        expect(handleValueCommitted.firstCall.args[1].reason).to.equal('drag');
      },
    );

    it.skipIf(isJSDOM)('should hedge against a dropped mouseup event', async () => {
      const handleValueChange = spy();

      await render(<TestSlider onValueChange={handleValueChange} value={0} />);

      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.pointerDown(sliderControl, {
        buttons: 1,
        clientX: 1,
      });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.equal(1);

      fireEvent.pointerMove(document.body, {
        buttons: 1,
        clientX: 10,
      });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.equal(10);

      fireEvent.pointerMove(document.body, {
        buttons: 0,
        clientX: 11,
      });
      // The mouse's button was released, stop the dragging session.
      expect(handleValueChange.callCount).to.equal(2);
    });

    it.skipIf(isWebKit)('should focus the slider when touching', async () => {
      await render(<TestSlider defaultValue={30} />);
      const slider = screen.getByRole('slider');
      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]),
      );

      expect(slider).toHaveFocus();
    });

    it('should focus the slider when dragging', async () => {
      await render(<TestSlider defaultValue={30} step={10} />);
      const slider = screen.getByRole('slider');
      const sliderThumb = screen.getByTestId('thumb');
      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.pointerDown(sliderThumb, {
        buttons: 1,
        clientX: 1,
      });

      await waitFor(() => {
        expect(slider).toHaveFocus();
      });
    });

    it.skipIf(isWebKit)('should not override the event.target on touch events', async () => {
      const handleValueChange = spy();
      const handleNativeEvent = spy();
      const handleEvent = spy();
      function Test() {
        React.useEffect(() => {
          document.addEventListener('touchstart', handleNativeEvent);
          return () => {
            document.removeEventListener('touchstart', handleNativeEvent);
          };
        });

        return (
          <div onTouchStart={handleEvent}>
            <TestSlider value={0} onValueChange={handleValueChange} />
          </div>
        );
      }

      await render(<Test />);
      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]),
      );

      expect(handleValueChange.callCount).to.equal(0);
      expect(handleNativeEvent.callCount).to.equal(1);
      expect(handleNativeEvent.firstCall.args[0]).to.have.property('target', sliderControl);
      expect(handleEvent.callCount).to.equal(1);
      expect(handleEvent.firstCall.args[0]).to.have.property('target', sliderControl);
    });

    it('should not override the event.target on mouse events', async () => {
      const handleValueChange = spy();
      const handleNativeEvent = spy();
      const handleEvent = spy();
      function Test() {
        React.useEffect(() => {
          document.addEventListener('mousedown', handleNativeEvent);
          return () => {
            document.removeEventListener('mousedown', handleNativeEvent);
          };
        });

        return (
          <div onMouseDown={handleEvent}>
            <TestSlider value={0} onValueChange={handleValueChange} />
          </div>
        );
      }
      await render(<Test />);
      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.mouseDown(sliderControl);

      expect(handleValueChange.callCount).to.equal(0);
      expect(handleNativeEvent.callCount).to.equal(1);
      expect(handleNativeEvent.firstCall.args[0]).to.have.property('target', sliderControl);
      expect(handleEvent.callCount).to.equal(1);
      expect(handleEvent.firstCall.args[0]).to.have.property('target', sliderControl);
    });
  });

  describe.skipIf(isWebKit)('dragging state', () => {
    it('should not apply data-dragging for click modality', async () => {
      await render(<TestSlider defaultValue={90} />);

      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]),
      );
      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 21, clientY: 0 }]),
      );
      expect(sliderControl).to.not.have.attribute('data-dragging');
      fireEvent.touchEnd(document.body, createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]));
    });

    it('should apply data-dragging for dragging modality', async () => {
      await render(<TestSlider defaultValue={90} />);

      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]),
      );
      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 200, clientY: 0 }]),
      );
      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 200, clientY: 0 }]),
      );

      expect(sliderControl).to.not.have.attribute('data-dragging');

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 200, clientY: 0 }]),
      );

      expect(sliderControl).to.have.attribute('data-dragging', '');
      fireEvent.touchEnd(document.body, createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]));
      expect(sliderControl).to.not.have.attribute('data-dragging');
    });
  });

  describe('prop: onValueChange', () => {
    it.skipIf(isJSDOM)('is called when clicking on the control', async () => {
      const handleValueChange = spy();
      await render(<TestSlider defaultValue={50} onValueChange={handleValueChange} />);

      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.pointerDown(sliderControl, {
        buttons: 1,
        clientX: 41,
      });

      expect(handleValueChange.callCount).to.equal(1);
    });

    it('is not called when clicking on the thumb', async () => {
      const handleValueChange = spy();
      await render(<TestSlider defaultValue={50} onValueChange={handleValueChange} />);

      const sliderControl = screen.getByTestId('control');
      const sliderThumb = screen.getByTestId('thumb');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.pointerDown(sliderThumb, {
        buttons: 1,
        clientX: 51,
      });

      expect(handleValueChange.callCount).to.equal(0);
    });

    it('should not react to right clicks', async () => {
      const handleValueChange = spy();
      await render(<TestSlider defaultValue={50} onValueChange={handleValueChange} />);

      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.pointerDown(sliderControl, {
        button: 2,
        clientX: 41,
      });

      expect(handleValueChange.callCount).to.equal(0);
    });

    it('provides the change reason for input events', async () => {
      const handleValueChange = spy();
      await render(<TestSlider defaultValue={30} onValueChange={handleValueChange} />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '35' } });

      expect(handleValueChange).to.have.property('callCount', 1);
      const [, details] = handleValueChange.firstCall.args as [
        number,
        SliderRoot.ChangeEventDetails,
      ];
      expect(details.reason).to.equal(REASONS.inputChange);
      expect(details.activeThumbIndex).to.equal(0);
    });

    it('provides the change reason for keyboard interactions', async () => {
      const handleValueChange = spy();
      await render(<TestSlider defaultValue={40} onValueChange={handleValueChange} />);

      const slider = screen.getByRole('slider');
      await act(async () => {
        slider.focus();
      });
      fireEvent.keyDown(slider, { key: ARROW_RIGHT });

      expect(handleValueChange).to.have.property('callCount', 1);
      const [, details] = handleValueChange.firstCall.args as [
        number,
        SliderRoot.ChangeEventDetails,
      ];
      expect(details.reason).to.equal('keyboard');
    });

    it('provides the change reason for track presses', async () => {
      const handleValueChange = spy();
      await render(<TestSlider defaultValue={0} onValueChange={handleValueChange} />);

      const sliderControl = screen.getByTestId('control');
      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.pointerDown(sliderControl, {
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
        buttons: 1,
        clientX: 80,
        clientY: 0,
      });

      await waitFor(() => {
        expect(handleValueChange.callCount).to.equal(1);
      });
      const [, details] = handleValueChange.firstCall.args as [
        number | number[],
        SliderRoot.ChangeEventDetails,
      ];
      expect(details.reason).to.equal(REASONS.trackPress);
    });

    it.skipIf(isJSDOM)('drags the intended thumb when 3 thumbs are present', async () => {
      const handleValueChange = spy();

      await render(
        <TestMultiThumbSlider
          defaultValue={[10, 40, 60]}
          min={0}
          max={100}
          onValueChange={handleValueChange}
        />,
      );

      const sliderControl = screen.getByTestId('control');
      const thirdThumb = screen.getAllByTestId('thumb')[2];

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);
      stub(thirdThumb, 'getBoundingClientRect').callsFake(() => ({
        width: 0,
        height: 0,
        bottom: 0,
        left: 60,
        right: 60,
        top: 0,
        x: 60,
        y: 0,
        toJSON() {},
      }));

      fireEvent.pointerDown(thirdThumb, {
        pointerId: 1,
        buttons: 1,
        clientX: 60,
      });

      fireEvent.pointerMove(document, {
        pointerId: 1,
        buttons: 1,
        clientX: 80,
      });

      expect(handleValueChange.callCount).to.be.greaterThan(0);

      const [newValue] = handleValueChange.lastCall.args;
      expect(handleValueChange.lastCall.args[1].activeThumbIndex).to.equal(2);
      expect(newValue[0]).to.equal(10);
      expect(newValue[1]).to.equal(40);
      expect(newValue[2]).to.not.equal(60);
    });

    it.skipIf(isJSDOM)('should fire only when the value changes', async () => {
      const handleValueChange = spy();
      await render(<TestSlider defaultValue={20} onValueChange={handleValueChange} />);

      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

      fireEvent.pointerDown(sliderControl, {
        buttons: 1,
        clientX: 21,
      });

      fireEvent.pointerMove(document.body, {
        buttons: 1,
        clientX: 22,
      });
      // Sometimes another event with the same position is fired by the browser.
      fireEvent.pointerMove(document.body, {
        buttons: 1,
        clientX: 22,
      });

      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[0][0]).to.deep.equal(21);
      expect(handleValueChange.args[1][0]).to.deep.equal(22);
    });

    type Values = Array<[string, number[]]>;

    const values = [
      ['readonly range', Object.freeze([2, 1])],
      ['range', [2, 1]],
    ] as Values;
    values.forEach(([valueLabel, value]) => {
      it.skipIf(isJSDOM)(`is called even if the ${valueLabel} did not change`, async () => {
        const handleValueChange = spy();

        await render(
          <TestRangeSlider
            min={0}
            max={5}
            onValueChange={handleValueChange}
            value={value}
            style={{ width: '100px' }}
          />,
        );

        const sliderControl = screen.getByTestId('control');

        stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

        // pixel:  0   20  40  60  80  100
        // slider: |---|---|---|---|---|
        // values: 0   1   2   3   4   5
        // value:      ��   ��
        // mouse:           ��

        fireEvent.pointerDown(sliderControl, {
          buttons: 1,
          clientX: 41,
        });

        expect(handleValueChange.callCount).to.equal(1);
        expect(handleValueChange.args[0][0]).not.to.equal(value);
        expect(handleValueChange.args[0][0]).to.deep.equal(value.slice().sort((a, b) => a - b));
      });
    });

    it('should pass "name" and "value" as part of the event.target for onValueChange', async () => {
      const handleValueChange = stub().callsFake((newValue, data) => (data as any).event.target);

      await render(
        <TestSlider onValueChange={handleValueChange} name="change-testing" value={3} />,
      );

      const slider = screen.getByRole('slider');

      await act(async () => {
        slider.focus();
      });
      fireEvent.change(slider, {
        target: {
          value: 4,
        },
      });

      expect(handleValueChange.callCount).to.equal(1);
      const target = handleValueChange.firstCall.returnValue;
      expect(target).to.deep.equal({
        name: 'change-testing',
        value: 4,
      });
    });

    it.skipIf(!isJSDOM)(
      'should not rely on the global event when cloning change events',
      async () => {
        const hadGlobalEvent = Object.prototype.hasOwnProperty.call(globalThis, 'event');
        const previousDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'event');
        const globalEventConstructor = class {
          constructor() {
            throw new Error('Should not construct global event');
          }
        };
        const fakeGlobalEvent = {
          type: 'click',
          constructor: globalEventConstructor,
        };

        Object.defineProperty(globalThis, 'event', {
          configurable: true,
          get() {
            return fakeGlobalEvent;
          },
          set() {
            // Ignore assignments from the event system to ensure we never use it.
          },
        });

        try {
          const handleValueChange = vi.fn();

          await render(
            <TestSlider onValueChange={handleValueChange} name="change-testing" value={3} />,
          );

          const slider = screen.getByRole('slider');

          await act(async () => {
            slider.focus();
          });

          expectVitest(() => {
            fireEvent.change(slider, {
              target: {
                value: 4,
              },
            });
          }).not.toThrow();

          expectVitest(handleValueChange).toHaveBeenCalledTimes(1);
        } finally {
          if (hadGlobalEvent && previousDescriptor) {
            Object.defineProperty(globalThis, 'event', previousDescriptor);
          } else {
            delete (globalThis as any).event;
          }
        }
      },
    );

    it.skipIf(isJSDOM)('should handle keyboard changes inside a shadow root', async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const shadowRoot = host.attachShadow({ mode: 'open' });
      const container = document.createElement('div');
      shadowRoot.appendChild(container);

      try {
        const handleValueChange = vi.fn();

        await render(<TestSlider onValueChange={handleValueChange} name="shadow" value={3} />, {
          container,
        });

        const slider = shadowRoot.querySelector('input[type="range"]');
        expectVitest(slider).toBeTruthy();

        if (!slider) {
          return;
        }

        await act(async () => {
          (slider as HTMLInputElement).focus();
        });

        await act(async () => {
          slider.dispatchEvent(new KeyboardEvent('keydown', { key: ARROW_RIGHT, bubbles: true }));
        });

        expectVitest(handleValueChange).toHaveBeenCalledTimes(1);
      } finally {
        await act(async () => {
          host.remove();
        });
      }
    });

    it.skipIf(isJSDOM)(
      'onValueCommitted is called with the same value as the latest onValueChange when pointerUp occurs at a different location than onValueChange',
      async () => {
        const handleValueChange = spy();
        const handleValueCommitted = spy();

        await render(
          <TestSlider
            onValueChange={handleValueChange}
            onValueCommitted={handleValueCommitted}
            defaultValue={0}
          />,
        );

        const sliderControl = screen.getByTestId('control');

        stub(sliderControl, 'getBoundingClientRect').callsFake(getHorizontalSliderRect);

        fireEvent.pointerDown(sliderControl, {
          buttons: 1,
          clientX: 10,
        });
        fireEvent.pointerMove(sliderControl, {
          buttons: 1,
          clientX: 15,
        });
        fireEvent.pointerUp(sliderControl, {
          buttons: 1,
          clientX: 20,
        });

        expect(handleValueChange.callCount).to.equal(2);
        expect(handleValueChange.args[0][0]).to.equal(10);
        expect(handleValueChange.args[1][0]).to.equal(15);
        expect(handleValueCommitted.callCount).to.equal(1);
        expect(handleValueCommitted.args[0][0]).to.equal(15);
        expect(handleValueCommitted.args[0][1].reason).to.equal('drag');
      },
    );
  });

  describe('keyboard interactions', () => {
    [
      ['ltr', 'horizontal', [ARROW_LEFT, ARROW_DOWN], [ARROW_RIGHT, ARROW_UP]],
      ['ltr', 'vertical', [ARROW_LEFT, ARROW_DOWN], [ARROW_RIGHT, ARROW_UP]],
      ['rtl', 'horizontal', [ARROW_RIGHT, ARROW_DOWN], [ARROW_LEFT, ARROW_UP]],
      ['rtl', 'vertical', [ARROW_RIGHT, ARROW_DOWN], [ARROW_LEFT, ARROW_UP]],
    ].forEach((entry) => {
      const [direction, orientation, decrementKeys, incrementKeys] = entry as [
        direction: TextDirection,
        orientation: Orientation,
        decrementKeys: string[],
        incrementKeys: string[],
      ];

      describe(String(direction), () => {
        describe(`orientation: ${orientation}`, () => {
          decrementKeys.forEach((key) => {
            it(`key: ${key} decrements the value`, async () => {
              const handleValueChange = spy();
              const { user } = await render(
                <div dir={direction}>
                  <DirectionProvider direction={direction}>
                    <Slider.Root
                      orientation={orientation}
                      defaultValue={20}
                      onValueChange={handleValueChange}
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Indicator />
                          <Slider.Thumb data-testid="thumb" />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const input = screen.getByRole('slider');

              await user.keyboard('[Tab]');
              expect(input).toHaveFocus();

              await user.keyboard(`[${key}]`);
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal(19);
              expect(input).to.have.attribute('aria-valuenow', '19');
            });

            it(`key: ${key} decrements the value by largeStep when Shift is pressed`, async () => {
              const handleValueChange = spy();
              const { user } = await render(
                <div dir={direction}>
                  <DirectionProvider direction={direction}>
                    <Slider.Root
                      orientation={orientation}
                      defaultValue={20}
                      largeStep={10}
                      onValueChange={handleValueChange}
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Indicator />
                          <Slider.Thumb data-testid="thumb" />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const input = screen.getByRole('slider');

              await user.keyboard('[Tab]');
              expect(input).toHaveFocus();

              await user.keyboard(`{Shift>}{${key}}`);
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal(10);
              expect(input).to.have.attribute('aria-valuenow', '10');
            });

            it(`key: ${key} stops at min when decrementing while Shift is pressed`, async () => {
              const handleValueChange = spy();
              const { user } = await render(
                <div dir={direction}>
                  <DirectionProvider direction={direction}>
                    <Slider.Root
                      orientation={orientation}
                      defaultValue={20}
                      largeStep={10}
                      min={15}
                      onValueChange={handleValueChange}
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Indicator />
                          <Slider.Thumb data-testid="thumb" />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const input = screen.getByRole('slider');

              await user.keyboard('[Tab]');
              expect(input).toHaveFocus();

              await user.keyboard(`{Shift>}{${key}}`);
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal(15);
              expect(input).to.have.attribute('aria-valuenow', '15');
            });
          });

          incrementKeys.forEach((key) => {
            it(`key: ${key} increments the value`, async () => {
              const handleValueChange = spy();
              const { user } = await render(
                <div dir={direction}>
                  <DirectionProvider direction={direction}>
                    <Slider.Root
                      orientation={orientation}
                      defaultValue={20}
                      onValueChange={handleValueChange}
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Indicator />
                          <Slider.Thumb data-testid="thumb" />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const input = screen.getByRole('slider');

              await user.keyboard('[Tab]');
              expect(input).toHaveFocus();

              await user.keyboard(`[${key}]`);
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal(21);
              expect(input).to.have.attribute('aria-valuenow', '21');
            });

            it(`key: ${key} increments the value by largeStep when Shift is pressed`, async () => {
              const handleValueChange = spy();
              const { user } = await render(
                <div dir={direction}>
                  <DirectionProvider direction={direction}>
                    <Slider.Root
                      orientation={orientation}
                      defaultValue={20}
                      largeStep={10}
                      onValueChange={handleValueChange}
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Indicator />
                          <Slider.Thumb data-testid="thumb" />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const input = screen.getByRole('slider');

              await user.keyboard('[Tab]');
              expect(input).toHaveFocus();

              await user.keyboard(`{Shift>}{${key}}`);
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal(30);
              expect(input).to.have.attribute('aria-valuenow', '30');
            });

            it(`key: ${key} stops at max when incrementing while Shift is pressed`, async () => {
              const handleValueChange = spy();
              const { user } = await render(
                <div dir={direction}>
                  <DirectionProvider direction={direction}>
                    <Slider.Root
                      orientation={orientation}
                      defaultValue={20}
                      largeStep={10}
                      max={21}
                      onValueChange={handleValueChange}
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Indicator />
                          <Slider.Thumb data-testid="thumb" />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const input = screen.getByRole('slider');

              await user.keyboard('[Tab]');
              expect(input).toHaveFocus();

              await user.keyboard(`{Shift>}{${key}}`);
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal(21);
              expect(input).to.have.attribute('aria-valuenow', '21');
            });
          });

          describe('key: End', () => {
            it('sets value to max in a single value slider', async () => {
              const handleValueChange = spy();
              const { user } = await render(
                <div dir={direction}>
                  <DirectionProvider direction={direction}>
                    <Slider.Root
                      orientation={orientation}
                      defaultValue={20}
                      max={77}
                      onValueChange={handleValueChange}
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Indicator />
                          <Slider.Thumb data-testid="thumb" />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const input = screen.getByRole('slider');

              await user.keyboard('[Tab]');
              expect(input).toHaveFocus();

              await user.keyboard(`[${END}]`);
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal(77);
              expect(input).to.have.attribute('aria-valuenow', '77');
            });

            it('sets value to the maximum possible value in a range slider', async () => {
              const handleValueChange = spy();
              const { user } = await render(
                <div dir={direction}>
                  <DirectionProvider direction={direction}>
                    <Slider.Root defaultValue={[20, 50]} max={77} onValueChange={handleValueChange}>
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Indicator />
                          <Slider.Thumb index={0} />
                          <Slider.Thumb index={1} />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const [input1, input2] = screen.getAllByRole('slider');

              await user.keyboard('[Tab]');
              expect(input1).toHaveFocus();

              await user.keyboard(`[${END}]`);
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal([50, 50]);
              await user.keyboard(`[${END}]`);
              expect(handleValueChange.callCount).to.equal(1);

              await user.keyboard('[Tab]');
              expect(input2).toHaveFocus();

              await user.keyboard(`[${END}]`);
              expect(handleValueChange.callCount).to.equal(2);
              expect(handleValueChange.args[1][0]).to.deep.equal([50, 77]);
            });
          });

          describe('key: Home', () => {
            it('sets value to min in a single value slider', async () => {
              const handleValueChange = spy();
              const { user } = await render(
                <div dir={direction}>
                  <DirectionProvider direction={direction}>
                    <Slider.Root
                      orientation={orientation}
                      defaultValue={20}
                      min={17}
                      onValueChange={handleValueChange}
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Indicator />
                          <Slider.Thumb data-testid="thumb" />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const input = screen.getByRole('slider');

              await user.keyboard('[Tab]');
              expect(input).toHaveFocus();

              await user.keyboard(`[${HOME}]`);
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal(17);
              expect(input).to.have.attribute('aria-valuenow', '17');
            });

            it('sets value to the minimum possible value in a range slider', async () => {
              const handleValueChange = spy();
              const { user } = await render(
                <div dir={direction}>
                  <DirectionProvider direction={direction}>
                    <Slider.Root defaultValue={[20, 50]} min={7} onValueChange={handleValueChange}>
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Indicator />
                          <Slider.Thumb index={0} />
                          <Slider.Thumb index={1} />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const [input1, input2] = screen.getAllByRole('slider');

              await user.keyboard('[Tab]');
              await user.keyboard('[Tab]');
              expect(input2).toHaveFocus();

              await user.keyboard(`[${HOME}]`);
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal([20, 20]);
              await user.keyboard(`[${HOME}]`);
              expect(handleValueChange.callCount).to.equal(1);

              await user.keyboard('{Shift>}{Tab}');
              expect(input1).toHaveFocus();

              await user.keyboard(`[${HOME}]`);
              expect(handleValueChange.callCount).to.equal(2);
              expect(handleValueChange.args[1][0]).to.deep.equal([7, 20]);
            });
          });

          describe('key: PageUp', () => {
            it('increments the value by largeStep', async () => {
              const handleValueChange = spy();
              const { user } = await render(
                <div dir={direction}>
                  <DirectionProvider direction={direction}>
                    <Slider.Root
                      orientation={orientation}
                      defaultValue={20}
                      largeStep={5}
                      onValueChange={handleValueChange}
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Indicator />
                          <Slider.Thumb data-testid="thumb" />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const input = screen.getByRole('slider');

              await user.keyboard('[Tab]');
              expect(input).toHaveFocus();

              await user.keyboard('[PageUp]');
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal(25);
              expect(input).to.have.attribute('aria-valuenow', '25');
            });

            it('does not exceed max', async () => {
              const handleValueChange = spy();
              const { user } = await render(
                <div dir={direction}>
                  <DirectionProvider direction={direction}>
                    <Slider.Root
                      orientation={orientation}
                      defaultValue={20}
                      largeStep={5}
                      max={21}
                      onValueChange={handleValueChange}
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Indicator />
                          <Slider.Thumb data-testid="thumb" />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const input = screen.getByRole('slider');

              await user.keyboard('[Tab]');
              expect(input).toHaveFocus();

              await user.keyboard('[PageUp]');
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal(21);
              expect(input).to.have.attribute('aria-valuenow', '21');
            });
          });

          describe('key: PageDown', () => {
            it('decrements the value by largeStep', async () => {
              const handleValueChange = spy();
              const { user } = await render(
                <div dir={direction}>
                  <DirectionProvider direction={direction}>
                    <Slider.Root
                      orientation={orientation}
                      defaultValue={20}
                      largeStep={5}
                      onValueChange={handleValueChange}
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Indicator />
                          <Slider.Thumb data-testid="thumb" />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const input = screen.getByRole('slider');

              await user.keyboard('[Tab]');
              expect(input).toHaveFocus();

              await user.keyboard('[PageDown]');
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal(15);
              expect(input).to.have.attribute('aria-valuenow', '15');
            });

            it('does not go below min', async () => {
              const handleValueChange = spy();
              const { user } = await render(
                <div dir={direction}>
                  <DirectionProvider direction={direction}>
                    <Slider.Root
                      orientation={orientation}
                      defaultValue={20}
                      largeStep={5}
                      min={17}
                      onValueChange={handleValueChange}
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Indicator />
                          <Slider.Thumb data-testid="thumb" />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const input = screen.getByRole('slider');

              await user.keyboard('[Tab]');
              expect(input).toHaveFocus();

              await user.keyboard('[PageDown]');
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal(17);
              expect(input).to.have.attribute('aria-valuenow', '17');
            });
          });
        });
      });

      it('keypresses should correct invalid values', async () => {
        function App() {
          const [val, setVal] = React.useState(5.4698);
          return (
            <Slider.Root value={val} onValueChange={setVal} min={0} max={10} step={1}>
              <Slider.Control>
                <Slider.Track>
                  <Slider.Indicator />
                  <Slider.Thumb data-testid="thumb" />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
          );
        }
        const { user } = await render(<App />);

        const input = screen.getByRole('slider');

        expect(input).to.have.attribute('aria-valuenow', '5.4698');
        await user.keyboard('[Tab]');
        expect(input).toHaveFocus();
        await user.keyboard(`[${ARROW_RIGHT}]`);
        expect(input).to.have.attribute('aria-valuenow', '6');
      });
    });
  });

  describe('prop: format', () => {
    it('formats the value', async () => {
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, USD_NUMBER_FORMAT).format(v);
      }

      await render(<TestSlider defaultValue={50} format={USD_NUMBER_FORMAT} />);

      const value = screen.getByTestId('value');
      const slider = screen.getByRole('slider');
      expect(value).to.have.text(formatValue(50));
      expect(slider).to.have.attribute('aria-valuetext', formatValue(50));
    });

    it('formats range values', async () => {
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, USD_NUMBER_FORMAT).format(v);
      }

      await render(<TestRangeSlider defaultValue={[50, 75]} format={USD_NUMBER_FORMAT} />);

      const value = screen.getByTestId('value');
      expect(value).to.have.text(`${formatValue(50)} – ${formatValue(75)}`);
      const [slider1, slider2] = screen.getAllByRole('slider');
      expect(slider1).to.have.attribute('aria-valuetext', `${formatValue(50)} start range`);
      expect(slider2).to.have.attribute('aria-valuetext', `${formatValue(75)} end range`);
    });
  });

  describe('prop: locale', () => {
    it('sets the locale when formatting a single value', async () => {
      const format: Intl.NumberFormatOptions = {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      };
      const expectedValue = new Intl.NumberFormat('de-DE', format).format(70.51);

      await render(<TestSlider value={70.51} format={format} step={0.01} locale="de-DE" />);

      expect(screen.getByTestId('value')).to.have.text(expectedValue);
    });

    it('sets the locale when formatting a range value', async () => {
      const format: Intl.NumberFormatOptions = {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      };
      const expectedValue = `${new Intl.NumberFormat('de-DE', format).format(24.8)} – ${new Intl.NumberFormat('de-DE', format).format(70.51)}`;

      await render(
        <TestRangeSlider value={[24.8, 70.51]} format={format} step={0.01} locale="de-DE" />,
      );

      expect(screen.getByTestId('value')).to.have.text(expectedValue);
    });
  });

  describe('Form', () => {
    it('clears external errors on change', async () => {
      const { user } = await render(
        <Form
          errors={{
            test: 'test',
          }}
        >
          <Field.Root name="test" data-testid="field">
            <TestSlider data-testid="slider" defaultValue={50} />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>,
      );

      const slider = screen.getByRole('slider');

      expect(slider).to.have.attribute('aria-invalid', 'true');
      expect(screen.getByTestId('error')).to.have.text('test');

      await user.keyboard('[Tab]');
      expect(slider).toHaveFocus();

      await user.keyboard(`{Shift>}{ArrowRight}`);

      expect(slider).not.to.have.attribute('aria-invalid');
      expect(screen.queryByTestId('error')).to.equal(null);
    });

    describe.skipIf(isJSDOM)('form submission', () => {
      it('should include the slider value', async () => {
        await render(
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              expect(formData.get('slider')).to.equal('25');
            }}
          >
            <Field.Root name="slider">
              <Slider.Root defaultValue={25} format={USD_NUMBER_FORMAT}>
                <Slider.Control>
                  <Slider.Thumb />
                </Slider.Control>
              </Slider.Root>
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>,
        );

        const submit = screen.getByRole('button');
        fireEvent.click(submit);
      });

      it('should include range slider value', async () => {
        await render(
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              expect(formData.getAll('slider')).to.deep.equal(['25', '50']);
            }}
          >
            <Field.Root name="slider">
              <Slider.Root defaultValue={[25, 50]} format={USD_NUMBER_FORMAT}>
                <Slider.Control>
                  <Slider.Thumb />
                  <Slider.Thumb />
                </Slider.Control>
              </Slider.Root>
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>,
        );

        const submit = screen.getByRole('button');
        fireEvent.click(submit);
      });
    });
  });

  describe('Field', () => {
    it('should receive disabled prop from Field.Root', async () => {
      await render(
        <Field.Root disabled>
          <Slider.Root data-testid="root">
            <Slider.Control>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>,
      );

      const root = screen.getByTestId('root');
      expect(root).to.have.attribute('data-disabled', '');
    });

    it('should receive name prop from Field.Root', async () => {
      await render(
        <Field.Root name="field-slider">
          <Slider.Root>
            <Slider.Control>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>,
      );

      expect(screen.getByRole('slider')).to.have.attribute('name', 'field-slider');
    });

    it('[data-touched]', async () => {
      await render(
        <Field.Root>
          <Slider.Root data-testid="root">
            <Slider.Control>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>,
      );

      const root = screen.getByTestId('root');
      const input = screen.getByRole('slider');

      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(root).to.have.attribute('data-touched', '');
    });

    it('[data-dirty]', async () => {
      await render(
        <Field.Root>
          <Slider.Root data-testid="root">
            <Slider.Control>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>,
      );

      const root = screen.getByTestId('root');
      const input = screen.getByRole('slider');

      expect(root).not.to.have.attribute('data-dirty');

      fireEvent.change(input, { target: { value: 'value' } });

      expect(root).to.have.attribute('data-dirty', '');
    });

    it('[data-focused]', async () => {
      await render(
        <Field.Root>
          <Slider.Root data-testid="root">
            <Slider.Control>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>,
      );

      const root = screen.getByTestId('root');
      const input = screen.getByRole('slider');

      expect(root).not.to.have.attribute('data-focused');

      fireEvent.focus(input);

      expect(root).to.have.attribute('data-focused', '');

      fireEvent.blur(input);

      expect(root).not.to.have.attribute('data-focused');
    });

    describe('prop: validate', () => {
      it('validationMode=onSubmit', async () => {
        await render(
          <Form>
            <Field.Root validate={(val) => ((val as number) > 90 ? 'error' : null)}>
              <Slider.Root defaultValue={99} data-testid="root">
                <Slider.Control>
                  <Slider.Thumb data-testid="thumb" />
                </Slider.Control>
              </Slider.Root>
              <Field.Error data-testid="error" />
            </Field.Root>
            <button type="submit">submit</button>
          </Form>,
        );

        const root = screen.getByTestId('root');
        const thumb = screen.getByTestId('thumb');
        const input = screen.getByRole('slider');
        expect(input).not.to.have.attribute('aria-invalid');
        expect(screen.queryByTestId('error')).to.equal(null);

        fireEvent.change(input, { target: { value: '98' } });
        expect(input).to.not.have.attribute('aria-invalid');
        expect(screen.queryByTestId('error')).to.equal(null);

        fireEvent.click(screen.getByText('submit'));
        expect(input).to.have.attribute('aria-invalid', 'true');
        expect(screen.queryByTestId('error')).to.not.equal(null);
        expect(root).to.have.attribute('data-invalid');
        expect(thumb).to.have.attribute('data-invalid');

        fireEvent.change(input, { target: { value: '10' } });
        expect(input).not.to.have.attribute('aria-invalid');
        expect(screen.queryByTestId('error')).to.equal(null);
        expect(root).not.to.have.attribute('data-invalid');
        expect(input).not.to.have.attribute('data-invalid');
        expect(root).to.have.attribute('data-valid');
        expect(thumb).to.have.attribute('data-valid');

        fireEvent.change(input, { target: { value: '94' } });
        expect(input).to.have.attribute('aria-invalid', 'true');
        expect(screen.queryByTestId('error')).to.not.equal(null);

        fireEvent.change(input, { target: { value: '12' } });
        expect(input).not.to.have.attribute('aria-invalid');
        expect(screen.queryByTestId('error')).to.equal(null);
      });

      it('validationMode=onBlur', async () => {
        await render(
          <Field.Root
            validationMode="onBlur"
            validate={(value) => ((value as number) > 1 ? 'error' : null)}
          >
            <Slider.Root>
              <Slider.Control>
                <Slider.Thumb />
              </Slider.Control>
            </Slider.Root>
            <Field.Error data-testid="error" />
          </Field.Root>,
        );

        const input = screen.getByRole('slider');
        expect(input).not.to.have.attribute('aria-invalid');

        fireEvent.change(input, { target: { value: '2' } });
        expect(input).not.to.have.attribute('aria-invalid');
        fireEvent.blur(input);
        await flushMicrotasks();
        expect(input).to.have.attribute('aria-invalid', 'true');
      });

      it('validationMode=onChange', async () => {
        await render(
          <Field.Root
            validationMode="onChange"
            validate={(value) => (Number(value) === 1 ? 'error' : null)}
          >
            <Slider.Root defaultValue={0}>
              <Slider.Control>
                <Slider.Thumb />
              </Slider.Control>
            </Slider.Root>
          </Field.Root>,
        );

        const input = screen.getByRole('slider');
        expect(input).not.to.have.attribute('aria-invalid');

        fireEvent.change(input, { target: { value: '1' } });
        await flushMicrotasks();
        expect(input).to.have.attribute('aria-invalid', 'true');
      });

      it('revalidates when the controlled value changes externally', async () => {
        const validateSpy = spy((value: unknown) => (Number(value) === 5 ? 'error' : null));

        function App() {
          const [value, setValue] = React.useState(0);

          return (
            <React.Fragment>
              <Field.Root validationMode="onChange" validate={validateSpy} name="volume">
                <Slider.Root value={value} onValueChange={(next) => setValue(next as number)}>
                  <Slider.Control>
                    <Slider.Thumb />
                  </Slider.Control>
                </Slider.Root>
              </Field.Root>
              <button type="button" onClick={() => setValue(5)}>
                Set externally
              </button>
            </React.Fragment>
          );
        }

        await render(<App />);

        const slider = screen.getByRole('slider');
        const toggle = screen.getByText('Set externally');

        expect(slider).not.to.have.attribute('aria-invalid');
        const initialCallCount = validateSpy.callCount;

        fireEvent.click(toggle);
        await flushMicrotasks();

        expect(validateSpy.callCount).to.equal(initialCallCount + 1);
        expect(validateSpy.lastCall.args[0]).to.equal(5);
        expect(slider).to.have.attribute('aria-invalid', 'true');
      });

      it('receives an array value for range sliders', async () => {
        const validateSpy = spy();
        await render(
          <Form>
            <Field.Root validate={validateSpy}>
              <Slider.Root defaultValue={[5, 12]}>
                <Slider.Control>
                  <Slider.Thumb index={0} />
                  <Slider.Thumb index={1} />
                </Slider.Control>
              </Slider.Root>
              <Field.Error data-testid="error" />
            </Field.Root>
            <button type="submit">submit</button>
          </Form>,
        );

        fireEvent.click(screen.getByText('submit'));
        expect(validateSpy.callCount).to.equal(1);
        expect(validateSpy.args[0][0]).to.deep.equal([5, 12]);
      });

      it('does not call validate on change when validationMode is omitted', async () => {
        const validateSpy = spy();
        await render(
          <Form>
            <Field.Root validate={validateSpy}>
              <Slider.Root defaultValue={50}>
                <Slider.Control data-testid="control">
                  <Slider.Track>
                    <Slider.Thumb aria-label="Value" />
                  </Slider.Track>
                </Slider.Control>
              </Slider.Root>
            </Field.Root>
            <button type="submit">submit</button>
          </Form>,
        );

        expect(validateSpy.callCount).to.equal(0);

        const sliderControl = screen.getByTestId('control');
        fireEvent.pointerDown(sliderControl, { buttons: 1, clientX: 10 });
        fireEvent.pointerUp(sliderControl, { buttons: 1, clientX: 30 });

        expect(validateSpy.callCount).to.equal(0);
      });
    });

    it('Field.Label', async () => {
      await render(
        <Field.Root>
          <Slider.Root>
            <Slider.Control>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
          <Field.Label data-testid="label" />
        </Field.Root>,
      );

      expect(screen.getByRole('slider')).to.have.attribute(
        'aria-labelledby',
        screen.getByTestId('label').id,
      );
    });

    it('Field.Description', async () => {
      await render(
        <Field.Root>
          <Slider.Root data-testid="slider">
            <Slider.Control />
          </Slider.Root>
          <Field.Description data-testid="description" />
        </Field.Root>,
      );

      expect(screen.getByTestId('slider')).to.have.attribute(
        'aria-describedby',
        screen.getByTestId('description').id,
      );
    });
  });
});
