import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, screen, fireEvent } from '@mui/internal-test-utils';
import { NumberField as NumberFieldBase } from '@base-ui-components/react/number-field';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
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

  describe('prop: name', () => {
    it('should set the name attribute on the hidden input', async () => {
      const { container } = await render(<NumberField name="test" />);
      const hiddenInput = container.querySelector('input[type=hidden]');
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
            fieldValue = formData.get('test');
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
            fieldValue = formData.get('test');
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
            onClearErrors={setErrors}
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

    it('clears errors on change', async () => {
      function App() {
        const [errors, setErrors] = React.useState<Form.Props['errors']>({
          test: 'test',
        });
        return (
          <Form errors={errors} onClearErrors={setErrors}>
            <Field.Root name="test" data-testid="field">
              <NumberField defaultValue={1} />
              <Field.Error data-testid="error" />
            </Field.Root>
          </Form>
        );
      }

      await render(<App />);

      const input = screen.getByRole('textbox');

      expect(input).to.have.attribute('aria-invalid', 'true');
      expect(screen.queryByTestId('error')).to.have.text('test');

      fireEvent.change(input, { target: { value: '5' } });

      expect(input).not.to.have.attribute('aria-invalid');
      expect(screen.queryByTestId('error')).to.equal(null);
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

    it('prop: validate', async () => {
      await render(
        <Field.Root validate={() => 'error'}>
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

    it('prop: validationMode=onChange', async () => {
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

    it('prop: validationMode=onBlur', async () => {
      await render(
        <Field.Root
          validationMode="onBlur"
          validate={(value) => {
            return value === 1 ? 'error' : null;
          }}
        >
          <NumberFieldBase.Root>
            <NumberFieldBase.Input data-testid="input" />
          </NumberFieldBase.Root>
          <Field.Error data-testid="error" />
        </Field.Root>,
      );

      const input = screen.getByTestId('input');

      expect(input).not.to.have.attribute('aria-invalid');

      fireEvent.change(input, { target: { value: '1' } });
      fireEvent.blur(input);

      expect(input).to.have.attribute('aria-invalid', 'true');
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
        <Field.Root validationMode="onBlur" validate={validate}>
          <NumberFieldBase.Root>
            <NumberFieldBase.Input />
          </NumberFieldBase.Root>
        </Field.Root>,
      );

      const input = screen.getByRole('textbox');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '1' } });
      fireEvent.blur(input);

      expect(validate.callCount).to.equal(1);
      expect(validate.firstCall.args).to.deep.equal([1]);
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
