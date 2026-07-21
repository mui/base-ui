import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import styles from './checkbox.module.css';

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

function HorizontalRuleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        stroke="currentColor"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Stories follow research/c-components/checkbox (Tier 2): the docs hero (enclosing-label
 * checkbox, Root + Indicator), the Space/click toggle interaction, the tri-state
 * `indeterminate` prop (not overridden by `checked`, #-verified against
 * `CheckboxRoot.test.tsx`), and native form submission with `uncheckedValue` — the #3406
 * "match native off state" contract: an unchecked checkbox submits nothing by default.
 */
const meta = {
  title: 'Form inputs/Checkbox',
  component: Checkbox.Root,
  subcomponents: { 'Checkbox.Indicator': Checkbox.Indicator },
} satisfies Meta<typeof Checkbox.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: an enclosing label, checked by default. */
export const Basic: Story = {
  render: () => (
    <label className={styles.Label}>
      <Checkbox.Root defaultChecked className={styles.Checkbox}>
        <Checkbox.Indicator className={styles.Indicator}>
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Enable notifications
    </label>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'Enable notifications' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  },
};

/** Clicking the label (or the checkbox itself) toggles `aria-checked`. */
export const ToggleWithClick: Story = {
  render: () => (
    <label className={styles.Label}>
      <Checkbox.Root className={styles.Checkbox}>
        <Checkbox.Indicator className={styles.Indicator}>
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Accept terms and conditions
    </label>
  ),
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Accept terms and conditions' });
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(checkbox);
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));

    await userEvent.click(checkbox);
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'false'));
  },
};

/** `indeterminate` sets `aria-checked="mixed"` independently of `checked` — it is not overridden or auto-cleared by clicking. */
export const Indeterminate: Story = {
  render: () => (
    <label className={styles.Label}>
      <Checkbox.Root indeterminate className={styles.Checkbox}>
        <Checkbox.Indicator className={styles.Indicator}>
          <HorizontalRuleIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Select all fruits
    </label>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'Select all fruits' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
  },
};

function FormExample() {
  const [submitted, setSubmitted] = React.useState<string | null | undefined>(undefined);
  return (
    <form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(data.get('newsletter') as string | null);
      }}
    >
      <label className={styles.Label}>
        <Checkbox.Root name="newsletter" uncheckedValue="off" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Subscribe to the newsletter
      </label>
      <button type="submit" className={styles.Button}>
        Save
      </button>
      {submitted !== undefined ? (
        <output className={styles.Output}>newsletter={submitted}</output>
      ) : null}
    </form>
  );
}

/** With `uncheckedValue` set, an unchecked checkbox submits that explicit sentinel rather than being absent from `FormData` (#3406's opt-in escape hatch). */
export const FormWithUncheckedValue: Story = {
  render: () => <FormExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(canvas.getByText('newsletter=off')).toBeVisible());

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Subscribe to the newsletter' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(canvas.getByText('newsletter=on')).toBeVisible());
  },
};

function ControlledCheckedExample() {
  const [checked, setChecked] = React.useState(false);
  return (
    <div className={styles.Form}>
      <label className={styles.Label}>
        <Checkbox.Root checked={checked} onCheckedChange={setChecked} className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Accept terms and conditions
      </label>
      <button type="button" className={styles.Button} onClick={() => setChecked((prev) => !prev)}>
        Toggle externally
      </button>
      <output className={styles.Output}>checked={String(checked)}</output>
    </div>
  );
}

/** External `checked`/`onCheckedChange` state drives the checkbox; clicking the label still round-trips through the same handler, so both interaction sources stay in sync. */
export const ControlledChecked: Story = {
  render: () => <ControlledCheckedExample />,
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Accept terms and conditions' });
    await expect(canvas.getByText('checked=false')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Toggle externally' }));
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));
    await waitFor(() => expect(canvas.getByText('checked=true')).toBeVisible());

    await userEvent.click(checkbox);
    await waitFor(() => expect(canvas.getByText('checked=false')).toBeVisible());
  },
};

