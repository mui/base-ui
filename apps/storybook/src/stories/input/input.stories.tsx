import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { Input } from '@base-ui/react/input';
import styles from './input.module.css';

/**
 * Stories follow research/c-components/input (Tier 3, lean brief): `Input.tsx`
 * is a 17-line component that renders `<Field.Control ref={forwardedRef} {...props} />`
 * and nothing else — Input *is* Field.Control under an intention-revealing name
 * (brief §1, §2). Every story below proves one part of that inherited contract
 * rather than re-deriving Field's own test matrix.
 */
const meta = {
  title: 'Form inputs/Input',
  component: Input,
  tags: ['ai-generated'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Field-integrated composition (the reason Input exists, brief §2): nested in `Field.Root`, `Input` "just works" with zero wiring props — labeling and the full validity/interaction state machine come for free the moment it's inside a Field tree. */
export const Hero: Story = {
  render: () => (
    <Field.Root className={styles.Field}>
      <Field.Label className={styles.Label}>Name</Field.Label>
      <Input placeholder="e.g. Colm Tuite" className={styles.Input} />
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Name');
    await expect(input).not.toHaveAttribute('data-filled');

    await userEvent.type(input, 'Ada Lovelace');
    await expect(input).toHaveValue('Ada Lovelace');
    await waitFor(() => expect(input).toHaveAttribute('data-filled'));
  },
};

/** Every attribute in `InputDataAttributes.ts` populates on the `<input>` itself once nested in `Field.Root` — an empty required field turns invalid on blur, then valid once filled (brief §1, §8, verbatim restatement of Field's contract). */
export const ValidationStates: Story = {
  render: () => (
    <Field.Root name="email" validationMode="onBlur" className={styles.Field}>
      <Field.Label className={styles.Label}>Work email</Field.Label>
      <Input required type="email" placeholder="you@company.com" className={styles.Input} />
      <Field.Error className={styles.Error} match="valueMissing">
        Please enter your email.
      </Field.Error>
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Work email');
    await expect(input).not.toHaveAttribute('data-invalid');

    // Dirty the field, then empty it: a blur now commits full validation.
    // (A *pristine* empty required field is deliberately not flagged on blur,
    // to reduce error noise — only a field the user has actually touched can
    // fail on `valueMissing` alone.)
    await userEvent.type(input, 'x');
    await userEvent.clear(input);
    await userEvent.tab();
    await waitFor(() => expect(input).toHaveAttribute('data-touched'));
    await waitFor(() => expect(input).toHaveAttribute('data-invalid'));
    await expect(await canvas.findByText('Please enter your email.')).toBeVisible();

    await userEvent.type(input, 'ada@base-ui.com');
    await userEvent.tab();
    await waitFor(() => expect(input).toHaveAttribute('data-valid'));
    await expect(input).not.toHaveAttribute('data-invalid');
  },
};

function FormExample() {
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <Form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(String(data.get('displayName')));
      }}
    >
      <Field.Root name="displayName" className={styles.Field}>
        <Field.Label className={styles.Label}>Display name</Field.Label>
        <Input required placeholder="e.g. Ada Lovelace" className={styles.Input} />
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Save
      </button>
      {submitted !== null ? <output className={styles.Output}>saved: {submitted}</output> : null}
    </Form>
  );
}

/** `Input` submits through the same hidden-input/native-form contract as `Field.Control` — no code of its own, entirely inherited (brief §6). */
export const FormIntegration: Story = {
  render: () => <FormExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Display name'), 'Ada Lovelace');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(await canvas.findByText('saved: Ada Lovelace')).toBeVisible();
  },
};
