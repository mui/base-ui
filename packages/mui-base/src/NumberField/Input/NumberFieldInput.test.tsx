import * as React from 'react';
import { expect } from 'chai';
import { act, createRenderer, screen, fireEvent } from '@mui/internal-test-utils';
import * as NumberField from '@base_ui/react/NumberField';
import { NumberFieldContext, type NumberFieldContextValue } from '@base_ui/react/NumberField';
import { describeConformance } from '../../../test/describeConformance';

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

describe.skip('<NumberField.Input />', () => {
  const { render } = createRenderer();

  describeConformance(<NumberField.Input />, () => ({
    inheritComponent: 'input',
    refInstanceof: window.HTMLInputElement,
    render(node) {
      return render(
        <NumberFieldContext.Provider value={testContext}>{node}</NumberFieldContext.Provider>,
      );
    },
  }));

  it('has textbox role', () => {
    render(
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>,
    );
    expect(screen.queryByRole('textbox')).not.to.equal(null);
  });

  it('should not allow non-numeric characters on change', () => {
    render(
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input).to.have.value('');
  });

  it('should not allow non-numeric characters on keydown', () => {
    render(
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.keyDown(input, { key: 'a' });
    expect(input).to.have.value('');
  });

  it('should allow numeric characters on change', () => {
    render(
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: '123' } });
    expect(input).to.have.value('123');
  });

  it('should increment on keydown ArrowUp', () => {
    render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).to.have.value('1');
  });

  it('should decrement on keydown ArrowDown', () => {
    render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).to.have.value('-1');
  });

  it('should increment to min on keydown Home', () => {
    render(
      <NumberField.Root min={-10} max={10}>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.keyDown(input, { key: 'Home' });
    expect(input).to.have.value('-10');
  });

  it('should decrement to max on keydown End', () => {
    render(
      <NumberField.Root min={-10} max={10}>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.keyDown(input, { key: 'End' });
    expect(input).to.have.value('10');
  });

  it('commits formatted value only on blur', () => {
    render(
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>,
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
      <NumberField.Root min={0}>
        <NumberField.Input />
      </NumberField.Root>,
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
      <NumberField.Root max={0}>
        <NumberField.Input />
      </NumberField.Root>,
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
      <NumberField.Root step={0.5}>
        <NumberField.Input />
      </NumberField.Root>,
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
      <NumberField.Root min={2} step={2}>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: '3' } });
    expect(input).to.have.value('3');
    fireEvent.blur(input);
    expect(input).to.have.value('4');
  });
});
