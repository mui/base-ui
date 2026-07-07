import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Meter } from '@base-ui/react/meter';
import styles from './meter.module.css';

/**
 * Stories follow research/c-components/meter (Tier 3): the kept hero demo,
 * the mandatory role="meter" ARIA-contract play, bounded-range math, and the
 * consumer-driven value-tier styling pattern (Meter ships no data attributes).
 */
const meta = {
  title: 'Status & display/Meter',
  component: Meter.Root,
  subcomponents: {
    'Meter.Label': Meter.Label,
    'Meter.Track': Meter.Track,
    'Meter.Indicator': Meter.Indicator,
    'Meter.Value': Meter.Value,
  },
  args: { value: 24 },
  tags: ['ai-generated', 'needs-work'],
} satisfies Meta<typeof Meter.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: a "Storage Used" measurement. Root exposes `role="meter"` with the full `aria-value*` contract — and unlike Progress, there is no indeterminate mode: `value` is always a required number. */
export const Hero: Story = {
  render: () => (
    <Meter.Root className={styles.Meter} value={24}>
      <Meter.Label className={styles.Label}>Storage Used</Meter.Label>
      <Meter.Value className={styles.Value} />
      <Meter.Track className={styles.Track}>
        <Meter.Indicator className={styles.Indicator} />
      </Meter.Track>
    </Meter.Root>
  ),
  play: async ({ canvas }) => {
    const meter = canvas.getByRole('meter', { name: 'Storage Used' });
    await expect(meter).toHaveAttribute('aria-valuenow', '24');
    await expect(meter).toHaveAttribute('aria-valuemin', '0');
    await expect(meter).toHaveAttribute('aria-valuemax', '100');
  },
};

/** `min`/`max` define arbitrary bounds — the default text stays the position within the range (6 of 0–8 hours reads as 75%), so text and fill agree for any bounds. */
export const BoundedRange: Story = {
  render: () => (
    <Meter.Root className={styles.Meter} value={6} min={0} max={8} locale="en-US">
      <Meter.Label className={styles.Label}>Battery life</Meter.Label>
      <Meter.Value className={styles.Value} />
      <Meter.Track className={styles.Track}>
        <Meter.Indicator className={styles.Indicator} />
      </Meter.Track>
    </Meter.Root>
  ),
  play: async ({ canvas }) => {
    const meter = canvas.getByRole('meter', { name: 'Battery life' });
    await expect(meter).toHaveAttribute('aria-valuenow', '6');
    await expect(meter).toHaveAttribute('aria-valuemax', '8');
    await expect(canvas.getByText('75%')).toBeVisible();
  },
};

/** `format` switches the visible text to the raw value (here a unit format); `getAriaValueText` overrides only the spoken text — the visible `Meter.Value` is unaffected. */
export const FormattedValue: Story = {
  render: () => (
    <Meter.Root
      className={styles.Meter}
      value={6.5}
      min={0}
      max={16}
      locale="en-US"
      format={{ style: 'unit', unit: 'gigabyte' }}
      getAriaValueText={(formattedValue) => `${formattedValue} of 16 gigabytes used`}
    >
      <Meter.Label className={styles.Label}>Memory used</Meter.Label>
      <Meter.Value className={styles.Value} />
      <Meter.Track className={styles.Track}>
        <Meter.Indicator className={styles.Indicator} />
      </Meter.Track>
    </Meter.Root>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('6.5 GB')).toBeVisible();
    const meter = canvas.getByRole('meter', { name: 'Memory used' });
    await expect(meter).toHaveAttribute('aria-valuetext', '6.5 GB of 16 gigabytes used');
  },
};

function TieredMeter({ label, value }: { label: string; value: number }) {
  let indicatorClass = styles.Indicator;
  if (value >= 90) {
    indicatorClass = styles.IndicatorHigh;
  } else if (value < 50) {
    indicatorClass = styles.IndicatorLow;
  }
  return (
    <Meter.Root className={styles.Meter} value={value}>
      <Meter.Label className={styles.Label}>{label}</Meter.Label>
      <Meter.Value className={styles.Value} />
      <Meter.Track className={styles.Track}>
        <Meter.Indicator className={indicatorClass} />
      </Meter.Track>
    </Meter.Root>
  );
}

/** Meter ships **no** data attributes (low/high segment styling was designed then dropped — open #1434), so tier colors must be computed by the consumer from `value`/`min`/`max`, as here. */
export const ValueTierStyling: Story = {
  render: () => (
    <div className={styles.Stack}>
      <TieredMeter label="Disk A" value={30} />
      <TieredMeter label="Disk B" value={72} />
      <TieredMeter label="Disk C" value={95} />
    </div>
  ),
};
