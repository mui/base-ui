import { expect } from 'chai';
import * as React from 'react';
import { spy, stub } from 'sinon';
import { act, createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import * as Slider from '@base_ui/react/Slider';
import { describeConformance } from '../../../test/describeConformance';
import type { SliderRootProps } from './SliderRoot.types';

type Touches = Array<Pick<Touch, 'identifier' | 'clientX' | 'clientY'>>;

const GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL = {
  width: 100,
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

function TestSlider(props: SliderRootProps) {
  return (
    <Slider.Root data-testid="root" {...props}>
      <Slider.Output data-testid="output" />
      <Slider.Track data-testid="track">
        <Slider.Thumb data-testid="thumb" />
      </Slider.Track>
    </Slider.Root>
  );
}

function TestRangeSlider(props: SliderRootProps) {
  return (
    <Slider.Root data-testid="root" {...props}>
      <Slider.Output data-testid="output" />
      <Slider.Track data-testid="track">
        <Slider.Thumb data-testid="thumb-0" />
        <Slider.Thumb data-testid="thumb-1" />
      </Slider.Track>
    </Slider.Root>
  );
}

describe('<Slider.Root />', () => {
  before(function beforeHook() {
    if (typeof Touch === 'undefined') {
      this.skip();
    }

    // PointerEvent not fully implemented in jsdom, causing
    // fireEvent.pointer* to ignore options
    // https://github.com/jsdom/jsdom/issues/2527
    (window as any).PointerEvent = window.MouseEvent;
  });

  const { render } = createRenderer();

  describeConformance(<Slider.Root defaultValue={50} />, () => ({
    inheritComponent: 'span',
    render,
    refInstanceof: window.HTMLSpanElement,
  }));

  it('renders a slider', () => {
    render(
      <Slider.Root defaultValue={30}>
        <Slider.Output />
        <Slider.Track>
          <Slider.Thumb />
        </Slider.Track>
      </Slider.Root>,
    );

    expect(screen.getByRole('slider')).to.have.attribute('aria-valuenow', '30');
  });

  it('should not break when initial value is out of range', () => {
    const { getByTestId } = render(<TestRangeSlider value={[19, 41]} min={20} max={40} />);

    const sliderTrack = getByTestId('track');

    stub(sliderTrack, 'getBoundingClientRect').callsFake(
      () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
    );

    fireEvent.touchStart(sliderTrack, createTouches([{ identifier: 1, clientX: 100, clientY: 0 }]));

    fireEvent.touchMove(document.body, createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]));
  });

  describe('ARIA attributes', () => {
    it('it has the correct aria attributes', () => {
      const { container, getByRole, getByTestId } = render(
        <Slider.Root defaultValue={30} aria-labelledby="labelId" data-testid="root">
          <Slider.Output />
          <Slider.Track>
            <Slider.Thumb />
          </Slider.Track>
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

    it('should update aria-valuenow', () => {
      const { getByRole } = render(<TestSlider defaultValue={50} />);
      const slider = getByRole('slider');
      act(() => {
        slider.focus();
      });

      fireEvent.change(slider, { target: { value: 51 } });
      expect(slider).to.have.attribute('aria-valuenow', '51');

      fireEvent.change(slider, { target: { value: 52 } });
      expect(slider).to.have.attribute('aria-valuenow', '52');
    });
  });

  describe('rtl', () => {
    it('should handle RTL', () => {
      const handleValueChange = spy();
      const { getByTestId } = render(
        <TestSlider isRtl value={30} onValueChange={handleValueChange} />,
      );
      const sliderTrack = getByTestId('track');
      const sliderThumb = getByTestId('thumb');
      expect(sliderThumb.style.right).to.equal('30%');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.touchStart(
        sliderTrack,
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

    it('increments on ArrowUp', () => {
      const handleValueChange = spy();
      const { container } = render(
        <TestSlider defaultValue={20} onValueChange={handleValueChange} isRtl />,
      );

      const input = container.querySelector('input');

      fireEvent.keyDown(document.body, { key: 'TAB' });

      act(() => {
        (input as HTMLInputElement).focus();
      });

      fireEvent.keyDown(input!, { key: 'ArrowUp' });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(21);

      fireEvent.keyDown(input!, { key: 'ArrowUp', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal(31);
    });

    it('increments on ArrowLeft', () => {
      const handleValueChange = spy();
      const { container } = render(
        <TestSlider defaultValue={20} onValueChange={handleValueChange} isRtl />,
      );

      const input = container.querySelector('input');

      fireEvent.keyDown(document.body, { key: 'TAB' });

      act(() => {
        (input as HTMLInputElement).focus();
      });

      fireEvent.keyDown(input!, { key: 'ArrowLeft' });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(21);

      fireEvent.keyDown(input!, { key: 'ArrowLeft', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal(31);
    });

    it('decrements on ArrowDown', () => {
      const handleValueChange = spy();
      const { container } = render(
        <TestSlider defaultValue={20} onValueChange={handleValueChange} isRtl />,
      );

      const input = container.querySelector('input');

      fireEvent.keyDown(document.body, { key: 'TAB' });

      act(() => {
        (input as HTMLInputElement).focus();
      });

      fireEvent.keyDown(input!, { key: 'ArrowDown' });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(19);

      fireEvent.keyDown(input!, { key: 'ArrowDown', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal(9);
    });

    it('decrements on ArrowRight', () => {
      const handleValueChange = spy();
      const { container } = render(
        <TestSlider defaultValue={20} onValueChange={handleValueChange} isRtl />,
      );

      const input = container.querySelector('input');

      fireEvent.keyDown(document.body, { key: 'TAB' });

      act(() => {
        (input as HTMLInputElement).focus();
      });

      fireEvent.keyDown(input!, { key: 'ArrowRight' });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(19);

      fireEvent.keyDown(input!, { key: 'ArrowRight', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal(9);
    });
  });

  describe('prop: disabled', () => {
    it('should render data-disabled on the root, track, output and thumb', () => {
      const { getByTestId } = render(
        <Slider.Root defaultValue={30} disabled data-testid="root">
          <Slider.Output data-testid="output" />
          <Slider.Track data-testid="track">
            <Slider.Thumb data-testid="thumb" />
          </Slider.Track>
        </Slider.Root>,
      );

      const root = getByTestId('root');
      const output = getByTestId('output');
      const track = getByTestId('track');
      const thumb = getByTestId('thumb');

      expect(root).to.have.attribute('data-disabled', 'true');
      expect(output).to.have.attribute('data-disabled', 'true');
      expect(track).to.have.attribute('data-disabled', 'true');
      expect(thumb).to.have.attribute('data-disabled', 'true');
    });

    it('should not respond to drag events after becoming disabled', function test() {
      // TODO: Don't skip once a fix for https://github.com/jsdom/jsdom/issues/3029 is released.
      if (/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }

      const { getByRole, setProps, getByTestId } = render(
        <TestSlider defaultValue={0} data-testid="slider-root" />,
      );

      const sliderTrack = getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );
      fireEvent.touchStart(
        sliderTrack,
        createTouches([{ identifier: 1, clientX: 21, clientY: 0 }]),
      );

      const thumb = getByRole('slider');

      expect(thumb).to.have.attribute('aria-valuenow', '21');
      expect(thumb).toHaveFocus();

      setProps({ disabled: true });
      expect(thumb).not.toHaveFocus();
      // expect(thumb).not.to.have.class(classes.active);

      fireEvent.touchMove(sliderTrack, createTouches([{ identifier: 1, clientX: 30, clientY: 0 }]));

      expect(thumb).to.have.attribute('aria-valuenow', '21');
    });

    it('should not respond to drag events if disabled', function test() {
      // TODO: Don't skip once a fix for https://github.com/jsdom/jsdom/issues/3029 is released.
      if (/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }

      const { getByRole, getByTestId } = render(
        <TestSlider defaultValue={21} data-testid="slider-root" disabled />,
      );

      const thumb = getByRole('slider');
      const sliderTrack = getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.touchStart(
        sliderTrack,
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

  describe('prop: marks', () => {
    it('does not cause unknown-prop error', () => {
      const marks = [
        {
          value: 33,
        },
      ];
      expect(() => {
        render(<Slider.Root marks={marks} />);
      }).not.to.throw();
    });
  });

  describe('prop: orientation', () => {
    it('sets the orientation via ARIA', () => {
      render(<TestSlider orientation="vertical" />);

      const sliderRoot = screen.getByRole('slider');
      expect(sliderRoot).to.have.attribute('aria-orientation', 'vertical');
    });

    it('sets the data-orientation attribute', () => {
      const { getByTestId } = render(<TestSlider />);

      const sliderRoot = screen.getByRole('group');
      expect(sliderRoot).to.have.attribute('data-orientation', 'horizontal');
      const sliderTrack = getByTestId('track');
      expect(sliderTrack).to.have.attribute('data-orientation', 'horizontal');
      const sliderOutput = getByTestId('output');
      expect(sliderOutput).to.have.attribute('data-orientation', 'horizontal');
    });

    it('does not set the orientation via appearance for WebKit browsers', function test() {
      if (/jsdom/.test(window.navigator.userAgent) || !/WebKit/.test(window.navigator.userAgent)) {
        this.skip();
      }

      render(<TestSlider orientation="vertical" />);

      const slider = screen.getByRole('slider');

      expect(slider).to.have.property('tagName', 'INPUT');
      expect(slider).to.have.property('type', 'range');
      // Only relevant if we implement `[role="slider"]` with `input[type="range"]`
      // We're not setting this by default because it changes horizontal keyboard navigation in WebKit: https://bugs.chromium.org/p/chromium/issues/detail?id=1162640
      expect(slider).not.toHaveComputedStyle({ webkitAppearance: 'slider-vertical' });
    });

    it('should report the right position', () => {
      const handleValueChange = spy();
      const { getByTestId } = render(
        <TestSlider orientation="vertical" defaultValue={20} onValueChange={handleValueChange} />,
      );

      const sliderTrack = getByTestId('track');
      stub(sliderTrack, 'getBoundingClientRect').callsFake(() => ({
        width: 10,
        height: 100,
        bottom: 100,
        left: 0,
        x: 0,
        y: 0,
        top: 0,
        right: 0,
        toJSON() {},
      }));

      fireEvent.touchStart(
        sliderTrack,
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
    it('supports non-integer values', () => {
      const { getByRole } = render(
        <TestSlider defaultValue={0.2} min={-100} max={100} step={0.00000001} />,
      );
      const slider = getByRole('slider');

      act(() => {
        slider.focus();
      });

      fireEvent.change(slider, { target: { value: '51.1' } });
      expect(slider).to.have.attribute('aria-valuenow', '51.1');

      fireEvent.change(slider, { target: { value: '0.00000005' } });
      expect(slider).to.have.attribute('aria-valuenow', '5e-8');

      fireEvent.change(slider, { target: { value: '1e-7' } });
      expect(slider).to.have.attribute('aria-valuenow', '1e-7');
    });

    it('should round value to step precision', () => {
      const { getByRole, getByTestId } = render(
        <TestSlider defaultValue={0.2} min={0} max={1} step={0.1} />,
      );
      const slider = getByRole('slider');

      act(() => {
        slider.focus();
      });

      const sliderTrack = getByTestId('track');
      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      act(() => {
        slider.focus();
      });

      expect(slider).to.have.attribute('aria-valuenow', '0.2');

      fireEvent.touchStart(
        sliderTrack,
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

    it('should not fail to round value to step precision when step is very small', () => {
      const { getByRole, getByTestId } = render(
        <TestSlider defaultValue={0.00000002} min={0} max={0.0000001} step={0.00000001} />,
      );
      const slider = getByRole('slider');

      act(() => {
        slider.focus();
      });

      const sliderTrack = getByTestId('track');
      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      act(() => {
        slider.focus();
      });

      expect(slider).to.have.attribute('aria-valuenow', '2e-8');

      fireEvent.touchStart(
        sliderTrack,
        createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]),
      );

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 80, clientY: 0 }]),
      );
      expect(slider).to.have.attribute('aria-valuenow', '8e-8');
    });

    it('should not fail to round value to step precision when step is very small and negative', () => {
      const { getByRole, getByTestId } = render(
        <TestSlider defaultValue={-0.00000002} min={-0.0000001} max={0} step={0.00000001} />,
      );
      const slider = getByRole('slider');

      act(() => {
        slider.focus();
      });

      const sliderTrack = getByTestId('track');
      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      act(() => {
        slider.focus();
      });

      expect(slider).to.have.attribute('aria-valuenow', '-2e-8');

      fireEvent.touchStart(
        sliderTrack,
        createTouches([{ identifier: 1, clientX: 80, clientY: 0 }]),
      );

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]),
      );
      expect(slider).to.have.attribute('aria-valuenow', '-8e-8');
    });
  });

  describe('prop: max', () => {
    const MAX = 750;

    it('should set the max and aria-valuemax on the input', () => {
      const { getByRole } = render(
        <TestSlider defaultValue={150} step={100} max={MAX} min={150} />,
      );
      const slider = getByRole('slider');

      expect(slider).to.have.attribute('aria-valuemax', String(MAX));
      expect(slider).to.have.attribute('max', String(MAX));
    });

    it('should not go more than the max', () => {
      const { getByRole } = render(
        <TestSlider defaultValue={150} step={100} max={MAX} min={150} />,
      );

      const slider = getByRole('slider');
      act(() => {
        slider.focus();
      });

      fireEvent.change(slider, { target: { value: String(MAX + 100) } });
      expect(slider).to.have.attribute('aria-valuenow', String(MAX));
    });

    it('should reach right edge value', () => {
      const { getByRole, getByTestId } = render(
        <TestSlider defaultValue={90} min={6} max={108} step={10} />,
      );

      const sliderTrack = getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      const slider = getByRole('slider');
      act(() => {
        slider.focus();
      });

      expect(slider).to.have.attribute('aria-valuenow', '90');

      fireEvent.touchStart(
        sliderTrack,
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

    it('should set the min and aria-valuemin on the input', () => {
      const { getByRole } = render(
        <TestSlider defaultValue={150} step={100} max={750} min={MIN} />,
      );
      const slider = getByRole('slider');

      expect(slider).to.have.attribute('aria-valuemin', String(MIN));
      expect(slider).to.have.attribute('min', String(MIN));
    });

    it('should use min as the step origin', () => {
      const { getByRole } = render(
        <TestSlider defaultValue={150} step={100} max={750} min={MIN} />,
      );
      const slider = getByRole('slider');
      act(() => {
        slider.focus();
      });

      expect(slider).to.have.attribute('aria-valuenow', String(MIN));
    });

    it('should not go less than the min', () => {
      const { getByRole } = render(
        <TestSlider defaultValue={150} step={100} max={750} min={MIN} />,
      );
      const slider = getByRole('slider');
      act(() => {
        slider.focus();
      });

      fireEvent.change(slider, { target: { value: String(MIN - 100) } });
      expect(slider).to.have.attribute('aria-valuenow', String(MIN));
    });
  });

  describe('prop: minDistanceBetweenValues', () => {
    it('should enforce a minimum distance between range slider values', () => {
      const handleValueChange = spy();

      const { getByTestId } = render(
        <TestRangeSlider
          onValueChange={handleValueChange}
          defaultValue={[47, 50]}
          minDistanceBetweenValues={2}
        />,
      );

      const thumbOne = getByTestId('thumb-0');
      const thumbTwo = getByTestId('thumb-1');

      act(() => {
        thumbOne.focus();
      });

      fireEvent.keyDown(thumbOne, { key: 'ArrowUp' });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal([48, 50]);
      fireEvent.keyDown(thumbOne, { key: 'ArrowUp' });
      expect(handleValueChange.callCount).to.equal(1);

      act(() => {
        thumbTwo.focus();
      });

      fireEvent.keyDown(thumbTwo, { key: 'ArrowUp' });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal([48, 51]);
      fireEvent.keyDown(thumbTwo, { key: 'ArrowDown' });
      fireEvent.keyDown(thumbTwo, { key: 'ArrowDown' });
      expect(handleValueChange.callCount).to.equal(3);
      expect(handleValueChange.args[2][0]).to.deep.equal([48, 50]);
    });
  });

  describe('events', () => {
    it('should call handlers', () => {
      const handleValueChange = spy();
      const handleValueCommitted = spy();

      const { getByRole, getByTestId } = render(
        <TestSlider
          onValueChange={handleValueChange}
          onValueCommitted={handleValueCommitted}
          value={0}
        />,
      );

      const sliderTrack = getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      const slider = getByRole('slider');

      fireEvent.pointerDown(sliderTrack, {
        buttons: 1,
        clientX: 10,
      });
      fireEvent.pointerUp(sliderTrack, {
        buttons: 1,
        clientX: 10,
      });

      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.equal(10);
      expect(handleValueCommitted.callCount).to.equal(1);
      expect(handleValueCommitted.args[0][0]).to.equal(10);

      act(() => {
        slider.focus();
      });

      fireEvent.change(slider, { target: { value: 23 } });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueCommitted.callCount).to.equal(2);
    });

    it('should support touch events', () => {
      const handleValueChange = spy();
      const { getByTestId } = render(
        <TestRangeSlider defaultValue={[20, 30]} onValueChange={handleValueChange} />,
      );
      const sliderTrack = getByTestId('track');
      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.touchStart(
        sliderTrack,
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
        sliderTrack,
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
        sliderTrack,
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

    it('should only listen to changes from the same touchpoint', () => {
      const handleValueChange = spy();
      const handleValueCommitted = spy();

      const { getByTestId } = render(
        <TestSlider
          onValueChange={handleValueChange}
          onValueCommitted={handleValueCommitted}
          value={0}
        />,
      );

      const sliderTrack = getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.touchStart(sliderTrack, createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]));
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

    it('should hedge against a dropped mouseup event', () => {
      const handleValueChange = spy();

      const { getByTestId } = render(<TestSlider onValueChange={handleValueChange} value={0} />);

      const sliderTrack = getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.pointerDown(sliderTrack, {
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

    it('should focus the slider when touching', () => {
      const { getByRole, getByTestId } = render(<TestSlider defaultValue={30} />);
      const slider = getByRole('slider');
      const sliderTrack = getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.touchStart(sliderTrack, createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]));

      expect(slider).toHaveFocus();
    });

    it('should focus the slider when dragging', () => {
      const { getByRole, getByTestId } = render(<TestSlider defaultValue={30} step={10} />);
      const slider = getByRole('slider');
      const sliderThumb = getByTestId('thumb');
      const sliderTrack = getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.pointerDown(sliderThumb, {
        buttons: 1,
        clientX: 1,
      });

      expect(slider).toHaveFocus();
    });

    it('should not override the event.target on touch events', () => {
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

      const { getByTestId } = render(<Test />);
      const sliderTrack = getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.touchStart(sliderTrack, createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]));

      expect(handleValueChange.callCount).to.equal(0);
      expect(handleNativeEvent.callCount).to.equal(1);
      expect(handleNativeEvent.firstCall.args[0]).to.have.property('target', sliderTrack);
      expect(handleEvent.callCount).to.equal(1);
      expect(handleEvent.firstCall.args[0]).to.have.property('target', sliderTrack);
    });

    it('should not override the event.target on mouse events', () => {
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
      const { getByTestId } = render(<Test />);
      const sliderTrack = getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.mouseDown(sliderTrack);

      expect(handleValueChange.callCount).to.equal(0);
      expect(handleNativeEvent.callCount).to.equal(1);
      expect(handleNativeEvent.firstCall.args[0]).to.have.property('target', sliderTrack);
      expect(handleEvent.callCount).to.equal(1);
      expect(handleEvent.firstCall.args[0]).to.have.property('target', sliderTrack);
    });
  });

  describe('dragging state', () => {
    it('should not apply data-dragging for click modality', () => {
      const { getByTestId } = render(<TestSlider defaultValue={90} />);

      const sliderTrack = getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.touchStart(
        sliderTrack,
        createTouches([{ identifier: 1, clientX: 20, clientY: 0 }]),
      );
      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 21, clientY: 0 }]),
      );
      expect(sliderTrack).to.not.have.attribute('data-dragging');
      fireEvent.touchEnd(document.body, createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]));
    });

    it('should apply data-dragging for dragging modality', () => {
      const { getByTestId } = render(<TestSlider defaultValue={90} />);

      const sliderTrack = getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.touchStart(
        sliderTrack,
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

      expect(sliderTrack).to.not.have.attribute('data-dragging');

      fireEvent.touchMove(
        document.body,
        createTouches([{ identifier: 1, clientX: 200, clientY: 0 }]),
      );

      expect(sliderTrack).to.have.attribute('data-dragging', 'true');
      fireEvent.touchEnd(document.body, createTouches([{ identifier: 1, clientX: 0, clientY: 0 }]));
      expect(sliderTrack).to.not.have.attribute('data-dragging');
    });
  });

  describe('form submission', () => {
    // doesn't work with two `<input type="range" />` elements with the same name attribute
    it('includes the slider value in formData when the `name` attribute is provided', function test() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        // FormData is not available in JSDOM
        this.skip();
      }

      const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        expect(formData.get('sliderField')).to.equal('51');

        // @ts-ignore
        const formDataAsObject = Object.fromEntries(formData.entries());
        expect(Object.keys(formDataAsObject).length).to.equal(1);
      };

      const { getByText } = render(
        <form onSubmit={handleSubmit}>
          <TestSlider defaultValue={51} name="sliderField" />
          <button type="submit">Submit</button>
        </form>,
      );

      const button = getByText('Submit');
      act(() => {
        button.click();
      });
    });
  });

  describe('prop: onValueChange', () => {
    it('is called when clicking on the track', () => {
      const handleValueChange = spy();
      render(<TestSlider defaultValue={50} onValueChange={handleValueChange} />);

      const sliderTrack = screen.getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.pointerDown(sliderTrack, {
        buttons: 1,
        clientX: 41,
      });

      expect(handleValueChange.callCount).to.equal(1);
    });

    it('is not called when clicking on the thumb', () => {
      const handleValueChange = spy();
      render(<TestSlider defaultValue={50} onValueChange={handleValueChange} />);

      const sliderTrack = screen.getByTestId('track');
      const sliderThumb = screen.getByTestId('thumb');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.pointerDown(sliderThumb, {
        buttons: 1,
        clientX: 51,
      });

      expect(handleValueChange.callCount).to.equal(0);
    });

    it('should not react to right clicks', () => {
      const handleValueChange = spy();
      render(<TestSlider defaultValue={50} onValueChange={handleValueChange} />);

      const sliderTrack = screen.getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.pointerDown(sliderTrack, {
        button: 2,
        clientX: 41,
      });

      expect(handleValueChange.callCount).to.equal(0);
    });

    it('should fire only when the value changes', () => {
      const handleValueChange = spy();
      render(<TestSlider defaultValue={20} onValueChange={handleValueChange} />);

      const sliderTrack = screen.getByTestId('track');

      stub(sliderTrack, 'getBoundingClientRect').callsFake(
        () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
      );

      fireEvent.pointerDown(sliderTrack, {
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
      it(`is called even if the ${valueLabel} did not change`, () => {
        const handleValueChange = spy();

        render(<TestRangeSlider min={0} max={5} onValueChange={handleValueChange} value={value} />);

        const sliderTrack = screen.getByTestId('track');

        stub(sliderTrack, 'getBoundingClientRect').callsFake(
          () => GETBOUNDINGCLIENTRECT_HORIZONTAL_SLIDER_RETURN_VAL,
        );

        // pixel:  0   20  40  60  80  100
        // slider: |---|---|---|---|---|
        // values: 0   1   2   3   4   5
        // value:      ¡ü   ¡ü
        // mouse:           ¡ü

        fireEvent.pointerDown(sliderTrack, {
          buttons: 1,
          clientX: 41,
        });

        expect(handleValueChange.callCount).to.equal(1);
        expect(handleValueChange.args[0][0]).not.to.equal(value);
        expect(handleValueChange.args[0][0]).to.deep.equal(value.slice().sort((a, b) => a - b));
      });
    });

    it('should pass "name" and "value" as part of the event.target for onValueChange', () => {
      const handleValueChange = stub().callsFake((newValue, thumbIndex, event) => event.target);

      const { getByRole } = render(
        <TestSlider onValueChange={handleValueChange} name="change-testing" value={3} />,
      );
      const slider = getByRole('slider');

      act(() => {
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
  });

  describe('keyboard interactions', () => {
    it('increments on ArrowUp', () => {
      const handleValueChange = spy();
      const { container } = render(
        <TestSlider defaultValue={20} onValueChange={handleValueChange} />,
      );

      const input = container.querySelector('input');

      fireEvent.keyDown(document.body, { key: 'TAB' });

      act(() => {
        (input as HTMLInputElement).focus();
      });

      fireEvent.keyDown(input!, { key: 'ArrowUp' });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(21);

      fireEvent.keyDown(input!, { key: 'ArrowUp', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal(31);
    });

    it('increments on ArrowRight', () => {
      const handleValueChange = spy();
      const { container } = render(
        <TestSlider defaultValue={20} onValueChange={handleValueChange} />,
      );

      const input = container.querySelector('input');

      fireEvent.keyDown(document.body, { key: 'TAB' });

      act(() => {
        (input as HTMLInputElement).focus();
      });

      fireEvent.keyDown(input!, { key: 'ArrowRight' });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(21);

      fireEvent.keyDown(input!, { key: 'ArrowRight', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal(31);
    });

    it('decrements on ArrowDown', () => {
      const handleValueChange = spy();
      const { container } = render(
        <TestSlider defaultValue={20} onValueChange={handleValueChange} />,
      );

      const input = container.querySelector('input');

      fireEvent.keyDown(document.body, { key: 'TAB' });

      act(() => {
        (input as HTMLInputElement).focus();
      });

      fireEvent.keyDown(input!, { key: 'ArrowDown' });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(19);

      fireEvent.keyDown(input!, { key: 'ArrowDown', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal(9);
    });

    it('decrements on ArrowLeft', () => {
      const handleValueChange = spy();
      const { container } = render(
        <TestSlider defaultValue={20} onValueChange={handleValueChange} />,
      );

      const input = container.querySelector('input');

      fireEvent.keyDown(document.body, { key: 'TAB' });

      act(() => {
        (input as HTMLInputElement).focus();
      });

      fireEvent.keyDown(input!, { key: 'ArrowLeft' });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(19);

      fireEvent.keyDown(input!, { key: 'ArrowLeft', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal(9);
    });

    describe('key: Home', () => {
      it('sets value to max in a single value slider', () => {
        const handleValueChange = spy();
        const { container } = render(
          <TestSlider defaultValue={20} onValueChange={handleValueChange} max={77} />,
        );

        const input = container.querySelector('input');

        fireEvent.keyDown(document.body, { key: 'TAB' });

        act(() => {
          (input as HTMLInputElement).focus();
        });

        fireEvent.keyDown(input!, { key: 'Home' });
        expect(handleValueChange.callCount).to.equal(1);
        expect(handleValueChange.args[0][0]).to.deep.equal(77);
      });

      it('sets value to the maximum possible value in a range slider', () => {
        const handleValueChange = spy();
        const { getByTestId } = render(
          <TestRangeSlider defaultValue={[20, 50]} onValueChange={handleValueChange} max={77} />,
        );

        const thumbOne = getByTestId('thumb-0');
        const thumbTwo = getByTestId('thumb-1');

        act(() => {
          thumbOne.focus();
        });

        fireEvent.keyDown(thumbOne, { key: 'Home' });
        expect(handleValueChange.callCount).to.equal(1);
        expect(handleValueChange.args[0][0]).to.deep.equal([49, 50]);
        fireEvent.keyDown(thumbOne, { key: 'Home' });
        expect(handleValueChange.callCount).to.equal(1);

        act(() => {
          thumbTwo.focus();
        });

        fireEvent.keyDown(thumbTwo, { key: 'Home' });
        expect(handleValueChange.callCount).to.equal(2);
        expect(handleValueChange.args[1][0]).to.deep.equal([49, 77]);
      });
    });

    describe('key: End', () => {
      it('sets value to min on End', () => {
        const handleValueChange = spy();
        const { container } = render(
          <TestSlider defaultValue={55} onValueChange={handleValueChange} min={17} />,
        );

        const input = container.querySelector('input');

        fireEvent.keyDown(document.body, { key: 'TAB' });

        act(() => {
          (input as HTMLInputElement).focus();
        });

        fireEvent.keyDown(input!, { key: 'End' });
        expect(handleValueChange.callCount).to.equal(1);
        expect(handleValueChange.args[0][0]).to.deep.equal(17);
      });

      it('sets value to the minimum possible value in a range slider', () => {
        const handleValueChange = spy();
        const { getByTestId } = render(
          <TestRangeSlider defaultValue={[20, 50]} onValueChange={handleValueChange} min={7} />,
        );

        const thumbOne = getByTestId('thumb-0');
        const thumbTwo = getByTestId('thumb-1');

        act(() => {
          thumbTwo.focus();
        });

        fireEvent.keyDown(thumbTwo, { key: 'End' });
        expect(handleValueChange.callCount).to.equal(1);
        expect(handleValueChange.args[0][0]).to.deep.equal([20, 21]);
        fireEvent.keyDown(thumbTwo, { key: 'End' });
        expect(handleValueChange.callCount).to.equal(1);

        act(() => {
          thumbOne.focus();
        });

        fireEvent.keyDown(thumbOne, { key: 'End' });
        expect(handleValueChange.callCount).to.equal(2);
        expect(handleValueChange.args[1][0]).to.deep.equal([7, 21]);
      });
    });

    it('should support Shift + Left Arrow / Right Arrow keys', () => {
      const handleValueChange = spy();
      const { container } = render(
        <TestSlider defaultValue={20} onValueChange={handleValueChange} />,
      );

      const input = container.querySelector('input');

      fireEvent.keyDown(document.body, { key: 'TAB' });

      act(() => {
        (input as HTMLInputElement).focus();
      });

      fireEvent.keyDown(input!, { key: 'ArrowLeft', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(10);

      fireEvent.keyDown(input!, { key: 'ArrowRight', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal(20);
    });

    it('should support Shift + Up Arrow / Down Arrow keys', () => {
      const handleValueChange = spy();
      const { container } = render(
        <TestSlider defaultValue={20} onValueChange={handleValueChange} />,
      );

      const input = container.querySelector('input');

      fireEvent.keyDown(document.body, { key: 'TAB' });
      act(() => {
        (input as HTMLInputElement).focus();
      });

      fireEvent.keyDown(input!, { key: 'ArrowDown', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(10);

      fireEvent.keyDown(input!, { key: 'ArrowUp', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal(20);
    });

    it('should support PageUp / PageDown keys', () => {
      const handleValueChange = spy();
      const { container } = render(
        <TestSlider defaultValue={20} onValueChange={handleValueChange} />,
      );

      const input = container.querySelector('input');

      fireEvent.keyDown(document.body, { key: 'TAB' });
      act(() => {
        (input as HTMLInputElement).focus();
      });

      fireEvent.keyDown(input!, { key: 'PageDown' });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(10);

      fireEvent.keyDown(input!, { key: 'PageUp' });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal(20);
    });

    it('should support Shift + Left Arrow / Right Arrow keys by taking acount step and largeStep', () => {
      const handleValueChange = spy();
      const DEFAULT_VALUE = 20;
      const LARGE_STEP = 15;
      const STEP = 5;
      const { container } = render(
        <TestSlider
          defaultValue={DEFAULT_VALUE}
          onValueChange={handleValueChange}
          step={STEP}
          largeStep={LARGE_STEP}
        />,
      );

      const input = container.querySelector('input');

      fireEvent.keyDown(document.body, { key: 'TAB' });
      act(() => {
        (input as HTMLInputElement).focus();
      });

      fireEvent.keyDown(input!, { key: 'ArrowLeft', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(DEFAULT_VALUE - LARGE_STEP);
      expect(input).to.have.attribute('aria-valuenow', `${DEFAULT_VALUE - LARGE_STEP}`);

      fireEvent.keyDown(input!, { key: 'ArrowRight', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal(DEFAULT_VALUE);
      expect(input).to.have.attribute('aria-valuenow', `${DEFAULT_VALUE}`);
    });

    it('should stop at max/min when using Shift + Left Arrow / Right Arrow keys', () => {
      const handleValueChange = spy();
      const { container } = render(
        <TestSlider defaultValue={5} max={8} onValueChange={handleValueChange} />,
      );

      const input = container.querySelector('input');

      fireEvent.keyDown(document.body, { key: 'TAB' });
      act(() => {
        (input as HTMLInputElement).focus();
      });

      fireEvent.keyDown(input!, { key: 'ArrowLeft', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.deep.equal(0);

      fireEvent.keyDown(input!, { key: 'ArrowRight', shiftKey: true });
      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.args[1][0]).to.deep.equal(8);
    });

    it('can be removed from the tab sequence', () => {
      render(<TestSlider tabIndex={-1} value={30} />);
      expect(screen.getByRole('slider')).to.have.property('tabIndex', -1);
    });
  });
});
