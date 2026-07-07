import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor } from 'storybook/test';
import { NumberField } from '@base-ui/react/number-field';
import { Field } from '@base-ui/react/field';
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
      <NumberField.Root id="number-field-hero" defaultValue={100} className={styles.Field}>
        <label htmlFor="number-field-hero" className={styles.Label}>
          Amount
        </label>
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
    <NumberField.Root
      id="number-field-keyboard-stepping"
      defaultValue={5}
      min={0}
      max={10}
      className={styles.Field}
    >
      <label htmlFor="number-field-keyboard-stepping" className={styles.Label}>
        Quantity
      </label>
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
 * The scrub area lets pointer users click-and-drag to change the value. The play function
 * dispatches synthetic `pointerdown`/`pointermove` events directly on the `ScrubArea` — the
 * same technique the project's own `NumberFieldScrubArea.test.tsx` uses, since
 * Testing Library's `user.pointer()` cannot yet drive realistic `movementX`/`movementY`
 * deltas. **Honest limitation**: this exercises the value-changing mechanics only. It cannot
 * verify real OS-level pointer lock (`document.body.requestPointerLock()` is denied or
 * inconsistent in headless browser automation) or WebKit's cursor-suppression behavior — the
 * project's own test skips both JSDOM and WebKit for the same reason. `ScrubArea`/
 * `ScrubAreaCursor` both render `role="presentation"` — the gesture is a pointer-only
 * enhancement layered on top of the already-complete keyboard path (see `KeyboardStepping`
 * above), never a required one.
 */
export const ScrubArea: Story = {
  render: () => (
    <NumberField.Root id="number-field-scrub-area" defaultValue={100} className={styles.Field}>
      <NumberField.ScrubArea className={styles.ScrubArea}>
        <label htmlFor="number-field-scrub-area" className={styles.Label}>
          Amount (drag to scrub)
        </label>
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
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('textbox');
    await expect(input).toHaveValue('100');

    const scrubArea = canvasElement.querySelector('[role="presentation"]') as HTMLElement;
    const box = scrubArea.getBoundingClientRect();
    const start = { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };

    scrubArea.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, ...start }));
    scrubArea.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        clientX: start.clientX + 10,
        clientY: start.clientY,
        movementX: 10,
        movementY: 0,
      }),
    );
    await waitFor(() => expect(input).toHaveValue('110'));

    scrubArea.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  },
};

