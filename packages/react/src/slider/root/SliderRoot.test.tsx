import { expect } from 'chai';
import * as React from 'react';
import { spy, stub } from 'sinon';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import {
  DirectionProvider,
  type TextDirection,
} from '@base-ui-components/react/direction-provider';
import { Field } from '@base-ui-components/react/field';
import { Slider } from '@base-ui-components/react/slider';
import { Form } from '@base-ui-components/react/form';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
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

type Touches = Array<Pick<Touch, 'identifier' | 'clientX' | 'clientY'>>;

const GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL = {
  width: 100,
  height: 10,
  bottom: 10,
  left: 0,
  x: 0,
  y: 0,
  top: 0,
  right: 100,
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
          <Slider.Thumb data-testid="thumb-0" />
          <Slider.Thumb data-testid="thumb-1" />
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

  it('renders a slider', async () => {
    await render(
      <Slider.Root defaultValue={30}>
        <Slider.Value />
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>,
    );

    expect(screen.getByRole('slider')).to.have.attribute('aria-valuenow', '30');
  });

  it('should not break when initial value is out of range', async () => {
    const { getByTestId } = await render(<TestRangeSlider value={[19, 41]} min={20} max={40} />);

    const sliderControl = getByTestId('control');

    stub(sliderControl, 'getBoundingClientRect').callsFake(
      () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
    );

    fireEvent.touchStart(
      sliderControl,
      createTouches([{ identifier: 1, clientX: 100, clientY: 0 }]),
    );

    fireEvent.touchMove(document.body, createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]));
  });

  describe('ARIA attributes', () => {
    it('it has the correct aria attributes', async () => {
      const { container, getByRole, getByTestId } = await render(
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

      const root = getByTestId('root');
      const slider = getByRole('slider');
      const input = container.querySelector('input');

      expect(root).to.have.attribute('aria-labelledby', 'labelId');

      expect(slider).to.have.attribute('aria-valuenow', '30');
      expect(slider).to.have.attribute('aria-valuemin', '0');
      expect(slider).to.have.attribute('aria-valuemax', '100');
      expect(slider).to.have.attribute('aria-orientation', 'horizontal');

      expect(input).to.have.attribute('aria-labelledby', 'labelId');
      expect(input).to.have.attribute('aria-valuenow', '30');
    });

    it('should update aria-valuenow', async () => {
      const { getByRole } = await render(<TestSlider defaultValue={50} />);
      const slider = getByRole('slider');
      await act(async () => {
        slider.focus();
      });

      fireEvent.change(slider, { target: { value: 51 } });
      expect(slider).to.have.attribute('aria-valuenow', '51');

      fireEvent.change(slider, { target: { value: 52 } });
      expect(slider).to.have.attribute('aria-valuenow', '52');
    });

    it('should set default aria-valuetext on range slider thumbs', async () => {
      const { getByTestId } = await render(<TestRangeSlider defaultValue={[44, 50]} />);

      const thumbOne = getByTestId('thumb-0');
      const thumbTwo = getByTestId('thumb-1');

      expect(thumbOne.querySelector('input')).to.have.attribute('aria-valuetext', '44 start range');
      expect(thumbTwo.querySelector('input')).to.have.attribute('aria-valuetext', '50 end range');
    });
  });

  describe.skipIf(isJSDOM)('rtl', () => {
    it('should handle RTL', async () => {
      const handleValueChange = spy();
      const { getByTestId } = await render(
        <div dir="rtl">
          <DirectionProvider direction="rtl">
            <TestSlider value={30} onValueChange={handleValueChange} />
          </DirectionProvider>
        </div>,
      );
      const sliderControl = getByTestId('control');
      const sliderThumb = getByTestId('thumb');
      expect(sliderThumb.style.insetInlineStart).to.equal('30%');

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]),
      );

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 22, clientY: 0 }]),
      );

      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[0][0]).to.equal(80);
      expect(handleValueChange.args[1][0]).to.equal(78);
    });
  });

  describe('prop: disabled', () => {
    it('should render data-disabled on all subcomponents', async () => {
      const { getByTestId } = await render(
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

      const root = getByTestId('root');
      const value = getByTestId('value');
      const control = getByTestId('control');
      const track = getByTestId('track');
      const indicator = getByTestId('indicator');
      const thumb = getByTestId('thumb');

      [root, value, control, track, indicator, thumb].forEach((subcomponent) => {
        expect(subcomponent).to.have.attribute('data-disabled', '');
      });
    });

    // may work in JSDOM depending on https://github.com/jsdom/jsdom/issues/3029
    it.skipIf(isJSDOM)('should not respond to drag events after becoming disabled', async () => {
      const { getByRole, setProps, getByTestId } = await render(
        <TestSlider defaultValue={0} data-testid="slider-root" />,
      );

      const sliderControl = getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );
      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 21, clientY: 0 }]),
      );

      const thumb = getByRole('slider');

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
    });

    // may work in JSDOM depending on https://github.com/jsdom/jsdom/issues/3029
    it.skipIf(isJSDOM)('should not respond to drag events if disabled', async () => {
      const { getByRole, getByTestId } = await render(
        <TestSlider defaultValue={21} data-testid="slider-root" disabled />,
      );

      const thumb = getByRole('slider');
      const sliderControl = getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

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
      const { getByTestId } = await render(<TestSlider />);

      const sliderRoot = screen.getByRole('group');
      expect(sliderRoot).to.have.attribute('data-orientation', 'horizontal');
      const sliderControl = getByTestId('control');
      expect(sliderControl).to.have.attribute('data-orientation', 'horizontal');
      const sliderOutput = getByTestId('value');
      expect(sliderOutput).to.have.attribute('data-orientation', 'horizontal');
    });

    it.skipIf(isJSDOM || !/WebKit/.test(window.navigator.userAgent))(
      'does not set the orientation via appearance for WebKit browsers',
      async () => {
        await render(<TestSlider orientation="vertical" />);

        const slider = screen.getByRole('slider');

        expect(slider).to.have.property('tagName', 'INPUT');
        expect(slider).to.have.property('type', 'range');
        // Only relevant if we implement `[role="slider"]` with `input[type="range"]`
        // We're not setting this by default because it changes horizontal keyboard navigation in WebKit: https://issues.chromium.org/issues/40739626
        expect(slider).not.toHaveComputedStyle({ webkitAppearance: 'slider-vertical' });
      },
    );

    it.skipIf(isJSDOM)('should report the right position', async () => {
      const handleValueChange = spy();
      const { getByTestId } = await render(
        <TestSlider orientation="vertical" defaultValue={20} onValueChange={handleValueChange} />,
      );

      const sliderControl = getByTestId('control');
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
      const { getByRole } = await render(
        <TestSlider defaultValue={0.2} min={-100} max={100} step={0.00000001} />,
      );
      const slider = getByRole('slider');

      await act(async () => {
        slider.focus();
      });

      fireEvent.change(slider, { target: { value: '51.1' } });
      expect(slider).to.have.attribute('aria-valuenow', '51.1');

      fireEvent.change(slider, { target: { value: '0.00000005' } });
      expect(slider).to.have.attribute('aria-valuenow', '5e-8');

      fireEvent.change(slider, { target: { value: '1e-7' } });
      expect(slider).to.have.attribute('aria-valuenow', '1e-7');
    });

    it.skipIf(isJSDOM)('should round value to step precision', async () => {
      const { getByRole, getByTestId } = await render(
        <TestSlider defaultValue={0.2} min={0} max={1} step={0.1} />,
      );
      const slider = getByRole('slider');

      await act(async () => {
        slider.focus();
      });

      const sliderControl = getByTestId('control');
      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

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

    it.skipIf(isJSDOM)(
      'should not fail to round value to step precision when step is very small',
      async () => {
        const { getByRole, getByTestId } = await render(
          <TestSlider defaultValue={0.00000002} min={0} max={0.0000001} step={0.00000001} />,
        );
        const slider = getByRole('slider');

        await act(async () => {
          slider.focus();
        });

        const sliderControl = getByTestId('control');
        stub(sliderControl, 'getBoundingClientRect').callsFake(
          () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
        );

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

    it.skipIf(isJSDOM)(
      'should not fail to round value to step precision when step is very small and negative',
      async () => {
        const { getByRole, getByTestId } = await render(
          <TestSlider defaultValue={-0.00000002} min={-0.0000001} max={0} step={0.00000001} />,
        );
        const slider = getByRole('slider');

        await act(async () => {
          slider.focus();
        });

        const sliderControl = getByTestId('control');
        stub(sliderControl, 'getBoundingClientRect').callsFake(
          () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
        );

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
    const MAX = 750;

    it('should set the max and aria-valuemax on the input', async () => {
      const { getByRole } = await render(
        <TestSlider defaultValue={150} step={100} max={MAX} min={150} />,
      );
      const slider = getByRole('slider');

      expect(slider).to.have.attribute('aria-valuemax', String(MAX));
      expect(slider).to.have.attribute('max', String(MAX));
    });

    it('should not go more than the max', async () => {
      const { getByRole } = await render(
        <TestSlider defaultValue={150} step={100} max={MAX} min={150} />,
      );

      const slider = getByRole('slider');
      await act(async () => {
        slider.focus();
      });

      fireEvent.change(slider, { target: { value: String(MAX + 100) } });
      expect(slider).to.have.attribute('aria-valuenow', String(MAX));
    });

    it.skipIf(isJSDOM)('should reach right edge value', async () => {
      const { getByRole, getByTestId } = await render(
        <TestSlider defaultValue={90} min={6} max={108} step={10} />,
      );

      const sliderControl = getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      const slider = getByRole('slider');
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
    const MIN = 150;

    it('should set the min and aria-valuemin on the input', async () => {
      const { getByRole } = await render(
        <TestSlider defaultValue={150} step={100} max={750} min={MIN} />,
      );
      const slider = getByRole('slider');

      expect(slider).to.have.attribute('aria-valuemin', String(MIN));
      expect(slider).to.have.attribute('min', String(MIN));
    });

    it('should use min as the step origin', async () => {
      const { getByRole } = await render(
        <TestSlider defaultValue={150} step={100} max={750} min={MIN} />,
      );
      const slider = getByRole('slider');
      await act(async () => {
        slider.focus();
      });

      expect(slider).to.have.attribute('aria-valuenow', String(MIN));
    });

    it('should not go less than the min', async () => {
      const { getByRole } = await render(
        <TestSlider defaultValue={150} step={100} max={750} min={MIN} />,
      );
      const slider = getByRole('slider');
      await act(async () => {
        slider.focus();
      });

      fireEvent.change(slider, { target: { value: String(MIN - 100) } });
      expect(slider).to.have.attribute('aria-valuenow', String(MIN));
    });
  });

  describe('prop: minStepsBetweenValues', () => {
    it('should enforce a minimum difference between range slider values', async () => {
      const handleValueChange = spy();

      const { getByTestId } = await render(
        <TestRangeSlider
          onValueChange={handleValueChange}
          defaultValue={[44, 50]}
          step={2}
          minStepsBetweenValues={2}
        />,
      );

      const thumbOne = getByTestId('thumb-0');
      const thumbTwo = getByTestId('thumb-1');

      await act(async () => {
        thumbOne.focus();
      });

      fireEvent.keyDown(thumbOne, { key: 'ArrowUp' });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal([46, 50]);
      fireEvent.keyDown(thumbOne, { key: 'ArrowUp' });
      expect(handleValueChange.callCount).to.equal(1);

      await act(async () => {
        thumbTwo.focus();
      });

      fireEvent.keyDown(thumbTwo, { key: 'ArrowUp' });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal([46, 52]);
      fireEvent.keyDown(thumbTwo, { key: 'ArrowDown' });
      fireEvent.keyDown(thumbTwo, { key: 'ArrowDown' });
      expect(handleValueChange.callCount).to.equal(3);
      expect(handleValueChange.args[2][0]).to.deep.equal([46, 50]);
    });
  });

  describe('events', () => {
    it.skipIf(isJSDOM)('should call handlers', async () => {
      const handleValueChange = spy();
      const handleValueCommitted = spy();

      const { getByRole, getByTestId } = await render(
        <TestSlider
          onValueChange={handleValueChange}
          onValueCommitted={handleValueCommitted}
          value={0}
        />,
      );

      const sliderControl = getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      const slider = getByRole('slider');

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
      expect(handleValueCommitted.callCount).to.equal(1);
      expect(handleValueCommitted.args[0][0]).to.equal(10);

      await act(async () => {
        slider.focus();
      });

      fireEvent.change(slider, { target: { value: 23 } });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueCommitted.callCount).to.equal(2);
    });

    it.skipIf(isJSDOM)('should support touch events', async () => {
      const handleValueChange = spy();
      const { getByTestId } = await render(
        <TestRangeSlider defaultValue={[20, 30]} onValueChange={handleValueChange} />,
      );
      const sliderControl = getByTestId('control');
      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

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

    it.skipIf(isJSDOM)('should only listen to changes from the same touchpoint', async () => {
      const handleValueChange = spy();
      const handleValueCommitted = spy();

      const { getByTestId } = await render(
        <TestSlider
          onValueChange={handleValueChange}
          onValueCommitted={handleValueCommitted}
          value={0}
        />,
      );

      const sliderControl = getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

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

      fireEvent.touchEnd(document.body, createTouches([{ identifier: 1, clientX: 2, clientY: 0 }]));
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueCommitted.callCount).to.equal(1);
    });

    it.skipIf(isJSDOM)('should hedge against a dropped mouseup event', async () => {
      const handleValueChange = spy();

      const { getByTestId } = await render(
        <TestSlider onValueChange={handleValueChange} value={0} />,
      );

      const sliderControl = getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

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

    it('should focus the slider when touching', async () => {
      const { getByRole, getByTestId } = await render(<TestSlider defaultValue={30} />);
      const slider = getByRole('slider');
      const sliderControl = getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.touchStart(
        sliderControl,
        createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]),
      );

      expect(slider).toHaveFocus();
    });

    it('should focus the slider when dragging', async () => {
      const { getByRole, getByTestId } = await render(<TestSlider defaultValue={30} step={10} />);
      const slider = getByRole('slider');
      const sliderThumb = getByTestId('thumb');
      const sliderControl = getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.pointerDown(sliderThumb, {
        buttons: 1,
        clientX: 1,
      });

      expect(slider).toHaveFocus();
    });

    it('should not override the event.target on touch events', async () => {
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

      const { getByTestId } = await render(<Test />);
      const sliderControl = getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

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
      const { getByTestId } = await render(<Test />);
      const sliderControl = getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.mouseDown(sliderControl);

      expect(handleValueChange.callCount).to.equal(0);
      expect(handleNativeEvent.callCount).to.equal(1);
      expect(handleNativeEvent.firstCall.args[0]).to.have.property('target', sliderControl);
      expect(handleEvent.callCount).to.equal(1);
      expect(handleEvent.firstCall.args[0]).to.have.property('target', sliderControl);
    });
  });

  describe('dragging state', () => {
    it('should not apply data-dragging for click modality', async () => {
      const { getByTestId } = await render(<TestSlider defaultValue={90} />);

      const sliderControl = getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

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
      const { getByTestId } = await render(<TestSlider defaultValue={90} />);

      const sliderControl = getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

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

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

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

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

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

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.pointerDown(sliderControl, {
        button: 2,
        clientX: 41,
      });

      expect(handleValueChange.callCount).to.equal(0);
    });

    it.skipIf(isJSDOM)('should fire only when the value changes', async () => {
      const handleValueChange = spy();
      await render(<TestSlider defaultValue={20} onValueChange={handleValueChange} />);

      const sliderControl = screen.getByTestId('control');

      stub(sliderControl, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

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
          <TestRangeSlider min={0} max={5} onValueChange={handleValueChange} value={value} />,
        );

        const sliderControl = screen.getByTestId('control');

        stub(sliderControl, 'getBoundingClientRect').callsFake(
          () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
        );

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
      const handleValueChange = stub().callsFake((newValue, event) => event.target);

      const { getByRole } = await render(
        <TestSlider onValueChange={handleValueChange} name="change-testing" value={3} />,
      );
      const slider = getByRole('slider');

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

        stub(sliderControl, 'getBoundingClientRect').callsFake(
          () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
        );

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
              expect(screen.getByTestId('thumb')).toHaveFocus();

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
              expect(screen.getByTestId('thumb')).toHaveFocus();

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
              expect(screen.getByTestId('thumb')).toHaveFocus();

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
              expect(screen.getByTestId('thumb')).toHaveFocus();

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
              expect(screen.getByTestId('thumb')).toHaveFocus();

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
              expect(screen.getByTestId('thumb')).toHaveFocus();

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
              expect(screen.getByTestId('thumb')).toHaveFocus();

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
                          <Slider.Thumb data-testid="thumb1" />
                          <Slider.Thumb data-testid="thumb2" />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const thumb1 = screen.getByTestId('thumb1');
              const thumb2 = screen.getByTestId('thumb2');

              await user.keyboard('[Tab]');
              expect(thumb1).toHaveFocus();

              await user.keyboard(`[${END}]`);
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal([50, 50]);
              await user.keyboard(`[${END}]`);
              expect(handleValueChange.callCount).to.equal(1);

              await user.keyboard('[Tab]');
              expect(thumb2).toHaveFocus();

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
              expect(screen.getByTestId('thumb')).toHaveFocus();

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
                          <Slider.Thumb data-testid="thumb1" />
                          <Slider.Thumb data-testid="thumb2" />
                        </Slider.Track>
                      </Slider.Control>
                    </Slider.Root>
                  </DirectionProvider>
                </div>,
              );

              const thumb1 = screen.getByTestId('thumb1');
              const thumb2 = screen.getByTestId('thumb2');

              await user.keyboard('[Tab]');
              await user.keyboard('[Tab]');
              expect(thumb2).toHaveFocus();

              await user.keyboard(`[${HOME}]`);
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal([20, 20]);
              await user.keyboard(`[${HOME}]`);
              expect(handleValueChange.callCount).to.equal(1);

              await user.keyboard('{Shift>}{Tab}');
              expect(thumb1).toHaveFocus();

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
              expect(screen.getByTestId('thumb')).toHaveFocus();

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
              expect(screen.getByTestId('thumb')).toHaveFocus();

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
              expect(screen.getByTestId('thumb')).toHaveFocus();

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
              expect(screen.getByTestId('thumb')).toHaveFocus();

              await user.keyboard('[PageDown]');
              expect(handleValueChange.callCount).to.equal(1);
              expect(handleValueChange.args[0][0]).to.deep.equal(17);
              expect(input).to.have.attribute('aria-valuenow', '17');
            });
          });
        });
      });

      it('can be removed from the tab sequence', async () => {
        await render(<TestSlider tabIndex={-1} value={30} />);
        expect(screen.getByRole('slider')).to.have.property('tabIndex', -1);
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

        expect(screen.getByRole('slider')).to.have.attribute('aria-valuenow', '5.4698');
        await user.keyboard('[Tab]');
        expect(screen.getByTestId('thumb')).toHaveFocus();
        await user.keyboard(`[${ARROW_RIGHT}]`);
        expect(screen.getByRole('slider')).to.have.attribute('aria-valuenow', '6');
      });
    });
  });

  describe('prop: format', () => {
    it('formats the value', async () => {
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      };
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v);
      }
      const { getByRole, getByTestId } = await render(
        <TestSlider defaultValue={50} format={format} />,
      );
      const value = getByTestId('value');
      const slider = getByRole('slider');
      expect(value).to.have.text(formatValue(50));
      expect(slider).to.have.attribute('aria-valuetext', formatValue(50));
    });

    it('formats range values', async () => {
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      };
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v);
      }
      const { getAllByRole, getByTestId } = await render(
        <TestRangeSlider defaultValue={[50, 75]} format={format} />,
      );
      const value = getByTestId('value');
      expect(value).to.have.text(`${formatValue(50)} – ${formatValue(75)}`);
      const [slider1, slider2] = getAllByRole('slider');
      expect(slider1).to.have.attribute('aria-valuetext', `${formatValue(50)} start range`);
      expect(slider2).to.have.attribute('aria-valuetext', `${formatValue(75)} end range`);
    });
  });

  describe.skipIf(isJSDOM)('form handling', () => {
    it('should include the slider value in the form submission', async () => {
      let stringifiedFormData = '';

      const { getByRole } = await render(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            stringifiedFormData = new URLSearchParams(formData as any).toString();
          }}
        >
          <Slider.Root name="slider" defaultValue={25}>
            <Slider.Control>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
          <button type="submit">Submit</button>
        </form>,
      );

      const submit = getByRole('button');
      fireEvent.click(submit);

      expect(stringifiedFormData).to.equal('slider=25');
    });
  });

  describe('Field', () => {
    it('should receive disabled prop from Field.Root', async () => {
      const { getByTestId } = await render(
        <Field.Root disabled>
          <Slider.Root data-testid="root">
            <Slider.Control>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>,
      );

      const root = getByTestId('root');
      expect(root).to.have.attribute('data-disabled', '');
    });

    it('should receive name prop from Field.Root', async () => {
      const { getByTestId } = await render(
        <Field.Root name="field-slider">
          <Slider.Root>
            <Slider.Control>
              <Slider.Thumb data-testid="thumb" />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>,
      );

      const thumb = getByTestId('thumb');
      const input = thumb.querySelector('input');
      expect(input).to.have.attribute('name', 'field-slider');
    });
  });

  describe('Form', () => {
    it('clears errors on change', async () => {
      function App() {
        const [errors, setErrors] = React.useState<Record<string, string | string[]>>({
          test: 'test',
        });
        return (
          <Form errors={errors} onClearErrors={setErrors}>
            <Field.Root name="test" data-testid="field">
              <TestSlider data-testid="slider" defaultValue={50} />
              <Field.Error data-testid="error" />
            </Field.Root>
          </Form>
        );
      }

      const { user } = await render(<App />);

      const slider = screen.getByRole('slider');

      expect(slider).to.have.attribute('aria-invalid', 'true');
      expect(screen.getByTestId('error')).to.have.text('test');

      await user.keyboard('[Tab]');
      expect(screen.getByTestId('thumb')).toHaveFocus();

      await user.keyboard(`{Shift>}{ArrowRight}`);

      expect(slider).not.to.have.attribute('aria-invalid');
      expect(screen.queryByTestId('error')).to.equal(null);
    });
  });

  describe('Field', () => {
    it('[data-touched]', async () => {
      await render(
        <Field.Root>
          <Slider.Root data-testid="root">
            <Slider.Control>
              <Slider.Thumb data-testid="thumb" />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>,
      );

      const root = screen.getByTestId('root');
      const thumb = screen.getByTestId('thumb');

      fireEvent.focus(thumb);
      fireEvent.blur(thumb);

      expect(root).to.have.attribute('data-touched', '');
    });

    it('[data-dirty]', async () => {
      const { container } = await render(
        <Field.Root>
          <Slider.Root data-testid="root">
            <Slider.Control>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>,
      );

      const root = screen.getByTestId('root');
      const input = container.querySelector<HTMLInputElement>('input')!;

      expect(root).not.to.have.attribute('data-dirty');

      fireEvent.change(input, { target: { value: 'value' } });

      expect(root).to.have.attribute('data-dirty', '');
    });

    it('[data-focused]', async () => {
      const { container } = await render(
        <Field.Root>
          <Slider.Root data-testid="root">
            <Slider.Control>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>,
      );

      const root = screen.getByTestId('root');
      const input = container.querySelector<HTMLInputElement>('input')!;

      expect(root).not.to.have.attribute('data-focused');

      fireEvent.focus(input);

      expect(root).to.have.attribute('data-focused', '');

      fireEvent.blur(input);

      expect(root).not.to.have.attribute('data-focused');
    });
  });
});
