import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
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
