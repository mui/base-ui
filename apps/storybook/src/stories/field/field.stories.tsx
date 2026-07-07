import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { Fieldset } from '@base-ui/react/fieldset';
import { Input } from '@base-ui/react/input';
import { Checkbox } from '@base-ui/react/checkbox';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Select } from '@base-ui/react/select';
import styles from './field.module.css';

/**
 * Stories follow research/c-components/field (Tier 1): the docs hero, the forms-handbook
 * labeling and grouping patterns, the validation-mode matrix (onSubmit default per #3013),
 * custom/cross-field/async validate, a control-swap set (Input/Select/Checkbox/textarea),
 * the state-attribute machine, server errors, and the RHF-style controlled adapter (#2950).
 */
const meta = {
  title: 'Form inputs/Field',
  component: Field.Root,
  subcomponents: {
    'Field.Label': Field.Label,
    'Field.Control': Field.Control,
    'Field.Description': Field.Description,
    'Field.Error': Field.Error,
    'Field.Item': Field.Item,
    'Field.Validity': Field.Validity,
  },
  tags: ['ai-generated', 'needs-work'],
} satisfies Meta<typeof Field.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Anatomy & labeling                                                  */
/* ------------------------------------------------------------------ */

/** The docs hero demo: label, control, error, and description — all id/aria wiring is automatic. */
export const Hero: Story = {
  render: () => (
    <Field.Root className={styles.Field}>
      <Field.Label className={styles.Label}>Name</Field.Label>
      <Field.Control required placeholder="Required" className={styles.Input} />

      <Field.Error className={styles.Error} match="valueMissing">
        Please enter your name
      </Field.Error>

      <Field.Description className={styles.Description}>Visible on your profile</Field.Description>
    </Field.Root>
  ),
};

/** All render-bearing parts in one field, plus the `Field.Validity` render prop. The play function asserts the a11y wiring: label association, `aria-describedby` joining Description (always) and Error (only while rendered), and the tri-state `aria-invalid`. */
export const AnatomyAllParts: Story = {
  render: () => (
    <Field.Root name="username" validationMode="onChange" className={styles.Field}>
      <Field.Label className={styles.Label}>Username</Field.Label>
      <Field.Control required placeholder="e.g. ada" className={styles.Input} />
      <Field.Description className={styles.Description}>
        Visible on your profile.
      </Field.Description>
      <Field.Error className={styles.Error} match="valueMissing">
        Please enter a username.
      </Field.Error>
      <Field.Validity>
        {(state) => (
          <output className={styles.Output}>
            validity.valid: {String(state.validity.valid)}
          </output>
        )}
      </Field.Validity>
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    // Label → control: htmlFor/id are generated and linked automatically.
    const input = canvas.getByLabelText('Username');
    const description = canvas.getByText('Visible on your profile.');

    await waitFor(() =>
      expect(input.getAttribute('aria-describedby')).toContain(description.id),
    );
    // Pristine field: `valid` is null (tri-state), so no aria-invalid yet.
    await expect(input).not.toHaveAttribute('aria-invalid');

    // Dirty the field, then empty it: valueMissing now marks it invalid (onChange mode).
    await userEvent.type(input, 'a');
    await userEvent.clear(input);

    const error = await canvas.findByText('Please enter a username.');
    await waitFor(() => expect(input.getAttribute('aria-describedby')).toContain(error.id));
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));
  },
};

/** The forms-handbook labeling strategies side by side: an explicit `Field.Label`, an implicit label enclosing a Checkbox, and the `aria-label` fallback when no visible label exists. */
export const HandbookLabeling: Story = {
  render: () => (
    <div className={styles.Row}>
      <Field.Root className={styles.Field}>
        <Field.Label className={styles.Label}>Full name</Field.Label>
        <Field.Control placeholder="Ada Lovelace" className={styles.Input} />
      </Field.Root>

      <Field.Root className={styles.Field}>
        <Field.Label className={styles.CheckboxLabel}>
          <Checkbox.Root className={styles.Checkbox}>
            <Checkbox.Indicator className={styles.CheckboxIndicator}>
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          Enable notifications
        </Field.Label>
      </Field.Root>

      <Field.Root className={styles.Field}>
        <Field.Control aria-label="Search" type="search" placeholder="Search…" className={styles.Input} />
      </Field.Root>
    </div>
  ),
  play: async ({ canvas }) => {
    // Explicit label: htmlFor points at the generated control id.
    const nameInput = canvas.getByLabelText('Full name');
    await expect(canvas.getByText('Full name')).toHaveAttribute('for', nameInput.id);

    // Implicit label: enclosing the checkbox names it without htmlFor plumbing.
    await expect(
      canvas.getByRole('checkbox', { name: 'Enable notifications' }),
    ).toBeVisible();

    // Fallback: aria-label directly on the control.
    await expect(canvas.getByRole('searchbox', { name: 'Search' })).toBeVisible();
  },
};

