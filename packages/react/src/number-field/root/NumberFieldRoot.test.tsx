import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, screen, fireEvent } from '@mui/internal-test-utils';
import { NumberField as NumberFieldBase } from '@base-ui-components/react/number-field';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

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

  describe('prop: invalid', () => {
    it('sets `aria-invalid` on the input', async () => {
      await render(<NumberField invalid />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.attribute('aria-invalid', 'true');
    });
  });

  describe('prop: name', () => {
    it('should set the name attribute on the input', async () => {
      await render(<NumberField name="test" />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.attribute('name', 'test');
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
      expect(input).to.have.value('20');
    });

    it('should decrement the value by the default `largeStep` prop of 10 while holding the shift key', async () => {
      await render(<NumberField defaultValue={6} />);
      const input = screen.getByRole('textbox');
      fireEvent.pointerDown(screen.getByLabelText('Decrease'), { shiftKey: true });
      expect(input).to.have.value('0');
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
  });

  describe('form handling', () => {
    it('should include the input value in the form submission', async ({ skip }) => {
      if (isJSDOM) {
        // FormData is not available in JSDOM
        skip();
      }

      let stringifiedFormData = '';

      await render(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            stringifiedFormData = new URLSearchParams(formData as any).toString();
          }}
        >
          <NumberField name="test-number-field" />
          <button type="submit" data-testid="submit">
            Submit
          </button>
        </form>,
      );

      const numberField = screen.getByRole('textbox');
      const submitButton = screen.getByTestId('submit');

      await act(async () => submitButton.click());

      expect(stringifiedFormData).to.equal('test-number-field=');

      fireEvent.change(numberField, { target: { value: '5' } });

      await act(async () => submitButton.click());

      expect(stringifiedFormData).to.equal('test-number-field=5');
    });
  });

  describe('inputMode', () => {
    it('should set the inputMode to numeric', async () => {
      await render(<NumberField />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.attribute('inputmode', 'numeric');
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
