import { expect } from 'vitest';
import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { OTPField } from '@base-ui/react/otp-field';
import { Field } from '@base-ui/react/field';
import { createRenderer, describeConformance } from '#test-utils';

describe('<OTPField.Input />', () => {
  const { render } = createRenderer();
  const OTP_LENGTH = 6;

  describeConformance(<OTPField.Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    render(node) {
      return render(<OTPField.Root length={1}>{node}</OTPField.Root>);
    },
  }));

  function OTPFieldTest(props: Partial<OTPField.Root.Props> = {}) {
    return (
      <OTPField.Root length={OTP_LENGTH} {...props}>
        <OTPField.Group>
          {Array.from({ length: OTP_LENGTH }, (_, index) => (
            <OTPField.Input key={index} />
          ))}
        </OTPField.Group>
      </OTPField.Root>
    );
  }

  it('renders one textbox per slot', async () => {
    await render(<OTPFieldTest />);

    expect(screen.getAllByRole('textbox')).toHaveLength(6);
  });

  it('moves focus with arrow keys', async () => {
    await render(<OTPFieldTest defaultValue="12" />);

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[1].focus();
    });

    fireEvent.keyDown(inputs[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(inputs[2]);

    fireEvent.keyDown(inputs[2], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(inputs[1]);
  });

  it('redirects focus to the first empty slot when a later empty slot is focused', async () => {
    await render(<OTPFieldTest defaultValue="12" />);

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[4].focus();
    });

    expect(document.activeElement).toBe(inputs[2]);
  });

  it('moves focus to the next slot after typing', async () => {
    await render(<OTPFieldTest />);

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[0].focus();
    });

    fireEvent.change(inputs[0], { target: { value: '1' } });

    expect(document.activeElement).toBe(inputs[1]);
  });

  it('selects the slot value on mousedown', async () => {
    await render(<OTPFieldTest defaultValue="1" />);

    const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');

    fireEvent.mouseDown(firstInput);

    expect(firstInput.selectionStart).toBe(0);
    expect(firstInput.selectionEnd).toBe(1);
  });

  it('moves focus to the next slot when typing the same digit into a filled slot', async () => {
    const user = userEvent.setup();

    await render(<OTPFieldTest defaultValue="12" />);

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[1].focus();
    });

    await user.keyboard('2');

    expect(document.activeElement).toBe(inputs[2]);
  });

  it('allows tabbing out of the field from the active slot', async () => {
    const user = userEvent.setup();

    await render(
      <React.Fragment>
        <OTPFieldTest />
        <button type="button">Next</button>
      </React.Fragment>,
    );

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[0].focus();
    });

    fireEvent.change(inputs[0], { target: { value: '1' } });
    expect(document.activeElement).toBe(inputs[1]);

    await user.tab();

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Next' }));
  });

  it('deletes the current digit and moves focus to the previous slot on backspace', async () => {
    await render(<OTPFieldTest defaultValue="1234" />);

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[1].focus();
    });

    fireEvent.keyDown(inputs[1], { key: 'Backspace' });

    expect(inputs.map((input) => input.value)).toEqual(['1', '3', '4', '', '', '']);
    expect(document.activeElement).toBe(inputs[0]);
  });

  it('selects the previous slot value after backspacing into the first slot', async () => {
    await render(<OTPFieldTest defaultValue="12" />);

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[1].focus();
    });

    fireEvent.keyDown(inputs[1], { key: 'Backspace' });

    expect(document.activeElement).toBe(inputs[0]);
    expect(inputs[0].selectionStart).toBe(0);
    expect(inputs[0].selectionEnd).toBe(1);
  });

  it('applies the Field label to every slot', async () => {
    await render(
      <Field.Root>
        <Field.Label data-testid="label">Verification code</Field.Label>
        <Field.Description data-testid="description">Enter the code.</Field.Description>
        <OTPFieldTest />
      </Field.Root>,
    );

    const label = screen.getByTestId('label');
    const description = screen.getByTestId('description');
    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    inputs.forEach((input) => {
      expect(input).toHaveAttribute('aria-labelledby', label.id);
      expect(input).not.toHaveAttribute('aria-describedby', description.id);
    });
  });

  it('applies a native label to every slot', async () => {
    await render(
      <React.Fragment>
        <label htmlFor="verification-code">Verification code</label>
        <OTPField.Root id="verification-code" length={OTP_LENGTH}>
          <OTPField.Group>
            <OTPField.Input />
            <OTPField.Input />
            <OTPField.Input />
            <OTPField.Input />
            <OTPField.Input />
            <OTPField.Input />
          </OTPField.Group>
        </OTPField.Root>
      </React.Fragment>,
    );

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    inputs.forEach((input) => {
      expect(input).toHaveAccessibleName('Verification code');
    });
  });
});