function InFieldWithValidationExample() {
  return (
    <Form className={styles.Form}>
      <Field.Root name="terms" className={styles.Form}>
        <label className={styles.Label}>
          <Checkbox.Root required className={styles.Checkbox}>
            <Checkbox.Indicator className={styles.Indicator}>
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          I agree to the terms of service
        </label>
        <Field.Error className={styles.Output} match="valueMissing">
          You must agree before continuing.
        </Field.Error>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Save
      </button>
    </Form>
  );
}

/** Wrapped in `Field.Root required`, submitting while unchecked shows `valueMissing`; checking the box clears the error — the same Field validation flow used across Radio/Checkbox Group. */
export const InFieldWithValidation: Story = {
  render: () => <InFieldWithValidationExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(canvas.getByText('You must agree before continuing.')).toBeVisible(),
    );

    await userEvent.click(
      canvas.getByRole('checkbox', { name: 'I agree to the terms of service' }),
    );
    await waitFor(() =>
      expect(canvas.queryByText('You must agree before continuing.')).not.toBeInTheDocument(),
    );
  },
};

/**
 * A single `Checkbox.Root parent` inside a small `CheckboxGroup` — the "select all" coordinator.
 * `parent` is declared here on `Checkbox.Root` because that's its public prop location, but the
 * full tri-state cycle algorithm (`mixed → on → off → mixed`, disabled-child exclusion, nested
 * groups) is demonstrated in depth in
 * [Checkbox Group](?path=/docs/form-inputs-checkbox-group--docs)'s own stories — this story is a
 * narrow preview showing only that the prop lives on `Checkbox.Root`.
 */
export const ParentCheckboxPreview: Story = {
  render: () => (
    <CheckboxGroup
      aria-label="Fruits"
      defaultValue={['apple']}
      allValues={['apple', 'banana', 'cherry']}
      className={styles.Form}
    >
      <label className={styles.Label}>
        <Checkbox.Root parent className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        All fruits
      </label>
      <label className={styles.Label} style={{ paddingLeft: '1.5rem' }}>
        <Checkbox.Root value="apple" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Apple
      </label>
      <label className={styles.Label} style={{ paddingLeft: '1.5rem' }}>
        <Checkbox.Root value="banana" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Banana
      </label>
      <label className={styles.Label} style={{ paddingLeft: '1.5rem' }}>
        <Checkbox.Root value="cherry" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Cherry
      </label>
    </CheckboxGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'All fruits' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
  },
};

/** Recreates the docs "Rendering as a native button" pattern: `nativeButton` + `render={<button/>}` paired with a sibling `<label htmlFor>` (rather than an enclosing label, which would be invalid HTML around a real `<button>`). */
export const NativeButtonSiblingLabel: Story = {
  render: () => (
    <div className={styles.Label}>
      <Checkbox.Root
        id="marketing-emails"
        nativeButton
        render={<button type="button" />}
        className={styles.Checkbox}
      >
        <Checkbox.Indicator className={styles.Indicator}>
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <label htmlFor="marketing-emails">Receive marketing emails</label>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Receive marketing emails' });
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(canvas.getByText('Receive marketing emails'));
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));
  },
};

/** `readOnly` blocks every toggle path (click, Space) while a sibling `disabled` checkbox is shown for comparison — both stay visibly ticked/unticked but neither can change state. */
export const ReadOnlyBlocksToggle: Story = {
  render: () => (
    <div className={styles.Form}>
      <label className={styles.Label}>
        <Checkbox.Root defaultChecked readOnly className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Read-only (checked)
      </label>
      <label className={styles.Label}>
        <Checkbox.Root disabled className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Disabled (unchecked)
      </label>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const readOnlyCheckbox = canvas.getByRole('checkbox', { name: 'Read-only (checked)' });
    await expect(readOnlyCheckbox).toHaveAttribute('aria-readonly', 'true');

    await userEvent.click(canvas.getByText('Read-only (checked)'));
    await waitFor(() => expect(readOnlyCheckbox).toHaveAttribute('aria-checked', 'true'));
  },
};
