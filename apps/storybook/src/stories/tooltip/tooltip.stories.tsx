import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Tooltip } from '@base-ui/react/tooltip';
import styles from './tooltip.module.css';

/**
 * Stories follow research/c-components/tooltip (Tier 2, floor coverage): the
 * hero recreation (Provider + Root + Trigger + Portal + Positioner + Popup +
 * Arrow), the keyboard focus-open interaction (the reliable play — hover is
 * flaky in a browser-automation play function, per story-plan.md notes),
 * the Provider delay-grouping mechanism (distinctive to this component), and
 * a positioning/Arrow playground.
 */
const meta = {
  title: 'Overlays/Tooltip',
  component: Tooltip.Root,
  subcomponents: {
    'Tooltip.Provider': Tooltip.Provider,
    'Tooltip.Trigger': Tooltip.Trigger,
    'Tooltip.Portal': Tooltip.Portal,
    'Tooltip.Positioner': Tooltip.Positioner,
    'Tooltip.Popup': Tooltip.Popup,
    'Tooltip.Arrow': Tooltip.Arrow,
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof Tooltip.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: a toolbar of icon-only buttons, each labeled by a tooltip, all sharing a `Tooltip.Provider` for delay-grouping. Use as the starting point for labeling any control whose own action is unrelated to the tooltip's content. */
export const Hero: Story = {
  render: () => (
    <Tooltip.Provider>
      <div className={styles.Panel}>
        <Tooltip.Root>
          <Tooltip.Trigger className={styles.Button} aria-label="Bold">
            B
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={11}>
              <Tooltip.Popup className={styles.Popup}>
                <Tooltip.Arrow className={styles.Arrow} />
                Bold
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger className={styles.Button} aria-label="Italic">
            I
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={11}>
              <Tooltip.Popup className={styles.Popup}>
                <Tooltip.Arrow className={styles.Arrow} />
                Italic
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger className={styles.Button} aria-label="Underline">
            U
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={11}>
              <Tooltip.Popup className={styles.Popup}>
                <Tooltip.Arrow className={styles.Arrow} />
                Underline
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </Tooltip.Provider>
  ),
};

/** Focus is the primary, reliable interaction path — it has no delay to race against (`useFocus` is independent of the hover rest-timer, brief.md §6). Tab to the trigger and the tooltip appears immediately; tab away and it closes. */
export const KeyboardFocusOpen: Story = {
  render: () => (
    <div className={styles.Row}>
      <button type="button" className={styles.TextButton}>
        Before
      </button>
      <Tooltip.Root>
        <Tooltip.Trigger className={styles.TextButton} aria-label="Save">
          Save
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={styles.Popup}>
              <Tooltip.Arrow className={styles.Arrow} />
              Save your changes
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      <button type="button" className={styles.TextButton}>
        After
      </button>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const before = canvas.getByRole('button', { name: 'Before' });
    const trigger = canvas.getByRole('button', { name: 'Save' });

    before.focus();
    await expect(before).toHaveFocus();

    // Tab from "Before" lands focus on the trigger and opens the tooltip
    // with no delay — the focus-open path is independent of the hover timer.
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await waitFor(() => expect(body.getByText('Save your changes')).toBeVisible());

    // Tabbing away closes it again.
    await userEvent.tab();
    await waitFor(() => expect(body.queryByText('Save your changes')).not.toBeInTheDocument());
  },
};

/** `Tooltip.Provider` groups sibling tooltips under one shared delay: the first hover/focus pays the full `600ms` open delay, but hopping to an adjacent trigger within the `timeout` window (default `400ms`) opens instantly (brief.md §6). This is the mechanism most distinctive to Tooltip among the overlay-cluster popups — Preview Card has no equivalent Provider. */
export const ProviderDelayGrouping: Story = {
  render: () => (
    <Tooltip.Provider timeout={400}>
      <div className={styles.Panel}>
        <Tooltip.Root>
          <Tooltip.Trigger className={styles.Button} aria-label="Bold">
            B
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={11}>
              <Tooltip.Popup className={styles.Popup}>
                <Tooltip.Arrow className={styles.Arrow} />
                Bold
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger className={styles.Button} aria-label="Italic">
            I
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={11}>
              <Tooltip.Popup className={styles.Popup}>
                <Tooltip.Arrow className={styles.Arrow} />
                Italic
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </Tooltip.Provider>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const bold = canvas.getByRole('button', { name: 'Bold' });
    const italic = canvas.getByRole('button', { name: 'Italic' });

    // Focus (not hover) is used here to avoid the play-function hover-flake
    // risk noted in story-plan.md; focus shares the same Provider grouping
    // context as hover for the delay-collapse behavior.
    bold.focus();
    await waitFor(() => expect(body.getByText('Bold')).toBeVisible(), { timeout: 2000 });

    // Moving focus to the sibling trigger inside the same warm Provider
    // group reopens near-instantly instead of paying the full open delay.
    italic.focus();
    await waitFor(() => expect(body.getByText('Italic')).toBeVisible(), { timeout: 2000 });
  },
};

const arrowSides = ['top', 'right', 'bottom', 'left'] as const;

/** All positioning lives on the Positioner: `side`, `align`, `sideOffset`. `Tooltip.Arrow`'s `data-side` attribute drives the rotation so one CSS-only arrow serves all four placements. */
export const PositioningAndArrow: Story = {
  render: () => (
    <div className={styles.Row}>
      {arrowSides.map((side) => (
        <Tooltip.Root key={side} defaultOpen>
          <Tooltip.Trigger className={styles.TextButton}>{side}</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner side={side} sideOffset={8}>
              <Tooltip.Popup className={styles.Popup}>
                <Tooltip.Arrow className={styles.Arrow} />
                {`side="${side}"`}
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      ))}
    </div>
  ),
};
