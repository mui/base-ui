import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor } from 'storybook/test';
import { Slider } from '@base-ui/react/slider';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Field } from '@base-ui/react/field';
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

/** Dark-theme variant of Hero (visual only — the interaction assertions stay on the light story). */
export const Dark: Story = {
  render: Hero.render,
  globals: { theme: 'dark' },
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

/**
 * The full keyboard contract on one thumb: ArrowRight/Left step by `step` (default `1`);
 * Shift+Arrow and PageUp/PageDown both step by `largeStep` (default `10`) — unlike Number Field,
 * Slider deliberately *does* treat PageUp/PageDown as large-step keys, always, regardless of
 * Shift; Home/End jump to `min`/`max`. Every keyboard change commits immediately (unlike a drag,
 * which only commits on release).
 */
export const KeyboardStepping: Story = {
  render: () => (
    <Slider.Root
      defaultValue={50}
      min={0}
      max={100}
      step={1}
      largeStep={10}
      className={styles.Root}
    >
      <Slider.Label className={styles.Label}>Brightness</Slider.Label>
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
    const thumb = canvas.getByRole('slider', { name: 'Brightness' });
    thumb.focus();

    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '51'));

    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '50'));

    fireEvent.keyDown(thumb, { key: 'ArrowRight', shiftKey: true });
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '60'));

    await userEvent.keyboard('{PageUp}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '70'));

    await userEvent.keyboard('{PageDown}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '60'));

    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '0'));

    await userEvent.keyboard('{End}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '100'));
  },
};

/**
 * `minStepsBetweenValues` gates the *keyboard* path too (`handleInputChange`'s own
 * `validateMinimumDistance` check), not only pointer drag — verified from source: the change is
 * rejected outright (the value stays put) rather than partially applied. `End` on the lower
 * thumb of a range slider jumps directly to the largest value that still respects the gap
 * (`neighbor - step * minStepsBetweenValues`); one further `ArrowRight` press is then rejected.
 */
export const MinStepsBetweenValues: Story = {
  render: () => (
    <Slider.Root
      defaultValue={[30, 50]}
      min={0}
      max={100}
      step={5}
      minStepsBetweenValues={1}
      className={styles.Root}
    >
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
    const [minThumb] = canvas.getAllByRole('slider');
    minThumb.focus();

    // Jumps to the closest value that still respects the 5-unit (step * minStepsBetweenValues) gap.
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(minThumb).toHaveAttribute('aria-valuenow', '45'));

    // One more step would collide with the other thumb (distance 0 < 5) — rejected outright.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(minThumb).toHaveAttribute('aria-valuenow', '45'));
  },
};

/**
 * RTL flips the *physical* meaning of ArrowRight/ArrowLeft (`getNewValue(..., rtl ? -1 : 1, ...)`
 * in source) so the key still "advances" in the direction it visually points on screen — but
 * that means the underlying numeric value **decreases** on ArrowRight in RTL, the opposite of
 * LTR. This is the surprising, easy-to-miss half of the RTL contract; the visual-only pairing
 * (`dir="rtl"` + `DirectionProvider`) is shown without a play in `direction-provider.stories.tsx`.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <DirectionProvider direction="rtl">
        <Slider.Root defaultValue={50} className={styles.Root}>
          <Slider.Label className={styles.Label}>Volume</Slider.Label>
          <Slider.Value className={styles.Value} />
          <Slider.Control className={styles.Control}>
            <Slider.Track className={styles.Track}>
              <Slider.Indicator className={styles.Indicator} />
              <Slider.Thumb className={styles.Thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </DirectionProvider>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const thumb = canvas.getByRole('slider', { name: 'Volume' });
    thumb.focus();

    // ArrowRight decreases the numeric value in RTL — it still visually advances rightward.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '49'));

    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '50'));
  },
};

function ControlledExample() {
  const [value, setValue] = React.useState(20);
  const [changeCount, setChangeCount] = React.useState(0);
  const [committedCount, setCommittedCount] = React.useState(0);
  return (
    <div className={styles.Stack}>
      <Slider.Root
        value={value}
        onValueChange={(newValue) => {
          setValue(newValue as number);
          setChangeCount((count) => count + 1);
        }}
        onValueCommitted={() => setCommittedCount((count) => count + 1)}
        className={styles.Root}
      >
        <Slider.Label className={styles.Label}>Controlled volume</Slider.Label>
        <Slider.Value className={styles.Value} />
        <Slider.Control className={styles.Control}>
          <Slider.Track className={styles.Track}>
            <Slider.Indicator className={styles.Indicator} />
            <Slider.Thumb className={styles.Thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <output className={styles.Output}>onValueChange calls: {changeCount}</output>
      <output className={styles.Output}>onValueCommitted calls: {committedCount}</output>
    </div>
  );
}

/**
 * A fully controlled slider (`value` + `onValueChange`) with `onValueCommitted` tracked
 * separately. For keyboard interactions the two callbacks fire 1:1, once per keypress — unlike a
 * drag gesture, where `onValueChange` fires continuously but `onValueCommitted` only once, on
 * release (mirrors Number Field's analogous `ValueChangeVsCommitted` story).
 */
export const ControlledValueWithCommit: Story = {
  render: () => <ControlledExample />,
  play: async ({ canvas, userEvent }) => {
    const thumb = canvas.getByRole('slider', { name: 'Controlled volume' });
    thumb.focus();

    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '23'));
    await waitFor(() => expect(canvas.getByText(/onValueChange calls: 3/)).toBeVisible());
    await expect(canvas.getByText(/onValueCommitted calls: 3/)).toBeVisible();
  },
};

