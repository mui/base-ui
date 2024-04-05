import * as React from 'react';
import { expect } from 'chai';
import { fireEvent } from '@testing-library/react';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { NumberField } from '@mui/base/NumberField';
import { describeConformance } from '../../test/describeConformance';
import { NumberFieldContext, NumberFieldContextValue } from './NumberFieldContext';
import { CHANGE_VALUE_TICK_DELAY, START_AUTO_CHANGE_DELAY } from '../useNumberField/constants';

const testContext = {
  getIncrementButtonProps: (externalProps) => externalProps,
  ownerState: {
    value: null,
    required: false,
    disabled: false,
    invalid: false,
    readOnly: false,
  },
} as NumberFieldContextValue;

describe('<NumberField.Increment />', () => {
  const { render, clock } = createRenderer();

  describeConformance(<NumberField.Increment />, () => ({
    inheritComponent: 'button',
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(
        <NumberFieldContext.Provider value={testContext}>{node}</NumberFieldContext.Provider>,
      );
    },
    skip: ['reactTestRenderer'],
  }));

  it('has increase label', () => {
    render(
      <NumberField>
        <NumberField.Increment />
      </NumberField>,
    );
    expect(screen.queryByLabelText('Increase')).not.to.equal(null);
  });

  it('increments starting from 0 click', () => {
    render(
      <NumberField>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('0');
  });

  it('increments to 1 starting from defaultValue=0 click', () => {
    render(
      <NumberField defaultValue={0}>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('1');
  });

  describe('press and hold', () => {
    clock.withFakeTimers();

    it('increments continuously when holding pointerdown', () => {
      render(
        <NumberField defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField>,
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

    it('does not increment twice with pointerdown and click', () => {
      render(
        <NumberField defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1
      fireEvent.pointerUp(button);
      fireEvent.click(button, { detail: 1 });

      expect(input).to.have.value('1');
    });

    it('should stop incrementing after mouseleave', () => {
      render(
        <NumberField defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField>,
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

    it('should start incrementing again after mouseleave then mouseenter', () => {
      render(
        <NumberField defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField>,
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

    it('should not start incrementing again after mouseleave then mouseenter after pointerup', () => {
      render(
        <NumberField defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField>,
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

  it('should not increment when disabled', () => {
    render(
      <NumberField disabled>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('');
  });

  it('should not increment when readOnly', () => {
    render(
      <NumberField readOnly>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('');
  });
});
