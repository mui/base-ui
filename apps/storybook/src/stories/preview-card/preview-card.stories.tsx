import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { PreviewCard } from '@base-ui/react/preview-card';
import { Tooltip } from '@base-ui/react/tooltip';
import styles from './preview-card.module.css';

/**
 * Stories follow research/c-components/preview-card (Tier 2, floor coverage):
 * the hero recreation (link trigger + rich card, per the docs hero demo), the
 * keyboard focus-open interaction (the same 600ms delay as hover, per
 * brief.md §6 — this is the one input modality besides mouse hover that
 * still works), and a positioning/Arrow story.
 */
const meta = {
  title: 'Overlays/Preview Card',
  component: PreviewCard.Root,
  subcomponents: {
    'PreviewCard.Trigger': PreviewCard.Trigger,
    'PreviewCard.Portal': PreviewCard.Portal,
    'PreviewCard.Positioner': PreviewCard.Positioner,
    'PreviewCard.Popup': PreviewCard.Popup,
    'PreviewCard.Arrow': PreviewCard.Arrow,
  },
} satisfies Meta<typeof PreviewCard.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: a link inline in a sentence previews its Wikipedia destination on hover/focus — image + bolded term + one-paragraph summary. Use as the starting point for any rich, hoverable link preview. */
export const Hero: Story = {
  render: () => (
    <PreviewCard.Root>
      <p className={styles.Paragraph}>
        The principles of good{' '}
        <PreviewCard.Trigger
          className={styles.Link}
          href="https://en.wikipedia.org/wiki/Typography"
        >
          typography
        </PreviewCard.Trigger>{' '}
        remain in the digital age.
      </p>

      <PreviewCard.Portal>
        <PreviewCard.Positioner className={styles.Positioner} sideOffset={8}>
          <PreviewCard.Popup className={styles.Popup}>
            <PreviewCard.Arrow className={styles.Arrow} />
            <div className={styles.PopupContent}>
              <img
                width="224"
                height="150"
                className={styles.Image}
                src="https://images.unsplash.com/photo-1619615391095-dfa29e1672ef?q=80&w=448&h=300"
                alt="Station Hofplein signage in Rotterdam, Netherlands"
              />
              <p className={styles.Summary}>
                <strong>Typography</strong> is the art and science of arranging type to make written
                language clear, visually appealing, and effective in communication.
              </p>
            </div>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  ),
};

/** Focus opens the preview card too, with the same 600ms delay as hover (`useFocus(..., { delay })` is wired unconditionally — brief.md §6). This is the one non-mouse modality Preview Card still supports; touch and screen readers never trigger it (see the MDX page). */
export const KeyboardFocusOpen: Story = {
  render: () => (
    <PreviewCard.Root>
      <p className={styles.Paragraph}>
        Read more about{' '}
        <PreviewCard.Trigger
          className={styles.Link}
          href="https://en.wikipedia.org/wiki/Typography"
        >
          typography
        </PreviewCard.Trigger>{' '}
        before you start.
      </p>
      <PreviewCard.Portal>
        <PreviewCard.Positioner className={styles.Positioner} sideOffset={8}>
          <PreviewCard.Popup className={styles.Popup}>
            <PreviewCard.Arrow className={styles.Arrow} />
            <div className={styles.PopupContent}>
              <p className={styles.Summary}>
                <strong>Typography</strong> is the art of arranging type.
              </p>
            </div>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('link', { name: 'typography' });

    // Tab to the link and focus it — no mouse events involved.
    await userEvent.tab();
    await waitFor(() => expect(trigger).toHaveFocus());

    // Focus pays the same 600ms delay as hover, so wait generously.
    await waitFor(() => expect(body.getByText(/is the art of arranging type/)).toBeVisible(), {
      timeout: 2000,
    });

    // Blurring away (tabbing off the link) closes the card again.
    await userEvent.tab();
    await waitFor(
      () => expect(body.queryByText(/is the art of arranging type/)).not.toBeInTheDocument(),
      { timeout: 2000 },
    );
  },
};

const arrowSides = ['top', 'right', 'bottom', 'left'] as const;

