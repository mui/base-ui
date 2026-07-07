import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import { Form } from '@base-ui/react/form';
import styles from './checkbox-group.module.css';

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

const fruits = ['fuji-apple', 'gala-apple', 'granny-smith-apple'];

/**
 * Stories follow research/c-components/checkbox-group (Tier 2): the docs hero (a set of
 * checkboxes sharing one array-valued group), the parent "select all" tri-state cycle — the
 * least obvious behavior in the brief: clicking a parent checkbox in a genuinely mixed state
 * follows `mixed → on → off → mixed` (restoring the exact prior subset), not a plain toggle —
 * and native submission of the group's value as one array-valued field (#1948), which
 * requires wrapping in `Field.Root` since `CheckboxGroup` has no `name` prop of its own.
 */
const meta = {
  title: 'Form inputs/Checkbox Group',
  component: CheckboxGroup,
  subcomponents: { 'Checkbox.Root': Checkbox.Root, 'Checkbox.Indicator': Checkbox.Indicator },
  tags: ['ai-generated'],
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: three checkboxes coordinating one array-valued group. */
export const Basic: Story = {
  render: () => (
    <CheckboxGroup
      aria-label="Apples"
      defaultValue={['fuji-apple']}
      className={styles.CheckboxGroup}
    >
      <label className={styles.Item}>
        <Checkbox.Root value="fuji-apple" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Fuji
      </label>
      <label className={styles.Item}>
        <Checkbox.Root value="gala-apple" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Gala
      </label>
      <label className={styles.Item}>
        <Checkbox.Root value="granny-smith-apple" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Granny Smith
      </label>
    </CheckboxGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'Fuji' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  },
};

function ParentTriStateExample() {
  const [value, setValue] = React.useState<string[]>(['fuji-apple']);
  return (
    <CheckboxGroup
      aria-label="Apples"
      value={value}
      onValueChange={setValue}
      allValues={fruits}
      className={styles.CheckboxGroup}
    >
      <label className={styles.Item}>
        <Checkbox.Root className={styles.Checkbox} parent>
          <Checkbox.Indicator
            className={styles.Indicator}
            render={(props, state) => (
              <span {...props}>{state.indeterminate ? <HorizontalRuleIcon /> : <CheckIcon />}</span>
            )}
          />
        </Checkbox.Root>
        All apples
      </label>
      <label className={styles.Item}>
        <Checkbox.Root value="fuji-apple" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Fuji
      </label>
      <label className={styles.Item}>
        <Checkbox.Root value="gala-apple" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Gala
      </label>
      <label className={styles.Item}>
        <Checkbox.Root value="granny-smith-apple" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Granny Smith
      </label>
    </CheckboxGroup>
  );
}

/**
 * Starting from a genuinely mixed selection (Fuji only), clicking the parent follows the
 * tested `mixed → on → off → mixed` cycle — the third click restores exactly the original
 * one-item subset rather than resetting to empty (`useCheckboxGroupParent.ts`, test
 * "preserves initial state if mixed when parent is clicked").
 */
export const ParentCheckboxTriState: Story = {
  render: () => <ParentTriStateExample />,
  play: async ({ canvas, userEvent }) => {
    const parent = canvas.getByRole('checkbox', { name: 'All apples' });
    const fuji = canvas.getByRole('checkbox', { name: 'Fuji' });
    const gala = canvas.getByRole('checkbox', { name: 'Gala' });

    // Starting state: one of three checked → parent is mixed.
    await waitFor(() => expect(parent).toHaveAttribute('aria-checked', 'mixed'));

    // mixed -> on: every child becomes checked.
    await userEvent.click(parent);
    await waitFor(() => expect(parent).toHaveAttribute('aria-checked', 'true'));
    await waitFor(() => expect(gala).toHaveAttribute('aria-checked', 'true'));

    // on -> off: every child becomes unchecked.
    await userEvent.click(parent);
    await waitFor(() => expect(parent).toHaveAttribute('aria-checked', 'false'));
    await waitFor(() => expect(fuji).toHaveAttribute('aria-checked', 'false'));

    // off -> mixed: restores the exact original subset (Fuji only), not empty.
    await userEvent.click(parent);
    await waitFor(() => expect(fuji).toHaveAttribute('aria-checked', 'true'));
    await waitFor(() => expect(gala).toHaveAttribute('aria-checked', 'false'));
    await waitFor(() => expect(parent).toHaveAttribute('aria-checked', 'mixed'));
  },
};

function FormExample() {
  const [submitted, setSubmitted] = React.useState<string[] | null>(null);
  return (
    <Form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(data.getAll('protocols') as string[]);
      }}
    >
      <Field.Root name="protocols" className={styles.CheckboxGroup}>
        <Fieldset.Root className={styles.Fieldset} render={<CheckboxGroup />}>
          <Fieldset.Legend className={styles.Legend}>Allowed network protocols</Fieldset.Legend>
          <Field.Item className={styles.FieldItem}>
            <Checkbox.Root value="http" className={styles.Checkbox}>
              <Checkbox.Indicator className={styles.Indicator}>
                <CheckIcon />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <Field.Label className={styles.ItemLabel}>HTTP</Field.Label>
          </Field.Item>
          <Field.Item className={styles.FieldItem}>
            <Checkbox.Root value="https" className={styles.Checkbox}>
              <Checkbox.Indicator className={styles.Indicator}>
                <CheckIcon />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <Field.Label className={styles.ItemLabel}>HTTPS</Field.Label>
          </Field.Item>
          <Field.Item className={styles.FieldItem}>
            <Checkbox.Root value="ssh" className={styles.Checkbox}>
              <Checkbox.Indicator className={styles.Indicator}>
                <CheckIcon />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <Field.Label className={styles.ItemLabel}>SSH</Field.Label>
          </Field.Item>
        </Fieldset.Root>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Save
      </button>
      {submitted !== null ? (
        <output className={styles.Output}>protocols={JSON.stringify(submitted)}</output>
      ) : null}
    </Form>
  );
}

/** Wrapped in a `Field.Root name`, the group's checked values submit as one array-valued field (#1948) — no per-checkbox `name` is needed. */
export const FormSubmitArray: Story = {
  render: () => <FormExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('checkbox', { name: 'HTTP' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'HTTPS' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(canvas.getByText('protocols=["http","https"]')).toBeVisible(),
    );
  },
};