/** Group anatomy from the forms handbook (#2810): `Fieldset.Legend` labels the group, and each option gets its own `Field.Item` with a per-option label and description. */
export const GroupWithFieldItem: Story = {
  render: () => (
    <Field.Root name="storage" className={styles.Field}>
      <Fieldset.Root className={styles.Fieldset} render={<RadioGroup defaultValue="ssd" />}>
        <Fieldset.Legend className={styles.Legend}>Storage type</Fieldset.Legend>
        <Field.Item className={styles.FieldItem}>
          <Radio.Root value="ssd" className={styles.Radio}>
            <Radio.Indicator className={styles.RadioIndicator} />
          </Radio.Root>
          <Field.Label className={styles.ItemLabel}>SSD</Field.Label>
          <Field.Description className={styles.ItemDescription}>
            Faster reads and writes.
          </Field.Description>
        </Field.Item>
        <Field.Item className={styles.FieldItem}>
          <Radio.Root value="hdd" className={styles.Radio}>
            <Radio.Indicator className={styles.RadioIndicator} />
          </Radio.Root>
          <Field.Label className={styles.ItemLabel}>HDD</Field.Label>
          <Field.Description className={styles.ItemDescription}>
            Higher capacity at lower cost.
          </Field.Description>
        </Field.Item>
        <Field.Item className={styles.FieldItem}>
          <Radio.Root value="network" className={styles.Radio}>
            <Radio.Indicator className={styles.RadioIndicator} />
          </Radio.Root>
          <Field.Label className={styles.ItemLabel}>Network volume</Field.Label>
          <Field.Description className={styles.ItemDescription}>
            Attached over the internal network.
          </Field.Description>
        </Field.Item>
      </Fieldset.Root>
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    // The legend names the group; each item label names its radio.
    await expect(canvas.getByRole('radiogroup', { name: 'Storage type' })).toBeVisible();

    const hdd = canvas.getByRole('radio', { name: 'HDD' });
    const hddDescription = canvas.getByText('Higher capacity at lower cost.');
    await waitFor(() =>
      expect(hdd.getAttribute('aria-describedby')).toContain(hddDescription.id),
    );

    await userEvent.click(hdd);
    await expect(hdd).toHaveAttribute('aria-checked', 'true');
  },
};

/* ------------------------------------------------------------------ */
/* Validation modes                                                    */
/* ------------------------------------------------------------------ */

function OnSubmitModeExample() {
  const [status, setStatus] = React.useState<string | null>(null);
  return (
    <Form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        setStatus('Saved');
      }}
    >
      <Field.Root name="fullName" className={styles.Field}>
        <Field.Label className={styles.Label}>Full name</Field.Label>
        <Field.Control required placeholder="Required" className={styles.Input} />
        <Field.Error className={styles.Error} match="valueMissing">
          Please enter your full name.
        </Field.Error>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Submit
      </button>
      {status ? <output className={styles.Output}>{status}</output> : null}
    </Form>
  );
}

