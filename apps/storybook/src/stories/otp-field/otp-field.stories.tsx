import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { OTPField } from '@base-ui/react/otp-field';
import { Field } from '@base-ui/react/field';
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
  // Mirrors the docs-nav [New] status tag (DoD §20) — the only [New]-tagged component.
  tags: ['new'],
  subcomponents: {
    'OTPField.Input': OTPField.Input,
    'OTPField.Separator': OTPField.Separator,
  },
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

function otpInputs(count: number, total: number = count, offset = 0) {
  return Array.from({ length: count }, (_, index) => (
    <OTPField.Input
      key={index + offset}
      className={styles.Input}
      aria-label={index + offset === 0 ? undefined : `Character ${index + offset + 1} of ${total}`}
    />
  ));
}

/**
 * `mask` renders each slot as `type="password"` instead of `type="text"`, contrasted with an
 * unmasked sibling. Confirmed live in this story's own play function (not just the brief's
 * flagged uncertainty): a `type="password"` input has **no implicit ARIA role at all** —
 * `getByRole('textbox')` cannot find it — so masked slots must be queried by tag, not role. What
 * a real screen reader announces for a masked slot still needs independent verification; this
 * story only confirms the DOM/role-query behavior, not the AT experience.
 */
export const MaskedVariant: Story = {
  args: { length: OTP_LENGTH },
  render: () => (
    <div className={styles.Row}>
      <div className={styles.Field}>
        <span className={styles.Label}>Masked</span>
        <OTPField.Root length={OTP_LENGTH} mask aria-label="Masked code" className={styles.Root}>
          {otpInputs(OTP_LENGTH)}
        </OTPField.Root>
      </div>
      <div className={styles.Field}>
        <span className={styles.Label}>Unmasked</span>
        <OTPField.Root length={OTP_LENGTH} aria-label="Unmasked code" className={styles.Root}>
          {otpInputs(OTP_LENGTH)}
        </OTPField.Root>
      </div>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const [maskedGroup, unmaskedGroup] = canvas.getAllByRole('group');
    // A `type="password"` input has no implicit ARIA role — `getByRole('textbox')` cannot find
    // it at all (verified live here, not merely the brief's flagged uncertainty), so masked
    // slots must be queried directly by tag rather than by role.
    const maskedInputs = maskedGroup.querySelectorAll<HTMLInputElement>('input');
    const unmaskedInputs = within(unmaskedGroup).getAllByRole<HTMLInputElement>('textbox');

    maskedInputs[0].focus();
    await userEvent.keyboard('1');
    await waitFor(() => expect(maskedInputs[0]).toHaveAttribute('type', 'password'));

    unmaskedInputs[0].focus();
    await userEvent.keyboard('1');
    await waitFor(() => expect(unmaskedInputs[0]).toHaveAttribute('type', 'text'));
  },
};

function AutoSubmitExample() {
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
        <OTPField.Root autoSubmit name="otp" length={OTP_LENGTH} className={styles.Root}>
          {otpInputs(OTP_LENGTH)}
        </OTPField.Root>
      </div>
      <label className={styles.CheckboxLabel}>
        <input type="checkbox" required />
        Accept the terms
      </label>
      <button type="submit" className={styles.Button}>
        Verify
      </button>
      {submitted !== null ? <output className={styles.Output}>otp={submitted}</output> : null}
    </form>
  );
}

/**
 * `autoSubmit` calls `form.requestSubmit()` automatically the moment the code completes — no
 * submit button click needed. But `requestSubmit()` is native `<form>` submission, so it still
 * respects *every* field's native validity: an unrelated invalid sibling (here, an unchecked
 * `required` checkbox) blocks it and moves focus there instead, exactly like a manual submit
 * would (brief §8/§9's auto-submit-blocked-by-sibling-invalid-field contract).
 */
