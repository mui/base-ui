import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { screen, fireEvent, act } from '@mui/internal-test-utils';
import { NumberField } from '@base-ui-components/react/number-field';
import { createRenderer, describeConformance } from '#test-utils';
import { CHANGE_VALUE_TICK_DELAY, START_AUTO_CHANGE_DELAY } from '../utils/constants';
import { NumberFieldRootContext } from '../root/NumberFieldRootContext';

const testContext = {
  getDecrementButtonProps: (externalProps) => externalProps,
  state: {
    value: null,
    required: false,
    disabled: false,
    invalid: false,
    readOnly: false,
  },
} as NumberFieldRootContext;

describe('<NumberField.Decrement />', () => {
  const { render, clock } = createRenderer();

  describeConformance(<NumberField.Decrement />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(
        <NumberFieldRootContext.Provider value={testContext}>
          {node}
        </NumberFieldRootContext.Provider>,
      );
    },
  }));

  it('has decrease label', async () => {
    await render(
      <NumberField.Root>
        <NumberField.Decrement />
      </NumberField.Root>,
    );
    expect(screen.queryByLabelText('Decrease')).not.to.equal(null);
  });

  it('decrements starting from 0 click', async () => {
    await render(
      <NumberField.Root>
        <NumberField.Decrement />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('0');
  });

  it('decrements to -1 starting from defaultValue=0 click', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Decrement />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('-1');
  });

  describe('press and hold', () => {
    clock.withFakeTimers();

    it('decrements continuously when holding pointerdown', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Decrement />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1

      expect(input).to.have.value('-1');

      clock.tick(START_AUTO_CHANGE_DELAY);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x2
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x3
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x4

      expect(input).to.have.value('-4');

      fireEvent.pointerUp(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('-4');
    });

    it('does not decrement twice with pointerdown and click', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Decrement />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1
      fireEvent.pointerUp(button);
      fireEvent.click(button, { detail: 1 });

      expect(input).to.have.value('-1');
    });

    it('should stop decrementing after mouseleave', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Decrement />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1

      expect(input).to.have.value('-1');

      clock.tick(START_AUTO_CHANGE_DELAY);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x2
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x3
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x4

      expect(input).to.have.value('-4');

      fireEvent.mouseLeave(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('-4');
    });

    it('should start decrementing again after mouseleave then mouseenter', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Decrement />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1

      expect(input).to.have.value('-1');

      clock.tick(START_AUTO_CHANGE_DELAY);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x2
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x3
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x4

      expect(input).to.have.value('-4');

      fireEvent.mouseLeave(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('-4');

      fireEvent.mouseEnter(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x5

      expect(input).to.have.value('-5');
    });

    it('should not start decrementing again after mouseleave then mouseenter after pointerup', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Decrement />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1

      expect(input).to.have.value('-1');

      clock.tick(START_AUTO_CHANGE_DELAY);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x2
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x3
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x4

      expect(input).to.have.value('-4');

      fireEvent.pointerUp(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('-4');

      fireEvent.mouseLeave(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('-4');

      fireEvent.mouseEnter(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('-4');
    });
  });

  it('should not decrement when disabled', async () => {
    await render(
      <NumberField.Root disabled>
        <NumberField.Decrement />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('');
  });

  it('should not decrement when readOnly', async () => {
    await render(
      <NumberField.Root readOnly>
        <NumberField.Decrement />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('');
  });

  it('should decrement when input is dirty but not blurred (click)', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Decrement />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const input = screen.getByRole('textbox');

    await act(() => input.focus());

    fireEvent.change(input, { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button'));

    expect(input).to.have.value('99');
  });

  it('should decrement when input is dirty but not blurred (pointerdown)', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Decrement />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const input = screen.getByRole('textbox');

    await act(() => input.focus());

    fireEvent.change(input, { target: { value: '100' } });
    fireEvent.pointerDown(screen.getByRole('button'));

    expect(input).to.have.value('99');
  });

  it('always decrements on quick touch (touchend that occurs before TOUCH_TIMEOUT)', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Decrement />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    const input = screen.getByRole('textbox');

    fireEvent.touchStart(button);
    fireEvent.mouseEnter(button);
    fireEvent.pointerDown(button, { pointerType: 'touch' });
    fireEvent.touchEnd(button);
    fireEvent.click(button, { detail: 1 });

    expect(input).to.have.value('-1');

    fireEvent.touchStart(button);
    // No mouseenter occurs after the first focus
    fireEvent.pointerDown(button, { pointerType: 'touch' });
    fireEvent.touchEnd(button);
    fireEvent.click(button, { detail: 1 });

    expect(input).to.have.value('-2');
  });

  it('prop: disabled', async () => {
    const handleValueChange = spy();
    await render(
      <NumberField.Root defaultValue={0} onValueChange={handleValueChange}>
        <NumberField.Decrement disabled />
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
