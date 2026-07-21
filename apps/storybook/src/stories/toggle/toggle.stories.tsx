import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import styles from './toggle.module.css';

function HeartFilledIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M7.99961 13.8667C7.88761 13.8667 7.77561 13.8315 7.68121 13.7611C7.43321 13.5766 1.59961 9.1963 1.59961 5.8667C1.59961 3.80856 3.27481 2.13336 5.33294 2.13336C6.59054 2.13336 7.49934 2.81176 7.99961 3.3131C8.49988 2.81176 9.40868 2.13336 10.6663 2.13336C12.7244 2.13336 14.3996 3.80803 14.3996 5.8667C14.3996 9.1963 8.56601 13.5766 8.31801 13.7616C8.22361 13.8315 8.11161 13.8667 7.99961 13.8667Z" />
    </svg>
  );
}

function HeartOutlineIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m7.99961 4.8232-.75505-.75666c-.40333-.40419-1.0559-.86651-1.91162-.86651-1.46903 0-2.66666 1.19764-2.66666 2.66667 0 .5412.24648 1.2356.75339 2.04713.49581.79376 1.17682 1.59861 1.89311 2.33647 1.06989 1.1022 2.1604 1.9962 2.68705 2.4102.52751-.4149 1.61735-1.3085 2.68657-2.4101.7163-.73792 1.3973-1.54278 1.8932-2.33656.5069-.81154.7533-1.50594.7533-2.04714 0-1.46947-1.1975-2.66667-2.6666-2.66667-.85574 0-1.50831.46232-1.91164.86651zm-.01387-1.52394c-.5031-.49988-1.40673-1.1659-2.6528-1.1659-2.05813 0-3.73333 1.6752-3.73333 3.73334 0 3.3296 5.8336 7.7099 6.0816 7.8944a.532.532 0 0 0 .3184.1056c.112 0 .224-.0352.3184-.1051.248-.185 6.08159-4.5653 6.08159-7.8949 0-2.05867-1.6752-3.73334-3.7333-3.73334-1.24617 0-2.14985.66611-2.65293 1.166q-.0069.00686-.0137.01367c.00002-.00003-.00002.00002 0 0-.00459-.0046-.00927-.00914-.01393-.01377"
      />
    </svg>
  );
}

/**
 * Stories follow research/c-components/toggle (Tier 3): the kept docs hero demo
 * plus the state-flip behavior that is Toggle's core identity — `aria-pressed`
 * toggling on click, distinct from Switch's `role="switch"` and RadioGroup's
 * `role="radio"`. Toggle never participates in native forms (it discards
 * `form`/`type` by design) — see the MDX "Related" section for the Switch/
 * Checkbox alternative when form participation is required.
 */
