import * as React from 'react';
import { expect } from 'chai';
import { createRenderer, screen } from '@mui/internal-test-utils';
import * as NumberField from '@base_ui/react/NumberField';
import { fireEvent } from '@testing-library/react';
import { describeConformance } from '../../test/describeConformance';
import { NumberFieldContext, NumberFieldContextValue } from './NumberFieldContext';
import { CHANGE_VALUE_TICK_DELAY, START_AUTO_CHANGE_DELAY } from '../useNumberField/constants';

const testContext = {
  getDecrementButtonProps: (externalProps) => externalProps,
  ownerState: {
    value: null,
    required: false,
    disabled: false,
    invalid: false,
    readOnly: false,
  },
} as NumberFieldContextValue;

describe('<NumberField.Decrement />', () => {
  const { render, clock } = createRenderer();

  describeConformance(<NumberField.Decrement />, () => ({
    inheritComponent: 'button',
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(
        <NumberFieldContext.Provider value={testContext}>{node}</NumberFieldContext.Provider>,
      );
    },
    skip: ['reactTestRenderer'],
  }));

  it('has decrease label', () => {
    render(
      <NumberField.Root>
        <NumberField.Decrement />
      </NumberField.Root>,
    );
    expect(screen.queryByLabelText('Decrease')).not.to.equal(null);
  });

  it('decrements starting from 0 click', () => {
    render(
      <NumberField.Root>
        <NumberField.Decrement />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('0');
  });

  it('decrements to -1 starting from defaultValue=0 click', () => {
    render(
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

    it('decrements continuously when holding pointerdown', () => {
      render(
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

    it('does not decrement twice with pointerdown and click', () => {
      render(
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

    it('should stop decrementing after mouseleave', () => {
      render(
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

    it('should start decrementing again after mouseleave then mouseenter', () => {
      render(
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

    it('should not start decrementing again after mouseleave then mouseenter after pointerup', () => {
      render(
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

  it('should not decrement when disabled', () => {
    render(
      <NumberField.Root disabled>
        <NumberField.Decrement />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('');
  });

  it('should not decrement when readOnly', () => {
    render(
      <NumberField.Root readOnly>
        <NumberField.Decrement />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('');
  });
});