export const FormSubmitWithAutoSubmit: Story = {
  args: { length: OTP_LENGTH },
  render: () => <AutoSubmitExample />,
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');
    const checkbox = canvas.getByRole('checkbox', { name: 'Accept the terms' });

    inputs[0].focus();
    for (const digit of '123456') {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.keyboard(digit);
    }
    await waitFor(() => expect(inputs[5]).toHaveValue('6'));

    // Completing the code auto-calls requestSubmit(), but the unchecked required checkbox
    // blocks native submission and receives focus instead.
    await waitFor(() => expect(checkbox).toHaveFocus());
    await expect(canvas.queryByText(/otp=/)).not.toBeInTheDocument();

    await userEvent.click(checkbox);

    // Clear and refill to re-trigger onValueComplete/autoSubmit now that the form is valid.
    // Focus must move back onto a slot first — the checkbox click left focus on the checkbox.
    inputs[0].focus();
    await userEvent.keyboard('{Control>}{Backspace}{/Control}');
    await waitFor(() => expect(inputs[0]).toHaveValue(''));
    for (const digit of '123456') {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.keyboard(digit);
    }
    await expect(await canvas.findByText('otp=123456')).toBeVisible();
  },
};

function InvalidCharacterFeedbackExample() {
  const [message, setMessage] = React.useState('');
  return (
    <div className={styles.Field}>
      <label className={styles.Label}>Verification code (digits only)</label>
      <OTPField.Root
        length={OTP_LENGTH}
        className={styles.Root}
        onValueChange={() => setMessage('')}
        onValueInvalid={(value) => setMessage(`"${value}" contains unsupported characters.`)}
      >
        {otpInputs(OTP_LENGTH)}
      </OTPField.Root>
      <p role="alert" className={styles.Error}>
        {message}
      </p>
    </div>
  );
}

/**
 * The default `validationType="numeric"` rejects non-digit characters outright — the slot stays
 * unchanged — and `onValueInvalid` fires with the raw rejected string, recreating the docs'
 * `useInvalidFeedback` pattern from `demos/custom-sanitize`.
 */
export const InvalidCharacterFeedback: Story = {
  args: { length: OTP_LENGTH },
  render: () => <InvalidCharacterFeedbackExample />,
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');

    inputs[0].focus();
    await userEvent.keyboard('a');
    await expect(inputs[0]).toHaveValue('');
    await expect(await canvas.findByText('"a" contains unsupported characters.')).toBeVisible();

    await userEvent.keyboard('1');
    await waitFor(() => expect(inputs[0]).toHaveValue('1'));
    await waitFor(() =>
      expect(canvas.queryByText('"a" contains unsupported characters.')).not.toBeInTheDocument(),
    );
  },
};

/**
 * `Field` integration: the root registers with the surrounding `Field.Root` the same way Number
 * Field and Slider do (`useRegisterFieldControl`), so `data-valid`/`data-invalid` land on
 * `OTPField.Root` (which renders `role="group"`) and `Field.Error` renders from `validate`.
 */
export const FieldValidation: Story = {
  args: { length: OTP_LENGTH },
  render: () => (
    <Field.Root
      name="otp"
      validationMode="onChange"
      validate={(value) =>
        typeof value === 'string' && value.length === OTP_LENGTH ? null : 'Enter all 6 digits.'
      }
      className={styles.Field}
    >
      <Field.Label className={styles.Label}>Verification code</Field.Label>
      <OTPField.Root length={OTP_LENGTH} className={styles.Root}>
        {otpInputs(OTP_LENGTH)}
      </OTPField.Root>
      <Field.Error className={styles.Error} />
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');
    const group = canvas.getByRole('group');

    inputs[0].focus();
    for (const digit of '123') {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.keyboard(digit);
    }
    await waitFor(() => expect(group).toHaveAttribute('data-invalid'));
    await expect(await canvas.findByText('Enter all 6 digits.')).toBeVisible();

    for (const digit of '456') {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.keyboard(digit);
    }
    await waitFor(() => expect(group).toHaveAttribute('data-valid'));
    await expect(canvas.queryByText('Enter all 6 digits.')).not.toBeInTheDocument();
  },
};

/**
 * `disabled` blocks all interaction (the slot is a real native `disabled` input, unfocusable);
 * `readOnly` preserves ArrowLeft/Right/Home/End/Up/Down navigation (the top-level `onKeyDown`
 * guard only checks `disabled`, not `readOnly`) while blocking Backspace/Delete/typing/paste
 * from changing the value — the same navigation-preserved-but-edits-blocked contract Number
 * Field and Slider use.
 */