/** All positioning lives on the Positioner: `side`, `align`, `sideOffset`. `PreviewCard.Arrow`'s `data-side` attribute drives the rotation so one CSS-only arrow serves all four placements — the same contract as Tooltip and Popover. */
export const PositioningWithArrow: Story = {
  render: () => (
    <div className={styles.Container}>
      {arrowSides.map((side) => (
        <PreviewCard.Root key={side} defaultOpen>
          <PreviewCard.Trigger
            className={styles.Link}
            href="https://en.wikipedia.org/wiki/Typography"
          >
            {side}
          </PreviewCard.Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner className={styles.Positioner} side={side} sideOffset={8}>
              <PreviewCard.Popup className={styles.Popup}>
                <PreviewCard.Arrow className={styles.Arrow} />
                <div className={styles.PopupContent}>
                  <p className={styles.Summary}>{`side="${side}"`}</p>
                </div>
              </PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>
      ))}
    </div>
  ),
};

function ControlledOpenExample() {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<string | null>(null);

  return (
    <div className={styles.Stack}>
      <PreviewCard.Root
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          setOpen(nextOpen);
          setReason(eventDetails.reason ?? null);
        }}
      >
        <p className={styles.Paragraph}>
          Focus{' '}
          <PreviewCard.Trigger
            className={styles.Link}
            href="https://en.wikipedia.org/wiki/Typography"
          >
            this link
          </PreviewCard.Trigger>{' '}
          to open it.
        </p>
        <PreviewCard.Portal>
          <PreviewCard.Positioner className={styles.Positioner} sideOffset={8}>
            <PreviewCard.Popup className={styles.Popup}>
              <PreviewCard.Arrow className={styles.Arrow} />
              <div className={styles.PopupContent}>
                <p className={styles.Summary}>Controlled preview card</p>
              </div>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
      <output className={styles.Output}>
        open={String(open)} reason={String(reason)}
      </output>
    </div>
  );
}

/** External `open`/`onOpenChange` state drives the card exactly like an uncontrolled Root's internal state would, plus `eventDetails.reason` reports which interaction caused each transition — `trigger-focus` on open here, `escape-key` on close. */
export const ControlledOpen: Story = {
  render: () => <ControlledOpenExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('link', { name: 'this link' });

    await userEvent.tab();
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() => expect(body.getByText('Controlled preview card')).toBeVisible(), {
      timeout: 2000,
    });
    await waitFor(() => expect(canvas.getByText(/reason=trigger-focus/)).toBeVisible());

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByText('Controlled preview card')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(canvas.getByText(/reason=escape-key/)).toBeVisible());
  },
};

/** `PreviewCard.Trigger`'s own `delay`/`closeDelay` props (default `600`/`300`ms) override the timing per trigger — since focus obeys the same delay as hover (unlike Tooltip), this can be pinned reliably via focus: the `delay={0}` trigger opens near-instantly, the default-delay trigger opens only after the full ~600ms wait. */
export const DelayTuning: Story = {
  render: () => (
    <div className={styles.Container}>
      <PreviewCard.Root>
        <p className={styles.Paragraph}>
          <PreviewCard.Trigger
            className={styles.Link}
            delay={0}
            href="https://en.wikipedia.org/wiki/Typography"
          >
            instant
          </PreviewCard.Trigger>
        </p>
        <PreviewCard.Portal>
          <PreviewCard.Positioner className={styles.Positioner} sideOffset={8}>
            <PreviewCard.Popup className={styles.Popup}>
              <PreviewCard.Arrow className={styles.Arrow} />
              <div className={styles.PopupContent}>
                <p className={styles.Summary}>Opens with delay=0</p>
              </div>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>

      <PreviewCard.Root>
        <p className={styles.Paragraph}>
          <PreviewCard.Trigger
            className={styles.Link}
            href="https://en.wikipedia.org/wiki/Typography"
          >
            default delay
          </PreviewCard.Trigger>
        </p>
        <PreviewCard.Portal>
          <PreviewCard.Positioner className={styles.Positioner} sideOffset={8}>
            <PreviewCard.Popup className={styles.Popup}>
              <PreviewCard.Arrow className={styles.Arrow} />
              <div className={styles.PopupContent}>
                <p className={styles.Summary}>Opens after the default 600ms delay</p>
              </div>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    const instant = canvas.getByRole('link', { name: 'instant' });
    instant.focus();
    await waitFor(() => expect(body.getByText('Opens with delay=0')).toBeVisible());

    const withDefaultDelay = canvas.getByRole('link', { name: 'default delay' });
    withDefaultDelay.focus();
    await waitFor(
      () => expect(body.getByText('Opens after the default 600ms delay')).toBeVisible(),
      { timeout: 2000 },
    );
  },
};

