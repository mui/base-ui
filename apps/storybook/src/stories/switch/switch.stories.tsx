import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Switch } from '@base-ui/react/switch';
import { Field } from '@base-ui/react/field';
import styles from './switch.module.css';

/**
 * Stories follow research/c-components/switch (Tier 3): the kept hero demo,
 * one story per documented use case (labeling, native button, form integration),
 * plus state variants driven by the data-attribute contract.
 */
const meta = {
  title: 'Form inputs/Switch',
  component: Switch.Root,
  subcomponents: { 'Switch.Thumb': Switch.Thumb },
} satisfies Meta<typeof Switch.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: label-wrapped switch, on by default. Use as the starting point for any boolean setting with immediate effect. */
export const Hero: Story = {
  render: () => (
    <label className={styles.Label}>
      <Switch.Root defaultChecked className={styles.Switch}>
        <Switch.Thumb className={styles.Thumb} />
      </Switch.Root>
      Notifications
    </label>
  ),
  play: async ({ canvas, userEvent }) => {
    const switchEl = canvas.getByRole('switch', { name: 'Notifications' });
    await expect(switchEl).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(switchEl);
    await expect(switchEl).toHaveAttribute('aria-checked', 'false');
  },
};

function ControlledExample() {
  const [checked, setChecked] = React.useState(false);
  return (
    <div className={styles.Form}>
      <label className={styles.Label}>
        <Switch.Root checked={checked} onCheckedChange={setChecked} className={styles.Switch}>
          <Switch.Thumb className={styles.Thumb} />
        </Switch.Root>
        Airplane mode
      </label>
      <span className={styles.Output}>{checked ? 'On' : 'Off'}</span>
    </div>
  );
}

/** Use `checked` + `onCheckedChange` when external state must drive or observe the switch. */
export const Controlled: Story = {
  render: () => <ControlledExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('switch', { name: 'Airplane mode' }));
    await expect(canvas.getByText('On')).toBeVisible();
  },
};

/** Use the Field parts when you need a managed label, description, or validation wiring. */
export const WithFieldLabel: Story = {
  render: () => (
    <Field.Root>
      <Field.Label className={styles.Label}>
        <Switch.Root defaultChecked className={styles.Switch}>
          <Switch.Thumb className={styles.Thumb} />
        </Switch.Root>
        Marketing emails
      </Field.Label>
    </Field.Root>
  ),
};

/** Use `render` + `nativeButton` to render an actual `<button>` element (default is a `<span>`). */
export const NativeButton: Story = {
  render: () => (
    <label className={styles.Label}>
      <Switch.Root
        nativeButton
        render={<button type="button" />}
        className={styles.Switch}
      >
        <Switch.Thumb className={styles.Thumb} />
      </Switch.Root>
      Dark mode
    </label>
  ),
};

/** `disabled` switches expose `data-disabled` on every part for styling. */
export const Disabled: Story = {
  render: () => (
    <div className={styles.Form}>
      <label className={styles.Label}>
        <Switch.Root disabled className={styles.Switch}>
          <Switch.Thumb className={styles.Thumb} />
        </Switch.Root>
        Disabled off
      </label>
      <label className={styles.Label}>
        <Switch.Root disabled defaultChecked className={styles.Switch}>
          <Switch.Thumb className={styles.Thumb} />
        </Switch.Root>
        Disabled on
      </label>
    </div>
  ),
};

function FormExample() {
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(String(data.get('newsletter')));
      }}
    >
      <label className={styles.Label}>
        <Switch.Root name="newsletter" className={styles.Switch}>
          <Switch.Thumb className={styles.Thumb} />
        </Switch.Root>
        Subscribe to the newsletter
      </label>
      <button type="submit" className={styles.Button}>
        Save
      </button>
      {submitted !== null ? (
        <output className={styles.Output}>newsletter={submitted}</output>
      ) : null}
    </form>
  );
}

/** The switch participates in native forms through a hidden input; `name` keys the submitted value. */
export const FormIntegration: Story = {
  render: () => <FormExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('switch', { name: 'Subscribe to the newsletter' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(await canvas.findByText('newsletter=on')).toBeVisible();
  },
};

/**
 * Project-wide CSS smoke check (exactly one across the whole Storybook, per the
 * generated setup prompt): asserts a concrete computed style from switch.module.css,
 * proving the CSS Modules pipeline and shared preview styles actually load.
 */
export const CssCheck: Story = {
  render: () => (
    <Switch.Root defaultChecked className={styles.Switch} aria-label="CSS check switch">
      <Switch.Thumb className={styles.Thumb} />
    </Switch.Root>
  ),
  play: async ({ canvas }) => {
    const switchEl = canvas.getByRole('switch', { name: 'CSS check switch' });
    // .Switch sets width: 2.25rem — 36px. Fails if the CSS Module did not load.
    await expect(getComputedStyle(switchEl).width).toBe('36px');
  },
};