/**
 * `Field` integration: the slider registers with the surrounding `Field.Root` the same way
 * Number Field does (`useRegisterFieldControl`), so `data-valid`/`data-invalid`/`data-touched`/
 * `data-dirty`/`data-focused` appear on every part (Root, Control, Track, Indicator, Thumb)
 * simultaneously, and `Field.Error` renders from the `validate` function.
 */
export const FieldIntegration: Story = {
  render: () => (
    <Field.Root
      validationMode="onChange"
      validate={(value) =>
        typeof value === 'number' && value >= 10 ? null : 'Must be at least 10.'
      }
      className={styles.Stack}
    >
      <Field.Label className={styles.Label}>Minimum spend</Field.Label>
      <Slider.Root defaultValue={5} min={0} max={20}>
        <Slider.Value className={styles.Value} />
        <Slider.Control data-testid="field-control" className={styles.Control}>
          <Slider.Track className={styles.Track}>
            <Slider.Indicator className={styles.Indicator} />
            <Slider.Thumb className={styles.Thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Field.Error className={styles.Error} />
    </Field.Root>
  ),
  play: async ({ canvas }) => {
    const thumb = canvas.getByRole('slider', { name: 'Minimum spend' });
    const control = canvas.getByTestId('field-control');
    // `data-valid`/`data-invalid` land on Thumb's outer <div> host, not the nested
    // `role="slider"` <input> itself — the div is the input's direct parent.
    const thumbHost = thumb.parentElement as HTMLElement;

    fireEvent.keyDown(thumb, { key: 'ArrowRight', shiftKey: true });
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '15'));
    await waitFor(() => expect(thumbHost).toHaveAttribute('data-valid'));
    await expect(control).toHaveAttribute('data-valid');
    await expect(canvas.queryByText('Must be at least 10.')).not.toBeInTheDocument();
  },
};

/**
 * Marks aren't a built-in feature — the legacy `Mark`/`marks` API was dropped in the #373
 * rewrite (still open: #462) — so they're hand-composed `<span>` children of `Track`, recreating
 * the `DelayUntilRepeat` pattern from `experiments/slider/slider.tsx`. Net-new Storybook
 * coverage: a documented workaround recipe, not a port of an existing docs demo.
 */
export const CustomMarks: Story = {
  render: () => (
    <Slider.Root defaultValue={2} min={0} max={5} step={1} className={styles.Root}>
      <Slider.Label className={styles.Label}>Delay until repeat</Slider.Label>
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.MarksTrack}>
          <span className={styles.Mark} />
          <span className={styles.Mark} />
          <span className={styles.Mark} />
          <span className={styles.Mark} />
          <span className={styles.Mark} />
          <span className={styles.Mark} />
          <Slider.Thumb className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
};

/**
 * `Slider.Value`'s `format`/`locale` (raw `Intl.NumberFormatOptions`, read from `Slider.Root`)
 * drive the visible readout, while `Slider.Thumb`'s `getAriaValueText` can produce a more
 * meaningful screen-reader announcement than the raw formatted number.
 */
export const FormattedValueWithGetAriaValueText: Story = {
  render: () => (
    <Slider.Root
      defaultValue={40}
      format={{ style: 'unit', unit: 'percent' }}
      className={styles.Root}
    >
      <Slider.Label className={styles.Label}>Volume</Slider.Label>
      <Slider.Value className={styles.Value} />
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb
            getAriaValueText={(formattedValue) => `${formattedValue} volume`}
            className={styles.Thumb}
          />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
  play: async ({ canvas }) => {
    const thumb = canvas.getByRole('slider', { name: 'Volume' });
    await expect(thumb).toHaveAttribute('aria-valuetext', '40% volume');
    await expect(canvas.getByText('40%')).toBeVisible();
  },
};

/**
 * `disabled` puts the same `data-disabled` attribute on every part (Root, Control, Track,
 * Indicator, Thumb) per the duplicated-data-attribute doctrine, and the nested `<input
 * type="range">` gets a real native `disabled` attribute — unlike Number Field's stepper
 * buttons, which use `aria-disabled` to stay focusable, a disabled range input is genuinely
 * excluded from the Tab order, requiring zero workaround.
 */
export const DisabledState: Story = {
  render: () => (
    <div className={styles.Row}>
      <Slider.Root defaultValue={50} disabled className={styles.Root}>
        <Slider.Label className={styles.Label}>Disabled</Slider.Label>
        <Slider.Control data-testid="disabled-control" className={styles.Control}>
          <Slider.Track className={styles.Track}>
            <Slider.Indicator className={styles.Indicator} />
            <Slider.Thumb className={styles.Thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Slider.Root defaultValue={50} className={styles.Root}>
        <Slider.Label className={styles.Label}>Enabled</Slider.Label>
        <Slider.Control className={styles.Control}>
          <Slider.Track className={styles.Track}>
            <Slider.Indicator className={styles.Indicator} />
            <Slider.Thumb className={styles.Thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  ),
  play: async ({ canvas }) => {
    const disabledThumb = canvas.getByRole('slider', { name: 'Disabled' });
    const enabledThumb = canvas.getByRole('slider', { name: 'Enabled' });

    await expect(disabledThumb).toBeDisabled();
    await expect(disabledThumb).not.toHaveFocus();
    const disabledControl = canvas.getByTestId('disabled-control');
    await expect(disabledControl).toHaveAttribute('data-disabled');

    await expect(enabledThumb).not.toBeDisabled();
  },
};
