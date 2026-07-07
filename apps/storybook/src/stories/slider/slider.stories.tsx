import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Slider } from '@base-ui/react/slider';
import styles from './slider.module.css';

/**
 * Floor coverage following research/c-components/slider (Tier 2 lean-plus): the docs hero
 * demo (Root+Control+Track+Indicator+Thumb+Value), keyboard-driven stepping (never a
 * synthetic drag — see the brief's honesty note on pointer/drag testability), a two-thumb
 * range slider, a vertical orientation, and native form integration.
 */
const meta = {
  title: 'Form inputs/Slider',
  component: Slider.Root,
  subcomponents: {
    'Slider.Control': Slider.Control,
    'Slider.Track': Slider.Track,
    'Slider.Indicator': Slider.Indicator,
    'Slider.Thumb': Slider.Thumb,
    'Slider.Value': Slider.Value,
  },
} satisfies Meta<typeof Slider.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo, plus a labeled `Slider.Value` readout. Recreates `demos/hero`. */
export const Hero: Story = {
  render: () => (
    <Slider.Root defaultValue={25} className={styles.Root}>
      <Slider.Label className={styles.Label}>Volume</Slider.Label>
      <Slider.Value className={styles.Value} />
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    // The real accessible node is the native <input type="range"> nested in Thumb, not a
    // custom div[role="slider"] — verified directly against source (see the MDX a11y section).
    const thumb = canvas.getByRole('slider', { name: 'Volume' });
    await expect(thumb).toHaveAttribute('aria-valuenow', '25');

    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '26'));
  },
};

/** A two-thumb range slider. Each thumb needs its own distinguishing `aria-label`, since a single `Slider.Label` names the group, not any one thumb. */
export const RangeTwoThumb: Story = {
  render: () => (
    <Slider.Root defaultValue={[25, 45]} className={styles.Root}>
      <Slider.Label className={styles.Label}>Price range</Slider.Label>
      <Slider.Value className={styles.Value} />
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb index={0} aria-label="Minimum price" className={styles.Thumb} />
          <Slider.Thumb index={1} aria-label="Maximum price" className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const [minThumb, maxThumb] = canvas.getAllByRole('slider');
    await expect(minThumb).toHaveAttribute('aria-valuenow', '25');
    await expect(maxThumb).toHaveAttribute('aria-valuenow', '45');

    minThumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(minThumb).toHaveAttribute('aria-valuenow', '26'));
    // The other thumb is untouched — the two are independently steppable.
    await expect(maxThumb).toHaveAttribute('aria-valuenow', '45');
  },
};

/** `orientation="vertical"` flips the geometry; ArrowUp/ArrowDown still govern stepping regardless of orientation. */
export const Vertical: Story = {
  render: () => (
    <Slider.Root orientation="vertical" defaultValue={35} className={styles.Root}>
      <Slider.Label className={styles.Label}>Volume</Slider.Label>
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const thumb = canvas.getByRole('slider', { name: 'Volume' });
    thumb.focus();

    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '36'));

    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '34'));
  },
};

function FormExample() {
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(String(data.get('volume')));
      }}
    >
      <Slider.Root name="volume" defaultValue={20} className={styles.Root}>
        <Slider.Label className={styles.Label}>Volume</Slider.Label>
        <Slider.Value className={styles.Value} />
        <Slider.Control className={styles.Control}>
          <Slider.Track className={styles.Track}>
            <Slider.Indicator className={styles.Indicator} />
            <Slider.Thumb className={styles.Thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <button type="submit" className={styles.Button}>
        Save
      </button>
      {submitted !== null ? <output className={styles.Output}>volume={submitted}</output> : null}
    </form>
  );
}

/** Each `Slider.Thumb` nests a real native `<input type="range">` carrying `name`/`form`, so a single-thumb slider participates in native form submission with zero extra machinery. */
export const FormIntegration: Story = {
  render: () => <FormExample />,
  play: async ({ canvas, userEvent }) => {
    const thumb = canvas.getByRole('slider', { name: 'Volume' });
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '22'));

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(await canvas.findByText('volume=22')).toBeVisible();
  },
};