/** The default mode (`onSubmit`, #3013): nothing is flagged while the user types, clears, or blurs — errors only appear on the first submit attempt, after which the field re-validates live. Requires a surrounding `Form` (or an explicit mode) — a standalone field never submits, so `validate` never runs. */
export const ValidationModeOnSubmit: Story = {
  render: () => <OnSubmitModeExample />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Full name');

    // Touch, dirty, empty, and blur the field: still no error before submit.
    await userEvent.type(input, 'x');
    await userEvent.clear(input);
    await userEvent.tab();
    await expect(canvas.queryByText('Please enter your full name.')).not.toBeInTheDocument();

    // First submit attempt commits validation and focuses the invalid field.
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await canvas.findByText('Please enter your full name.');
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));

    // After a submit attempt the field re-validates on every change.
    await userEvent.type(input, 'Ada Lovelace');
    await waitFor(() =>
      expect(canvas.queryByText('Please enter your full name.')).not.toBeInTheDocument(),
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByText('Saved')).toBeVisible();
  },
};

/** `validationMode="onBlur"`: typing an invalid value shows nothing until focus leaves the control — the middle ground between submit-gated and live validation. Works standalone, without a `Form`. */
export const ValidationModeOnBlur: Story = {
  render: () => (
    <Field.Root validationMode="onBlur" className={styles.Field}>
      <Field.Label className={styles.Label}>Work email</Field.Label>
      <Field.Control type="email" placeholder="you@company.com" className={styles.Input} />
      <Field.Error className={styles.Error} match="typeMismatch">
        Enter a valid email address.
      </Field.Error>
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Work email');

    await userEvent.type(input, 'not-an-email');
    // No error while typing.
    await expect(canvas.queryByText('Enter a valid email address.')).not.toBeInTheDocument();

    // Blur commits validation.
    await userEvent.tab();
    await expect(await canvas.findByText('Enter a valid email address.')).toBeVisible();

    // Fix the value; the next blur clears the error.
    await userEvent.clear(input);
    await userEvent.type(input, 'ada@company.com');
    await userEvent.tab();
    await waitFor(() =>
      expect(canvas.queryByText('Enter a valid email address.')).not.toBeInTheDocument(),
    );
  },
};

/** `validationMode="onChange"`: every keystroke validates against native constraints (`minLength` here) — errors appear and disappear mid-typing. Reserve it for instant-feedback inputs; the maintainers argue submit-gated validation is the less noisy default (#2142). */
export const ValidationModeOnChange: Story = {
  render: () => (
    <Field.Root validationMode="onChange" className={styles.Field}>
      <Field.Label className={styles.Label}>Passphrase</Field.Label>
      <Field.Control
        type="password"
        required
        minLength={6}
        placeholder="At least 6 characters"
        className={styles.Input}
      />
      <Field.Error className={styles.Error} match="tooShort">
        Use at least 6 characters.
      </Field.Error>
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Passphrase');

    await userEvent.type(input, 'abc');
    await expect(await canvas.findByText('Use at least 6 characters.')).toBeVisible();

    await userEvent.type(input, 'def');
    await waitFor(() =>
      expect(canvas.queryByText('Use at least 6 characters.')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(input).toHaveAttribute('data-valid'));
  },
};

/* ------------------------------------------------------------------ */
/* Custom validation                                                   */
/* ------------------------------------------------------------------ */

/** A custom `validate` function: return the error message (or an array of messages) to fail, `null` to pass. A children-less `Field.Error` renders the returned message automatically. Custom validation only runs after native constraints pass (#1926). */
export const CustomValidateFunction: Story = {
  render: () => (
    <Field.Root
      validationMode="onChange"
      validate={(value) => (value === 'base-ui' ? null : 'Type "base-ui" to continue.')}
      className={styles.Field}
    >
      <Field.Label className={styles.Label}>Magic word</Field.Label>
      <Field.Control placeholder="base-ui" className={styles.Input} />
      <Field.Error className={styles.Error} />
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Magic word');

    await userEvent.type(input, 'base');
    await expect(await canvas.findByText('Type "base-ui" to continue.')).toBeVisible();

    await userEvent.type(input, '-ui');
    await waitFor(() =>
      expect(canvas.queryByText('Type "base-ui" to continue.')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(input).toHaveAttribute('data-valid'));
  },
};

function CrossFieldValidationExample() {
  const [status, setStatus] = React.useState<string | null>(null);
  return (
    <Form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        setStatus('Account created');
      }}
    >
      <Field.Root name="password" className={styles.Field}>
        <Field.Label className={styles.Label}>Password</Field.Label>
        <Field.Control type="password" required className={styles.Input} />
      </Field.Root>
      <Field.Root
        name="confirmPassword"
        validate={(value, formValues) =>
          value !== formValues.password ? 'Passwords do not match.' : null
        }
        className={styles.Field}
      >
        <Field.Label className={styles.Label}>Confirm password</Field.Label>
        <Field.Control type="password" required className={styles.Input} />
        <Field.Error className={styles.Error} />
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Create account
      </button>
      {status ? <output className={styles.Output}>{status}</output> : null}
    </Form>
  );
}