/**
 * The boundary from the parent brief: Tooltip labels a non-link control ("the point of
 * interacting with the trigger is unrelated to the tooltip content"); Preview Card previews
 * where a real `<a href>` link goes. Rendering both side by side in the same sentence makes the
 * distinction concrete — hover/focus each in turn and compare trigger element and popup content.
 * Litmus test verbatim from brief.md §4 (colmtuite, mui/base-ui#4778): "If you're not rendering
 * a link, you should not use PreviewCard."
 */
export const TooltipVsPreviewCardDistinction: Story = {
  render: () => (
    <p className={styles.Paragraph}>
      Click{' '}
      <Tooltip.Root>
        <Tooltip.Trigger render={<button type="button" />} className={styles.Button}>
          Copy
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={styles.Popup}>Copy to clipboard</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>{' '}
      to copy this snippet, or read more about{' '}
      <PreviewCard.Root>
        <PreviewCard.Trigger
          className={styles.Link}
          href="https://en.wikipedia.org/wiki/Typography"
        >
          typography
        </PreviewCard.Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Positioner className={styles.Positioner} sideOffset={8}>
            <PreviewCard.Popup className={styles.Popup}>
              <PreviewCard.Arrow className={styles.Arrow} />
              <div className={styles.PopupContent}>
                <img
                  width="224"
                  height="150"
                  className={styles.Image}
                  src="https://images.unsplash.com/photo-1619615391095-dfa29e1672ef?q=80&w=448&h=300"
                  alt="Station Hofplein signage in Rotterdam, Netherlands"
                />
                <p className={styles.Summary}>
                  <strong>Typography</strong> is the art of arranging type.
                </p>
              </div>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>{' '}
      first.
    </p>
  ),
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);

    // The Tooltip trigger is a plain button; its content is short text only.
    const tooltipTrigger = canvas.getByRole('button', { name: 'Copy' });
    tooltipTrigger.focus();
    await waitFor(() => expect(body.getByText('Copy to clipboard')).toBeVisible());
    expect(body.queryByRole('img')).not.toBeInTheDocument();
    tooltipTrigger.blur();
    await waitFor(() => expect(body.queryByText('Copy to clipboard')).not.toBeInTheDocument());

    // The Preview Card trigger is a real link; its content is richer (image + summary).
    const previewCardTrigger = canvas.getByRole('link', { name: 'typography' });
    previewCardTrigger.focus();
    await waitFor(() => expect(body.getByRole('img')).toBeVisible(), { timeout: 2000 });
  },
};

const detachedHandle = PreviewCard.createHandle();

/** `PreviewCard.createHandle()` connects a `Trigger` rendered anywhere in the tree to a `Root`/`Popup` declared elsewhere — no DOM parent/child relationship required, mirroring Tooltip's detached-trigger pattern. */
export const DetachedTriggerWithHandle: Story = {
  render: () => (
    <div className={styles.Stack}>
      <p className={styles.Paragraph}>
        See the{' '}
        <PreviewCard.Trigger
          handle={detachedHandle}
          id="detached-trigger"
          className={styles.Link}
          href="https://en.wikipedia.org/wiki/Typography"
        >
          detached trigger
        </PreviewCard.Trigger>{' '}
        above; its popup is declared separately below.
      </p>
      <button
        type="button"
        className={styles.Button}
        onClick={() => detachedHandle.open('detached-trigger')}
      >
        Open programmatically
      </button>
      <button type="button" className={styles.Button} onClick={() => detachedHandle.close()}>
        Close
      </button>

      <PreviewCard.Root handle={detachedHandle}>
        <PreviewCard.Portal>
          <PreviewCard.Positioner className={styles.Positioner} sideOffset={8}>
            <PreviewCard.Popup className={styles.Popup}>
              <PreviewCard.Arrow className={styles.Arrow} />
              <div className={styles.PopupContent}>
                <p className={styles.Summary}>Declared elsewhere in the tree</p>
              </div>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
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
  },
};