/** `min`/`max`/`step` bound the value: typed out-of-range input clamps on blur, and the stepper buttons disable at the boundary. */
export const MinMaxStep: Story = {
  render: () => (
    <NumberField.Root
      id="number-field-min-max-step"
      defaultValue={95}
      min={0}
      max={100}
      step={5}
      className={styles.Field}
    >
      <label htmlFor="number-field-min-max-step" className={styles.Label}>
        Percent
      </label>
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
      <NumberField.Root
        id="number-field-form-integration"
        name="quantity"
        defaultValue={1}
        min={1}
        className={styles.Field}
      >
        <label htmlFor="number-field-form-integration" className={styles.Label}>
          Quantity
        </label>
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

function PressAndHoldExample() {
  const [committedCount, setCommittedCount] = React.useState(0);
  return (
    <div className={styles.Stack}>
      <NumberField.Root
        id="number-field-press-and-hold"
        defaultValue={97}
        min={0}
        max={100}
        className={styles.Field}
        onValueCommitted={() => setCommittedCount((count) => count + 1)}
      >
        <label htmlFor="number-field-press-and-hold" className={styles.Label}>
          Percent (holds to 100 quickly)
        </label>
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
      <output className={styles.Output}>onValueCommitted calls: {committedCount}</output>
    </div>
  );
}

/**
 * Holding `pointerdown` on a stepper button triggers one immediate step, then (after a
 * `START_AUTO_CHANGE_DELAY` of 400ms) continuous auto-repeat stepping every
 * `CHANGE_VALUE_TICK_DELAY` of 60ms (`usePressAndHold`, `utils/constants.ts`) — real delays,
 * exercised here with real timers rather than mocked ones. A single `onValueCommitted` fires
 * on pointer release, not once per tick; auto-repeat also halts on its own once the `max`
 * boundary is reached (the button becomes `aria-disabled`), well before release.
 */
export const PressAndHoldStepping: Story = {
  render: () => <PressAndHoldExample />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    const increment = canvas.getByRole('button', { name: 'Increase' });

    fireEvent.pointerDown(increment, { pointerType: 'mouse', button: 0 });
    // Immediate tick on pointerdown.
    await waitFor(() => expect(input).toHaveValue('98'));

    // Auto-repeat continues past the immediate tick and stops itself at the `max` boundary.
    await waitFor(() => expect(input).toHaveValue('100'), { timeout: 2000 });
    await waitFor(() => expect(increment).toHaveAttribute('aria-disabled', 'true'));

    fireEvent.pointerUp(document);
    await waitFor(() => expect(canvas.getByText(/onValueCommitted calls: 1/)).toBeVisible());
  },
};

/**
 * `snapOnStep` snaps increment/decrement results to the nearest multiple of `step` — directional
 * snapping (toward the direction of travel) for regular steps, nearest-multiple for Alt/`smallStep`
 * moves. Contrasted with a sibling field that steps by the exact amount with no snapping.
 */
export const SnapOnStep: Story = {
  render: () => (
    <div className={styles.Row}>
      <NumberField.Root
        id="number-field-snap-on-step-with"
        defaultValue={1.3}
        snapOnStep
        className={styles.Field}
      >
        <label htmlFor="number-field-snap-on-step-with" className={styles.Label}>
          With snapOnStep
        </label>
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
      <NumberField.Root
        id="number-field-snap-on-step-without"
        defaultValue={1.3}
        className={styles.Field}
      >
        <label htmlFor="number-field-snap-on-step-without" className={styles.Label}>
          Without (exact step)
        </label>
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
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const increments = canvas.getAllByRole('button', { name: 'Increase' });

    await userEvent.click(increments[0]);
    // 1.3 snaps directionally to the next whole step, 2, instead of landing on 2.3.
    await waitFor(() => expect(canvas.getAllByRole('textbox')[0]).toHaveValue('2'));

    await userEvent.click(increments[1]);
    await waitFor(() => expect(canvas.getAllByRole('textbox')[1]).toHaveValue('2.3'));
  },
};

/**
 * `allowOutOfRange` lets *direct text entry* (typing/paste/clear) exceed `min`/`max` so native
 * `rangeOverflow` validation can fire, contrasted with the default (clamping) behavior. Only
 * text entry is affected — stepper-button/keyboard stepping still clamps either way (verified
 * separately by the project's own `allowOutOfRange` test suite; not re-demonstrated here to
 * keep this story focused on the text-entry contrast). Note the clamp itself applies to the
 * numeric value immediately (visible on the hidden native input the story reads), while the
 * *visible* typed text only resyncs to the clamped display on blur — not on every keystroke.
 */
export const AllowOutOfRange: Story = {
  render: () => (
    <div className={styles.Row}>
      <NumberField.Root id="number-field-clamped" name="clamped" max={100} className={styles.Field}>
        <label htmlFor="number-field-clamped" className={styles.Label}>
          Clamps by default
        </label>
        <NumberField.Group className={styles.Group}>
          <NumberField.Input className={styles.Input} />
        </NumberField.Group>
      </NumberField.Root>
      <NumberField.Root
        id="number-field-out-of-range"
        name="outOfRange"
        max={100}
        allowOutOfRange
        className={styles.Field}
      >
        <label htmlFor="number-field-out-of-range" className={styles.Label}>
          allowOutOfRange
        </label>
        <NumberField.Group className={styles.Group}>
          <NumberField.Input className={styles.Input} />
        </NumberField.Group>
      </NumberField.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const inputs = canvas.getAllByRole('textbox');

    // The *numeric* value clamps immediately (checked via the hidden native input, which the
    // browser's own constraint validation reads) — but the visible typed text is only
    // resynced to the clamped display on blur, not on every keystroke.
    await userEvent.type(inputs[0], '150');
    const clampedHidden = canvasElement.querySelector<HTMLInputElement>(
      'input[type="number"][name="clamped"]',
    )!;
    await waitFor(() => expect(clampedHidden.value).toBe('100'));
    await waitFor(() => expect(clampedHidden.validity.rangeOverflow).toBe(false));
    await userEvent.tab();
    await waitFor(() => expect(inputs[0]).toHaveValue('100'));

    await userEvent.type(inputs[1], '150');
    await waitFor(() => expect(inputs[1]).toHaveValue('150'));
    const outOfRangeHidden = canvasElement.querySelector<HTMLInputElement>(
      'input[type="number"][name="outOfRange"]',
    )!;
    await waitFor(() => expect(outOfRangeHidden.value).toBe('150'));
    await waitFor(() => expect(outOfRangeHidden.validity.rangeOverflow).toBe(true));
  },
};

const usdFormat: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };
const eurDeFormat: Intl.NumberFormatOptions = { style: 'currency', currency: 'EUR' };

