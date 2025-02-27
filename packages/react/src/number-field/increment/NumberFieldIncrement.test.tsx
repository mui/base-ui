import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { screen, fireEvent, act } from '@mui/internal-test-utils';
import { NumberField } from '@base-ui-components/react/number-field';
import { createRenderer, describeConformance } from '#test-utils';
import { CHANGE_VALUE_TICK_DELAY, START_AUTO_CHANGE_DELAY } from '../utils/constants';
import { NOOP } from '../../utils/noop';
import { NumberFieldRootContext } from '../root/NumberFieldRootContext';

const testContext = {
  allowInputSyncRef: { current: false },
  disabled: false,
  formatOptionsRef: { current: undefined },
  getGroupProps: (externalProps) => externalProps,
  getInputProps: (externalProps) => externalProps,
  getScrubAreaProps: (externalProps) => externalProps,
  getScrubAreaCursorProps: (externalProps) => externalProps,
  getStepAmount: NOOP,
  id: 'id',
  incrementValue: NOOP,
  inputRef: { current: null },
  inputValue: '',
  intentionalTouchCheckTimeoutRef: { current: -1 },
  isPressedRef: { current: false },
  isScrubbing: false,
  maxWithDefault: 100,
  mergedRef: (_node) => {},
  minWithDefault: 0,
  movesAfterTouchRef: { current: 0 },
  readOnly: false,
  scrubAreaRef: { current: null },
  scrubAreaCursorRef: { current: null },
  scrubHandleRef: {
    current: {
      direction: 'horizontal',
      pixelSensitivity: 0,
      teleportDistance: 0,
    },
  },
  setValue: NOOP,
  state: {
    value: null,
    required: false,
    disabled: false,
    invalid: false,
    readOnly: false,
    scrubbing: false,
    touched: false,
    dirty: false,
    inputValue: '',
    valid: true,
    filled: false,
    focused: false,
  },
  startAutoChange: NOOP,
  stopAutoChange: NOOP,
  value: null,
  valueRef: { current: null },
} as NumberFieldRootContext;

describe('<NumberField.Increment />', () => {
  const { render, clock } = createRenderer();

  describeConformance(<NumberField.Increment />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(
        <NumberFieldRootContext.Provider value={testContext}>
          {node}
        </NumberFieldRootContext.Provider>,
      );
    },
  }));

  it('has increase label', async () => {
    await render(
      <NumberField.Root>
        <NumberField.Increment />
      </NumberField.Root>,
    );
    expect(screen.queryByLabelText('Increase')).not.to.equal(null);
  });

  it('increments starting from 0 click', async () => {
    await render(
      <NumberField.Root>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('0');
  });

  it('increments to 1 starting from defaultValue=0 click', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('1');
  });

  describe('press and hold', () => {
    clock.withFakeTimers();

    it('increments continuously when holding pointerdown', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1

      expect(input).to.have.value('1');

      clock.tick(START_AUTO_CHANGE_DELAY);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x2
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x3
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x4

      expect(input).to.have.value('4');

      fireEvent.pointerUp(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('4');
    });

    it('does not increment twice with pointerdown and click', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1
      fireEvent.pointerUp(button);
      fireEvent.click(button, { detail: 1 });

      expect(input).to.have.value('1');
    });

    it('should stop incrementing after mouseleave', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1

      expect(input).to.have.value('1');

      clock.tick(START_AUTO_CHANGE_DELAY);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x2
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x3
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x4

      expect(input).to.have.value('4');

      fireEvent.mouseLeave(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('4');
    });

    it('should start incrementing again after mouseleave then mouseenter', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1

      expect(input).to.have.value('1');

      clock.tick(START_AUTO_CHANGE_DELAY);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x2
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x3
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x4

      expect(input).to.have.value('4');

      fireEvent.mouseLeave(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('4');

      fireEvent.mouseEnter(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x5

      expect(input).to.have.value('5');
    });

    it('should not start incrementing again after mouseleave then mouseenter after pointerup', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1

      expect(input).to.have.value('1');

      clock.tick(START_AUTO_CHANGE_DELAY);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x2
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x3
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x4

      expect(input).to.have.value('4');

      fireEvent.pointerUp(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('4');

      fireEvent.mouseLeave(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('4');

      fireEvent.mouseEnter(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('4');
    });
  });

  it('should not increment when disabled', async () => {
    await render(
      <NumberField.Root disabled>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('');
  });

  it('should not increment when readOnly', async () => {
    await render(
      <NumberField.Root readOnly>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('');
  });

  it('should increment when input is dirty but not blurred (click)', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const input = screen.getByRole('textbox');

    await act(() => input.focus());

    fireEvent.change(input, { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button'));

    expect(input).to.have.value('101');
  });

  it('should increment when input is dirty but not blurred (pointerdown)', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const input = screen.getByRole('textbox');

    await act(() => input.focus());

    fireEvent.change(input, { target: { value: '100' } });
    fireEvent.pointerDown(screen.getByRole('button'));

    expect(input).to.have.value('101');
  });

  it('always increments on quick touch (touchend that occurs before TOUCH_TIMEOUT)', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    const input = screen.getByRole('textbox');

    fireEvent.touchStart(button);
    fireEvent.mouseEnter(button);
    fireEvent.pointerDown(button, { pointerType: 'touch' });
    fireEvent.click(button, { detail: 1 });
    fireEvent.touchEnd(button);

    expect(input).to.have.value('1');

    fireEvent.touchStart(button);
    // No mouseenter occurs after the first focus
    fireEvent.pointerDown(button, { pointerType: 'touch' });
    fireEvent.click(button, { detail: 1 });
    fireEvent.touchEnd(button);

    expect(input).to.have.value('2');
  });

  it('prop: disabled', async () => {
    const handleValueChange = spy();
    await render(
      <NumberField.Root defaultValue={0} onValueChange={handleValueChange}>
        <NumberField.Increment disabled />
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');
    expect(button).to.have.attribute('disabled');
    expect(input).to.have.value('0');

    fireEvent.pointerDown(button);
    expect(handleValueChange.callCount).to.equal(0);
    expect(input).to.have.value('0');
  });
});