export const DisabledAndReadOnly: Story = {
  args: { length: OTP_LENGTH },
  render: () => (
    <div className={styles.Row}>
      <div className={styles.Field}>
        <span className={styles.Label}>Disabled</span>
        <OTPField.Root
          defaultValue="12"
          length={OTP_LENGTH}
          disabled
          aria-label="Disabled code"
          className={styles.Root}
        >
          {otpInputs(OTP_LENGTH)}
        </OTPField.Root>
      </div>
      <div className={styles.Field}>
        <span className={styles.Label}>Read-only</span>
        <OTPField.Root
          defaultValue="12"
          length={OTP_LENGTH}
          readOnly
          aria-label="Read-only code"
          className={styles.Root}
        >
          {otpInputs(OTP_LENGTH)}
        </OTPField.Root>
      </div>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const [disabledGroup, readOnlyGroup] = canvas.getAllByRole('group');
    const disabledInputs = within(disabledGroup).getAllByRole<HTMLInputElement>('textbox');
    const readOnlyInputs = within(readOnlyGroup).getAllByRole<HTMLInputElement>('textbox');

    await expect(disabledInputs[0]).toBeDisabled();

    // readOnly: navigation still works...
    readOnlyInputs[2].focus();
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(document.activeElement).toBe(readOnlyInputs[1]));

    // ...but Backspace/typing don't change the value.
    await userEvent.keyboard('{Backspace}');
    await userEvent.keyboard('9');
    await waitFor(() => expect(readOnlyInputs.map((input) => input.value).join('')).toBe('12'));
  },
};

/**
 * Slots can be nested in arbitrary DOM structure (here, two plain `<div>` groups split by
 * `OTPField.Separator`) — the `CompositeList` tracks logical slot order independently of DOM
 * sibling structure, so typing still auto-advances focus across the group boundary. Recreates
 * `demos/grouped`.
 */
export const GroupedWithSeparator: Story = {
  args: { length: OTP_LENGTH },
  render: () => (
    <div className={styles.Field}>
      <label className={styles.Label}>Verification code</label>
      <OTPField.Root length={OTP_LENGTH} className={styles.Root}>
        <div className={styles.Group}>{otpInputs(3, OTP_LENGTH)}</div>
        <OTPField.Separator className={styles.Separator} />
        <div className={styles.Group}>{otpInputs(3, OTP_LENGTH, 3)}</div>
      </OTPField.Root>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');
    await expect(inputs).toHaveLength(OTP_LENGTH);

    inputs[0].focus();
    await userEvent.keyboard('1');
    // Auto-advances into the second `<div>` group, across the Separator.
    await waitFor(() => expect(document.activeElement).toBe(inputs[1]));
  },
};

/** `validationType="alphanumeric"` accepts both letters and digits, unlike the `"numeric"` default. Recreates `demos/alphanumeric`. */
export const Alphanumeric: Story = {
  args: { length: OTP_LENGTH },
  render: () => (
    <div className={styles.Field}>
      <label className={styles.Label}>Recovery code</label>
      <OTPField.Root length={OTP_LENGTH} validationType="alphanumeric" className={styles.Root}>
        {otpInputs(OTP_LENGTH)}
      </OTPField.Root>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');
    inputs[0].focus();
    for (const char of 'A1B2C3') {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.keyboard(char);
    }
    await waitFor(() => expect(inputs.map((input) => input.value).join('')).toBe('A1B2C3'));
  },
};

/** `length` isn't hardcoded to 6 — any positive integer works, here a 4-character code. `onValueComplete` fires once the shorter code is filled. */
export const CustomLength: Story = {
  args: { length: 4 },
  render: () => {
    function FourDigitExample() {
      const [complete, setComplete] = React.useState<string | null>(null);
      return (
        <div className={styles.Field}>
          <label className={styles.Label}>PIN</label>
          <OTPField.Root length={4} className={styles.Root} onValueComplete={setComplete}>
            {otpInputs(4)}
          </OTPField.Root>
          <output className={styles.Output}>
            {complete !== null ? `complete=${complete}` : 'incomplete'}
          </output>
        </div>
      );
    }
    return <FourDigitExample />;
  },
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole<HTMLInputElement>('textbox');
    await expect(inputs).toHaveLength(4);

    inputs[0].focus();
    for (const digit of '1234') {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.keyboard(digit);
    }
    await expect(await canvas.findByText('complete=1234')).toBeVisible();
  },
};