const meta = {
  title: 'Actions/Toggle',
  component: Toggle,
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: a standalone favorite/star-style toggle with an icon that swaps on press. */
export const Hero: Story = {
  render: () => (
    <Toggle
      aria-label="Favorite"
      className={styles.Button}
      render={(props, state) => {
        if (state.pressed) {
          return (
            <button type="button" {...props}>
              <HeartFilledIcon />
            </button>
          );
        }
        return (
          <button type="button" {...props}>
            <HeartOutlineIcon />
          </button>
        );
      }}
    />
  ),
};

/** Dark-theme variant of Hero (Chromatic coverage of the dark semantic layer). */
export const Dark: Story = {
  ...Hero,
  globals: { theme: 'dark' },
};

/** Uncontrolled: `defaultPressed` seeds the initial state; clicking flips `aria-pressed` and `data-pressed`. */
export const UncontrolledPressed: Story = {
  render: () => (
    <div className={styles.Row}>
      <Toggle aria-label="Bold" defaultPressed={false} className={styles.Button}>
        B
      </Toggle>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole('button', { name: 'Bold' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveAttribute('data-pressed', '');

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  },
};

function ControlledPressedExample() {
  const [pressed, setPressed] = React.useState(false);
  return (
    <div className={styles.Row}>
      <label>
        <input
          type="checkbox"
          checked={pressed}
          onChange={() => setPressed((current) => !current)}
        />{' '}
        Bold externally
      </label>
      <Toggle aria-label="Bold" pressed={pressed} className={styles.Button}>
        B
      </Toggle>
    </div>
  );
}

/**
 * Controlled: `pressed` is driven entirely by external state (here a plain
 * checkbox), with the Toggle following in lockstep — recreates the exact
 * pattern in `Toggle.test.tsx` "controlled" (checkbox click flips the
 * Toggle's `aria-pressed`, not the other way around, since no
 * `onPressedChange` is wired here).
 */
export const ControlledPressed: Story = {
  render: () => <ControlledPressedExample />,
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox');
    const toggle = canvas.getByRole('button', { name: 'Bold' });

    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(checkbox);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(checkbox);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  },
};

/**
 * `disabled` prevents all interaction: `aria-pressed` stays fixed and
 * `onPressedChange` never fires, matching `Toggle.test.tsx` "prop: disabled".
 */
export const Disabled: Story = {
  render: () => {
    function DisabledExample() {
      const [pressedCount, setPressedCount] = React.useState(0);
      return (
        <div className={styles.Row}>
          <Toggle
            aria-label="Bold"
            disabled
            className={styles.Button}
            onPressedChange={() => setPressedCount((count) => count + 1)}
          >
            B
          </Toggle>
          <span className={styles.Output}>Changes: {pressedCount}</span>
        </div>
      );
    }
    return <DisabledExample />;
  },
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole('button', { name: 'Bold' });
    await expect(toggle).toHaveAttribute('disabled');
    await expect(toggle).toHaveAttribute('data-disabled');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getByText('Changes: 0')).toBeVisible();
  },
};

function CancelPressChangeExample() {
  return (
    <Toggle
      aria-label="Locked toggle"
      defaultPressed={false}
      className={styles.Button}
      onPressedChange={(_pressed, eventDetails) => {
        eventDetails.cancel();
      }}
    >
      B
    </Toggle>
  );
}

/**
 * `onPressedChange`'s `eventDetails.cancel()` vetoes the press entirely:
 * `aria-pressed` never flips despite the click firing, matching
 * `Toggle.test.tsx` "does not change the pressed state when the event is
 * canceled".
 */
export const CancelPressChange: Story = {
  render: () => <CancelPressChangeExample />,
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole('button', { name: 'Locked toggle' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  },
};

function InsideToggleGroupExample() {
  const [changeCount, setChangeCount] = React.useState(0);
  return (
    <div className={styles.Row}>
      <ToggleGroup
        multiple
        aria-label="Formatting"
        className={styles.Row}
        onValueChange={() => setChangeCount((count) => count + 1)}
      >
        <Toggle
          aria-label="Bold (vetoes the group)"
          value="bold"
          className={styles.Button}
          onPressedChange={(_pressed, eventDetails) => {
            eventDetails.cancel();
          }}
        >
          B
        </Toggle>
        <Toggle aria-label="Italic" value="italic" className={styles.Button}>
          I
        </Toggle>
      </ToggleGroup>
      <span className={styles.Output}>Group changes: {changeCount}</span>
    </div>
  );
}

/**
 * A Toggle nested inside `ToggleGroup` shares its `eventDetails` with the
 * group: canceling a grouped Toggle's `onPressedChange` also prevents the
 * group's own `onValueChange` from firing — matching `Toggle.test.tsx`
 * "canceling in a grouped Toggle prevents the group value from changing".
 * The sibling "Italic" toggle is unaffected and still fires the group's
 * `onValueChange` normally.
 *
 * (`RichTextFormattingToggle`, a static standalone bold/italic/underline
 * composition from the story plan, is intentionally not added — it would
 * duplicate the `toggle-group` stories' `Multiple` story, which already
 * covers the same visual archetype with a play function.)
 */
export const InsideToggleGroup: Story = {
  render: () => <InsideToggleGroupExample />,
  play: async ({ canvas, userEvent }) => {
    const bold = canvas.getByRole('button', { name: 'Bold (vetoes the group)' });
    const italic = canvas.getByRole('button', { name: 'Italic' });

    await userEvent.click(bold);
    await expect(bold).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getByText('Group changes: 0')).toBeVisible();

    await userEvent.click(italic);
    await expect(italic).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText('Group changes: 1')).toBeVisible();
  },
};
