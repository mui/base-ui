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

function ControlledArrayExample() {
  const [value, setValue] = React.useState<string[]>([]);
  return (
    <div className={styles.Form}>
      <CheckboxGroup
        aria-label="Apples"
        value={value}
        onValueChange={setValue}
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
      </CheckboxGroup>
      <output className={styles.Output}>value={JSON.stringify(value)}</output>
    </div>
  );
}

/** The core array-coordination contract: checking a checkbox adds its `value` to the group's array; unchecking removes it by filtering, not by re-sorting the remaining entries. */
export const GroupValueCoordination: Story = {
  render: () => <ControlledArrayExample />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('value=[]')).toBeVisible();

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Fuji' }));
    await waitFor(() => expect(canvas.getByText('value=["fuji-apple"]')).toBeVisible());

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Gala' }));
    await waitFor(() =>
      expect(canvas.getByText('value=["fuji-apple","gala-apple"]')).toBeVisible(),
    );

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Fuji' }));
    await waitFor(() => expect(canvas.getByText('value=["gala-apple"]')).toBeVisible());
  },
};

/** Checking exactly one child directly (not via the parent) automatically flips the parent to `aria-checked="mixed"` — the parent's tri-state is a computed value derived from the live child array, not something the app sets by hand. */
export const ParentIndeterminateFromPartialSelection: Story = {
  render: () => <ParentTriStateExample />,
  play: async ({ canvas, userEvent }) => {
    const parent = canvas.getByRole('checkbox', { name: 'All apples' });
    const gala = canvas.getByRole('checkbox', { name: 'Gala' });

    // Starting state (Fuji only checked) is already mixed.
    await waitFor(() => expect(parent).toHaveAttribute('aria-checked', 'mixed'));

    await userEvent.click(gala);
    await waitFor(() => expect(parent).toHaveAttribute('aria-checked', 'mixed'));
  },
};

