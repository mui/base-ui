import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { PreviewCard } from '@base-ui/react/preview-card';
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
  tags: ['ai-generated'],
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
                <strong>Typography</strong> is the art and science of arranging type to make
                written language clear, visually appealing, and effective in communication.
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
        <PreviewCard.Trigger className={styles.Link} href="https://en.wikipedia.org/wiki/Typography">
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
