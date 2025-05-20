import * as React from 'react';
import { expect } from 'chai';
import { act, screen, fireEvent } from '@mui/internal-test-utils';
import { spy } from 'sinon';
import { NumberField } from '@base-ui-components/react/number-field';
import { createRenderer, describeConformance } from '#test-utils';

describe('<NumberField.Input />', () => {
  const { render } = createRenderer();

  describeConformance(<NumberField.Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    render(node) {
      return render(<NumberField.Root>{node}</NumberField.Root>);
    },
  }));

  it('has textbox role', async () => {
    await render(
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>,
    );
    expect(screen.queryByRole('textbox')).not.to.equal(null);
  });

  it('should not allow non-numeric characters on change', async () => {
    await render(
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    await act(async () => input.focus());
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input).to.have.value('');
  });

  it('should not allow non-numeric characters on keydown', async () => {
    await render(
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    await act(async () => input.focus());
    fireEvent.keyDown(input, { key: 'a' });
    expect(input).to.have.value('');
  });

  it('should allow numeric characters on change', async () => {
    await render(
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    await act(async () => input.focus());
    fireEvent.change(input, { target: { value: '123' } });
    expect(input).to.have.value('123');
  });

  it('should increment on keydown ArrowUp', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    await act(async () => input.focus());
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).to.have.value('1');
  });

  it('should decrement on keydown ArrowDown', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    await act(async () => input.focus());
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).to.have.value('-1');
  });

  it('should increment to min on keydown Home', async () => {
    await render(
      <NumberField.Root min={-10} max={10}>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    await act(async () => input.focus());
    fireEvent.keyDown(input, { key: 'Home' });
    expect(input).to.have.value('-10');
  });

  it('should decrement to max on keydown End', async () => {
    await render(
      <NumberField.Root min={-10} max={10}>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    await act(async () => input.focus());
    fireEvent.keyDown(input, { key: 'End' });
    expect(input).to.have.value('10');
  });

  it('commits formatted value only on blur', async () => {
    await render(
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    await act(async () => input.focus());
    fireEvent.change(input, { target: { value: '1234' } });
    expect(input).to.have.value('1234');
    fireEvent.blur(input);
    expect(input).to.have.value((1234).toLocaleString());
  });

  it('should commit validated number on blur (min)', async () => {
    await render(
      <NumberField.Root min={0}>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    await act(async () => input.focus());
    fireEvent.change(input, { target: { value: '-1' } });
    expect(input).to.have.value('-1');
    fireEvent.blur(input);
    expect(input).to.have.value('0');
  });

  it('should commit validated number on blur (max)', async () => {
    await render(
      <NumberField.Root max={0}>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    await act(async () => input.focus());
    fireEvent.change(input, { target: { value: '1' } });
    expect(input).to.have.value('1');
    fireEvent.blur(input);
    expect(input).to.have.value('0');
  });

  it('should not snap number to step on blur', async () => {
    await render(
      <NumberField.Root step={0.5} snapOnStep>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    await act(async () => input.focus());
    fireEvent.change(input, { target: { value: '1.5' } });
    expect(input).to.have.value('1.5');
    fireEvent.blur(input);
    expect(input).to.have.value('1.5');
  });

  it('should commit validated number on blur (step and min)', async () => {
    await render(
      <NumberField.Root min={2} step={2}>
        <NumberField.Input />
      </NumberField.Root>,
    );
    const input = screen.getByRole('textbox');
    await act(async () => input.focus());
    fireEvent.change(input, { target: { value: '3' } });
    expect(input).to.have.value('3');
    fireEvent.blur(input);
    expect(input).to.have.value('3');
  });

  it('should preserve full precision on first blur after external value change', async () => {
    const onValueChange = spy();

    function Controlled(props: { value: number | null }) {
      return (
        <NumberField.Root value={props.value} onValueChange={onValueChange}>
          <NumberField.Input />
        </NumberField.Root>
      );
    }

    const { setProps } = await render(<Controlled value={null} />);
    const input = screen.getByRole('textbox');

    await act(async () => {
      setProps({ value: 1.23456 });
    });

    expect(input).to.have.value('1.23456');

    await act(async () => {
      input.focus();
      input.blur();
    });

    expect(input).to.have.value('1.23456');
    expect(onValueChange.callCount).to.equal(0);
  });
});
