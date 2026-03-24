import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { OTPField as OTPFieldBase } from '@base-ui/react/otp-field';
import { Field } from '@base-ui/react/field';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { REASONS } from '../../utils/reasons';

describe('<OTPField />', () => {
  const { render, renderToString } = createRenderer();
  const OTP_LENGTH = 6;

  describeConformance(<OTPFieldBase.Root length={1} />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  type OTPFieldProps = Omit<OTPFieldBase.Root.Props, 'children' | 'length'>;

  function OTPField(props: OTPFieldProps = {}) {
    return (
      <OTPFieldBase.Root length={OTP_LENGTH} {...props}>
        <OTPFieldBase.Group>
          {Array.from({ length: OTP_LENGTH }, (_, index) => (
            <OTPFieldBase.Input key={index} />
          ))}
        </OTPFieldBase.Group>
      </OTPFieldBase.Root>
    );
  }

  function getValues() {
    return screen
      .getAllByRole<HTMLInputElement>('textbox')
      .map((input) => input.value)
      .join('');
  }

  describe('value handling', () => {
    it('splits the default value across inputs', async () => {
      await render(<OTPField defaultValue="12a34b56" />);

      const inputs = screen.getAllByRole<HTMLInputElement>('textbox');
      expect(inputs.map((input) => input.value)).toEqual(['1', '2', '3', '4', '5', '6']);
    });

    it('clamps an overlong default value to the rendered slot count', async () => {
      await render(<OTPField defaultValue="12a34b56c7" name="otp" />);

      const inputs = screen.getAllByRole<HTMLInputElement>('textbox');
      const hiddenInput = document.querySelector<HTMLInputElement>('input[name="otp"]');

      expect(inputs.map((input) => input.value)).toEqual(['1', '2', '3', '4', '5', '6']);
      expect(inputs[0]).toHaveAttribute('maxlength', '6');
      expect(hiddenInput).toHaveValue('123456');
    });

    it('assigns slot indexes from render order when omitted', async () => {
      await render(
        <OTPFieldBase.Root defaultValue="123" length={3}>
          <OTPFieldBase.Group>
            <OTPFieldBase.Input />
            <OTPFieldBase.Input />
            <OTPFieldBase.Input />
          </OTPFieldBase.Group>
        </OTPFieldBase.Root>,
      );

      const inputs = screen.getAllByRole<HTMLInputElement>('textbox');
      expect(inputs.map((input) => input.value)).toEqual(['1', '2', '3']);
    });

    it('updates the rendered value in controlled mode', async () => {
      const { rerender } = await render(<OTPField value="123456" />);

      expect(getValues()).toBe('123456');

      await rerender(<OTPField value="654321" />);

      expect(getValues()).toBe('654321');
    });

    describe('prop: validationType', () => {
      describe('built-in filtering', () => {
        it('supports alphabetic values when set to `alpha`', async () => {
          await render(<OTPField defaultValue="1a2b3Cd4" validationType="alpha" />);

          const inputs = screen.getAllByRole<HTMLInputElement>('textbox');
          expect(inputs.map((input) => input.value)).toEqual(['a', 'b', 'C', 'd', '', '']);
        });

        it('supports alphanumeric values when set to `alphanumeric`', async () => {
          await render(<OTPField validationType="alphanumeric" />);

          const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');
          fireEvent.change(firstInput, { target: { value: 'A1-B2c3' } });

          expect(getValues()).toBe('A1B2c3');
        });

        it('applies single-character validation to each visible slot', async () => {
          await render(<OTPField validationType="alphanumeric" />);

          const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');

          expect(firstInput).toHaveAttribute('pattern', '[a-zA-Z0-9]{1}');
        });
      });

      describe('hidden validation input', () => {
        it('renders the hidden validation input with an alphanumeric pattern during SSR', () => {
          renderToString(
            <OTPFieldBase.Root
              name="otp"
              required
              length={OTP_LENGTH}
              validationType="alphanumeric"
            >
              <OTPFieldBase.Group>
                <OTPFieldBase.Input />
                <OTPFieldBase.Input />
                <OTPFieldBase.Input />
                <OTPFieldBase.Input />
                <OTPFieldBase.Input />
                <OTPFieldBase.Input />
              </OTPFieldBase.Group>
            </OTPFieldBase.Root>,
          );

          const hiddenInput = document.querySelector<HTMLInputElement>('input[name="otp"]');

          expect(hiddenInput).not.toBeNull();
          expect(hiddenInput).toHaveAttribute('pattern', '[a-zA-Z0-9]{6}');
        });

        it('omits the hidden validation pattern when set to `none`', async () => {
          await render(<OTPField name="otp" validationType="none" />);

          const hiddenInput = document.querySelector<HTMLInputElement>('input[name="otp"]');

          expect(hiddenInput).not.toBeNull();
          expect(hiddenInput).not.toHaveAttribute('pattern');
        });

        it('allows a custom inputMode when validation is set to `none`', async () => {
          await render(<OTPField name="otp" validationType="none" inputMode="numeric" />);

          const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');
          const hiddenInput = document.querySelector<HTMLInputElement>('input[name="otp"]');

          expect(firstInput).toHaveAttribute('inputmode', 'numeric');
          expect(hiddenInput).toHaveAttribute('inputmode', 'numeric');
        });

        it('allows overriding the built-in inputMode when needed', async () => {
          await render(<OTPField name="otp" validationType="numeric" inputMode="text" />);

          const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');
          const hiddenInput = document.querySelector<HTMLInputElement>('input[name="otp"]');

          expect(firstInput).toHaveAttribute('inputmode', 'text');
          expect(hiddenInput).toHaveAttribute('inputmode', 'text');
        });
      });
    });

    describe('prop: sanitizeValue', () => {
      it('supports custom sanitization when `validationType` is `none`', async () => {
        await render(
          <OTPField
            validationType="none"
            sanitizeValue={(value) => value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}
          />,
        );

        const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');
        fireEvent.change(firstInput, { target: { value: 'ab-12 cd' } });

        expect(getValues()).toBe('AB12CD');
      });
    });

    describe('prop: onValueChange', () => {
      it('fires `input-change` when typing', async () => {
        const onValueChange = vi.fn();

        await render(<OTPField onValueChange={onValueChange} />);

        const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');
        fireEvent.change(firstInput, { target: { value: '1' } });

        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange.mock.calls[0]?.[0]).toBe('1');
        expect(onValueChange.mock.calls[0]?.[1].reason).toBe(REASONS.inputChange);
      });

      it('fires `input-clear` when clearing a slot by input', async () => {
        const onValueChange = vi.fn();

        await render(<OTPField defaultValue="1" onValueChange={onValueChange} />);

        const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');
        fireEvent.change(firstInput, { target: { value: '' } });

        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange.mock.calls[0]?.[0]).toBe('');
        expect(onValueChange.mock.calls[0]?.[1].reason).toBe(REASONS.inputClear);
      });
    });

    describe('prop: onValueInvalid', () => {
      it('fires when typing is sanitized before the OTP value updates', async () => {
        const onValueInvalid = vi.fn();

        await render(<OTPField onValueInvalid={onValueInvalid} />);

        const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');
        fireEvent.change(firstInput, { target: { value: '1a' } });

        expect(getValues()).toBe('1');
        expect(onValueInvalid).toHaveBeenCalledTimes(1);
        expect(onValueInvalid.mock.calls[0]?.[0]).toBe('1a');
        expect(onValueInvalid.mock.calls[0]?.[1].reason).toBe(REASONS.inputChange);
      });

      it('fires when custom sanitization removes characters', async () => {
        const onValueInvalid = vi.fn();

        await render(
          <OTPField
            validationType="none"
            inputMode="numeric"
            sanitizeValue={(value) => value.replace(/[^0-3]/g, '')}
            onValueInvalid={onValueInvalid}
          />,
        );

        const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');
        fireEvent.change(firstInput, { target: { value: '1209' } });

        expect(getValues()).toBe('120');
        expect(onValueInvalid).toHaveBeenCalledTimes(1);
        expect(onValueInvalid.mock.calls[0]?.[0]).toBe('1209');
        expect(onValueInvalid.mock.calls[0]?.[1].reason).toBe(REASONS.inputChange);
      });
    });

    describe('prop: onValueComplete', () => {
      it('fires when typing completes the OTP', async () => {
        const onValueComplete = vi.fn();

        await render(<OTPField onValueComplete={onValueComplete} />);

        const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');
        fireEvent.change(firstInput, { target: { value: '123456' } });

        expect(onValueComplete).toHaveBeenCalledTimes(1);
        expect(onValueComplete.mock.calls[0]?.[0]).toBe('123456');
        expect(onValueComplete.mock.calls[0]?.[1].reason).toBe(REASONS.inputChange);
      });

      it('does not fire before the OTP becomes complete', async () => {
        const onValueComplete = vi.fn();

        await render(<OTPField onValueComplete={onValueComplete} />);

        const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');
        fireEvent.change(firstInput, { target: { value: '12345' } });

        expect(onValueComplete).not.toHaveBeenCalled();
      });

      it('does not fire later for a stale controlled completion attempt', async () => {
        vi.useFakeTimers();

        try {
          const onValueComplete = vi.fn();

          function Test() {
            const [value, setValue] = React.useState('');

            return (
              <React.Fragment>
                <OTPField
                  value={value}
                  onValueChange={() => {}}
                  onValueComplete={onValueComplete}
                />
                <button type="button" onClick={() => setValue('654321')}>
                  Apply value
                </button>
              </React.Fragment>
            );
          }

          await render(<Test />);

          const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');
          fireEvent.change(firstInput, { target: { value: '123456' } });

          await act(async () => {
            vi.runAllTimers();
          });

          fireEvent.click(screen.getByRole('button', { name: 'Apply value' }));

          expect(onValueComplete).not.toHaveBeenCalled();
        } finally {
          vi.useRealTimers();
        }
      });
    });
  });

  describe('Field', () => {
    it('associates Field.Label with the first slot', async () => {
      await render(
        <Field.Root>
          <Field.Label>Verification code</Field.Label>
          <OTPField />
        </Field.Root>,
      );

      const label = screen.getByText('Verification code');
      const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');

      expect(label).toHaveAttribute('for', firstInput.id);
    });

    it('applies the Field description to the group', async () => {
      await render(
        <Field.Root>
          <Field.Label data-testid="label">Verification code</Field.Label>
          <Field.Description data-testid="description">Enter the code.</Field.Description>
          <OTPField />
        </Field.Root>,
      );

      const label = screen.getByTestId('label');
      const description = screen.getByTestId('description');
      const group = screen.getByRole('group', { name: 'Verification code' });

      expect(group).toHaveAttribute('aria-labelledby', label.id);
      expect(group).toHaveAttribute('aria-describedby', description.id);
    });
  });

  describe('accessibility', () => {
    it('forwards root `aria-describedby` to the group', async () => {
      await render(<OTPField aria-describedby="description-id" />);

      expect(screen.getByRole('group')).toHaveAttribute('aria-describedby', 'description-id');
    });

    it('forwards root `aria-labelledby` to the group and slots', async () => {
      await render(
        <React.Fragment>
          <span id="label-id">Verification code</span>
          <OTPField aria-labelledby="label-id" />
        </React.Fragment>,
      );

      const group = screen.getByRole('group', { name: 'Verification code' });
      const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

      expect(group).toHaveAttribute('aria-labelledby', 'label-id');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('aria-labelledby', 'label-id');
      });
    });

    describe('prop: autoComplete', () => {
      it('applies the default autocomplete to the first slot only', async () => {
        await render(<OTPField />);

        const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

        expect(inputs[0]).toHaveAttribute('autocomplete', 'one-time-code');
        expect(inputs[1]).toHaveAttribute('autocomplete', 'off');
      });

      it('allows overriding the autocomplete attribute', async () => {
        await render(<OTPField autoComplete="off" name="otp" />);

        const inputs = screen.getAllByRole<HTMLInputElement>('textbox');
        const hiddenInput = document.querySelector<HTMLInputElement>('input[name="otp"]');

        expect(inputs[0]).toHaveAttribute('autocomplete', 'off');
        expect(hiddenInput).toHaveAttribute('autocomplete', 'off');
      });
    });
  });

  describe('prop: disabled', () => {
    it('disables every slot and prevents value changes', async () => {
      const onValueChange = vi.fn();

      await render(<OTPField disabled onValueChange={onValueChange} />);

      const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');

      expect(firstInput).toBeDisabled();

      fireEvent.change(firstInput, { target: { value: '1' } });

      expect(getValues()).toBe('');
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('prop: readOnly', () => {
    it('marks every slot as readonly and prevents value changes', async () => {
      const onValueChange = vi.fn();

      await render(<OTPField readOnly onValueChange={onValueChange} />);

      const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');

      expect(firstInput).toHaveAttribute('readonly');

      fireEvent.change(firstInput, { target: { value: '1' } });

      expect(getValues()).toBe('');
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('prop: mask', () => {
    describe('native masking', () => {
      it('renders password slot inputs when enabled', async () => {
        await render(<OTPField defaultValue="123" mask />);

        expect(document.querySelectorAll('input[type="password"]')).toHaveLength(6);
      });
    });

    describe('slot overrides', () => {
      it('allows overriding the input type on individual slots', async () => {
        await render(
          <OTPFieldBase.Root length={1} mask>
            <OTPFieldBase.Group>
              <OTPFieldBase.Input type="tel" />
            </OTPFieldBase.Group>
          </OTPFieldBase.Root>,
        );

        expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel');
      });
    });
  });

  describe('interactions', () => {
    describe('typing', () => {
      it('fills consecutive slots when typing multiple characters into the first input', async () => {
        await render(<OTPField />);

        const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');

        fireEvent.change(firstInput, { target: { value: '123456' } });

        expect(getValues()).toBe('123456');
      });
    });

    describe('pasting', () => {
      it('fills consecutive slots when pasting a code', async () => {
        const onValueChange = vi.fn();

        await render(<OTPField onValueChange={onValueChange} />);

        const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');

        if (isJSDOM) {
          fireEvent.paste(firstInput, {
            clipboardData: {
              getData: () => '123456',
            },
          });
        } else {
          const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
          Object.defineProperty(pasteEvent, 'clipboardData', {
            value: {
              getData: () => '123456',
            },
          });

          fireEvent(firstInput, pasteEvent);
        }

        expect(getValues()).toBe('123456');
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange.mock.calls[0]?.[0]).toBe('123456');
        expect(onValueChange.mock.calls[0]?.[1].reason).toBe(REASONS.inputPaste);
      });
    });

    describe('keyboard', () => {
      it('removes a character and moves focus to the previous slot with backspace', async () => {
        const onValueChange = vi.fn();

        await render(<OTPField defaultValue="1234" onValueChange={onValueChange} />);

        const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

        await act(async () => {
          inputs[1].focus();
        });

        fireEvent.keyDown(inputs[1], { key: 'Backspace' });

        expect(getValues()).toBe('134');
        expect(document.activeElement).toBe(inputs[0]);
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange.mock.calls[0]?.[0]).toBe('134');
        expect(onValueChange.mock.calls[0]?.[1].reason).toBe(REASONS.keyboard);
      });

      it('does not move focus later for a stale controlled change', async () => {
        vi.useFakeTimers();

        try {
          function Test() {
            const [value, setValue] = React.useState('');

            return (
              <React.Fragment>
                <OTPField value={value} onValueChange={() => {}} />
                <button type="button" onClick={() => setValue('9')}>
                  Apply value
                </button>
              </React.Fragment>
            );
          }

          await render(<Test />);

          const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

          await act(async () => {
            inputs[0].focus();
          });

          fireEvent.change(inputs[0], { target: { value: '1' } });

          await act(async () => {
            vi.runAllTimers();
          });

          fireEvent.click(screen.getByRole('button', { name: 'Apply value' }));

          expect(document.activeElement).toBe(inputs[0]);
        } finally {
          vi.useRealTimers();
        }
      });
    });
  });

  describe('Form', () => {
    it('blocks form submission while the code is incomplete', async () => {
      await render(
        <form data-testid="form">
          <OTPField defaultValue="123" name="otp" required />
          <button type="submit">Submit</button>
        </form>,
      );

      expect(screen.getByTestId<HTMLFormElement>('form').checkValidity()).toBe(false);
    });

    it('allows form submission when the code is complete', async () => {
      await render(
        <form data-testid="form">
          <OTPField defaultValue="123456" name="otp" required />
          <button type="submit">Submit</button>
        </form>,
      );

      expect(screen.getByTestId<HTMLFormElement>('form').checkValidity()).toBe(true);
    });

    it('renders the hidden validation input with the provided name', async () => {
      await render(<OTPField name="otp" />);

      expect(document.querySelector('input[name="otp"]')).not.toBeNull();
    });

    it('handles password manager autofill through the hidden input', async () => {
      const onValueChange = vi.fn();
      const onValueComplete = vi.fn();

      await render(
        <OTPField name="otp" onValueChange={onValueChange} onValueComplete={onValueComplete} />,
      );

      const hiddenInput = document.querySelector<HTMLInputElement>('input[name="otp"]');

      expect(hiddenInput).not.toBeNull();

      fireEvent.change(hiddenInput!, { target: { value: '12a34b56' } });

      const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

      expect(inputs.map((input) => input.value)).toEqual(['1', '2', '3', '4', '5', '6']);
      expect(onValueChange.mock.calls.length).toBe(1);
      expect(onValueChange.mock.calls[0]?.[0]).toBe('123456');
      expect(onValueChange.mock.calls[0]?.[1].reason).toBe(REASONS.inputChange);
      expect(onValueComplete.mock.calls.length).toBe(1);
      expect(onValueComplete.mock.calls[0]?.[0]).toBe('123456');
      expect(onValueComplete.mock.calls[0]?.[1].reason).toBe(REASONS.inputChange);
    });

    describe('prop: autoSubmit', () => {
      it('does not auto-submit the owning form when the OTP becomes complete by default', async () => {
        const handleSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
        });

        await render(
          <form onSubmit={handleSubmit}>
            <OTPField />
            <button type="submit">Submit</button>
          </form>,
        );

        const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');

        fireEvent.change(firstInput, { target: { value: '123456' } });

        expect(getValues()).toBe('123456');
        expect(handleSubmit).not.toHaveBeenCalled();
      });

      it('submits the completed named OTP value from the owning form when enabled', async () => {
        const handleSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();

          expect(new FormData(event.currentTarget).get('otp')).toBe('123456');
        });

        await render(
          <form onSubmit={handleSubmit}>
            <OTPField name="otp" required autoSubmit />
            <button type="submit">Submit</button>
          </form>,
        );

        const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');

        fireEvent.change(firstInput, { target: { value: '123456' } });

        expect(getValues()).toBe('123456');
        expect(handleSubmit).toHaveBeenCalledTimes(1);
      });

      it('does not submit the owning form before the OTP becomes complete when enabled', async () => {
        const handleSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
        });

        await render(
          <form onSubmit={handleSubmit}>
            <OTPField autoSubmit />
            <button type="submit">Submit</button>
          </form>,
        );

        const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');

        fireEvent.change(firstInput, { target: { value: '12345' } });

        expect(getValues()).toBe('12345');
        expect(handleSubmit).not.toHaveBeenCalled();
      });
    });

    describe('prop: form', () => {
      it('submits an associated external form when used with `autoSubmit`', async () => {
        const handleSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();

          expect(new FormData(event.currentTarget).get('otp')).toBe('123456');
        });

        await render(
          <React.Fragment>
            <form id="verification-form" onSubmit={handleSubmit}>
              <button type="submit">Submit</button>
            </form>
            <OTPField form="verification-form" name="otp" autoSubmit />
          </React.Fragment>,
        );

        const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');

        fireEvent.change(firstInput, { target: { value: '123456' } });

        expect(getValues()).toBe('123456');
        expect(handleSubmit).toHaveBeenCalledTimes(1);
      });
    });

    describe('server-side rendering', () => {
      it('renders a hidden validation input with the provided length', () => {
        renderToString(
          <OTPFieldBase.Root name="otp" required length={OTP_LENGTH}>
            <OTPFieldBase.Group>
              <OTPFieldBase.Input />
              <OTPFieldBase.Input />
              <OTPFieldBase.Input />
              <OTPFieldBase.Input />
              <OTPFieldBase.Input />
              <OTPFieldBase.Input />
            </OTPFieldBase.Group>
          </OTPFieldBase.Root>,
        );

        const hiddenInput = document.querySelector<HTMLInputElement>('input[name="otp"]');

        expect(hiddenInput).not.toBeNull();
        expect(hiddenInput).toHaveAttribute('minlength', '6');
        expect(hiddenInput).toHaveAttribute('maxlength', '6');
        expect(hiddenInput).toHaveAttribute('pattern', '\\d{6}');
      });
    });
  });

  it('updates standalone filled and focused state on the root and group', async () => {
    await render(
      <OTPFieldBase.Root data-testid="root" length={OTP_LENGTH}>
        <OTPFieldBase.Group data-testid="group">
          <OTPFieldBase.Input />
          <OTPFieldBase.Input />
          <OTPFieldBase.Input />
          <OTPFieldBase.Input />
          <OTPFieldBase.Input />
          <OTPFieldBase.Input />
        </OTPFieldBase.Group>
      </OTPFieldBase.Root>,
    );

    const root = screen.getByTestId('root');
    const group = screen.getByTestId('group');
    const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');

    expect(root).not.toHaveAttribute('data-filled');
    expect(group).not.toHaveAttribute('data-focused');

    await act(async () => {
      firstInput.focus();
    });

    expect(root).toHaveAttribute('data-focused', '');
    expect(group).toHaveAttribute('data-focused', '');

    fireEvent.change(firstInput, { target: { value: '1' } });

    expect(root).toHaveAttribute('data-filled', '');
    expect(group).toHaveAttribute('data-filled', '');

    fireEvent.blur(firstInput);

    expect(root).not.toHaveAttribute('data-focused');
    expect(group).not.toHaveAttribute('data-focused');
  });

  it('renders a fallback hidden input id when name is not provided', async () => {
    await render(<OTPField id="verification-code" />);

    expect(document.querySelector('#verification-code-hidden-input')).not.toBeNull();
  });

  it('warns when length does not match the rendered input count', async () => {
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockName('console.warn')
      .mockImplementation(() => {});

    await render(
      <OTPFieldBase.Root length={OTP_LENGTH}>
        <OTPFieldBase.Group>
          <OTPFieldBase.Input />
          <OTPFieldBase.Input />
          <OTPFieldBase.Input />
          <OTPFieldBase.Input />
          <OTPFieldBase.Input />
        </OTPFieldBase.Group>
      </OTPFieldBase.Root>,
    );

    expect(warnSpy.mock.calls.length).toBe(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain(
      'Base UI: <OTPField.Root> `length` must match the number of rendered <OTPField.Input /> parts.',
    );
    expect(warnSpy.mock.calls[0]?.[0]).toContain('Received `length={6}` but rendered 5 inputs.');

    warnSpy.mockRestore();
  });
});
