import * as React from 'react';
import { expect } from 'chai';
import { act, createRenderer, screen } from '@mui/internal-test-utils';
import { NumberField } from '@mui/base/NumberField';
import { fireEvent } from '@testing-library/react';
import { describeConformance } from '../../test/describeConformance';
import { NumberFieldContext, NumberFieldContextValue } from './NumberFieldContext';

const testContext = {
  getInputProps: (externalProps) => externalProps,
  ownerState: {
    value: null,
    required: false,
    disabled: false,
    invalid: false,
    readOnly: false,
  },
} as NumberFieldContextValue;

describe('<NumberField.Group />', () => {
  const { render } = createRenderer();

  describeConformance(<NumberField.Input />, () => ({
    inheritComponent: 'input',
    refInstanceof: window.HTMLInputElement,
    render(node) {
      return render(
        <NumberFieldContext.Provider value={testContext}>{node}</NumberFieldContext.Provider>,
      );
    },
    skip: ['reactTestRenderer'],
  }));

  it('has textbox role', () => {
    render(
      <NumberField>
        <NumberField.Input />
      </NumberField>,
    );
    expect(screen.queryByRole('textbox')).not.to.equal(null);
  });

  it('should not allow non-numeric characters on change', () => {
    render(
      <NumberField>
        <NumberField.Input />
      </NumberField>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input).to.have.value('');
  });

  it('should not allow non-numeric characters on keydown', () => {
    render(
      <NumberField>
        <NumberField.Input />
      </NumberField>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.keyDown(input, { key: 'a' });
    expect(input).to.have.value('');
  });

  it('should allow numeric characters on change', () => {
    render(
      <NumberField>
        <NumberField.Input />
      </NumberField>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: '123' } });
    expect(input).to.have.value('123');
  });

  it('should increment on keydown ArrowUp', () => {
    render(
      <NumberField defaultValue={0}>
        <NumberField.Input />
      </NumberField>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).to.have.value('1');
  });

  it('should decrement on keydown ArrowDown', () => {
    render(
      <NumberField defaultValue={0}>
        <NumberField.Input />
      </NumberField>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).to.have.value('-1');
  });

  it('should increment to min on keydown Home', () => {
    render(
      <NumberField min={-10} max={10}>
        <NumberField.Input />
      </NumberField>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.keyDown(input, { key: 'Home' });
    expect(input).to.have.value('-10');
  });

  it('should decrement to max on keydown End', () => {
    render(
      <NumberField min={-10} max={10}>
        <NumberField.Input />
      </NumberField>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.keyDown(input, { key: 'End' });
    expect(input).to.have.value('10');
  });

  it('commits formatted value only on blur', () => {
    render(
      <NumberField>
        <NumberField.Input />
      </NumberField>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: '1234' } });
    expect(input).to.have.value('1234');
    fireEvent.blur(input);
    expect(input).to.have.value('1,234');
  });

  it('should commit validated number on blur (min)', () => {
    render(
      <NumberField min={0}>
        <NumberField.Input />
      </NumberField>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: '-1' } });
    expect(input).to.have.value('-1');
    fireEvent.blur(input);
    expect(input).to.have.value('0');
  });

  it('should commit validated number on blur (max)', () => {
    render(
      <NumberField max={0}>
        <NumberField.Input />
      </NumberField>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: '1' } });
    expect(input).to.have.value('1');
    fireEvent.blur(input);
    expect(input).to.have.value('0');
  });

  it('should commit validated number on blur (step)', () => {
    render(
      <NumberField step={0.5}>
        <NumberField.Input />
      </NumberField>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: '1.1' } });
    expect(input).to.have.value('1.1');
    fireEvent.blur(input);
    expect(input).to.have.value('1');
  });

  it('should commit validated number on blur (step and min)', () => {
    render(
      <NumberField min={2} step={2}>
        <NumberField.Input />
      </NumberField>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: '3' } });
    expect(input).to.have.value('3');
    fireEvent.blur(input);
    expect(input).to.have.value('4');
  });
});
