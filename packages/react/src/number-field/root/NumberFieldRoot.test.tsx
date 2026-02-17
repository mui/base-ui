import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, screen, fireEvent } from '@mui/internal-test-utils';
import { NumberField as NumberFieldBase } from '@base-ui/react/number-field';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { REASONS } from '../../utils/reasons';

describe('<NumberField />', () => {
  const { render } = createRenderer();

  describeConformance(<NumberFieldBase.Root />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  function NumberField(props: NumberFieldBase.Root.Props) {
    return (
      <NumberFieldBase.Root {...props}>
        <NumberFieldBase.Group>
          <NumberFieldBase.Input />
          <NumberFieldBase.Increment />
          <NumberFieldBase.Decrement />
          <NumberFieldBase.ScrubArea />
        </NumberFieldBase.Group>
      </NumberFieldBase.Root>
    );
  }

  describe('prop: defaultValue', () => {
    it('should accept a number value', async () => {
      await render(<NumberField defaultValue={1} />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.value('1');
    });

    it('should accept an `undefined` value', async () => {
      await render(<NumberField />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.value('');
    });
  });

  describe('prop: value', () => {
    it('should accept a number value that can change over time', async () => {
      const { rerender } = await render(<NumberField value={1} />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.value('1');
      await rerender(<NumberField value={2} />);
      expect(input).to.have.value('2');
    });

    it('should accept an `undefined` value', async () => {
      await render(<NumberField />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.value('');
    });

    it('should accept a `null` value', async () => {
      await render(<NumberField value={null} />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.value('');
    });

    it('should be `null` when the input is empty but not trimmed', async () => {
      const onValueChange = spy();
      await render(<NumberField value={1} onValueChange={onValueChange} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '  ' } });
      expect(onValueChange.firstCall.args[0]).to.equal(null);
    });
  });

  it('blocks submission when step mismatch occurs', async () => {
    await render(
      <form data-testid="form">
        <NumberFieldBase.Root name="quantity" min={0} step={0.1}>
          <NumberFieldBase.Group>
            <NumberFieldBase.Input />
          </NumberFieldBase.Group>
        </NumberFieldBase.Root>
        <button type="submit">Submit</button>
      </form>,
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '0.11' } });

    const hiddenInput = document.querySelector(
      'input[type="number"][name="quantity"]',
    ) as HTMLInputElement;
    expect(hiddenInput).not.to.equal(null);
    expect(hiddenInput.validity.stepMismatch).to.equal(true);

    const form = screen.getByTestId<HTMLFormElement>('form');
    expect(form.checkValidity()).to.equal(false);
  });

  it.skipIf(isJSDOM)('blocks submission when step mismatch occurs with default step', async () => {
    await render(
      <form data-testid="form">
        <NumberFieldBase.Root name="quantity" min={0}>
          <NumberFieldBase.Group>
            <NumberFieldBase.Input />
          </NumberFieldBase.Group>
        </NumberFieldBase.Root>
        <button type="submit">Submit</button>
      </form>,
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '0.11' } });

    const hiddenInput = document.querySelector(
      'input[type="number"][name="quantity"]',
    ) as HTMLInputElement;
    expect(hiddenInput).not.to.equal(null);
    expect(hiddenInput.validity.stepMismatch).to.equal(true);

    const form = screen.getByTestId<HTMLFormElement>('form');
    expect(form.checkValidity()).to.equal(false);
  });

  it('does not block submission when step="any"', async () => {
    await render(
      <form data-testid="form">
        <NumberFieldBase.Root name="quantity" min={0} step="any">
          <NumberFieldBase.Group>
            <NumberFieldBase.Input />
          </NumberFieldBase.Group>
        </NumberFieldBase.Root>
        <button type="submit">Submit</button>
      </form>,
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '0.11' } });

    const hiddenInput = document.querySelector(
      'input[type="number"][name="quantity"]',
    ) as HTMLInputElement;
    expect(hiddenInput).not.to.equal(null);
    expect(hiddenInput.validity.stepMismatch).to.equal(false);

    const form = screen.getByTestId<HTMLFormElement>('form');
    expect(form.checkValidity()).to.equal(true);
  });

  describe('prop: onValueChange', () => {
    it('should be called when the value changes', async () => {
      const onValueChange = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(1);
        return (
          <NumberField
            value={value}
            onValueChange={(val) => {
              onValueChange(val);
              setValue(val);
            }}
          />
        );
      }
      await render(<App />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '2' } });
      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).to.equal(2);
    });

    it('should be called with a number when transitioning from `null`', async () => {
      const onValueChange = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(null);
        return (
          <NumberField
            value={value}
            onValueChange={(val) => {
              onValueChange(val);
              setValue(val);
            }}
          />
        );
      }
      await render(<App />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '5' } });
      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).to.equal(5);
    });

    it('should be called with `null` when empty and transitioning from a number', async () => {
      const onValueChange = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(5);
        return (
          <NumberField
            value={value}
            onValueChange={(val) => {
              onValueChange(val);
              setValue(val);
            }}
          />
        );
      }
      await render(<App />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '' } });
      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).to.equal(null);
    });

    it('includes the reason for parseable typing', async () => {
      const onValueChange = spy();
      await render(<NumberField onValueChange={onValueChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '12' } });

      expect(onValueChange).to.have.property('callCount', 1);
      const [, details] = onValueChange.firstCall.args as [
        number | null,
        NumberFieldBase.Root.ChangeEventDetails,
      ];
      expect(details.reason).to.equal(REASONS.inputChange);
    });

    it('includes the reason when clearing the value', async () => {
      const onValueChange = spy();
      await render(<NumberField defaultValue={5} onValueChange={onValueChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '' } });

      expect(onValueChange).to.have.property('callCount', 1);
      const [, details] = onValueChange.firstCall.args as [
        number | null,
        NumberFieldBase.Root.ChangeEventDetails,
      ];
      expect(details.reason).to.equal(REASONS.inputClear);
    });

    it('includes the reason for keyboard increments', async () => {
      const onValueChange = spy();
      await render(<NumberField defaultValue={1} onValueChange={onValueChange} />);
      const input = screen.getByRole('textbox');

      await act(async () => {
        input.focus();
      });
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(onValueChange).to.have.property('callCount', 1);
      const [, details] = onValueChange.firstCall.args as [
        number | null,
        NumberFieldBase.Root.ChangeEventDetails,
      ];
      expect(details.reason).to.equal('keyboard');
    });

    it('includes the reason for increment button presses', async () => {
      const onValueChange = spy();
      await render(<NumberField defaultValue={1} onValueChange={onValueChange} />);
      const incrementButton = screen.getByRole('button', { name: 'Increase' });

      fireEvent.click(incrementButton);

      expect(onValueChange.callCount).to.equal(1);
      const [, details] = onValueChange.firstCall.args as [
        number | null,
        NumberFieldBase.Root.ChangeEventDetails,
      ];
      expect(details.reason).to.equal('increment-press');
    });

    it('includes the reason for decrement button presses', async () => {
      const onValueChange = spy();
      await render(<NumberField defaultValue={1} onValueChange={onValueChange} />);
      const decrementButton = screen.getByRole('button', { name: 'Decrease' });

      fireEvent.click(decrementButton);

      expect(onValueChange.callCount).to.equal(1);
      const [, details] = onValueChange.firstCall.args as [
        number | null,
        NumberFieldBase.Root.ChangeEventDetails,
      ];
      expect(details.reason).to.equal('decrement-press');
    });

    it('includes the reason for wheel scrubbing', async () => {
      const onValueChange = spy();
      await render(<NumberField allowWheelScrub defaultValue={4} onValueChange={onValueChange} />);
      const input = screen.getByRole('textbox');

      await act(async () => {
        input.focus();
      });
      fireEvent.wheel(input, { deltaY: -100 });

      expect(onValueChange.callCount).to.equal(1);
      const [, details] = onValueChange.firstCall.args as [
        number | null,
        NumberFieldBase.Root.ChangeEventDetails,
      ];
      expect(details.reason).to.equal('wheel');
    });
  });

  describe('typing behavior (parseable changes)', () => {
    it('fires onValueChange for each parseable change while typing', async () => {
      const onValueChange = spy();
      const onValueCommitted = spy();
      await render(
        <NumberField onValueChange={onValueChange} onValueCommitted={onValueCommitted} />,
      );
      const input = screen.getByRole('textbox');

      // Type '1' -> parseable
      fireEvent.change(input, { target: { value: '1' } });
      // Type '12' -> parseable
      fireEvent.change(input, { target: { value: '12' } });
      // Type '12.' -> parseable (treated as 12)
      fireEvent.change(input, { target: { value: '12.' } });
      // Type '12.a' -> not parseable, should not fire
      fireEvent.change(input, { target: { value: '12.a' } });

      expect(onValueChange.callCount).to.equal(3);
      expect(onValueChange.getCall(0).args[0]).to.equal(1);
      expect(onValueChange.getCall(1).args[0]).to.equal(12);
      expect(onValueChange.getCall(2).args[0]).to.equal(12);

      expect(onValueCommitted.callCount).to.equal(0);
    });

    it('does not fire onValueChange for non-numeric composition/partial input', async () => {
      const onValueChange = spy();
      const onValueCommitted = spy();
      await render(
        <NumberField onValueChange={onValueChange} onValueCommitted={onValueCommitted} />,
      );
      const input = screen.getByRole('textbox');

      // Simulate IME composition of non-numeric text; intermediate values like 'ni'
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: 'n' } });
      fireEvent.change(input, { target: { value: 'ni' } });
      fireEvent.compositionEnd(input);

      expect(onValueChange.callCount).to.equal(0);

      // Now enter a Han numeral which is parseable
      fireEvent.change(input, { target: { value: '一' } });
      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).to.equal(1);

      expect(onValueCommitted.callCount).to.equal(0);
      fireEvent.blur(input);
      expect(onValueCommitted.callCount).to.equal(1);
      expect(onValueCommitted.firstCall.args[0]).to.equal(1);
    });

    it('handles sign and decimal partials vs. parseable numbers', async () => {
      const onValueChange = spy();
      const onValueCommitted = spy();
      await render(
        <NumberField onValueChange={onValueChange} onValueCommitted={onValueCommitted} min={-10} />,
      );
      const input = screen.getByRole('textbox');

      // '-' or '.' alone aren't parseable
      fireEvent.change(input, { target: { value: '-' } });
      fireEvent.change(input, { target: { value: '.' } });
      // '0.' is parseable (-> 0)
      fireEvent.change(input, { target: { value: '0.' } });
      fireEvent.change(input, { target: { value: '-1' } });
      fireEvent.change(input, { target: { value: '-1.5' } });

      expect(onValueChange.callCount).to.equal(3);
      expect(onValueChange.getCall(0).args[0]).to.equal(0);
      expect(onValueChange.getCall(1).args[0]).to.equal(-1);
      expect(onValueChange.getCall(2).args[0]).to.equal(-1.5);

      // No commit until blur
      expect(onValueCommitted.callCount).to.equal(0);

      fireEvent.blur(input);
      expect(onValueCommitted.callCount).to.equal(1);
      expect(onValueCommitted.firstCall.args[0]).to.equal(-1.5);
    });

    it('allows typing a decimal while replacing a selection', async () => {
      await render(<NumberField defaultValue={12.3} locale="en-US" />);
      const input = screen.getByRole<HTMLInputElement>('textbox');

      await act(async () => {
        input.focus();
      });

      const decimalIndex = input.value.indexOf('.');
      expect(decimalIndex).to.be.greaterThan(-1);
      await act(async () => {
        input.setSelectionRange(1, decimalIndex + 2);
      });

      const keydownResult = fireEvent.keyDown(input, { key: '.' });
      expect(keydownResult).to.equal(true);
    });

    it('accepts grouping while typing and parses progressively', async () => {
      const onValueChange = spy();
      const onValueCommitted = spy();
      await render(
        <NumberField onValueChange={onValueChange} onValueCommitted={onValueCommitted} />,
      );
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '1' } }); // 1
      fireEvent.change(input, { target: { value: '1,' } }); // 1 (group symbol)
      fireEvent.change(input, { target: { value: '1,2' } }); // 12
      fireEvent.change(input, { target: { value: '1,23' } }); // 123
      fireEvent.change(input, { target: { value: '1,234' } }); // 1234

      expect(onValueChange.callCount).to.equal(5);
      expect(onValueChange.getCall(0).args[0]).to.equal(1);
      expect(onValueChange.getCall(1).args[0]).to.equal(1);
      expect(onValueChange.getCall(2).args[0]).to.equal(12);
      expect(onValueChange.getCall(3).args[0]).to.equal(123);
      expect(onValueChange.getCall(4).args[0]).to.equal(1234);

      expect(onValueCommitted.callCount).to.equal(0);
      fireEvent.blur(input);
      expect(onValueCommitted.callCount).to.equal(1);
      expect(onValueCommitted.firstCall.args[0]).to.equal(1234);
    });

    it('respects locale decimal separator while typing (de-DE)', async () => {
      const onValueChange = spy();
      const onValueCommitted = spy();
      await render(
        <NumberField
          onValueChange={onValueChange}
          onValueCommitted={onValueCommitted}
          locale="de-DE"
        />,
      );
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '1' } }); // 1
      fireEvent.change(input, { target: { value: '1,' } }); // 1 (decimal separator typed)
      fireEvent.change(input, { target: { value: '1,5' } }); // 1.5

      expect(onValueChange.callCount).to.equal(3);
      expect(onValueChange.getCall(0).args[0]).to.equal(1);
      expect(onValueChange.getCall(1).args[0]).to.equal(1);
      expect(onValueChange.getCall(2).args[0]).to.equal(1.5);

      fireEvent.blur(input);
      expect(onValueCommitted.callCount).to.equal(1);
      expect(onValueCommitted.firstCall.args[0]).to.equal(1.5);
    });

    it('parses percent while typing and commits canonical percent value', async () => {
      const onValueChange = spy();
      const onValueCommitted = spy();
      await render(
        <NumberField
          onValueChange={onValueChange}
          onValueCommitted={onValueCommitted}
          format={{ style: 'percent' }}
        />,
      );
      const input = screen.getByRole('textbox');

      // Typing digits in percent style represents a fraction (12 -> 0.12)
      fireEvent.change(input, { target: { value: '12' } });
      // Typing with explicit percent sign also remains 0.12
      fireEvent.change(input, { target: { value: '12%' } });

      expect(onValueChange.callCount).to.equal(2);
      expect(onValueChange.getCall(0).args[0]).to.equal(0.12);
      expect(onValueChange.getCall(1).args[0]).to.equal(0.12);
      expect(onValueCommitted.callCount).to.equal(0);

      fireEvent.blur(input);
      expect(onValueCommitted.callCount).to.equal(1);
      expect(onValueCommitted.firstCall.args[0]).to.equal(0.12);
    });

    it('accepts currency symbol while typing and parses numeric value', async () => {
      const onValueChange = spy();
      await render(
        <NumberField
          onValueChange={onValueChange}
          format={{ style: 'currency', currency: 'USD' }}
        />,
      );
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '$1' } });
      fireEvent.change(input, { target: { value: '$1,2' } });

      expect(onValueChange.callCount).to.equal(2);
      expect(onValueChange.getCall(0).args[0]).to.equal(1);
      expect(onValueChange.getCall(1).args[0]).to.equal(12);
    });

    it('allows deleting trailing currency symbols with locale literals', async () => {
      const onValueChange = spy();
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      };
      const formatter = new Intl.NumberFormat('de-DE', format);

      await render(
        <NumberField
          defaultValue={12.34}
          locale="de-DE"
          format={format}
          onValueChange={onValueChange}
        />,
      );
      const input = screen.getByRole('textbox');
      const formatted = formatter.format(12.34);
      const withoutCurrency = formatted.replace('€', '');

      fireEvent.change(input, { target: { value: withoutCurrency } });

      expect(input).to.have.value(withoutCurrency);
      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).to.equal(12.34);
    });

    it('allows backspace to remove trailing currency symbol that follows a locale literal', async () => {
      const onValueChange = spy();
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      };
      const formatter = new Intl.NumberFormat('de-DE', format);

      await render(
        <NumberField
          defaultValue={12.34}
          locale="de-DE"
          format={format}
          onValueChange={onValueChange}
        />,
      );

      const input = screen.getByRole('textbox');
      const formatted = formatter.format(12.34);
      const afterBackspace = formatted.slice(0, -1);

      await act(async () => {
        input.focus();
      });

      const keydownResult = fireEvent.keyDown(input, { key: 'Backspace' });
      expect(keydownResult).to.equal(true);

      fireEvent.change(input, { target: { value: afterBackspace } });

      expect(input).to.have.value(afterBackspace);
      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).to.equal(12.34);
    });

    it('does not commit on blur for invalid input', async () => {
      const onValueCommitted = spy();
      await render(<NumberField onValueCommitted={onValueCommitted} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '.' } });
      expect(input).to.have.value('.');
      fireEvent.blur(input);

      expect(onValueCommitted.callCount).to.equal(0);
    });
  });

  describe('prop: onValueCommitted', () => {
    it('fires on blur with committed numeric value', async () => {
      const onValueCommitted = spy();
      await render(<NumberField onValueCommitted={onValueCommitted} />);
      const input = screen.getByRole('textbox');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '123.' } });
      fireEvent.blur(input);

      expect(onValueCommitted.callCount).to.equal(1);
      // Canonicalizes to 123
      expect(onValueCommitted.firstCall.args[0]).to.equal(123);
    });

    it('fires null on blur when input is cleared', async () => {
      const onValueCommitted = spy();
      await render(<NumberField defaultValue={5} onValueCommitted={onValueCommitted} />);
      const input = screen.getByRole('textbox');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      expect(onValueCommitted.callCount).to.equal(1);
      expect(onValueCommitted.firstCall.args[0]).to.equal(null);
    });

    it('fires on keyboard interactions (ArrowUp/Down/Home/End)', async () => {
      const onValueCommitted = spy();
      await render(
        <NumberField defaultValue={0} min={-10} max={10} onValueCommitted={onValueCommitted} />,
      );

      const input = screen.getByRole('textbox');
      await act(async () => input.focus());

      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(onValueCommitted.callCount).to.equal(1);
      expect(onValueCommitted.lastCall.args[0]).to.equal(1);

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(onValueCommitted.callCount).to.equal(2);
      expect(onValueCommitted.lastCall.args[0]).to.equal(0);

      fireEvent.keyDown(input, { key: 'Home' });
      expect(onValueCommitted.callCount).to.equal(3);
      expect(onValueCommitted.lastCall.args[0]).to.equal(-10);

      fireEvent.keyDown(input, { key: 'End' });
      expect(onValueCommitted.callCount).to.equal(4);
      expect(onValueCommitted.lastCall.args[0]).to.equal(10);
    });

    it('fires when using increment/decrement buttons', async () => {
      const onValueCommitted = spy();
      await render(<NumberField defaultValue={0} onValueCommitted={onValueCommitted} />);

      const input = screen.getByRole('textbox');
      const inc = screen.getByLabelText('Increase');
      const dec = screen.getByLabelText('Decrease');

      fireEvent.click(inc);
      expect(onValueCommitted.callCount).to.equal(1);
      expect(onValueCommitted.lastCall.args[0]).to.equal(1);
      expect(input).to.have.value('1');

      fireEvent.click(dec);
      expect(onValueCommitted.callCount).to.equal(2);
      expect(onValueCommitted.lastCall.args[0]).to.equal(0);
      expect(input).to.have.value('0');
    });
  });

  describe('prop: disabled', () => {
    it('should disable the input', async () => {
      await render(<NumberField disabled />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.attribute('disabled');
    });
  });

  describe('prop: readOnly', () => {
    it('should mark the input as readOnly', async () => {
      await render(<NumberField readOnly />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.attribute('readonly');
    });
  });

  describe('prop: required', () => {
    it('should mark the input as required', async () => {
      await render(<NumberField required />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.attribute('required');
    });
  });

  describe('prop: name', () => {
    it('should set the name attribute on the hidden input', async () => {
      await render(<NumberField name="test" />);
      const hiddenInput = screen.getByText('', {
        selector: 'input[aria-hidden][type=number]',
      });
      expect(hiddenInput).to.have.attribute('name', 'test');
    });
  });

  describe('prop: min', () => {
    it('prevents the raw value from going below the `min` prop', async () => {
      const fn = spy();

      function App() {
        const [value, setValue] = React.useState<number | null>(5);
        return (
          <NumberField
            value={value}
            onValueChange={(v) => {
              fn(v);
              setValue(v);
            }}
            min={5}
          />
        );
      }

      await render(<App />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '4' } });

      expect(input).to.have.value('4');
      expect(fn.firstCall.args[0]).to.equal(5);
    });

    it('allows the value to go above the `min` prop', async () => {
      const fn = spy();

      function App() {
        const [value, setValue] = React.useState<number | null>(5);
        return (
          <NumberField
            value={value}
            onValueChange={(v) => {
              fn(v);
              setValue(v);
            }}
            min={5}
          />
        );
      }

      await render(<App />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '6' } });

      expect(input).to.have.value('6');
    });
  });

  describe('prop: max', () => {
    it('prevents the value from going above the `max` prop', async () => {
      const fn = spy();

      function App() {
        const [value, setValue] = React.useState<number | null>(5);
        return (
          <NumberField
            value={value}
            onValueChange={(v) => {
              fn(v);
              setValue(v);
            }}
            max={5}
          />
        );
      }

      await render(<App />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '6' } });

      expect(input).to.have.value('6');
      expect(fn.firstCall.args[0]).to.equal(5);
    });

    it('allows the value to go below the `max` prop', async () => {
      const fn = spy();

      function App() {
        const [value, setValue] = React.useState<number | null>(5);
        return (
          <NumberField
            value={value}
            onValueChange={(v) => {
              fn(v);
              setValue(v);
            }}
            max={5}
          />
        );
      }

      await render(<App />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '4' } });

      expect(input).to.have.value('4');
      expect(fn.firstCall.args[0]).to.equal(4);
    });
  });

  describe('prop: allowOutOfRange', () => {
    it('allows range overflow validation when true', async () => {
      await render(
        <form data-testid="form">
          <NumberFieldBase.Root name="quantity" max={5} allowOutOfRange>
            <NumberFieldBase.Group>
              <NumberFieldBase.Input />
            </NumberFieldBase.Group>
          </NumberFieldBase.Root>
          <button type="submit">Submit</button>
        </form>,
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '6' } });

      const hiddenInput = document.querySelector(
        'input[type="number"][name="quantity"]',
      ) as HTMLInputElement;

      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.value).to.equal('6');
      expect(hiddenInput.validity.rangeOverflow).to.equal(true);

      const form = screen.getByTestId<HTMLFormElement>('form');
      expect(form.checkValidity()).to.equal(false);
    });

    it('still clamps step interactions when true', async () => {
      await render(
        <form data-testid="form">
          <NumberField defaultValue={5} max={5} allowOutOfRange name="quantity" />
          <button type="submit">Submit</button>
        </form>,
      );

      const input = screen.getByRole('textbox');
      fireEvent.click(screen.getByLabelText('Increase'));

      const hiddenInput = document.querySelector(
        'input[type="number"][name="quantity"]',
      ) as HTMLInputElement;

      expect(input).to.have.value('5');
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.value).to.equal('5');
      expect(hiddenInput.validity.rangeOverflow).to.equal(false);

      const form = screen.getByTestId<HTMLFormElement>('form');
      expect(form.checkValidity()).to.equal(true);
    });

    it('clamps to range when false', async () => {
      await render(
        <form data-testid="form">
          <NumberFieldBase.Root name="quantity" max={5} allowOutOfRange={false}>
            <NumberFieldBase.Group>
              <NumberFieldBase.Input />
            </NumberFieldBase.Group>
          </NumberFieldBase.Root>
          <button type="submit">Submit</button>
        </form>,
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '6' } });

      const hiddenInput = document.querySelector(
        'input[type="number"][name="quantity"]',
      ) as HTMLInputElement;

      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.value).to.equal('5');
      expect(hiddenInput.validity.rangeOverflow).to.equal(false);

      const form = screen.getByTestId<HTMLFormElement>('form');
      expect(form.checkValidity()).to.equal(true);
    });
  });

  describe('prop: step', () => {
    it('defaults to 1', async () => {
      await render(<NumberField defaultValue={5} />);
      const input = screen.getByRole('textbox');
      fireEvent.click(screen.getByLabelText('Increase'));
      expect(input).to.have.value('6');
    });

    it('should increment the value by the `step` prop', async () => {
      await render(<NumberField defaultValue={4} step={2} />);
      const input = screen.getByRole('textbox');
      fireEvent.click(screen.getByLabelText('Increase'));
      expect(input).to.have.value('6');
    });

    it('should snap when incrementing to the nearest multiple of the `step` prop', async () => {
      await render(<NumberField defaultValue={5} step={2} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '6' } });
      fireEvent.blur(input);
      expect(input).to.have.value('6');
    });

    it('should decrement the value by the `step` prop', async () => {
      await render(<NumberField defaultValue={6} step={2} />);
      const input = screen.getByRole('textbox');
      fireEvent.click(screen.getByLabelText('Decrease'));
      expect(input).to.have.value('4');
    });

    it('should snap when decrementing to the nearest multiple of the `step` prop', async () => {
      await render(<NumberField defaultValue={5} step={2} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '4' } });
      fireEvent.blur(input);
      expect(input).to.have.value('4');
    });
  });

  describe.skipIf(isJSDOM)('prop: largeStep', () => {
    it('should increment the value by the default `largeStep` prop of 10 while holding the shift key', async () => {
      await render(<NumberField defaultValue={5} />);
      const input = screen.getByRole('textbox');
      fireEvent.pointerDown(screen.getByLabelText('Increase'), { shiftKey: true });
      expect(input).to.have.value('15');
    });

    it('should decrement the value by the default `largeStep` prop of 10 while holding the shift key', async () => {
      await render(<NumberField defaultValue={6} />);
      const input = screen.getByRole('textbox');
      fireEvent.pointerDown(screen.getByLabelText('Decrease'), { shiftKey: true });
      expect(input).to.have.value('-4');
    });

    it('should use explicit `largeStep` value if provided while holding the shift key', async () => {
      await render(<NumberField defaultValue={5} largeStep={5} />);
      const input = screen.getByRole('textbox');
      fireEvent.pointerDown(screen.getByLabelText('Increase'), { shiftKey: true });
      expect(input).to.have.value('10');
    });

    it('should not use the `largeStep` prop if no longer holding the shift key', async () => {
      await render(<NumberField defaultValue={5} largeStep={5} />);
      const input = screen.getByRole('textbox');
      fireEvent.pointerDown(screen.getByLabelText('Increase'), { shiftKey: true });
      expect(input).to.have.value('10');
      fireEvent.keyUp(input, { shiftKey: true });
      fireEvent.pointerDown(screen.getByLabelText('Increase'), { shiftKey: true });
      expect(input).to.have.value('15');
    });
  });

  describe.skipIf(isJSDOM)('prop: smallStep', () => {
    it('should increment the value by the default `smallStep` prop of 0.1 while holding the alt key', async () => {
      await render(<NumberField defaultValue={5} />);
      const input = screen.getByRole('textbox');
      fireEvent.pointerDown(screen.getByLabelText('Increase'), { altKey: true });
      expect(input).to.have.value((5.1).toLocaleString());
    });

    it('should decrement the value by the default `smallStep` prop of 0.1 while holding the alt key', async () => {
      await render(<NumberField defaultValue={6} />);
      const input = screen.getByRole('textbox');
      fireEvent.pointerDown(screen.getByLabelText('Decrease'), { altKey: true });
      expect(input).to.have.value((5.9).toLocaleString());
    });

    it('should use explicit `smallStep` value if provided while holding the alt key', async () => {
      await render(<NumberField defaultValue={5} smallStep={0.5} />);
      const input = screen.getByRole('textbox');
      fireEvent.keyDown(document.body, { altKey: true });
      fireEvent.pointerDown(screen.getByLabelText('Increase'), { altKey: true });
      expect(input).to.have.value((5.5).toLocaleString());
    });

    it('should not use the `smallStep` prop if no longer holding the alt key', async () => {
      await render(<NumberField defaultValue={5} smallStep={0.5} />);
      const input = screen.getByRole('textbox');
      const button = screen.getByLabelText('Increase');
      fireEvent.pointerDown(button, { altKey: true });
      expect(input).to.have.value((5.5).toLocaleString());
      fireEvent.keyUp(input, { altKey: false });
      fireEvent.pointerDown(button);
      expect(input).to.have.value((6.5).toLocaleString());
    });
  });

  describe('prop: format', () => {
    it('should format the value using the provided options', async () => {
      await render(
        <NumberField defaultValue={1000} format={{ style: 'currency', currency: 'USD' }} />,
      );
      const input = screen.getByRole('textbox');
      const expectedValue = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
      }).format(1000);
      expect(input).to.have.value(expectedValue);
    });

    it('reflects controlled value changes in the textbox', async () => {
      function App() {
        const [val, setVal] = React.useState<number | null>(1);
        return (
          <div>
            <NumberField value={val} onValueChange={setVal} />
            <button onClick={() => setVal(1234)}>set</button>
          </div>
        );
      }

      const { user } = await render(<App />);
      const input = screen.getByRole('textbox');

      expect(input).to.have.value('1');

      await user.click(screen.getByText('set'));
      expect(input).to.have.value((1234).toLocaleString());
    });
  });

  describe('prop: allowWheelScrub', () => {
    it('should allow the user to scrub the input value with the mouse wheel', async () => {
      await render(<NumberField defaultValue={5} allowWheelScrub />);
      const input = screen.getByRole('textbox');
      await act(async () => input.focus());
      fireEvent.wheel(input, { deltaY: 1 });
      expect(input).to.have.value('4');
      fireEvent.wheel(input, { deltaY: -1 });
      expect(input).to.have.value('5');
    });

    it('should not allow the user to scrub the input value with the mouse wheel if `allowWheelScrub` is `false`', async () => {
      await render(<NumberField defaultValue={5} allowWheelScrub={false} />);
      const input = screen.getByRole('textbox');
      await act(async () => input.focus());
      fireEvent.wheel(input, { deltaY: 1 });
      expect(input).to.have.value('5');
      fireEvent.wheel(input, { deltaY: -5 });
      expect(input).to.have.value('5');
    });

    it('calls onValueChange on wheel and commits on blur', async () => {
      const onValueChange = spy();
      const onValueCommitted = spy();
      await render(
        <NumberField
          defaultValue={5}
          allowWheelScrub
          onValueChange={onValueChange}
          onValueCommitted={onValueCommitted}
        />,
      );
      const input = screen.getByRole('textbox');
      await act(async () => input.focus());

      fireEvent.wheel(input, { deltaY: 1 });
      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.lastCall.args[0]).to.equal(4);

      fireEvent.wheel(input, { deltaY: -1 });
      expect(onValueChange.callCount).to.equal(2);
      expect(onValueChange.lastCall.args[0]).to.equal(5);

      // Wheel does not commit; blur commits current value
      expect(onValueCommitted.callCount).to.equal(0);

      fireEvent.blur(input);
      expect(onValueCommitted.callCount).to.equal(1);
      expect(onValueCommitted.firstCall.args[0]).to.equal(5);
    });
  });

  describe('Form', () => {
    it('should include the input value in the form submission', async ({ skip }) => {
      if (isJSDOM) {
        // FormData is not available in JSDOM
        skip();
      }

      let fieldValue = '';

      await render(
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            fieldValue = formData.get('test') as string;
          }}
        >
          <Field.Root name="test">
            <NumberFieldBase.Root defaultValue={undefined}>
              <NumberFieldBase.Input />
            </NumberFieldBase.Root>
            <button type="submit">Submit</button>
          </Field.Root>
        </Form>,
      );

      const submitButton = screen.getByText('Submit');
      await act(async () => submitButton.click());
      expect(fieldValue).to.equal('');

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '50' } });
      await act(async () => submitButton.click());
      expect(fieldValue).to.equal('50');
    });

    it('should not include formatting in the submitted value', async ({ skip }) => {
      if (isJSDOM) {
        // FormData is not available in JSDOM
        skip();
      }

      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      };

      let fieldValue = '';

      await render(
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            fieldValue = formData.get('test') as string;
          }}
        >
          <Field.Root name="test">
            <NumberFieldBase.Root defaultValue={54.5} format={format} locale="de-DE">
              <NumberFieldBase.Input />
            </NumberFieldBase.Root>
            <button type="submit">Submit</button>
          </Field.Root>
        </Form>,
      );

      const input = screen.getByRole('textbox');
      const expectedValue = new Intl.NumberFormat('de-DE', format).format(54.5);
      expect(input).to.have.value(expectedValue);

      const submitButton = screen.getByText('Submit');

      await act(async () => submitButton.click());

      expect(fieldValue).to.equal('54.5');
    });

    it('triggers native HTML validation on submit', async () => {
      const { user } = await render(
        <Form>
          <Field.Root name="test" data-testid="field">
            <NumberField required />
            <Field.Error match="valueMissing" data-testid="error">
              required
            </Field.Error>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      const submit = screen.getByText('Submit');

      expect(screen.queryByTestId('error')).to.equal(null);

      await user.click(submit);

      const error = screen.getByTestId('error');
      expect(error).to.have.text('required');
    });

    it('focuses the input when the field receives an error from Form', async () => {
      function App() {
        const [errors, setErrors] = React.useState<Form.Props['errors']>({});
        return (
          <Form
            errors={errors}
            onSubmit={(event) => {
              event.preventDefault();
              setErrors({ quantity: 'server error' });
            }}
          >
            <Field.Root name="quantity" data-testid="field">
              <NumberField defaultValue={1} />
              <Field.Error data-testid="error" />
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>
        );
      }

      const { user } = await render(<App />);
      expect(screen.queryByTestId('error')).to.equal(null);
      const submit = screen.getByText('Submit');
      await user.click(submit);

      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
      expect(input).to.have.attribute('aria-invalid', 'true');
      expect(screen.queryByTestId('error')).to.have.text('server error');
    });

    it('clears external errors on change', async () => {
      await render(
        <Form
          errors={{
            test: 'test',
          }}
        >
          <Field.Root name="test" data-testid="field">
            <NumberField defaultValue={1} />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>,
      );

      const input = screen.getByRole('textbox');

      expect(input).to.have.attribute('aria-invalid', 'true');
      expect(screen.queryByTestId('error')).to.have.text('test');

      fireEvent.change(input, { target: { value: '5' } });

      expect(input).not.to.have.attribute('aria-invalid');
      expect(screen.queryByTestId('error')).to.equal(null);
    });

    it('revalidates immediately after form submission errors using increment button', async () => {
      const { user } = await render(
        <Form>
          <Field.Root name="quantity">
            <NumberField required />
            <Field.Error match="valueMissing" data-testid="error">
              required
            </Field.Error>
          </Field.Root>
          <button type="submit" data-testid="submit">
            Submit
          </button>
        </Form>,
      );

      const submit = screen.getByTestId('submit');
      await user.click(submit);

      expect(screen.getByTestId('error')).to.have.text('required');
      const input = screen.getByRole('textbox');
      expect(input).to.have.attribute('aria-invalid', 'true');

      const incrementButton = screen.getByLabelText('Increase');
      await user.click(incrementButton);

      expect(screen.queryByTestId('error')).to.equal(null);
      expect(input).not.to.have.attribute('aria-invalid');
    });

    it('should handle browser autofill', async () => {
      const onValueChange = spy();

      await render(
        <Field.Root name="quantity">
          <NumberFieldBase.Root onValueChange={onValueChange}>
            <NumberFieldBase.Input />
          </NumberFieldBase.Root>
        </Field.Root>,
      );

      const input = screen.getByRole('textbox');
      const hiddenInput = document.querySelector('input[type="number"][name="quantity"]');

      expect(hiddenInput).not.to.equal(null);
      fireEvent.change(hiddenInput!, { target: { value: '42' } });

      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).to.equal(42);
      expect(input).to.have.value('42');
    });
  });

  describe('Field', () => {
    it('[data-touched]', async () => {
      await render(
        <Field.Root>
          <NumberFieldBase.Root>
            <NumberFieldBase.Input />
          </NumberFieldBase.Root>
        </Field.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('textbox');

      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(input).to.have.attribute('data-touched', '');
    });

    it('[data-dirty]', async () => {
      await render(
        <Field.Root>
          <NumberFieldBase.Root>
            <NumberFieldBase.Input />
          </NumberFieldBase.Root>
        </Field.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('textbox');

      expect(input).not.to.have.attribute('data-dirty');

      fireEvent.change(input, { target: { value: '1' } });

      expect(input).to.have.attribute('data-dirty', '');
    });

    describe('[data-filled]', () => {
      it('adds [data-filled] attribute when filled', async () => {
        await render(
          <Field.Root>
            <NumberFieldBase.Root>
              <NumberFieldBase.Input data-testid="input" />
            </NumberFieldBase.Root>
          </Field.Root>,
        );

        const input = screen.getByTestId('input');

        expect(input).not.to.have.attribute('data-filled');

        fireEvent.change(input, { target: { value: '1' } });

        expect(input).to.have.attribute('data-filled', '');

        fireEvent.change(input, { target: { value: '' } });

        expect(input).not.to.have.attribute('data-filled');
      });

      it('has [data-filled] attribute when already filled', async () => {
        await render(
          <Field.Root>
            <NumberFieldBase.Root defaultValue={1}>
              <NumberFieldBase.Input data-testid="input" />
            </NumberFieldBase.Root>
          </Field.Root>,
        );

        const input = screen.getByTestId('input');

        expect(input).to.have.attribute('data-filled');

        fireEvent.change(input, { target: { value: '' } });

        expect(input).not.to.have.attribute('data-filled');
      });
    });

    it('[data-filled]', async () => {
      await render(
        <Field.Root>
          <NumberFieldBase.Root>
            <NumberFieldBase.Input data-testid="input" />
          </NumberFieldBase.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');

      expect(input).not.to.have.attribute('data-focused');

      fireEvent.focus(input);

      expect(input).to.have.attribute('data-focused', '');

      fireEvent.blur(input);

      expect(input).not.to.have.attribute('data-focused');
    });

    it('adds [data-focused] attribute on every focus', async () => {
      await render(
        <Field.Root>
          <NumberFieldBase.Root>
            <NumberFieldBase.Input data-testid="input" />
          </NumberFieldBase.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');

      fireEvent.focus(input);
      expect(input).to.have.attribute('data-focused', '');

      fireEvent.blur(input);
      expect(input).not.to.have.attribute('data-focused');

      fireEvent.focus(input);
      expect(input).to.have.attribute('data-focused', '');
    });

    it('prop: validate', async () => {
      await render(
        <Field.Root validationMode="onBlur" validate={() => 'error'}>
          <NumberFieldBase.Root>
            <NumberFieldBase.Input />
          </NumberFieldBase.Root>
          <Field.Error data-testid="error" />
        </Field.Root>,
      );

      const input = screen.getByRole('textbox');

      expect(input).not.to.have.attribute('aria-invalid');

      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(input).to.have.attribute('aria-invalid', 'true');
    });

    describe('prop: validationMode', () => {
      it('onSubmit', async () => {
        await render(
          <Form>
            <Field.Root validate={(value) => (value === 1 ? 'custom error' : null)}>
              <NumberFieldBase.Root required data-testid="root">
                <NumberFieldBase.Input data-testid="input" />
              </NumberFieldBase.Root>
              <Field.Error data-testid="error" match="valueMissing">
                valueMissing error
              </Field.Error>
              <Field.Error data-testid="error" match="customError" />
            </Field.Root>
            <button type="submit">submit</button>
          </Form>,
        );

        const input = screen.getByRole('textbox');
        expect(input).not.to.have.attribute('aria-invalid');

        fireEvent.change(input, { target: { value: '1' } });
        fireEvent.blur(input);
        expect(input).not.to.have.attribute('aria-invalid');
        expect(screen.queryByTestId('error')).to.equal(null);

        fireEvent.change(input, { target: { value: '' } });
        fireEvent.blur(input);
        expect(input).not.to.have.attribute('aria-invalid');
        expect(screen.queryByTestId('error')).to.equal(null);

        fireEvent.click(screen.getByText('submit'));
        expect(input).to.have.attribute('aria-invalid', 'true');
        expect(screen.queryByTestId('error')).to.have.text('valueMissing error');
        expect(screen.getByTestId('root')).to.have.attribute('data-invalid');
        expect(input).to.have.attribute('data-invalid');

        fireEvent.change(input, { target: { value: '2' } });
        expect(input).not.to.have.attribute('aria-invalid');
        expect(screen.queryByTestId('error')).to.equal(null);
        expect(screen.getByTestId('root')).not.to.have.attribute('data-invalid');
        expect(input).not.to.have.attribute('data-invalid');
        expect(screen.getByTestId('root')).to.have.attribute('data-valid');
        expect(input).to.have.attribute('data-valid');
        // re-invalidate the field value
        fireEvent.change(input, { target: { value: '1' } });
        expect(input).to.have.attribute('aria-invalid', 'true');
        expect(screen.queryByTestId('error')).to.have.text('custom error');

        fireEvent.change(input, { target: { value: '3' } });
        expect(input).not.to.have.attribute('aria-invalid');
        expect(screen.queryByTestId('error')).to.equal(null);

        fireEvent.change(input, { target: { value: '' } });
        expect(input).to.have.attribute('aria-invalid', 'true');
        expect(screen.queryByTestId('error')).to.have.text('valueMissing error');
      });

      it('onChange', async () => {
        await render(
          <Field.Root
            validationMode="onChange"
            validate={(value) => {
              return value === 1 ? 'error' : null;
            }}
          >
            <NumberFieldBase.Root>
              <NumberFieldBase.Input data-testid="input" />
            </NumberFieldBase.Root>
          </Field.Root>,
        );

        const input = screen.getByTestId('input');

        expect(input).not.to.have.attribute('aria-invalid');

        fireEvent.change(input, { target: { value: '1' } });

        expect(input).to.have.attribute('aria-invalid', 'true');
      });

      it('revalidates when the controlled value changes externally', async () => {
        const validateSpy = spy((value: unknown) =>
          (value as number | null) === 5 ? 'error' : null,
        );

        function App() {
          const [value, setValue] = React.useState<number | null>(null);

          return (
            <React.Fragment>
              <Field.Root validationMode="onChange" validate={validateSpy} name="quantity">
                <NumberFieldBase.Root value={value} onValueChange={(next) => setValue(next)}>
                  <NumberFieldBase.Input data-testid="input" />
                </NumberFieldBase.Root>
              </Field.Root>
              <button type="button" onClick={() => setValue(5)}>
                Set externally
              </button>
            </React.Fragment>
          );
        }

        await render(<App />);

        const input = screen.getByTestId('input');
        const toggle = screen.getByText('Set externally');

        expect(input).not.to.have.attribute('aria-invalid');
        const initialCallCount = validateSpy.callCount;

        fireEvent.click(toggle);

        expect(validateSpy.callCount).to.equal(initialCallCount + 1);
        expect(validateSpy.lastCall.args[0]).to.equal(5);
        expect(input).to.have.attribute('aria-invalid', 'true');
      });

      it('onBlur', async () => {
        await render(
          <Field.Root
            validationMode="onBlur"
            validate={(value) => {
              return value === 1 ? 'error' : null;
            }}
          >
            <NumberFieldBase.Root required>
              <NumberFieldBase.Input data-testid="input" />
            </NumberFieldBase.Root>
            <Field.Error data-testid="error" />
          </Field.Root>,
        );

        const input = screen.getByTestId('input');
        expect(input).not.to.have.attribute('aria-invalid');

        fireEvent.change(input, { target: { value: '1' } });
        expect(input).not.to.have.attribute('aria-invalid');
        fireEvent.blur(input);
        expect(input).to.have.attribute('aria-invalid', 'true');
        // revalidation
        fireEvent.change(input, { target: { value: '2' } });
        expect(input).not.to.have.attribute('aria-invalid');
        expect(screen.queryByTestId('error')).to.equal(null);
      });
    });

    // Chromium shows a native validation popup when stepMismatch occurs that blocks the test
    it.skipIf(!isJSDOM)(
      'prevents form submission when the value does not match the step',
      async () => {
        const handleSubmit = spy();
        await render(
          <form onSubmit={handleSubmit}>
            <NumberFieldBase.Root name="quantity" defaultValue={0} min={0} step={0.1}>
              <NumberFieldBase.Input data-testid="input" />
            </NumberFieldBase.Root>
            <button type="submit">submit</button>
          </form>,
        );

        const input = screen.getByTestId('input');

        await act(async () => {
          input.focus();
        });

        fireEvent.change(input, { target: { value: '0.11' } });
        fireEvent.click(screen.getByText('submit'));

        expect(handleSubmit.callCount).to.equal(0);

        fireEvent.change(input, { target: { value: '0.1' } });
        fireEvent.click(screen.getByText('submit'));

        expect(handleSubmit.callCount).to.equal(1);
        expect(new FormData(handleSubmit.firstCall.args[0].target).get('quantity')).to.equal('0.1');
      },
    );

    it('prevents Form/Field submission when the value does not match the step', async () => {
      const handleSubmit = spy();
      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="quantity">
            <NumberFieldBase.Root defaultValue={0} min={0} step={0.1}>
              <NumberFieldBase.Input data-testid="input" />
            </NumberFieldBase.Root>
            <Field.Error match="stepMismatch" data-testid="error">
              step mismatch
            </Field.Error>
          </Field.Root>
          <button type="submit">submit</button>
        </Form>,
      );

      const input = screen.getByTestId('input');

      await act(async () => {
        input.focus();
      });

      expect(screen.queryByTestId('error')).to.equal(null);

      fireEvent.change(input, { target: { value: '0.11' } });
      fireEvent.click(screen.getByText('submit'));

      expect(handleSubmit.callCount).to.equal(0);
      expect(screen.getByTestId('error')).to.have.text('step mismatch');

      fireEvent.change(input, { target: { value: '0.1' } });
      fireEvent.click(screen.getByText('submit'));

      expect(handleSubmit.callCount).to.equal(1);
      expect(handleSubmit.firstCall.args[0].quantity).to.equal(0.1);
    });

    it('disables the input when disabled=true', async () => {
      await render(
        <Field.Root disabled>
          <NumberFieldBase.Root>
            <NumberFieldBase.Input />
          </NumberFieldBase.Root>
        </Field.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('textbox');

      expect(input).to.have.attribute('disabled', '');
    });

    it('does not disable the input when disabled=false', async () => {
      await render(
        <Field.Root disabled={false}>
          <NumberFieldBase.Root>
            <NumberFieldBase.Input />
          </NumberFieldBase.Root>
        </Field.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('textbox');

      expect(input).not.to.have.attribute('disabled');
    });

    it('is validated with latest value when validationMode=onBlur', async () => {
      const validate = spy(() => 'error');

      await render(
        <Form>
          <Field.Root validationMode="onBlur" validate={validate} name="quantity">
            <NumberFieldBase.Root defaultValue={undefined}>
              <NumberFieldBase.Input />
            </NumberFieldBase.Root>
          </Field.Root>
        </Form>,
      );

      const input = screen.getByRole('textbox');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '1' } });
      fireEvent.blur(input);

      expect(validate.callCount).to.equal(1);
      expect(validate.firstCall.args).to.deep.equal([1, { quantity: 1 }]);
    });

    it('Field.Label', async () => {
      await render(
        <Field.Root>
          <NumberFieldBase.Root>
            <NumberFieldBase.Input />
          </NumberFieldBase.Root>
          <Field.Label data-testid="label" />
        </Field.Root>,
      );

      expect(screen.getByTestId('label')).to.have.attribute('for', screen.getByRole('textbox').id);
    });

    it('Field.Description', async () => {
      await render(
        <Field.Root>
          <NumberFieldBase.Root>
            <NumberFieldBase.Input />
          </NumberFieldBase.Root>
          <Field.Description data-testid="description" />
        </Field.Root>,
      );

      expect(screen.getByRole('textbox')).to.have.attribute(
        'aria-describedby',
        screen.getByTestId('description').id,
      );
    });
  });

  describe('prop: inputMode', () => {
    it('should set the inputMode to numeric', async () => {
      await render(<NumberField />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.attribute('inputmode', 'numeric');
    });
  });

  describe('integration: exotic inputs and IME', () => {
    it('parses Persian digits and separators via change events', async () => {
      const onValueChange = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(null);
        return (
          <NumberField
            value={value}
            onValueChange={(v) => {
              onValueChange(v);
              setValue(v);
            }}
          />
        );
      }
      await render(<App />);

      const input = screen.getByRole('textbox');
      // ۱۲٫۳۴ => 12.34
      fireEvent.change(input, { target: { value: '۱۲٫۳۴' } });

      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).to.equal(12.34);
    });

    it('parses Persian digits with Arabic group/decimal separators', async () => {
      const onValueChange = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(null);
        return (
          <NumberField
            value={value}
            onValueChange={(v) => {
              onValueChange(v);
              setValue(v);
            }}
          />
        );
      }
      await render(<App />);

      const input = screen.getByRole('textbox');
      // ۱۲٬۳۴۵٫۶۷ => 12345.67
      fireEvent.change(input, { target: { value: '۱۲٬۳۴۵٫۶۷' } });

      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).to.equal(12345.67);
    });

    it('parses fullwidth digits and punctuation', async () => {
      const onValueChange = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(null);
        return (
          <NumberField
            value={value}
            onValueChange={(v) => {
              onValueChange(v);
              setValue(v);
            }}
          />
        );
      }

      await render(<App />);

      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '１，２３４．５６' } });

      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).to.equal(1234.56);
    });

    it('parses percent and permille signs in exotic forms when formatted as percent', async () => {
      const onValueChange = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(null);
        return (
          <NumberField
            value={value}
            format={{ style: 'percent' }}
            onValueChange={(v) => {
              onValueChange(v);
              setValue(v);
            }}
          />
        );
      }

      await render(<App />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '١٢٪' } });

      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).to.equal(0.12);

      // reset by typing again
      fireEvent.change(input, { target: { value: '12؉' } });
      expect(onValueChange.callCount).to.equal(2);
      expect(onValueChange.secondCall.args[0]).to.equal(0.012);
    });

    it('ignores percent and permille symbols when not formatted as percent', async () => {
      const onValueChange = spy();
      await render(<NumberField onValueChange={onValueChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '12' } });
      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).to.equal(12);

      fireEvent.change(input, { target: { value: '12%' } });
      fireEvent.change(input, { target: { value: '12‰' } });

      expect(onValueChange.callCount).to.equal(1);
      expect(input).to.have.value('12');
    });

    it('parses trailing unicode minus', async () => {
      const onValueChange = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(null);
        return (
          <NumberField
            value={value}
            onValueChange={(v) => {
              onValueChange(v);
              setValue(v);
            }}
          />
        );
      }

      await render(<App />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '1234−' } });

      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).to.equal(-1234);
    });

    it('treats parentheses negatives as invalid input', async () => {
      const onValueChange = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(null);
        return (
          <NumberField
            value={value}
            onValueChange={(v) => {
              onValueChange(v);
              setValue(v);
            }}
          />
        );
      }

      await render(<App />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '(1,234.5)' } });

      expect(onValueChange.callCount).to.equal(0);
      expect(input).to.have.value('');
    });

    it('collapses extra dots from mixed-locale inputs', async () => {
      const onValueChange = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(null);
        return (
          <NumberField
            value={value}
            onValueChange={(v) => {
              onValueChange(v);
              setValue(v);
            }}
          />
        );
      }

      await render(<App />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '1.234.567.89' } });

      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).to.equal(1234567.89);
    });

    it('allows composition key events (IME) without preventing default', async () => {
      await render(<NumberField />);

      const input = screen.getByRole('textbox');

      await act(async () => input.focus());

      const preventDefaultSpy = spy();

      // 229 indicates a composition key event
      fireEvent.keyDown(input, { which: 229, preventDefault: preventDefaultSpy });
      expect(preventDefaultSpy).to.have.property('callCount', 0);
    });
  });

  describe.skipIf(isJSDOM)('pasting', () => {
    it('should allow pasting a valid number', async () => {
      await render(<NumberField />);
      const input = screen.getByRole('textbox');

      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', '123');

      fireEvent.paste(input, { clipboardData: dataTransfer });
      fireEvent.change(input, { target: { value: '123' } });
      expect(input).to.have.value('123');
    });

    it('should not allow pasting an invalid number', async () => {
      await render(<NumberField />);
      const input = screen.getByRole('textbox');

      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', 'abc');

      fireEvent.paste(input, { clipboardData: dataTransfer });
      fireEvent.change(input, { target: { value: 'abc' } });
      expect(input).to.have.value('');
      fireEvent.blur(input);
      expect(input).to.have.value('');
    });
  });

  it('should allow navigation keys and not prevent their default behavior', async () => {
    await render(<NumberField />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: '123' } });

    const navigateKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
    navigateKeys.forEach((key) => {
      const preventDefaultSpy = spy();
      fireEvent.keyDown(input, { key, preventDefault: preventDefaultSpy });
      expect(preventDefaultSpy).to.have.property('callCount', 0);
    });
  });

  describe('prop: locale', () => {
    it('should set the locale of the input', async () => {
      await render(<NumberField defaultValue={1000.5} locale="de-DE" />);
      const input = screen.getByRole('textbox');

      // In German locale, numbers use dot as thousands separator and comma as decimal separator
      const expectedValue = new Intl.NumberFormat('de-DE').format(1000.5);
      expect(input).to.have.value(expectedValue);
    });

    it('should use the default locale if no locale is provided', async () => {
      await render(<NumberField defaultValue={1000.5} />);
      const input = screen.getByRole('textbox');
      const expectedValue = new Intl.NumberFormat().format(1000.5);
      expect(input).to.have.value(expectedValue);
    });

    it('should handle locales using space as the thousands separator', async () => {
      await render(<NumberField defaultValue={12345.5} locale="pl" />);

      const input = screen.getByRole('textbox');
      const expectedValue = new Intl.NumberFormat('pl').format(12345.5);
      expect(input).to.have.value(expectedValue);

      const incrementButton = screen.getByLabelText('Increase');
      fireEvent.click(incrementButton);

      const newExpectedValue = new Intl.NumberFormat('pl').format(12346.5);
      expect(input).to.have.value(newExpectedValue);
    });
  });
});
