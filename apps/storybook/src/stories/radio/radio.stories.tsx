import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import { Form } from '@base-ui/react/form';
import styles from './radio.module.css';

/**
 * Stories follow research/c-components/radio (Tier 2, one research unit with Radio Group —
 * note the packaging asymmetry: `radio-group` is its own public subpath but has no standalone
 * docs page, so its content is folded into the Radio page). Floor coverage: the docs hero
 * (RadioGroup + enclosing-label Radio items), the arrow-key-selects interaction (the single
 * most important behavioral fact — arrow navigation both moves focus and commits selection,
 * matching native `<input type="radio">` groups), a disabled-item variant, and native form
 * submission (submits `null` when nothing is selected, matching native radio groups).
 */
const meta = {
  title: 'Form inputs/Radio',
  component: RadioGroup,
  subcomponents: { 'Radio.Root': Radio.Root, 'Radio.Indicator': Radio.Indicator },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: a RadioGroup of three mutually exclusive options, each wrapped in an enclosing label. */
export const Basic: Story = {
  render: () => (
    <RadioGroup defaultValue="fuji-apple" aria-label="Best apple" className={styles.RadioGroup}>
      <label className={styles.Item}>
        <Radio.Root value="fuji-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Fuji
      </label>
      <label className={styles.Item}>
        <Radio.Root value="gala-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Gala
      </label>
      <label className={styles.Item}>
        <Radio.Root value="granny-smith-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Granny Smith
      </label>
    </RadioGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Fuji' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  },
};

/**
 * The single most important behavioral fact in the brief: arrow-key navigation both moves
 * focus AND commits selection in one step — no separate Space/click needed — matching native
 * `<input type="radio">` group behavior (`RadioGroup.test.tsx` "should automatically select
 * radio upon navigation").
 */
export const ArrowDownSelectsOnNavigation: Story = {
  render: () => (
    <RadioGroup defaultValue="fuji-apple" aria-label="Best apple" className={styles.RadioGroup}>
      <label className={styles.Item}>
        <Radio.Root value="fuji-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Fuji
      </label>
      <label className={styles.Item}>
        <Radio.Root value="gala-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Gala
      </label>
      <label className={styles.Item}>
        <Radio.Root value="granny-smith-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Granny Smith
      </label>
    </RadioGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    const fuji = canvas.getByRole('radio', { name: 'Fuji' });
    const gala = canvas.getByRole('radio', { name: 'Gala' });

    // Focus the currently-checked radio (clicking it is a no-op state-wise).
    await userEvent.click(fuji);
    await waitFor(() => expect(fuji).toHaveFocus());

    await userEvent.keyboard('{ArrowDown}');

    // ArrowDown alone — no Space, no click — both moved focus and selected Gala.
    await waitFor(() => expect(gala).toHaveFocus());
    await waitFor(() => expect(gala).toHaveAttribute('aria-checked', 'true'));
    await waitFor(() => expect(fuji).toHaveAttribute('aria-checked', 'false'));
  },
};

/** A `disabled` radio stays visible and focusable (composite-widget policy) but cannot be selected by click or keyboard. */
export const DisabledItem: Story = {
  render: () => (
    <RadioGroup defaultValue="fuji-apple" aria-label="Best apple" className={styles.RadioGroup}>
      <label className={styles.Item}>
        <Radio.Root value="fuji-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Fuji
      </label>
      <label className={styles.Item}>
        <Radio.Root value="gala-apple" disabled className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Gala (out of stock)
      </label>
      <label className={styles.Item}>
        <Radio.Root value="granny-smith-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Granny Smith
      </label>
    </RadioGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    const gala = canvas.getByRole('radio', { name: 'Gala (out of stock)' });
    await expect(gala).toHaveAttribute('data-disabled');

    await userEvent.click(gala);
    await waitFor(() => expect(gala).toHaveAttribute('aria-checked', 'false'));
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
        setSubmitted(data.get('storageType') as string | null);
      }}
    >
      <RadioGroup name="storageType" aria-label="Storage type" className={styles.RadioGroup}>
        <label className={styles.Item}>
          <Radio.Root value="ssd" className={styles.Radio}>
            <Radio.Indicator className={styles.Indicator} />
          </Radio.Root>
          SSD
        </label>
        <label className={styles.Item}>
          <Radio.Root value="hdd" className={styles.Radio}>
            <Radio.Indicator className={styles.Indicator} />
          </Radio.Root>
          HDD
        </label>
      </RadioGroup>
      <button type="submit" className={styles.Button}>
        Save
      </button>
      {submitted !== undefined ? (
        <output className={styles.Output}>storageType={String(submitted)}</output>
      ) : null}
    </form>
  );
}