function DisabledChildExample() {
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
        <Checkbox.Root value="fuji-apple" disabled className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Fuji (disabled, pre-checked)
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

/** A `disabled` child that is already checked is excluded from the parent's bulk select-all/select-none: clicking "select all" leaves it untouched (already checked) while every enabled child becomes checked; clicking "select none" leaves it checked while every enabled child unchecks. */
export const DisabledChildExcludedFromParentToggle: Story = {
  render: () => <DisabledChildExample />,
  play: async ({ canvas, userEvent }) => {
    const parent = canvas.getByRole('checkbox', { name: 'All apples' });
    const fuji = canvas.getByRole('checkbox', { name: 'Fuji (disabled, pre-checked)' });
    const gala = canvas.getByRole('checkbox', { name: 'Gala' });
    const grannySmith = canvas.getByRole('checkbox', { name: 'Granny Smith' });

    await expect(fuji).toHaveAttribute('aria-checked', 'true');
    await expect(fuji).toHaveAttribute('data-disabled');

    // select-all: enabled children become checked; the disabled+checked child stays checked.
    await userEvent.click(parent);
    await waitFor(() => expect(gala).toHaveAttribute('aria-checked', 'true'));
    await waitFor(() => expect(grannySmith).toHaveAttribute('aria-checked', 'true'));
    await expect(fuji).toHaveAttribute('aria-checked', 'true');

    // select-none: enabled children uncheck; the disabled child is untouched, still checked.
    await userEvent.click(parent);
    await waitFor(() => expect(gala).toHaveAttribute('aria-checked', 'false'));
    await waitFor(() => expect(grannySmith).toHaveAttribute('aria-checked', 'false'));
    await expect(fuji).toHaveAttribute('aria-checked', 'true');
  },
};

function RequiredAllExample() {
  return (
    <Form className={styles.Form}>
      <Field.Root name="agreements" className={styles.CheckboxGroup}>
        <Fieldset.Root className={styles.Fieldset} render={<CheckboxGroup />}>
          <Fieldset.Legend className={styles.Legend}>Required agreements</Fieldset.Legend>
          <Field.Item className={styles.FieldItem}>
            <Checkbox.Root value="privacy" required className={styles.Checkbox}>
              <Checkbox.Indicator className={styles.Indicator}>
                <CheckIcon />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <Field.Label className={styles.ItemLabel}>Privacy policy</Field.Label>
          </Field.Item>
          <Field.Item className={styles.FieldItem}>
            <Checkbox.Root value="terms" required className={styles.Checkbox}>
              <Checkbox.Indicator className={styles.Indicator}>
                <CheckIcon />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <Field.Label className={styles.ItemLabel}>Terms of service</Field.Label>
          </Field.Item>
        </Fieldset.Root>
        <Field.Error className={styles.Output} match="valueMissing">
          You must agree to both before continuing.
        </Field.Error>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Save
      </button>
    </Form>
  );
}

const userManagementPermissions = ['create-user', 'edit-user'];

function NestedParentExample() {
  const [mainValue, setMainValue] = React.useState<string[]>([]);
  const [managementValue, setManagementValue] = React.useState<string[]>([]);
  const mainPermissions = ['view-dashboard', 'manage-users'];

  return (
    <div className={styles.CheckboxGroup}>
      <CheckboxGroup
        aria-label="Main permissions"
        value={mainValue}
        onValueChange={(value) => {
          if (value.includes('manage-users')) {
            setManagementValue(userManagementPermissions);
          } else if (managementValue.length === userManagementPermissions.length) {
            setManagementValue([]);
          }
          setMainValue(value);
        }}
        allValues={mainPermissions}
        className={styles.CheckboxGroup}
      >
        <label className={styles.Item}>
          <Checkbox.Root value="view-dashboard" className={styles.Checkbox}>
            <Checkbox.Indicator className={styles.Indicator}>
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          View dashboard
        </label>

        <CheckboxGroup
          aria-label="User management permissions"
          value={managementValue}
          onValueChange={(value) => {
            if (value.length === userManagementPermissions.length) {
              setMainValue((prev) => Array.from(new Set([...prev, 'manage-users'])));
            } else {
              setMainValue((prev) => prev.filter((v) => v !== 'manage-users'));
            }
            setManagementValue(value);
          }}
          allValues={userManagementPermissions}
          className={styles.CheckboxGroup}
        >
          <label className={styles.Item}>
            <Checkbox.Root className={styles.Checkbox} parent>
              <Checkbox.Indicator
                className={styles.Indicator}
                render={(props, state) => (
                  <span {...props}>
                    {state.indeterminate ? <HorizontalRuleIcon /> : <CheckIcon />}
                  </span>
                )}
              />
            </Checkbox.Root>
            Manage users
          </label>
          <label className={styles.Item}>
            <Checkbox.Root value="create-user" className={styles.Checkbox}>
              <Checkbox.Indicator className={styles.Indicator}>
                <CheckIcon />
              </Checkbox.Indicator>
            </Checkbox.Root>
            Create user
          </label>
          <label className={styles.Item}>
            <Checkbox.Root value="edit-user" className={styles.Checkbox}>
              <Checkbox.Indicator className={styles.Indicator}>
                <CheckIcon />
              </Checkbox.Indicator>
            </Checkbox.Root>
            Edit user
          </label>
        </CheckboxGroup>
      </CheckboxGroup>
      <output className={styles.Output}>manage-users in main: {String(mainValue.includes('manage-users'))}</output>
    </div>
  );
}

/**
 * Recreates the docs "nested" demo: two independent `CheckboxGroup` instances wired together by
 * app-level `onValueChange` propagation (there is no native multi-level tree API) — checking
 * every child of the inner "user management" group both checks its own parent **and** adds
 * `"manage-users"` to the outer group's value automatically.
 */
export const NestedParentCheckbox: Story = {
  render: () => <NestedParentExample />,
  play: async ({ canvas, userEvent }) => {
    const manageUsersParent = canvas.getByRole('checkbox', { name: 'Manage users' });
    await expect(canvas.getByText('manage-users in main: false')).toBeVisible();

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Create user' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Edit user' }));

    await waitFor(() => expect(manageUsersParent).toHaveAttribute('aria-checked', 'true'));
    await waitFor(() =>
      expect(canvas.getByText('manage-users in main: true')).toBeVisible(),
    );

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Edit user' }));
    await waitFor(() =>
      expect(canvas.getByText('manage-users in main: false')).toBeVisible(),
    );
  },
};

/** The counter-intuitive `required` contract: `required` on *individual* checkboxes means **every** required one must be checked, not "at least one." Checking only one of the two required checkboxes and resubmitting still shows the error — it clears only once both are checked. */
export const RequiredMeansAllMustBeChecked: Story = {
  render: () => <RequiredAllExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(canvas.getByText('You must agree to both before continuing.')).toBeVisible(),
    );

    // Checking only one required checkbox does NOT clear the error.
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Privacy policy' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(canvas.getByText('You must agree to both before continuing.')).toBeVisible(),
    );

    // Checking the second one clears it.
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Terms of service' }));
    await waitFor(() =>
      expect(canvas.queryByText('You must agree to both before continuing.')).not.toBeInTheDocument(),
    );
  },
};
