import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Fieldset } from '@base-ui/react/fieldset';
import { Field } from '@base-ui/react/field';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import styles from './fieldset.module.css';

/**
 * Stories follow research/c-components/fieldset (Tier 3): Fieldset is a
 * 2-part, minimal component whose entire value is (a) staying a native
 * `<fieldset>` for free grouping/disabled-cascade semantics, and (b)
 * replacing only the unstylable native `<legend>` with a styleable `<div>` +
 * `aria-labelledby` — a deliberate, cited decision (#3044, see the MDX).
 */
const meta = {
  title: 'Form inputs/Fieldset',
  component: Fieldset.Root,
  subcomponents: { 'Fieldset.Legend': Fieldset.Legend },
} satisfies Meta<typeof Fieldset.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero shape: one Legend labeling two unrelated `Field.Root`s. `Fieldset.Root` renders a real `<fieldset>` (native grouping for free); `Fieldset.Legend` renders a `<div>` linked to it via `aria-labelledby`, not a native `<legend>` (brief §5, §7). */
export const Hero: Story = {
  render: () => (
    <Fieldset.Root className={styles.Fieldset}>
      <Fieldset.Legend className={styles.Legend}>Billing details</Fieldset.Legend>
      <Field.Root className={styles.Field}>
        <Field.Label className={styles.Label}>Company</Field.Label>
        <Field.Control placeholder="Enter company name" className={styles.Input} />
      </Field.Root>
      <Field.Root className={styles.Field}>
        <Field.Label className={styles.Label}>Tax ID</Field.Label>
        <Field.Control placeholder="Enter fiscal number" className={styles.Input} />
      </Field.Root>
    </Fieldset.Root>
  ),
  play: async ({ canvas }) => {
    // Native <fieldset> has an implicit "group" role; the Legend names it via
    // aria-labelledby, auto-registered on mount (brief §5, §7).
    const group = canvas.getByRole('group', { name: 'Billing details' });
    await expect(group.tagName).toBe('FIELDSET');
  },
};

function GroupedRadioExample() {
  return (
    <Field.Root name="storage" className={styles.FieldRoot}>
      <Fieldset.Root className={styles.Fieldset} render={<RadioGroup defaultValue="ssd" />}>
        <Fieldset.Legend className={styles.Legend}>Storage type</Fieldset.Legend>
        <Field.Item className={styles.FieldItem}>
          <Radio.Root value="ssd" className={styles.Radio}>
            <Radio.Indicator className={styles.RadioIndicator} />
          </Radio.Root>
          <Field.Label className={styles.ItemLabel}>SSD</Field.Label>
        </Field.Item>
        <Field.Item className={styles.FieldItem}>
          <Radio.Root value="hdd" className={styles.Radio}>
            <Radio.Indicator className={styles.RadioIndicator} />
          </Radio.Root>
          <Field.Label className={styles.ItemLabel}>HDD</Field.Label>
        </Field.Item>
        <Field.Item className={styles.FieldItem}>
          <Radio.Root value="network" className={styles.Radio}>
            <Radio.Indicator className={styles.RadioIndicator} />
          </Radio.Root>
          <Field.Label className={styles.ItemLabel}>Network volume</Field.Label>
        </Field.Item>
      </Fieldset.Root>
    </Field.Root>
  );
}

/** Fieldset composed via `render` over `RadioGroup` — the forms handbook's canonical grouped-control pattern (brief §5): `Fieldset.Root` becomes the literal element the composed-over Root renders as (here RadioGroup's own `<div role="radiogroup">`, not a `<fieldset>` — the native-element semantics are RadioGroup's, not Fieldset's, once composed this way), and the Legend still labels the *group* via `aria-labelledby` while each `Field.Item` labels its own option. */
export const GroupedRadio: Story = {
  render: () => <GroupedRadioExample />,
  play: async ({ canvas, userEvent }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Storage type' });
    const legend = canvas.getByText('Storage type');
    // The Legend's id is exactly what aria-labelledby wires to (brief §5, §7).
    await expect(group).toHaveAttribute('aria-labelledby', legend.id);

    const hdd = canvas.getByRole('radio', { name: 'HDD' });
    await userEvent.click(hdd);
    await expect(hdd).toHaveAttribute('aria-checked', 'true');
  },
};

/**
 * Two sub-cases in one story (story-plan #4), both source-verified against
 * `FieldsetRoot.test.tsx`:
 * - Nested fieldsets: an outer `Fieldset.Root disabled` keeps an *inner*
 *   Fieldset's control disabled even though the inner Fieldset never
 *   receives `disabled` directly — the native HTML fieldset-disables-
 *   descendants cascade, unbroken by nesting ("keeps nested fieldsets
 *   disabled when an ancestor fieldset is disabled").
 * - Composed-over: `Fieldset.Root disabled render={<RadioGroup />}` passes
 *   `disabled` through to RadioGroup's own convention (`aria-disabled="true"`)
 *   rather than normalizing it to a plain `disabled` DOM attribute — Fieldset
 *   forwards the prop, it doesn't reinterpret the target's semantics
 *   ("passes disabled to rendered Base UI roots").
 */
export const DisabledCascade: Story = {
  render: () => (
    <div className={styles.FieldRoot}>
      <Fieldset.Root disabled className={styles.Fieldset}>
        <Fieldset.Legend className={styles.Legend}>Outer (disabled)</Fieldset.Legend>
        <Fieldset.Root className={styles.Fieldset}>
          <Fieldset.Legend className={styles.Legend}>Inner (not disabled directly)</Fieldset.Legend>
          <Field.Root className={styles.Field}>
            <Field.Label className={styles.Label}>Company</Field.Label>
            <Field.Control
              data-testid="nested-control"
              placeholder="Enter company name"
              className={styles.Input}
            />
          </Field.Root>
        </Fieldset.Root>
      </Fieldset.Root>

      <Field.Root name="storage2">
        <Fieldset.Root
          disabled
          className={styles.Fieldset}
          render={<RadioGroup data-testid="composed-radio-group" defaultValue="ssd" />}
        >
          <Fieldset.Legend className={styles.Legend}>Storage type (composed-over)</Fieldset.Legend>
          <Field.Item className={styles.FieldItem}>
            <Radio.Root value="ssd" className={styles.Radio}>
              <Radio.Indicator className={styles.RadioIndicator} />
            </Radio.Root>
            <Field.Label className={styles.ItemLabel}>SSD</Field.Label>
          </Field.Item>
        </Fieldset.Root>
      </Field.Root>
    </div>
  ),
  play: async ({ canvas }) => {
    const nestedControl = canvas.getByTestId('nested-control');
    await expect(nestedControl).toHaveAttribute('disabled');

    const composedGroup = canvas.getByTestId('composed-radio-group');
    await expect(composedGroup).not.toHaveAttribute('disabled');
    await expect(composedGroup).toHaveAttribute('aria-disabled', 'true');
  },
};

// `CheckboxGroupComposition` (story-plan #3) and `MultiThumbSlider`
// (story-plan #5) are intentionally skipped in this small-gap-closing pass:
// both are additional composition-recipe demonstrations beyond the floor
// (a third and fourth "Fieldset composed via render over X" example), and
// `DisabledCascade` above already exercises the composed-over-disabled
// behavior via RadioGroup, the same mechanism CheckboxGroup/Slider share.
