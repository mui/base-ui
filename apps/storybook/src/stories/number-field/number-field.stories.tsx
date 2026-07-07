import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { NumberField } from '@base-ui/react/number-field';
import styles from './number-field.module.css';

/**
 * Floor coverage following research/c-components/number-field (Tier 2): the docs hero
 * demo, incrementing/decrementing plays, keyboard stepping, the scrub area (rendered
 * and described but not gesture-tested — see the story's own doc comment for why),
 * min/max/step constraints, and form integration (`noValidate` + `stepMismatch`, #3552).
 */
const meta = {
  title: 'Form inputs/Number Field',
  component: NumberField.Root,
  subcomponents: {
    'NumberField.Group': NumberField.Group,
    'NumberField.Input': NumberField.Input,
    'NumberField.Increment': NumberField.Increment,
    'NumberField.Decrement': NumberField.Decrement,
    'NumberField.ScrubArea': NumberField.ScrubArea,
    'NumberField.ScrubAreaCursor': NumberField.ScrubAreaCursor,
  },
} satisfies Meta<typeof NumberField.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1.5 8h13M8 14.5v-13" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1.5 8h13" />
    </svg>
  );
}

/** The docs hero demo: a scrubbable label, a `Group` of Decrement/Input/Increment. Recreates `demos/hero`. */
export const Hero: Story = {
  render: () => {
    return (
      <NumberField.Root defaultValue={100} className={styles.Field}>
        <label className={styles.Label}>Amount</label>
        <NumberField.Group className={styles.Group}>
          <NumberField.Decrement className={styles.Decrement}>
            <MinusIcon />
          </NumberField.Decrement>
          <NumberField.Input className={styles.Input} />
          <NumberField.Increment className={styles.Increment}>
            <PlusIcon />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    );
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    await expect(input).toHaveValue('100');

    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }));
    await waitFor(() => expect(input).toHaveValue('101'));
  },
};

/** Arrow keys step the focused Input directly — no need to reach for the stepper buttons. Home/End jump straight to `min`/`max` (only when those props are set); PageUp/PageDown are deliberately native, per the brief's honest read of the source (no ARIA spinbutton pattern is implemented here). */
export const KeyboardStepping: Story = {
  render: () => (
    <NumberField.Root defaultValue={5} min={0} max={10} className={styles.Field}>
      <label className={styles.Label}>Quantity</label>
      <NumberField.Group className={styles.Group}>
        <NumberField.Decrement className={styles.Decrement}>
          <MinusIcon />
        </NumberField.Decrement>
        <NumberField.Input className={styles.Input} />
        <NumberField.Increment className={styles.Increment}>
          <PlusIcon />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    input.focus();

    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(input).toHaveValue('6'));

    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await waitFor(() => expect(input).toHaveValue('4'));

    await userEvent.keyboard('{End}');
    await waitFor(() => expect(input).toHaveValue('10'));

    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(input).toHaveValue('0'));
  },
};

/**
 * The scrub area lets pointer users click-and-drag to change the value. This story renders
 * and documents the gesture rather than driving it with a play function: real pointer-lock
 * scrubbing (`document.body.requestPointerLock()`) is denied or inconsistent in headless
 * browser automation, and the project's own `NumberFieldScrubArea.test.tsx` skips both
 * JSDOM and WebKit for the same reason. `ScrubArea`/`ScrubAreaCursor` both render
 * `role="presentation"` — the gesture is a pointer-only enhancement layered on top of the
 * already-complete keyboard path (see `KeyboardStepping` above), never a required one.
 */
export const ScrubArea: Story = {
  render: () => (
    <NumberField.Root defaultValue={100} className={styles.Field}>
      <NumberField.ScrubArea className={styles.ScrubArea}>
        <span className={styles.Label}>Amount (drag to scrub)</span>
        <NumberField.ScrubAreaCursor className={styles.ScrubAreaCursor} />
      </NumberField.ScrubArea>
      <NumberField.Group className={styles.Group}>
        <NumberField.Decrement className={styles.Decrement}>
          <MinusIcon />
        </NumberField.Decrement>
        <NumberField.Input className={styles.Input} />
        <NumberField.Increment className={styles.Increment}>
          <PlusIcon />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  ),
  play: async ({ canvas }) => {
    // Render-only assertion: the scrub area and its input mount, both decorative to a11y.
    await expect(canvas.getByText('Amount (drag to scrub)')).toHaveAttribute(
      'class',
      expect.stringContaining(styles.Label),
    );
    await expect(canvas.getByRole('textbox')).toHaveValue('100');
  },
};

/** `min`/`max`/`step` bound the value: typed out-of-range input clamps on blur, and the stepper buttons disable at the boundary. */
export const MinMaxStep: Story = {
  render: () => (
    <NumberField.Root defaultValue={95} min={0} max={100} step={5} className={styles.Field}>
      <label className={styles.Label}>Percent</label>
      <NumberField.Group className={styles.Group}>
        <NumberField.Decrement className={styles.Decrement}>
          <MinusIcon />
        </NumberField.Decrement>
        <NumberField.Input className={styles.Input} />
        <NumberField.Increment className={styles.Increment}>
          <PlusIcon />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    const increment = canvas.getByRole('button', { name: 'Increase' });

    await userEvent.click(increment);
    await waitFor(() => expect(input).toHaveValue('100'));
    await waitFor(() => expect(increment).toHaveAttribute('aria-disabled', 'true'));
  },
};

function FormExample() {
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <form
      noValidate
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(String(data.get('quantity')));
      }}
    >
      <NumberField.Root name="quantity" defaultValue={1} min={1} className={styles.Field}>
        <label className={styles.Label}>Quantity</label>
        <NumberField.Group className={styles.Group}>
          <NumberField.Decrement className={styles.Decrement}>
            <MinusIcon />
          </NumberField.Decrement>
          <NumberField.Input className={styles.Input} />
          <NumberField.Increment className={styles.Increment}>
            <PlusIcon />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
      <button type="submit" className={styles.Button}>
        Add to cart
      </button>
      {submitted !== null ? <output className={styles.Output}>quantity={submitted}</output> : null}
    </form>
  );
}

/**
 * Native form participation via a hidden `<input type="number">`. `noValidate` is applied
 * on the `<form>` here deliberately: the default `step={1}` triggers native step validation
 * once an explicit `min` is present, and shadcn/RHF-style forms that skip `noValidate` can
 * have submission silently blocked by a native browser popup (mui/base-ui#3552) — Base UI's
 * own `Field`/`Form` validation is meant to be authoritative instead.
 */
export const FormIntegration: Story = {
  render: () => <FormExample />,
  play: async ({ canvas, userEvent }) => {
    const increment = canvas.getByRole('button', { name: 'Increase' });
    await userEvent.click(increment);
    await userEvent.click(canvas.getByRole('button', { name: 'Add to cart' }));
    await expect(await canvas.findByText('quantity=2')).toBeVisible();
  },
};
