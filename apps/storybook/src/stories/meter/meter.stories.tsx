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

/** Dark-theme variant of Hero (visual only — the interaction assertions stay on the light story). */
export const Dark: Story = {
  render: Hero.render,
  globals: { theme: 'dark' },
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

/**
 * Out-of-range values normalize rather than error, mirroring
 * `MeterRoot.test.tsx`'s parametrized "normalizes aria attributes" suite:
 * a value above `max` clamps `aria-valuenow`/text/indicator width to 100%,
 * a value below `min` clamps to 0%, and a non-finite `NaN` value clamps to
 * the same 0% as below-min rather than propagating `NaN` into the DOM.
 */
export const ClampedOutOfRangeValues: Story = {
  render: () => (
    <div className={styles.Stack}>
      <Meter.Root className={styles.Meter} value={150} locale="en-US">
        <Meter.Label className={styles.Label}>Above max (value=150)</Meter.Label>
        <Meter.Value className={styles.Value} />
        <Meter.Track className={styles.Track}>
          <Meter.Indicator className={styles.Indicator} data-testid="indicator-above" />
        </Meter.Track>
      </Meter.Root>
      <Meter.Root className={styles.Meter} value={-10} locale="en-US">
        <Meter.Label className={styles.Label}>Below min (value=-10)</Meter.Label>
        <Meter.Value className={styles.Value} />
        <Meter.Track className={styles.Track}>
          <Meter.Indicator className={styles.Indicator} data-testid="indicator-below" />
        </Meter.Track>
      </Meter.Root>
      <Meter.Root className={styles.Meter} value={Number.NaN} locale="en-US">
        <Meter.Label className={styles.Label}>NaN value</Meter.Label>
        <Meter.Value className={styles.Value} />
        <Meter.Track className={styles.Track}>
          <Meter.Indicator className={styles.Indicator} data-testid="indicator-nan" />
        </Meter.Track>
      </Meter.Root>
    </div>
  ),
  play: async ({ canvas }) => {
    const above = canvas.getByRole('meter', { name: 'Above max (value=150)' });
    await expect(above).toHaveAttribute('aria-valuenow', '100');
    await expect(canvas.getByTestId('indicator-above')).toHaveAttribute(
      'style',
      expect.stringContaining('width: 100%'),
    );

    const below = canvas.getByRole('meter', { name: 'Below min (value=-10)' });
    await expect(below).toHaveAttribute('aria-valuenow', '0');
    await expect(canvas.getByTestId('indicator-below')).toHaveAttribute(
      'style',
      expect.stringContaining('width: 0%'),
    );

    const nan = canvas.getByRole('meter', { name: 'NaN value' });
    await expect(nan).toHaveAttribute('aria-valuenow', '0');
    await expect(canvas.getByTestId('indicator-nan')).toHaveAttribute(
      'style',
      expect.stringContaining('width: 0%'),
    );
  },
};

/**
 * The same value/format formats differently per `locale` — a regression
 * guard in spirit for the open SSR/locale issue #4616 cited across this
 * batch's Progress brief (an explicit `locale` keeps `Intl.NumberFormat`
 * output stable and hydration-safe rather than relying on the runtime's
 * ambient locale).
 */
export const LocaleVariants: Story = {
  render: () => (
    <div className={styles.Stack}>
      <Meter.Root
        className={styles.Meter}
        value={30}
        format={{ style: 'currency', currency: 'EUR' }}
        locale="en-US"
      >
        <Meter.Label className={styles.Label}>Budget (en-US)</Meter.Label>
        <Meter.Value className={styles.Value} />
        <Meter.Track className={styles.Track}>
          <Meter.Indicator className={styles.Indicator} />
        </Meter.Track>
      </Meter.Root>
      <Meter.Root
        className={styles.Meter}
        value={30}
        format={{ style: 'currency', currency: 'EUR' }}
        locale="de-DE"
      >
        <Meter.Label className={styles.Label}>Budget (de-DE)</Meter.Label>
        <Meter.Value className={styles.Value} />
        <Meter.Track className={styles.Track}>
          <Meter.Indicator className={styles.Indicator} />
        </Meter.Track>
      </Meter.Root>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('€30.00')).toBeVisible();
    await expect(canvas.getByText('30,00 €')).toBeVisible();
  },
};