/** `validate` receives all named form values as its second argument (#1941), enabling cross-field rules like confirm-password. An invalid field blocks `Form` submission and receives focus. */
export const CrossFieldValidation: Story = {
  render: () => <CrossFieldValidationExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Password'), 'hunter2');
    const confirm = canvas.getByLabelText('Confirm password');
    await userEvent.type(confirm, 'hunter');

    await userEvent.click(canvas.getByRole('button', { name: 'Create account' }));
    await expect(await canvas.findByText('Passwords do not match.')).toBeVisible();
    await expect(canvas.queryByText('Account created')).not.toBeInTheDocument();

    await userEvent.clear(confirm);
    await userEvent.type(confirm, 'hunter2');
    await userEvent.click(canvas.getByRole('button', { name: 'Create account' }));
    await expect(await canvas.findByText('Account created')).toBeVisible();
    await expect(canvas.queryByText('Passwords do not match.')).not.toBeInTheDocument();
  },
};

const takenUsernames = ['admin', 'root', 'sirius'];

function AsyncValidationExample() {
  const [checks, setChecks] = React.useState(0);
  return (
    <Field.Root
      name="username"
      validationMode="onChange"
      validationDebounceTime={300}
      validate={async (value) => {
        setChecks((count) => count + 1);
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
        return takenUsernames.includes(String(value)) ? 'That username is taken.' : null;
      }}
      className={styles.Field}
    >
      <Field.Label className={styles.Label}>Username</Field.Label>
      <Field.Control placeholder="Try “admin”" className={styles.Input} />
      <Field.Error className={styles.Error} />
      <Field.Description className={styles.Description}>
        Availability is checked 300ms after you stop typing.
      </Field.Description>
      <output className={styles.Output}>validate calls: {checks}</output>
    </Field.Root>
  );
}

/** Async `validate` with `validationDebounceTime`: a burst of keystrokes coalesces into a single (fake) availability check, and stale in-flight results are discarded. Note: async validation cannot block form submission — gate on the server for that. */
export const AsyncValidationDebounced: Story = {
  render: () => <AsyncValidationExample />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Username');

    await userEvent.type(input, 'admin');
    await expect(
      await canvas.findByText('That username is taken.', undefined, { timeout: 3000 }),
    ).toBeVisible();
    // Five keystrokes, one debounced validation.
    await expect(canvas.getByText('validate calls: 1')).toBeVisible();

    await userEvent.type(input, '2');
    await waitFor(
      () => expect(canvas.queryByText('That username is taken.')).not.toBeInTheDocument(),
      { timeout: 3000 },
    );
  },
};

/* ------------------------------------------------------------------ */
/* Wrapping controls                                                   */
/* ------------------------------------------------------------------ */

/** `Input` extends `Field.Control`, so it participates in labeling and validation with zero wiring — clicking the label focuses it, and the description joins its `aria-describedby`. */
export const WrapsInput: Story = {
  render: () => (
    <Field.Root className={styles.Field}>
      <Field.Label className={styles.Label}>API key</Field.Label>
      <Input placeholder="sk-…" className={styles.Input} />
      <Field.Description className={styles.Description}>
        Find it in the dashboard.
      </Field.Description>
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('API key');
    const description = canvas.getByText('Find it in the dashboard.');

    await userEvent.click(canvas.getByText('API key'));
    await expect(input).toHaveFocus();
    await waitFor(() =>
      expect(input.getAttribute('aria-describedby')).toContain(description.id),
    );
  },
};

const tierItems = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

