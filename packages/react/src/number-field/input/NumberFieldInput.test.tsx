import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, screen, fireEvent } from '@mui/internal-test-utils';
import { NumberField } from '@base-ui/react/number-field';
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
    expect(screen.queryByRole('textbox')).not.toBe(null);
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
    expect(input).toHaveValue('');
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
    expect(input).toHaveValue('');
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
    expect(input).toHaveValue('123');
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
    expect(input).toHaveValue('1');
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
    expect(input).toHaveValue('-1');
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
    expect(input).toHaveValue('-10');
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
    expect(input).toHaveValue('10');
  });

  it('allows unicode plus/minus, permille and fullwidth digits on keydown when formatted as percent', async () => {
    await render(
      <NumberField.Root format={{ style: 'percent' }}>
        <NumberField.Input />
      </NumberField.Root>,
    );

    const input = screen.getByRole('textbox');
    await act(async () => input.focus());

    function dispatchKey(key: string) {
      const evt = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      return input.dispatchEvent(evt);
    }

    expect(dispatchKey('−')).toBe(true); // MINUS SIGN U+2212
    expect(dispatchKey('＋')).toBe(true); // FULLWIDTH PLUS SIGN U+FF0B
    expect(dispatchKey('‰')).toBe(true);
    expect(dispatchKey('１')).toBe(true);
  });

  it('blocks percent and permille symbols on keydown when not formatted as percent', async () => {
    await render(
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>,
    );

    const input = screen.getByRole('textbox');
    await act(async () => input.focus());

    function dispatchKey(key: string) {
      const evt = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      return input.dispatchEvent(evt);
    }

    expect(dispatchKey('%')).toBe(false);
    expect(dispatchKey('‰')).toBe(false);
  });

  it('applies locale-aware decimal/group gating (de-DE)', async () => {
    await render(
      <NumberField.Root locale="de-DE">
        <NumberField.Input />
      </NumberField.Root>,
    );

    const input = screen.getByRole('textbox');
    await act(async () => input.focus());

    const dispatchKey = (key: string) => {
      const evt = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      return input.dispatchEvent(evt);
    };

    // de-DE: decimal is ',' and group is '.'
    // First comma is allowed
    expect(dispatchKey(',')).toBe(true);
    // Simulate a typical user value with a digit before decimal to let change handler accept it
    fireEvent.change(input, { target: { value: '1,' } });
    expect(input).toHaveValue('1,');

    // Second comma should be blocked
    expect(dispatchKey(',')).toBe(false);

    // Grouping '.' should be allowed multiple times
    expect(dispatchKey('.')).toBe(true);
    fireEvent.change(input, { target: { value: '1.,' } });
    expect(dispatchKey('.')).toBe(true);
  });

  it('allows space key when locale uses space-like grouping (pl-PL)', async () => {
    await render(
      <NumberField.Root locale="pl-PL">
        <NumberField.Input />
      </NumberField.Root>,
    );

    const input = screen.getByRole('textbox');
    await act(async () => input.focus());

    const dispatchKey = (key: string) => {
      const evt = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      return input.dispatchEvent(evt);
    };

    // pl-PL grouping is a space-like character; typing plain space from keyboard should be allowed
    expect(dispatchKey(' ')).toBe(true);

    // Simulate a typical user value using a regular space as group
    fireEvent.change(input, { target: { value: '1 234' } });
    expect(input).toHaveValue('1 234');
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
    expect(input).toHaveValue('1234');
    fireEvent.blur(input);
    expect(input).toHaveValue((1234).toLocaleString());
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
    expect(input).toHaveValue('-1');
    fireEvent.blur(input);
    expect(input).toHaveValue('0');
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
    expect(input).toHaveValue('1');
    fireEvent.blur(input);
    expect(input).toHaveValue('0');
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
    expect(input).toHaveValue('1.5');
    fireEvent.blur(input);
    expect(input).toHaveValue((1.5).toLocaleString());
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
    expect(input).toHaveValue('3');
    fireEvent.blur(input);
    expect(input).toHaveValue('3');
  });

  it('should preserve full precision on first blur after external value change', async () => {
    const onValueChange = vi.fn();

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

    expect(input).toHaveValue((1.23456).toLocaleString(undefined, { minimumFractionDigits: 5 }));

    await act(async () => {
      input.focus();
      input.blur();
    });

    expect(input).toHaveValue((1.23456).toLocaleString(undefined, { minimumFractionDigits: 5 }));
    expect(onValueChange.mock.calls.length).toBe(0);
  });

  it('should update input value after increment/decrement followed by external value change', async () => {
    const onValueChange = vi.fn();

    function Controlled() {
      const [value, setValue] = React.useState<number | null>(0);
      return (
        <NumberField.Root
          value={value}
          onValueChange={(val) => {
            onValueChange(val);
            setValue(val);
          }}
        >
          <NumberField.Input />
          <NumberField.Increment />
          <NumberField.Decrement />
          <button onClick={() => setValue(1.23456)}>external</button>
        </NumberField.Root>
      );
    }

    const { user } = await render(<Controlled />);
    const input = screen.getByRole('textbox');
    const incrementButton = screen.getByLabelText('Increase');

    expect(input).toHaveValue('0');

    await user.click(incrementButton);

    expect(input).toHaveValue('1');
    expect(onValueChange.mock.calls.length).toBe(1);

    await user.click(screen.getByText('external'));

    expect(input).toHaveValue((1.23456).toLocaleString(undefined, { minimumFractionDigits: 5 }));
  });

  it('should update input value after decrement followed by external value change', async () => {
    const onValueChange = vi.fn();

    function Controlled() {
      const [value, setValue] = React.useState<number | null>(5);
      return (
        <NumberField.Root
          value={value}
          onValueChange={(val) => {
            onValueChange(val);
            setValue(val);
          }}
        >
          <NumberField.Input />
          <NumberField.Increment />
          <NumberField.Decrement />
          <button onClick={() => setValue(2.98765)}>external</button>
        </NumberField.Root>
      );
    }

    const { user } = await render(<Controlled />);
    const input = screen.getByRole('textbox');
    const decrementButton = screen.getByLabelText('Decrease');

    expect(input).toHaveValue('5');

    await user.click(decrementButton);

    expect(input).toHaveValue('4');
    expect(onValueChange.mock.calls.length).toBe(1);

    await user.click(screen.getByText('external'));

    expect(input).toHaveValue((2.98765).toLocaleString(undefined, { minimumFractionDigits: 5 }));
  });

  it('should allow typing after precision is preserved on blur', async () => {
    const onValueChange = vi.fn();

    function Controlled(props: { value: number | null }) {
      return (
        <NumberField.Root value={props.value} onValueChange={onValueChange}>
          <NumberField.Input />
        </NumberField.Root>
      );
    }

    const { setProps, user } = await render(<Controlled value={null} />);
    const input = screen.getByRole('textbox');

    await act(async () => {
      setProps({ value: 1.23456 });
    });

    expect(input).toHaveValue((1.23456).toLocaleString(undefined, { minimumFractionDigits: 5 }));

    await act(async () => {
      input.focus();
      input.blur();
    });

    expect(input).toHaveValue((1.23456).toLocaleString(undefined, { minimumFractionDigits: 5 }));

    await act(async () => {
      input.focus();
    });

    await user.clear(input);
    await user.keyboard('1.234567');
    expect(input).toHaveValue('1.234567');

    fireEvent.blur(input);
    expect(input).toHaveValue((1.23456).toLocaleString(undefined, { minimumFractionDigits: 5 }));
  });

  it('should format to canonical representation when input differs from max precision', async () => {
    const onValueChange = vi.fn();

    function Controlled(props: { value: number | null }) {
      return (
        <NumberField.Root value={props.value} onValueChange={onValueChange}>
          <NumberField.Input />
        </NumberField.Root>
      );
    }

    const { setProps, user } = await render(<Controlled value={null} />);
    const input = screen.getByRole('textbox');

    await act(async () => {
      setProps({ value: 1.23456 });
    });

    expect(input).toHaveValue((1.23456).toLocaleString(undefined, { minimumFractionDigits: 5 }));

    await act(async () => {
      input.focus();
    });

    await user.clear(input);
    await user.keyboard('1.23456000');
    expect(input).toHaveValue('1.23456000');

    fireEvent.blur(input);
    expect(input).toHaveValue((1.23456).toLocaleString(undefined, { minimumFractionDigits: 5 }));
  });

  it('should handle multiple blur cycles with precision preservation', async () => {
    const onValueChange = vi.fn();

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
      setProps({ value: 1.23456789 });
    });

    expect(input).toHaveValue((1.23456789).toLocaleString(undefined, { minimumFractionDigits: 8 }));

    await act(async () => {
      input.focus();
      input.blur();
    });

    expect(input).toHaveValue((1.23456789).toLocaleString(undefined, { minimumFractionDigits: 8 }));
    expect(onValueChange.mock.calls.length).toBe(0);

    await act(async () => {
      input.focus();
      input.blur();
    });

    expect(input).toHaveValue((1.23456789).toLocaleString(undefined, { minimumFractionDigits: 8 }));
    expect(onValueChange.mock.calls.length).toBe(0);
  });

  it('should handle edge case where parsed value equals current value but input differs', async () => {
    const onValueChange = vi.fn();

    function Controlled(props: { value: number | null }) {
      return (
        <NumberField.Root value={props.value} onValueChange={onValueChange}>
          <NumberField.Input />
        </NumberField.Root>
      );
    }

    const { setProps, user } = await render(<Controlled value={null} />);
    const input = screen.getByRole('textbox');

    await act(async () => {
      setProps({ value: 1.5 });
    });

    expect(input).toHaveValue((1.5).toLocaleString());

    await act(async () => {
      input.focus();
    });

    await user.clear(input);
    await user.keyboard('1.50');
    expect(input).toHaveValue('1.50');

    fireEvent.blur(input);
    expect((input as HTMLInputElement).value).toMatch(/^1[.,]5/);
  });

  it('should preserve precision when value matches max precision after external change during typing', async () => {
    const onValueChange = vi.fn();

    function Controlled() {
      const [value, setValue] = React.useState<number | null>(null);
      return (
        <NumberField.Root
          value={value}
          onValueChange={(val) => {
            onValueChange(val);
            setValue(val);
          }}
        >
          <NumberField.Input />
          <button onClick={() => setValue(3.14159265)}>set pi</button>
        </NumberField.Root>
      );
    }

    const { user } = await render(<Controlled />);
    const input = screen.getByRole('textbox');

    await act(async () => {
      input.focus();
    });

    await user.keyboard('2.7');
    expect(input).toHaveValue('2.7');

    await user.click(screen.getByText('set pi'));

    expect(input).toHaveValue((3.14159265).toLocaleString(undefined, { minimumFractionDigits: 8 }));

    fireEvent.blur(input);
    expect(input).toHaveValue((3.14159265).toLocaleString(undefined, { minimumFractionDigits: 8 }));
  });

  it('should round to explicit maximumFractionDigits on blur', async () => {
    const onValueChange = vi.fn();

    function Controlled(props: { value: number | null }) {
      return (
        <NumberField.Root
          value={props.value}
          onValueChange={onValueChange}
          format={{ maximumFractionDigits: 2 }}
        >
          <NumberField.Input />
        </NumberField.Root>
      );
    }

    const { setProps } = await render(<Controlled value={null} />);
    const input = screen.getByRole('textbox');

    await act(async () => {
      setProps({ value: 1.23456 });
    });

    expect(input).toHaveValue((1.23).toLocaleString());

    await act(async () => {
      input.focus();
      input.blur();
    });

    expect(input).toHaveValue((1.23).toLocaleString());
    expect(onValueChange.mock.calls.length).toBe(1);
    expect(onValueChange.mock.calls[0][0]).toBe(1.23);
  });

  it('should round to step precision on blur when step implies precision constraints', async () => {
    const onValueChange = vi.fn();

    function Controlled() {
      const [value, setValue] = React.useState<number | null>(null);
      return (
        <NumberField.Root
          value={value}
          onValueChange={(val) => {
            onValueChange(val);
            setValue(val);
          }}
          step={0.01}
        >
          <NumberField.Input />
        </NumberField.Root>
      );
    }

    const { user } = await render(<Controlled />);
    const input = screen.getByRole('textbox');

    await act(async () => {
      input.focus();
    });

    await user.keyboard('1.23456');
    expect(input).toHaveValue('1.23456');

    // The stored value should be the full precision value
    const valueBeforeBlur = onValueChange.mock.lastCall?.[0];
    // The value gets processed through removeFloatingPointErrors during validation
    // which applies some default precision constraints
    expect(valueBeforeBlur).toBe(1.235);

    const callCountBeforeBlur = onValueChange.mock.calls.length;

    fireEvent.blur(input);

    // Without explicit precision formatting, the behavior depends on the step
    // The current implementation preserves full precision until it differs from canonical
    expect(input).toHaveValue((1.235).toLocaleString(undefined, { minimumFractionDigits: 3 }));
    expect(onValueChange.mock.calls.length).toBe(callCountBeforeBlur + 1);
  });

  it('commits parsed value on blur and normalizes display for fr-FR', async () => {
    const onValueChange = vi.fn();

    await render(
      <NumberField.Root locale="fr-FR" onValueChange={onValueChange}>
        <NumberField.Input />
      </NumberField.Root>,
    );

    const input = screen.getByRole<HTMLInputElement>('textbox');
    await act(async () => input.focus());

    fireEvent.change(input, { target: { value: '1234,5' } });
    expect(input).toHaveValue('1234,5');

    fireEvent.blur(input);

    expect(onValueChange.mock.calls.length).toBe(1);
    expect(onValueChange.mock.calls[0][0]).toBe(1234.5);

    expect(input.value).toBe((1234.5).toLocaleString('fr-FR'));
  });
});
