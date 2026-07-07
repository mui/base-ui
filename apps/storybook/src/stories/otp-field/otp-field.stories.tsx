import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { OTPField } from '@base-ui/react/otp-field';
import styles from './otp-field.module.css';

const OTP_LENGTH = 6;

/**
 * Floor coverage following research/c-components/otp-field (Tier 2 lean-plus): the docs
 * hero slot composition, typing a code to completion, pasting a full code, the Backspace
 * cascading-delete state machine, and form submission. Imports the stable `OTPField` export
 * (post-#5029 — never `OTPFieldPreview`, which was renamed as a breaking change).
 */
const meta = {
  title: 'Form inputs/OTP Field',
  component: OTPField.Root,
  subcomponents: {
    'OTPField.Input': OTPField.Input,
    'OTPField.Separator': OTPField.Separator,
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof OTPField.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

function HeroExample() {
  const id = React.useId();
  const descriptionId = `${id}-description`;
  return (
    <div className={styles.Field}>
      <label htmlFor={id} className={styles.Label}>
        Verification code
      </label>
      <OTPField.Root
        id={id}
        length={OTP_LENGTH}
        aria-describedby={descriptionId}
        className={styles.Root}
      >
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={styles.Input}
            aria-label={index === 0 ? undefined : `Character ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField.Root>
      <p id={descriptionId} className={styles.Description}>
        Enter the 6-character code we sent to your device.
      </p>
    </div>
  );
}

/** The docs hero demo: 6 numeric slots, a native label on slot 0, `aria-label` on the rest, and a description. Recreates `demos/hero`. */
export const Hero: Story = {
  // `length` is a required OTPField.Root prop with no default; `render` fully overrides
  // rendering below, but StoryObj's generated args type still needs a value to satisfy it.
  args: { length: OTP_LENGTH },
  render: () => <HeroExample />,
  play: async ({ canvas }) => {
    const inputs = canvas.getAllByRole('textbox');
    await expect(inputs).toHaveLength(OTP_LENGTH);
    // Only slot 0 inherits the field's shared accessible name (via aria-labelledby to the
    // native <label>) — the rest need their own aria-label (verified against source, see
    // the MDX a11y section). The hidden validation input shares the same labelledby id, so
    // getByLabelText can match more than one node — assert the attribute directly instead.
    const labelId = canvas.getByText('Verification code').id;
    await expect(inputs[0]).toHaveAttribute('aria-labelledby', labelId);
    await expect(inputs[1]).toHaveAttribute('aria-label', 'Character 2 of 6');
  },
};

function TypeToCompleteExample() {
  const [complete, setComplete] = React.useState<string | null>(null);
  return (
    <div className={styles.Field}>
      <label className={styles.Label}>Verification code</label>
      <OTPField.Root
        length={OTP_LENGTH}
        className={styles.Root}
        onValueComplete={(value) => setComplete(value)}
      >
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={styles.Input}
            aria-label={index === 0 ? undefined : `Character ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField.Root>
      <output className={styles.Output}>
        {complete !== null ? `complete=${complete}` : 'incomplete'}
      </output>
    </div>
  );
}

/** Typing digits fills each slot and auto-advances focus; `onValueComplete` fires once the last slot is filled. */
export const TypeToComplete: Story = {
  args: { length: OTP_LENGTH },
  render: () => <TypeToCompleteExample />,
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');

    inputs[0].focus();
    for (const digit of '12345') {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.keyboard(digit);
    }
    await waitFor(() => expect(inputs[4]).toHaveValue('5'));
    await expect(canvas.getByText('incomplete')).toBeVisible();

    await userEvent.keyboard('6');
    await expect(await canvas.findByText('complete=123456')).toBeVisible();
  },
};

function PasteCompletesCodeExample() {
  const [complete, setComplete] = React.useState<string | null>(null);
  return (
    <div className={styles.Field}>
      <label className={styles.Label}>Verification code</label>
      <OTPField.Root
        length={OTP_LENGTH}
        className={styles.Root}
        onValueComplete={(value) => setComplete(value)}
      >
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={styles.Input}
            aria-label={index === 0 ? undefined : `Character ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField.Root>
      <output className={styles.Output}>
        {complete !== null ? `complete=${complete}` : 'incomplete'}
      </output>
    </div>
  );
}

/** Pasting a full code splits it across every slot in one operation, following the project's own tested paste technique (a manually-defined `clipboardData` on a real `paste` event). */
export const PasteCompletesCode: Story = {
  args: { length: OTP_LENGTH },
  render: () => <PasteCompletesCodeExample />,
  play: async ({ canvas }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { getData: () => '123456' },
    });
    fireEvent(inputs[0], pasteEvent);

    await waitFor(() => expect(inputs.map((input) => input.value).join('')).toBe('123456'));
    await expect(await canvas.findByText('complete=123456')).toBeVisible();
  },
};

/**
 * Both slots hold one contiguous string value under the hood, so removing a character
 * always splices the underlying string — later characters shift left to fill the gap.
 * Backspace on an *empty*, non-first slot cascades backward to the nearest filled slot
 * (a deliberately forgiving UX, not a bug); Delete never moves focus, but a middle-slot
 * Delete still visibly shifts every later slot's character down by one, per the project's
 * own tested contract (`OTPFieldInput.test.tsx`, `defaultValue="1234"` + Delete on slot 1
 * → `['1','3','4','','','']`, focus unchanged).
 */
export const BackspaceNavigation: Story = {
  args: { length: OTP_LENGTH },
  render: () => (
    <div className={styles.Field}>
      <div className={styles.Field}>
        <span className={styles.Label}>Backspace cascades to the nearest filled slot</span>
        <OTPField.Root
          defaultValue="123"
          length={OTP_LENGTH}
          aria-label="Backspace demo code"
          className={styles.Root}
        >
          {Array.from({ length: OTP_LENGTH }, (_, index) => (
            <OTPField.Input
              key={index}
              className={styles.Input}
              aria-label={index === 0 ? undefined : `Character ${index + 1} of ${OTP_LENGTH}`}
            />
          ))}
        </OTPField.Root>
      </div>
      <div className={styles.Field}>
        <span className={styles.Label}>Delete shifts later characters, focus stays put</span>
        <OTPField.Root
          defaultValue="1234"
          length={OTP_LENGTH}
          aria-label="Delete demo code"
          className={styles.Root}
        >
          {Array.from({ length: OTP_LENGTH }, (_, index) => (
            <OTPField.Input
              key={index}
              className={styles.Input}
              aria-label={index === 0 ? undefined : `Character ${index + 1} of ${OTP_LENGTH}`}
            />
          ))}
        </OTPField.Root>
      </div>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const [cascadeGroup, deleteGroup] = canvas.getAllByRole('group');
    const cascadeInputs = within(cascadeGroup).getAllByRole<HTMLInputElement>('textbox');
    const deleteInputs = within(deleteGroup).getAllByRole<HTMLInputElement>('textbox');

    // Slots 0-2 are filled ("1","2","3"); slot 3 is the first empty slot.
    cascadeInputs[3].focus();
    await userEvent.keyboard('{Backspace}');
    // Cascades backward: clears the nearest filled slot (2) and moves focus there.
    await waitFor(() => expect(cascadeInputs[2]).toHaveValue(''));
    await waitFor(() => expect(document.activeElement).toBe(cascadeInputs[2]));

    // Delete on slot 1 ("2") removes that character from the underlying string; slots 2-3
    // ("3","4") shift left to fill the gap. Focus stays on slot 1.
    deleteInputs[1].focus();
    await userEvent.keyboard('{Delete}');
    await waitFor(() =>
      expect(deleteInputs.map((input) => input.value)).toEqual(['1', '3', '4', '', '', '']),
    );
    await expect(document.activeElement).toBe(deleteInputs[1]);
  },
};

function FormExample() {
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(String(data.get('otp')));
      }}
    >
      <div className={styles.Field}>
        <label className={styles.Label}>Verification code</label>
        <OTPField.Root name="otp" length={OTP_LENGTH} className={styles.Root}>
          {Array.from({ length: OTP_LENGTH }, (_, index) => (
            <OTPField.Input
              key={index}
              className={styles.Input}
              aria-label={index === 0 ? undefined : `Character ${index + 1} of ${OTP_LENGTH}`}
            />
          ))}
        </OTPField.Root>
      </div>
      <button type="submit" className={styles.Button}>
        Verify
      </button>
      {submitted !== null ? <output className={styles.Output}>otp={submitted}</output> : null}
    </form>
  );
}

/** The full code is carried by a hidden validation input (`name`/`form`/`pattern`), so a standard form submit reads the joined value under one key — the same hidden-input-carries-native-semantics pattern used by Number Field and Slider. */
export const FormSubmit: Story = {
  args: { length: OTP_LENGTH },
  render: () => <FormExample />,
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');
    inputs[0].focus();
    for (const digit of '123456') {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.keyboard(digit);
    }
    await waitFor(() => expect(inputs[5]).toHaveValue('6'));

    await userEvent.click(canvas.getByRole('button', { name: 'Verify' }));
    await expect(await canvas.findByText('otp=123456')).toBeVisible();
  },
};