function WrapsSelectExample() {
  const [status, setStatus] = React.useState<string | null>(null);
  return (
    <Form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        setStatus('Saved');
      }}
    >
      <Field.Root name="tier" className={styles.Field}>
        <Field.Label className={styles.Label} nativeLabel={false} render={<div />}>
          Plan tier
        </Field.Label>
        <Select.Root items={tierItems} required>
          <Select.Trigger className={styles.Select}>
            <Select.Value className={styles.SelectValue} placeholder="Select tier" />
            <Select.Icon className={styles.SelectIcon}>
              <CaretUpDownIcon />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner className={styles.Positioner} sideOffset={4}>
              <Select.Popup className={styles.Popup}>
                <Select.List className={styles.List}>
                  {tierItems.map(({ value, label }) => (
                    <Select.Item key={value} value={value} className={styles.SelectItem}>
                      <Select.ItemIndicator className={styles.SelectItemIndicator}>
                        <CheckIcon />
                      </Select.ItemIndicator>
                      <Select.ItemText className={styles.SelectItemText}>{label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <Field.Error className={styles.Error} match="valueMissing">
          Please choose a tier.
        </Field.Error>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Save plan
      </button>
      {status ? <output className={styles.Output}>{status}</output> : null}
    </Form>
  );
}

/** Any Base UI control registers with the surrounding field automatically — here a Select. Because the trigger is a `<button>`, the label uses `nativeLabel={false}` with a `<div>` so clicks and `:hover` don't leak into it (#3723); the field links it via `aria-labelledby` instead. */
export const WrapsSelect: Story = {
  render: () => <WrapsSelectExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    // The non-native label still names the trigger, via aria-labelledby.
    const trigger = canvas.getByRole('combobox', { name: 'Plan tier' });

    await userEvent.click(canvas.getByRole('button', { name: 'Save plan' }));
    await expect(await canvas.findByText('Please choose a tier.')).toBeVisible();
    await waitFor(() => expect(trigger).toHaveAttribute('data-invalid'));

    await userEvent.click(trigger);
    await userEvent.click(await body.findByRole('option', { name: 'Pro' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Save plan' }));

    await expect(await canvas.findByText('Saved')).toBeVisible();
    await expect(canvas.queryByText('Please choose a tier.')).not.toBeInTheDocument();
  },
};

function WrapsCheckboxExample() {
  const [status, setStatus] = React.useState<string | null>(null);
  return (
    <Form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        setStatus('Saved');
      }}
    >
      <Field.Root name="terms" className={styles.Field}>
        <Field.Label className={styles.CheckboxLabel}>
          <Checkbox.Root required className={styles.Checkbox}>
            <Checkbox.Indicator className={styles.CheckboxIndicator}>
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          Accept the terms
        </Field.Label>
        <Field.Error className={styles.Error} match="valueMissing">
          You must accept the terms to continue.
        </Field.Error>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Sign up
      </button>
      {status ? <output className={styles.Output}>{status}</output> : null}
    </Form>
  );
}

/** A checkbox wrapped implicitly by `Field.Label` (#2036): the enclosing label names it, `required` feeds `valueMissing`, and checking it clears the error after a failed submit. */
export const WrapsCheckbox: Story = {
  render: () => <WrapsCheckboxExample />,
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Accept the terms' });

    await userEvent.click(canvas.getByRole('button', { name: 'Sign up' }));
    await expect(
      await canvas.findByText('You must accept the terms to continue.'),
    ).toBeVisible();

    await userEvent.click(checkbox);
    await userEvent.click(canvas.getByRole('button', { name: 'Sign up' }));
    await expect(await canvas.findByText('Saved')).toBeVisible();
    await expect(
      canvas.queryByText('You must accept the terms to continue.'),
    ).not.toBeInTheDocument();
  },
};

/** The sanctioned custom-control path (#1996): `Field.Control render={<textarea />}`. The state machine still runs — typing sets `data-dirty`/`data-filled`, blurring sets `data-touched`. With the default `onSubmit` mode and no surrounding `Form`, validity stays pristine: neither `data-valid` nor `data-invalid` is present. */
export const WrapsCustomTextarea: Story = {
  render: () => (
    <Field.Root className={styles.Field}>
      <Field.Label className={styles.Label}>Feedback</Field.Label>
      <Field.Control
        required
        render={<textarea rows={3} />}
        placeholder="What should we improve?"
        className={styles.Textarea}
      />
      <Field.Description className={styles.Description}>
        Plain text, at most 500 characters.
      </Field.Description>
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const textarea = canvas.getByLabelText('Feedback');

    await userEvent.type(textarea, 'More stories, please.');
    await waitFor(() => expect(textarea).toHaveAttribute('data-dirty'));
    await expect(textarea).toHaveAttribute('data-filled');

    await userEvent.tab();
    await waitFor(() => expect(textarea).toHaveAttribute('data-touched'));

    // No Form and default validationMode="onSubmit": validation never ran.
    await expect(textarea).not.toHaveAttribute('data-valid');
    await expect(textarea).not.toHaveAttribute('data-invalid');
    await expect(textarea).not.toHaveAttribute('aria-invalid');
  },
};

/* ------------------------------------------------------------------ */
/* State attributes, server errors, external libraries, animation      */
/* ------------------------------------------------------------------ */

/** Every interaction state is a data-attribute on every part — the badges below light up purely via CSS on `Field.Root`'s attributes. The play function drives the whole machine: pristine (neither `data-valid` nor `data-invalid`), focused, dirty + filled, invalid after clearing, valid after retyping, touched after blur. */
export const StateAttributesStyling: Story = {
  render: () => (
    <Field.Root name="displayName" required validationMode="onChange" className={styles.StateField}>
      <Field.Label className={styles.Label}>Display name</Field.Label>
      <Field.Control placeholder="Type, clear, and blur…" className={styles.StateInput} />
      <div className={styles.BadgeRow} aria-hidden="true">
        <span className={`${styles.Badge} ${styles.BadgeFocused}`}>data-focused</span>
        <span className={`${styles.Badge} ${styles.BadgeDirty}`}>data-dirty</span>
        <span className={`${styles.Badge} ${styles.BadgeFilled}`}>data-filled</span>
        <span className={`${styles.Badge} ${styles.BadgeTouched}`}>data-touched</span>
        <span className={`${styles.Badge} ${styles.BadgeValid}`}>data-valid</span>
        <span className={`${styles.Badge} ${styles.BadgeInvalid}`}>data-invalid</span>
      </div>
      <Field.Description className={styles.Description}>
        The badges reflect the data-attributes on the field root.
      </Field.Description>
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Display name');

    // Tri-state validity: a pristine field is neither valid nor invalid.
    await expect(input).not.toHaveAttribute('data-valid');
    await expect(input).not.toHaveAttribute('data-invalid');

    await userEvent.click(input);
    await waitFor(() => expect(input).toHaveAttribute('data-focused'));

    await userEvent.type(input, 'Ada');
    await waitFor(() => expect(input).toHaveAttribute('data-dirty'));
    await expect(input).toHaveAttribute('data-filled');

    // Emptying a previously-dirtied required field marks it invalid (onChange mode).
    await userEvent.clear(input);
    await waitFor(() => expect(input).toHaveAttribute('data-invalid'));
    await expect(input).not.toHaveAttribute('data-filled');

    await userEvent.type(input, 'Grace');
    await waitFor(() => expect(input).toHaveAttribute('data-valid'));

    await userEvent.tab();
    await waitFor(() => expect(input).toHaveAttribute('data-touched'));
    await expect(input).not.toHaveAttribute('data-focused');
  },
};

function ServerErrorExample() {
  const [errors, setErrors] = React.useState<Form.Props['errors']>({});
  return (
    <Form
      className={styles.Form}
      errors={errors}
      onSubmit={(event) => {
        event.preventDefault();
        // Pretend the server rejected the address.
        setErrors({ email: 'This email is already registered.' });
      }}
    >
      <Field.Root name="email" className={styles.Field}>
        <Field.Label className={styles.Label}>Email</Field.Label>
        <Field.Control
          type="email"
          required
          defaultValue="taken@example.com"
          className={styles.Input}
        />
        <Field.Error className={styles.Error} />
        <Field.Description className={styles.Description}>
          Submitting simulates a server rejection keyed by the field's `name`.
        </Field.Description>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Sign up
      </button>
    </Form>
  );
}

/** Server-side errors: pass `errors` (keyed by field `name`) to `Form` after submission — the matching field turns invalid and a children-less `Field.Error` renders the message. The entry auto-clears as soon as the user edits the field (#3136 removed `onClearErrors`). */
export const ServerErrorDisplay: Story = {
  render: () => <ServerErrorExample />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Email');

    await userEvent.click(canvas.getByRole('button', { name: 'Sign up' }));
    await expect(await canvas.findByText('This email is already registered.')).toBeVisible();
    await waitFor(() => expect(input).toHaveAttribute('data-invalid'));

    // Editing the field optimistically clears the server error.
    await userEvent.type(input, '2');
    await waitFor(() =>
      expect(canvas.queryByText('This email is already registered.')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(input).not.toHaveAttribute('data-invalid'));
  },
};

function ControlledFieldExample() {
  const [invalid, setInvalid] = React.useState(false);
  const [disabled, setDisabled] = React.useState(false);
  return (
    <div className={styles.Stack}>
      <Field.Root
        name="handle"
        invalid={invalid}
        touched
        dirty
        disabled={disabled}
        className={styles.Field}
      >
        <Field.Label className={styles.Label}>Handle</Field.Label>
        <Field.Control defaultValue="@ada" className={styles.Input} />
        <Field.Error className={styles.Error} match={invalid}>
          That handle is unavailable.
        </Field.Error>
      </Field.Root>
      <div className={styles.Row}>
        <button type="button" className={styles.Button} onClick={() => setInvalid((v) => !v)}>
          Toggle invalid
        </button>
        <button type="button" className={styles.Button} onClick={() => setDisabled((v) => !v)}>
          Toggle disabled
        </button>
      </div>
    </div>
  );
}

/** The form-library adapter surface (#2950): `invalid`, `touched`, and `dirty` become controlled props (mirroring React Hook Form / TanStack Form state), and `Field.Error match={boolean}` delegates error visibility. App-set invalidity survives `disabled` — only `aria-invalid` is withheld from disabled controls (#5116). */
export const ExternalLibraryControlled: Story = {
  render: () => <ControlledFieldExample />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Handle');

    // Controlled touched/dirty are on from the first render.
    await expect(input).toHaveAttribute('data-touched');
    await expect(input).toHaveAttribute('data-dirty');
    await expect(canvas.queryByText('That handle is unavailable.')).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Toggle invalid' }));
    await expect(await canvas.findByText('That handle is unavailable.')).toBeVisible();
    await waitFor(() => expect(input).toHaveAttribute('data-invalid'));
    await expect(input).toHaveAttribute('aria-invalid', 'true');

    // Disabling suppresses computed validity and aria-invalid, but keeps app-set data-invalid.
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle disabled' }));
    await waitFor(() => expect(input).toHaveAttribute('data-disabled'));
    await expect(input).toHaveAttribute('data-invalid');
    await expect(input).not.toHaveAttribute('aria-invalid');
  },
};

/** `Field.Error` supports the standard transition-status attributes (`data-starting-style`/`data-ending-style`, #3939) and keeps the last rendered message during the exit transition, so text doesn't vanish mid-fade. */
export const ErrorTransitionAnimation: Story = {
  render: () => (
    <Field.Root required validationMode="onChange" className={styles.Field}>
      <Field.Label className={styles.Label}>Project name</Field.Label>
      <Field.Control placeholder="Required" className={styles.Input} />
      <Field.Error className={styles.ErrorAnimated} match="valueMissing">
        This field is required.
      </Field.Error>
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Project name');

    await userEvent.type(input, 'x');
    await userEvent.clear(input);
    await expect(await canvas.findByText('This field is required.')).toBeVisible();

    await userEvent.type(input, 'Base UI');
    await waitFor(() =>
      expect(canvas.queryByText('This field is required.')).not.toBeInTheDocument(),
    );
  },
};

/* ------------------------------------------------------------------ */
/* Icons (inline SVGs, matching the docs demos)                        */
/* ------------------------------------------------------------------ */

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

function CaretUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
    </svg>
  );
}