/**
 * `format` (raw `Intl.NumberFormatOptions`) and `locale` drive the displayed text through the
 * standard `Intl.NumberFormat` pipeline — currency symbols, grouping, and locale-specific
 * decimal separators — while the value submitted to a form stays the plain number. Evidenced
 * directly from `formatNumber`/`parseNumber` and the currency/locale test blocks in
 * `NumberFieldRoot.test.tsx`; there is no format/locale demo in the docs today, so this is net-new
 * Storybook coverage rather than a port of existing docs content.
 */
export const LocaleAndCurrencyFormat: Story = {
  render: () => (
    <div className={styles.Row}>
      <NumberField.Root
        id="number-field-usd"
        defaultValue={1234.5}
        format={usdFormat}
        locale="en-US"
        className={styles.Field}
      >
        <label htmlFor="number-field-usd" className={styles.Label}>
          USD (en-US)
        </label>
        <NumberField.Group className={styles.Group}>
          <NumberField.Input className={styles.Input} />
        </NumberField.Group>
      </NumberField.Root>
      <NumberField.Root
        id="number-field-eur"
        defaultValue={1234.5}
        format={eurDeFormat}
        locale="de-DE"
        className={styles.Field}
      >
        <label htmlFor="number-field-eur" className={styles.Label}>
          EUR (de-DE)
        </label>
        <NumberField.Group className={styles.Group}>
          <NumberField.Input className={styles.Input} />
        </NumberField.Group>
      </NumberField.Root>
    </div>
  ),
  play: async ({ canvas }) => {
    const inputs = canvas.getAllByRole('textbox');
    await expect(inputs[0]).toHaveValue(new Intl.NumberFormat('en-US', usdFormat).format(1234.5));
    await expect(inputs[1]).toHaveValue(new Intl.NumberFormat('de-DE', eurDeFormat).format(1234.5));
  },
};

/**
 * `allowWheelScrub`: with the input focused, each discrete wheel tick steps the value by one
 * `step` and commits immediately — distinct from the accumulating drag gesture in `ScrubArea`.
 * `ctrlKey` wheel events (pinch-zoom) are deliberately ignored so the component never hijacks
 * browser zoom (verified from source, not re-demonstrated here since it's a non-event).
 */
export const WheelScrub: Story = {
  render: () => (
    <NumberField.Root
      id="number-field-wheel-scrub"
      defaultValue={10}
      allowWheelScrub
      className={styles.Field}
    >
      <label htmlFor="number-field-wheel-scrub" className={styles.Label}>
        Scroll while focused
      </label>
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
    const input = canvas.getByRole('textbox');
    input.focus();
    await waitFor(() => expect(input).toHaveFocus());

    fireEvent.wheel(input, { deltaY: -100 });
    await waitFor(() => expect(input).toHaveValue('11'));

    fireEvent.wheel(input, { deltaY: 100 });
    await waitFor(() => expect(input).toHaveValue('10'));
  },
};

function ValueChangeVsCommittedExample() {
  const [changeCount, setChangeCount] = React.useState(0);
  const [committedCount, setCommittedCount] = React.useState(0);
  return (
    <div className={styles.Stack}>
      <NumberField.Root
        id="number-field-value-change-vs-committed"
        className={styles.Field}
        onValueChange={() => setChangeCount((count) => count + 1)}
        onValueCommitted={() => setCommittedCount((count) => count + 1)}
      >
        <label htmlFor="number-field-value-change-vs-committed" className={styles.Label}>
          Type digits, then blur or click the buttons
        </label>
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
      <output className={styles.Output}>onValueChange calls: {changeCount}</output>
      <output className={styles.Output}>onValueCommitted calls: {committedCount}</output>
    </div>
  );
}

/**
 * The single most distinctive event contract in this component, made directly observable:
 * `onValueChange` fires on every parseable intermediate change (each digit typed), while
 * `onValueCommitted` only fires once a value is finalized (blur, or immediately for a stepper
 * click/keyboard step). Typing "12" then blurring fires `onValueChange` twice but
 * `onValueCommitted` once; a stepper click fires both exactly once, together.
 */
