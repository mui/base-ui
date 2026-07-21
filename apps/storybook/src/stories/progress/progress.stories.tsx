import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Progress } from '@base-ui/react/progress';
import styles from './progress.module.css';

/**
 * Stories follow research/c-components/progress (Tier 3): the kept hero demo,
 * the mandatory determinate + indeterminate pair with ARIA-contract plays,
 * and the format/locale/range prop-guidance stories from the story plan.
 */
const meta = {
  title: 'Status & display/Progress',
  component: Progress.Root,
  subcomponents: {
    'Progress.Label': Progress.Label,
    'Progress.Track': Progress.Track,
    'Progress.Indicator': Progress.Indicator,
    'Progress.Value': Progress.Value,
  },
  args: { value: 40 },
} satisfies Meta<typeof Progress.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

function HeroExample() {
  const [value, setValue] = React.useState(20);

  // Simulate changes (same mechanism as the docs hero demo).
  React.useEffect(() => {
    const interval = setInterval(() => {
      setValue((current) => Math.min(100, Math.round(current + Math.random() * 25)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Progress.Root className={styles.Progress} value={value}>
      <Progress.Label className={styles.Label}>Export data</Progress.Label>
      <Progress.Value className={styles.Value} />
      <Progress.Track className={styles.Track}>
        <Progress.Indicator className={styles.Indicator} />
      </Progress.Track>
    </Progress.Root>
  );
}

/** The docs hero demo: a labeled export task whose value increments over time — the consumer always drives `value` (there is no uncontrolled mode). */
export const Hero: Story = {
  render: () => <HeroExample />,
};

/** A fixed determinate value. Root exposes `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`, and the default text is the percentage of the range. */
export const Determinate: Story = {
  render: () => (
    <Progress.Root className={styles.Progress} value={40} locale="en-US">
      <Progress.Label className={styles.Label}>Uploading files</Progress.Label>
      <Progress.Value className={styles.Value} />
      <Progress.Track className={styles.Track}>
        <Progress.Indicator className={styles.Indicator} />
      </Progress.Track>
    </Progress.Root>
  ),
  play: async ({ canvas }) => {
    const progressbar = canvas.getByRole('progressbar', { name: 'Uploading files' });
    await expect(progressbar).toHaveAttribute('aria-valuenow', '40');
    await expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    await expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    await expect(canvas.getByText('40%')).toBeVisible();
  },
};

/** `value={null}` puts Progress in indeterminate mode: `aria-valuenow` is omitted entirely, `aria-valuetext` defaults to "indeterminate progress", and the Indicator gets no inline width — the sweep animation here is plain consumer CSS on `[data-indeterminate]`. */
export const Indeterminate: Story = {
  render: () => (
    <Progress.Root className={styles.Progress} value={null}>
      <Progress.Label className={styles.Label}>Preparing download</Progress.Label>
      <Progress.Track className={styles.Track}>
        <Progress.Indicator className={styles.Indicator} />
      </Progress.Track>
    </Progress.Root>
  ),
  play: async ({ canvas }) => {
    const progressbar = canvas.getByRole('progressbar', { name: 'Preparing download' });
    await expect(progressbar).not.toHaveAttribute('aria-valuenow');
    await expect(progressbar).toHaveAttribute('aria-valuetext', 'indeterminate progress');
    await expect(progressbar).toHaveAttribute('data-indeterminate');
  },
};

/** With `format`, the raw value (not the percentage) is formatted — e.g. a budget in dollars. An explicit `locale` keeps `Intl.NumberFormat` output stable, which is also the documented mitigation for the open SSR hydration issue (#4616). */
export const CustomFormat: Story = {
  render: () => (
    <Progress.Root
      className={styles.Progress}
      value={30}
      format={{ style: 'currency', currency: 'USD' }}
      locale="en-US"
    >
      <Progress.Label className={styles.Label}>Budget used</Progress.Label>
      <Progress.Value className={styles.Value} />
      <Progress.Track className={styles.Track}>
        <Progress.Indicator className={styles.Indicator} />
      </Progress.Track>
    </Progress.Root>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('$30.00')).toBeVisible();
    const progressbar = canvas.getByRole('progressbar', { name: 'Budget used' });
    await expect(progressbar).toHaveAttribute('aria-valuetext', '$30.00');
  },
};

function LiveValueUpdatesExample() {
  const [value, setValue] = React.useState(0);
  return (
    <div className={styles.Progress}>
      <Progress.Root className={styles.Progress} value={value}>
        <Progress.Label className={styles.Label}>Uploading files</Progress.Label>
        <Progress.Value className={styles.Value} />
        <Progress.Track className={styles.Track}>
          <Progress.Indicator className={styles.Indicator} />
        </Progress.Track>
      </Progress.Root>
      <button
        type="button"
        onClick={() => setValue((current) => Math.min(100, current + 25))}
        style={{ gridColumn: '1 / 3', width: 'fit-content' }}
      >
        Advance 25%
      </button>
    </div>
  );
}

/**
 * The mandatory live-value-update story (story plan #3): since Progress has
 * no uncontrolled mode, the consumer always drives `value` directly. Each
 * click bumps `value` by 25 and the play function asserts `aria-valuenow`
 * updates at every single step (one assertion per `waitFor`, per AGENTS.md).
 */
export const LiveValueUpdates: Story = {
  render: () => <LiveValueUpdatesExample />,
  play: async ({ canvas, userEvent }) => {
    const progressbar = canvas.getByRole('progressbar', { name: 'Uploading files' });
    const advance = canvas.getByRole('button', { name: 'Advance 25%' });

    await expect(progressbar).toHaveAttribute('aria-valuenow', '0');

    await userEvent.click(advance);
    await waitFor(() => expect(progressbar).toHaveAttribute('aria-valuenow', '25'));

    await userEvent.click(advance);
    await waitFor(() => expect(progressbar).toHaveAttribute('aria-valuenow', '50'));

    await userEvent.click(advance);
    await waitFor(() => expect(progressbar).toHaveAttribute('aria-valuenow', '75'));

    await userEvent.click(advance);
    await waitFor(() => expect(progressbar).toHaveAttribute('aria-valuenow', '100'));
    await waitFor(() => expect(progressbar).toHaveAttribute('data-complete'));
  },
};

/**
 * `getAriaValueText` layers an enriched screen-reader string on top of the
 * default percent text without touching the visible `Progress.Value` —
 * distinct from `CustomFormat` above, which changes both the visible text
 * and the spoken text together via `format`.
 */
export const WithLabelAndCustomAriaValueText: Story = {
  render: () => (
    <Progress.Root
      className={styles.Progress}
      value={40}
      locale="en-US"
      getAriaValueText={(formattedValue) => `${formattedValue} of the export complete`}
    >
      <Progress.Label className={styles.Label}>Exporting data</Progress.Label>
      <Progress.Value className={styles.Value} />
      <Progress.Track className={styles.Track}>
        <Progress.Indicator className={styles.Indicator} />
      </Progress.Track>
    </Progress.Root>
  ),
  play: async ({ canvas }) => {
    const progressbar = canvas.getByRole('progressbar', { name: 'Exporting data' });
    await expect(canvas.getByText('40%')).toBeVisible();
    await expect(progressbar).toHaveAttribute('aria-valuetext', '40% of the export complete');
  },
};

/** `min`/`max` support arbitrary ranges, and overshooting values clamp: `min={0} max={40} value={50}` reports `aria-valuenow="40"`, fills 100%, and gains `data-complete`. */
export const CustomRange: Story = {
  render: () => (
    <Progress.Root className={styles.Progress} value={50} min={0} max={40} locale="en-US">
      <Progress.Label className={styles.Label}>Processed items</Progress.Label>
      <Progress.Value className={styles.Value} />
      <Progress.Track className={styles.Track}>
        <Progress.Indicator className={styles.Indicator} />
      </Progress.Track>
    </Progress.Root>
  ),
  play: async ({ canvas }) => {
    const progressbar = canvas.getByRole('progressbar', { name: 'Processed items' });
    await expect(progressbar).toHaveAttribute('aria-valuenow', '40');
    await expect(progressbar).toHaveAttribute('aria-valuemax', '40');
    await expect(progressbar).toHaveAttribute('data-complete');
  },
};