/** A RadioGroup with nothing selected submits `null` for its name, matching native `<input type="radio">` group behavior — not an empty string, not omitted, a real `null` (#2473). */
export const FormIntegration: Story = {
  render: () => <FormExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(canvas.getByText('storageType=null')).toBeVisible());

    await userEvent.click(canvas.getByRole('radio', { name: 'SSD' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(canvas.getByText('storageType=ssd')).toBeVisible());
  },
};

// NOTE: a `RadioGroup` `orientation` prop (as seen on Toolbar/Tabs) was checked against
// `RadioGroupProps` in `packages/react/src/radio-group/RadioGroup.tsx` and does not exist —
// there is no evidence of a horizontal-vs-vertical layout prop, so no orientation story is
// added here (per story-plan.md's Tier-2 floor, layout direction is CSS-only, not a prop).

/** `Space` selects a focused, unchecked radio on **keyup**, not keydown — pressing the key down alone must not yet flip selection (`useButton`'s composite-item Space-activates-on-keyup contract, pinned by `#4930`). */
export const SpaceSelectsOnKeyUp: Story = {
  render: () => (
    <RadioGroup aria-label="Best apple" className={styles.RadioGroup}>
      <label className={styles.Item}>
        <Radio.Root value="fuji-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Fuji
      </label>
      <label className={styles.Item}>
        <Radio.Root value="gala-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Gala
      </label>
    </RadioGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    const fuji = canvas.getByRole('radio', { name: 'Fuji' });

    await userEvent.tab();
    await waitFor(() => expect(fuji).toHaveFocus());
    await expect(fuji).toHaveAttribute('aria-checked', 'false');

    await userEvent.keyboard('[Space]');
    await waitFor(() => expect(fuji).toHaveAttribute('aria-checked', 'true'));
  },
};

/** `Home`/`End` have **no effect**, by design — `enableHomeAndEndKeys={false}` is passed explicitly inside `RadioGroup`, a deliberate divergence from listbox-style composites like Select. */
export const HomeEndHaveNoEffect: Story = {
  render: () => (
    <RadioGroup defaultValue="gala-apple" aria-label="Best apple" className={styles.RadioGroup}>
      <label className={styles.Item}>
        <Radio.Root value="fuji-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Fuji
      </label>
      <label className={styles.Item}>
        <Radio.Root value="gala-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Gala
      </label>
      <label className={styles.Item}>
        <Radio.Root value="granny-smith-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Granny Smith
      </label>
    </RadioGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    const gala = canvas.getByRole('radio', { name: 'Gala' });

    await userEvent.click(gala);
    await waitFor(() => expect(gala).toHaveFocus());

    await userEvent.keyboard('{Home}');
    await expect(gala).toHaveFocus();
    await expect(gala).toHaveAttribute('aria-checked', 'true');

    await userEvent.keyboard('{End}');
    await expect(gala).toHaveFocus();
    await expect(gala).toHaveAttribute('aria-checked', 'true');
  },
};

function ControlledValueExample() {
  const [value, setValue] = React.useState<string | null>('gala-apple');
  return (
    <div className={styles.Form}>
      <RadioGroup
        value={value}
        onValueChange={setValue}
        aria-label="Best apple"
        className={styles.RadioGroup}
      >
        <label className={styles.Item}>
          <Radio.Root value="fuji-apple" className={styles.Radio}>
            <Radio.Indicator className={styles.Indicator} />
          </Radio.Root>
          Fuji
        </label>
        <label className={styles.Item}>
          <Radio.Root value="gala-apple" className={styles.Radio}>
            <Radio.Indicator className={styles.Indicator} />
          </Radio.Root>
          Gala
        </label>
      </RadioGroup>
      <div className={styles.Form} style={{ flexDirection: 'row' }}>
        <button
          type="button"
          className={styles.Button}
          onClick={() => setValue('fuji-apple')}
        >
          Select Fuji externally
        </button>
        <button type="button" className={styles.Button} onClick={() => setValue(null)}>
          Clear externally
        </button>
      </div>
      <output className={styles.Output}>value={String(value)}</output>
    </div>
  );
}

/** External `value`/`onValueChange` state drives selection; `null` is a real, externally-reachable app state (matching the native-parity contract), not merely "nothing selected yet" (#2473 decision log). */
export const ControlledValue: Story = {
  render: () => <ControlledValueExample />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('value=gala-apple')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Select Fuji externally' }));
    await waitFor(() => expect(canvas.getByText('value=fuji-apple')).toBeVisible());
    await waitFor(() =>
      expect(canvas.getByRole('radio', { name: 'Fuji' })).toHaveAttribute(
        'aria-checked',
        'true',
      ),
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Clear externally' }));
    await waitFor(() => expect(canvas.getByText('value=null')).toBeVisible());
    await waitFor(() =>
      expect(canvas.getByRole('radio', { name: 'Fuji' })).toHaveAttribute(
        'aria-checked',
        'false',
      ),
    );
  },
};