export const ValueChangeVsCommitted: Story = {
  render: () => <ValueChangeVsCommittedExample />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');

    await userEvent.type(input, '12');
    await waitFor(() => expect(canvas.getByText(/onValueChange calls: 2/)).toBeVisible());
    await expect(canvas.getByText(/onValueCommitted calls: 0/)).toBeVisible();

    await userEvent.tab();
    await waitFor(() => expect(canvas.getByText(/onValueCommitted calls: 1/)).toBeVisible());

    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }));
    await waitFor(() => expect(canvas.getByText(/onValueChange calls: 3/)).toBeVisible());
    await waitFor(() => expect(canvas.getByText(/onValueCommitted calls: 2/)).toBeVisible());
  },
};

/**
 * `Field` integration: wrapping in `Field.Root` with a `validate` function and `Field.Error`
 * demonstrates the duplicated-data-attribute doctrine — `data-valid`/`data-invalid`/
 * `data-touched`/`data-dirty`/`data-filled`/`data-focused` appear on every part (Root, Group,
 * Input, Increment, Decrement) simultaneously, since they all share one `state` object from
 * `NumberFieldRootContext`, plus `aria-invalid` on the Input.
 */
export const FieldValidation: Story = {
  render: () => (
    <Field.Root
      name="price"
      validationMode="onChange"
      validate={(value) => (typeof value === 'number' && value >= 1 ? null : 'Must be at least 1.')}
      className={styles.Field}
    >
      <Field.Label className={styles.Label}>Price</Field.Label>
      <NumberField.Root>
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
      <Field.Error className={styles.Error} />
    </Field.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    const increment = canvas.getByRole('button', { name: 'Increase' });
    const group = increment.closest('[role="group"]')!;

    await userEvent.type(input, '0');
    await waitFor(() => expect(input).toHaveAttribute('data-invalid'));
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    // The data attribute is duplicated onto every part sharing the field state, not just Input.
    await expect(group).toHaveAttribute('data-invalid');
    await expect(increment).toHaveAttribute('data-invalid');
    await expect(await canvas.findByText('Must be at least 1.')).toBeVisible();

    await userEvent.clear(input);
    await userEvent.type(input, '5');
    await waitFor(() => expect(input).toHaveAttribute('data-valid'));
    await expect(group).toHaveAttribute('data-valid');
    await expect(canvas.queryByText('Must be at least 1.')).not.toBeInTheDocument();
  },
};

/**
 * `disabled` removes the field from interaction and native form submission entirely (the hidden
 * input itself becomes `disabled`). `readOnly` keeps the `Input` focusable and its value
 * copyable but blocks edits and disables the stepper buttons — via computed `disabled`, not
 * `aria-readonly` (invalid on `role="button"`, per the source's own comment) — and also
 * disables wheel/scrub interactions.
 */
export const DisabledAndReadOnly: Story = {
  render: () => (
    <div className={styles.Row}>
      <NumberField.Root
        id="number-field-disabled"
        defaultValue={42}
        disabled
        className={styles.Field}
      >
        <label htmlFor="number-field-disabled" className={styles.Label}>
          Disabled
        </label>
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
      <NumberField.Root
        id="number-field-readonly"
        defaultValue={42}
        readOnly
        className={styles.Field}
      >
        <label htmlFor="number-field-readonly" className={styles.Label}>
          Read-only
        </label>
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
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const inputs = canvas.getAllByRole('textbox');
    const increments = canvas.getAllByRole('button', { name: 'Increase' });

    // Disabled: native disabled input, excluded from form submission and interaction.
    await expect(inputs[0]).toBeDisabled();
    await expect(inputs[0]).toHaveAttribute('data-disabled');
    await expect(increments[0]).toHaveAttribute('data-disabled');

    // Read-only: the input stays focusable (not `disabled`), but edits are blocked.
    await expect(inputs[1]).not.toBeDisabled();
    await expect(inputs[1]).toHaveAttribute('data-readonly');
    await userEvent.click(inputs[1]);
    await expect(inputs[1]).toHaveFocus();
    await userEvent.keyboard('9');
    await waitFor(() => expect(inputs[1]).toHaveValue('42'));

    // Read-only steppers: disabled via `aria-disabled` (not `aria-readonly`, invalid on buttons).
    await waitFor(() => expect(increments[1]).toHaveAttribute('aria-disabled', 'true'));
    await expect(increments[1]).not.toHaveAttribute('aria-readonly');
  },
};
