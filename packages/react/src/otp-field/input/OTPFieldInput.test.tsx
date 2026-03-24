import { expect } from 'vitest';
import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { OTPField } from '@base-ui/react/otp-field';
import { Field } from '@base-ui/react/field';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<OTPField.Input />', () => {
  const { render } = createRenderer();
  const OTP_LENGTH = 6;

  describeConformance(<OTPField.Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    render(node) {
      return render(<OTPField.Root length={1}>{node}</OTPField.Root>);
    },
  }));

  type OTPFieldTestProps = Omit<OTPField.Root.Props, 'children' | 'length'>;

  function OTPFieldTest(props: OTPFieldTestProps = {}) {
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

  it('keeps focus in place when typing is canceled', async () => {
    await render(
      <OTPFieldTest
        onValueChange={(_, eventDetails) => {
          eventDetails.cancel();
        }}
      />,
    );

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[0].focus();
    });

    fireEvent.change(inputs[0], { target: { value: '1' } });

    expect(inputs.map((input) => input.value)).toEqual(['', '', '', '', '', '']);
    expect(document.activeElement).toBe(inputs[0]);
  });

  it('selects the slot value on mousedown', async () => {
    await render(<OTPFieldTest defaultValue="1" />);

    const [firstInput] = screen.getAllByRole<HTMLInputElement>('textbox');

    fireEvent.mouseDown(firstInput);

    expect(firstInput.selectionStart).toBe(0);
    expect(firstInput.selectionEnd).toBe(1);
  });

  it('moves focus to the next slot when typing the same character into a filled slot', async () => {
    const user = userEvent.setup();

    await render(<OTPFieldTest defaultValue="12" />);

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[1].focus();
    });

    await user.keyboard('2');

    expect(document.activeElement).toBe(inputs[2]);
  });

  it('moves focus to the first slot with Home', async () => {
    await render(<OTPFieldTest defaultValue="1234" />);

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[3].focus();
    });

    fireEvent.keyDown(inputs[3], { key: 'Home' });

    expect(document.activeElement).toBe(inputs[0]);
  });

  it('moves focus to the last filled slot with End', async () => {
    await render(<OTPFieldTest defaultValue="1234" />);

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[0].focus();
    });

    fireEvent.keyDown(inputs[0], { key: 'End' });

    expect(document.activeElement).toBe(inputs[3]);
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

  it('deletes the current character and moves focus to the previous slot on backspace', async () => {
    await render(<OTPFieldTest defaultValue="1234" />);

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[1].focus();
    });

    fireEvent.keyDown(inputs[1], { key: 'Backspace' });

    expect(inputs.map((input) => input.value)).toEqual(['1', '3', '4', '', '', '']);
    expect(document.activeElement).toBe(inputs[0]);
  });

  it('keeps focus in place when backspace is canceled', async () => {
    await render(
      <OTPFieldTest
        defaultValue="1234"
        onValueChange={(_, eventDetails) => {
          eventDetails.cancel();
        }}
      />,
    );

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[1].focus();
    });

    fireEvent.keyDown(inputs[1], { key: 'Backspace' });

    expect(inputs.map((input) => input.value)).toEqual(['1', '2', '3', '4', '', '']);
    expect(document.activeElement).toBe(inputs[1]);
  });

  it('deletes the current character with Delete without moving focus', async () => {
    await render(<OTPFieldTest defaultValue="1234" />);

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[1].focus();
    });

    fireEvent.keyDown(inputs[1], { key: 'Delete' });

    expect(inputs.map((input) => input.value)).toEqual(['1', '3', '4', '', '', '']);
    expect(document.activeElement).toBe(inputs[1]);
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

  it('keeps focus in place when paste is canceled', async () => {
    await render(
      <OTPFieldTest
        onValueChange={(_, eventDetails) => {
          eventDetails.cancel();
        }}
      />,
    );

    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');

    await act(async () => {
      inputs[0].focus();
    });

    if (isJSDOM) {
      fireEvent.paste(inputs[0], {
        clipboardData: {
          getData: () => '1234',
        },
      });
    } else {
      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: {
          getData: () => '1234',
        },
      });

      fireEvent(inputs[0], pasteEvent);
    }

    expect(inputs.map((input) => input.value)).toEqual(['', '', '', '', '', '']);
    expect(document.activeElement).toBe(inputs[0]);
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