/**
 * Recreates the docs "Form integration" example: a `Fieldset.Root` (rendered as the
 * `RadioGroup`) supplies the group's accessible name via `Fieldset.Legend`, and each option is a
 * `Field.Item` pairing `Field.Label` with `Radio.Root` — the managed alternative to a plain
 * enclosing `<label>` (brief.md Anatomy composition).
 */
export const WithFieldAndFieldset: Story = {
  render: () => (
    <Field.Root name="shippingSpeed" className={styles.RadioGroup}>
      <Fieldset.Root className={styles.RadioGroup} render={<RadioGroup />}>
        <Fieldset.Legend>Shipping speed</Fieldset.Legend>
        <Field.Item className={styles.Item}>
          <Radio.Root value="standard" className={styles.Radio}>
            <Radio.Indicator className={styles.Indicator} />
          </Radio.Root>
          <Field.Label>Standard (5-7 days)</Field.Label>
        </Field.Item>
        <Field.Item className={styles.Item}>
          <Radio.Root value="express" className={styles.Radio}>
            <Radio.Indicator className={styles.Indicator} />
          </Radio.Root>
          <Field.Label>Express (1-2 days)</Field.Label>
        </Field.Item>
      </Fieldset.Root>
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const express = canvas.getByRole('radio', { name: 'Express (1-2 days)' });
    await expect(express).toHaveAttribute('aria-checked', 'false');

    // Clicking the Field.Label (not the radio itself) toggles selection via `for`/`id`.
    await userEvent.click(canvas.getByText('Express (1-2 days)'));
    await waitFor(() => expect(express).toHaveAttribute('aria-checked', 'true'));
  },
};

function RequiredInvalidExample() {
  return (
    <Form className={styles.Form}>
      <Field.Root name="plan" className={styles.RadioGroup}>
        <Fieldset.Root className={styles.RadioGroup} render={<RadioGroup required />}>
          <Fieldset.Legend>Plan</Fieldset.Legend>
          <Field.Item className={styles.Item}>
            <Radio.Root value="monthly" className={styles.Radio}>
              <Radio.Indicator className={styles.Indicator} />
            </Radio.Root>
            <Field.Label>Monthly</Field.Label>
          </Field.Item>
          <Field.Item className={styles.Item}>
            <Radio.Root value="yearly" className={styles.Radio}>
              <Radio.Indicator className={styles.Indicator} />
            </Radio.Root>
            <Field.Label>Yearly</Field.Label>
          </Field.Item>
        </Fieldset.Root>
        <Field.Error className={styles.Output} match="valueMissing">
          Please choose a plan.
        </Field.Error>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Save
      </button>
    </Form>
  );
}

/** `required` on the `Field.Root`/`RadioGroup` pair flags `valueMissing` on submit when nothing is selected; selecting an option clears the error (mirrors `RadioGroup.test.tsx` "clears required validation when a value is selected"). */
export const RequiredInvalidState: Story = {
  render: () => <RequiredInvalidExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(canvas.getByText('Please choose a plan.')).toBeVisible());

    await userEvent.click(canvas.getByText('Monthly'));
    await waitFor(() =>
      expect(canvas.queryByText('Please choose a plan.')).not.toBeInTheDocument(),
    );
  },
};

/** `readOnly` on `RadioGroup` blocks every selection path (click, arrow-key auto-select, Space) while keeping the group focusable and its current value visible — distinct from `disabled`, which also removes it from the tab sequence. */
export const ReadOnlyGroup: Story = {
  render: () => (
    <RadioGroup
      defaultValue="fuji-apple"
      readOnly
      aria-label="Best apple (read-only)"
      className={styles.RadioGroup}
    >
      <label className={styles.Item}>
        <Radio.Root value="fuji-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Fuji
      </label>
      <label className={styles.Item}>
        <Radio.Root value="gala-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        Gala
      </label>
    </RadioGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    const fuji = canvas.getByRole('radio', { name: 'Fuji' });
    const gala = canvas.getByRole('radio', { name: 'Gala' });

    await expect(gala).toHaveAttribute('aria-readonly', 'true');

    await userEvent.click(gala);
    await waitFor(() => expect(gala).toHaveAttribute('aria-checked', 'false'));
    await waitFor(() => expect(fuji).toHaveAttribute('aria-checked', 'true'));
  },
};
