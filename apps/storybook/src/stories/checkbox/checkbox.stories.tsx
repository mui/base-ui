import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Checkbox } from '@base-ui/react/checkbox';
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
      <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" vectorEffect="non-scaling-stroke" />
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
  tags: ['ai-generated'],
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
