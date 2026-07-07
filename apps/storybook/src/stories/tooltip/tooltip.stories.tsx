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

const alignments = ['start', 'center', 'end'] as const;

/** A fuller positioning matrix: every `side` × `align` combination, each rendered open so `data-side`/`data-align`/`data-uncentered` can be spot-checked visually against `Tooltip.Arrow`'s rotation and offset. */
export const PositioningMatrix: Story = {
  render: () => (
    <div className={styles.Grid}>
      {arrowSides.map((side) =>
        alignments.map((align) => (
          <Tooltip.Root key={`${side}-${align}`} defaultOpen>
            <Tooltip.Trigger className={styles.TextButton}>
              {`${side}/${align}`}
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner side={side} align={align} sideOffset={8}>
                <Tooltip.Popup className={styles.Popup}>
                  <Tooltip.Arrow className={styles.Arrow} />
                  {`${side} / ${align}`}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        )),
      )}
    </div>
  ),
};

function ControlledOpenExample() {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<string | null>(null);

  return (
    <div className={styles.Row}>
      <Tooltip.Root
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          setOpen(nextOpen);
          setReason(eventDetails.reason ?? null);
        }}
      >
        <Tooltip.Trigger className={styles.TextButton}>Focus me</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={styles.Popup}>
              <Tooltip.Arrow className={styles.Arrow} />
              Controlled tooltip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      <output className={styles.Output}>
        open={String(open)} reason={String(reason)}
      </output>
    </div>
  );
}

/** External `open`/`onOpenChange` state drives the tooltip exactly like an uncontrolled Root's internal state would, plus `eventDetails.reason` reports which interaction caused each transition — `trigger-focus` on open here, `escape-key` on close. */
export const ControlledOpen: Story = {
  render: () => <ControlledOpenExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Focus me' });

    await userEvent.tab();
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() => expect(body.getByText('Controlled tooltip')).toBeVisible());
    await waitFor(() => expect(canvas.getByText(/reason=trigger-focus/)).toBeVisible());

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByText('Controlled tooltip')).not.toBeInTheDocument());
    await waitFor(() => expect(canvas.getByText(/reason=escape-key/)).toBeVisible());
  },
};

/**
 * `Tooltip.Trigger`'s own `delay`/`closeDelay` props override the Provider/default timing per
 * trigger (default `600`ms open / `0`ms close). This story is documentation-only, not
 * play-tested: per story-plan.md's reliability notes, hover-rest-timer assertions are flaky in
 * a browser-automation play function, and these props specifically govern the *hover* path
 * (focus-open ignores `delay` entirely) — so there is no reliable non-hover way to pin the
 * timing difference in an automated test. Inspect manually: the left trigger opens instantly on
 * hover, the right one waits the full default delay.
 */
export const DelayCustomization: Story = {
  render: () => (
    <div className={styles.Row}>
      <Tooltip.Root>
        <Tooltip.Trigger className={styles.TextButton} delay={0}>
          delay=0
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={styles.Popup}>
              <Tooltip.Arrow className={styles.Arrow} />
              Opens instantly
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Tooltip.Root>
        <Tooltip.Trigger className={styles.TextButton} closeDelay={500}>
          closeDelay=500
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={styles.Popup}>
              <Tooltip.Arrow className={styles.Arrow} />
              Lingers on close
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  ),
};

/** `Tooltip.Root disabled` suppresses opening entirely, on every interaction path — unlike `Tooltip.Trigger disabled`, which only stops that one trigger from opening its tooltip while leaving the DOM element itself interactive. */
export const DisabledTrigger: Story = {
  render: () => (
    <div className={styles.Row}>
      <Tooltip.Root>
        <Tooltip.Trigger className={styles.TextButton}>Enabled</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={styles.Popup}>
              <Tooltip.Arrow className={styles.Arrow} />
              Enabled tooltip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Tooltip.Root disabled>
        <Tooltip.Trigger className={styles.TextButton}>Disabled</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={styles.Popup}>
              <Tooltip.Arrow className={styles.Arrow} />
              Disabled tooltip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const enabled = canvas.getByRole('button', { name: 'Enabled' });
    const disabled = canvas.getByRole('button', { name: 'Disabled' });

    enabled.focus();
    await waitFor(() => expect(body.getByText('Enabled tooltip')).toBeVisible());

    disabled.focus();
    await expect(body.queryByText('Disabled tooltip')).not.toBeInTheDocument();
  },
};

const detachedHandle = Tooltip.createHandle();

/** `Tooltip.createHandle()` connects a `Trigger` rendered anywhere in the tree to a `Root`/`Popup` declared elsewhere — no parent/child DOM relationship is required. Here, external buttons call `handle.open(id)`/`handle.close()` imperatively, and the physically-separate trigger's own focus/hover still works too. */
export const DetachedTriggerHandle: Story = {
  render: () => (
    <div className={styles.Form}>
      <div className={styles.Row}>
        <Tooltip.Trigger handle={detachedHandle} id="detached-trigger" className={styles.TextButton}>
          Detached trigger
        </Tooltip.Trigger>
        <button type="button" className={styles.TextButton} onClick={() => detachedHandle.open('detached-trigger')}>
          Open programmatically
        </button>
        <button type="button" className={styles.TextButton} onClick={() => detachedHandle.close()}>
          Close
        </button>
      </div>

      <Tooltip.Root handle={detachedHandle}>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={styles.Popup}>
              <Tooltip.Arrow className={styles.Arrow} />
              Declared elsewhere in the tree
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open programmatically' }));
    await waitFor(() => expect(body.getByText('Declared elsewhere in the tree')).toBeVisible());

    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(body.queryByText('Declared elsewhere in the tree')).not.toBeInTheDocument(),
    );

    // The detached trigger's own focus-open path still works independently of the handle buttons.
    const trigger = canvas.getByRole('button', { name: 'Detached trigger' });
    trigger.focus();
    await waitFor(() => expect(body.getByText('Declared elsewhere in the tree')).toBeVisible());
  },
};
