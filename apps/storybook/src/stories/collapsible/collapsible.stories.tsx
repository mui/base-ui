import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Collapsible } from '@base-ui/react/collapsible';
import styles from './collapsible.module.css';

/**
 * Stories follow research/c-components/collapsible (Tier 3, lean brief): the
 * hero Trigger+Panel demo, `keepMounted`, and `hiddenUntilFound` (browser
 * find-in-page support).
 *
 * Collapsible is the shared primitive Accordion is built on — each
 * `Accordion.Item` calls `useCollapsibleRoot`/`useCollapsiblePanel` directly
 * rather than reimplementing open/close/measurement logic (brief §1). Unlike
 * Accordion, Collapsible coordinates with no siblings: it has no `value`
 * prop, just a single boolean `open` state.
 */
const meta = {
  title: 'Disclosure & structure/Collapsible',
  component: Collapsible.Root,
  subcomponents: {
    'Collapsible.Trigger': Collapsible.Trigger,
    'Collapsible.Panel': Collapsible.Panel,
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof Collapsible.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

function CaretRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M6 12V4l4.5 4z" />
    </svg>
  );
}

/** The docs hero demo: a single Trigger+Panel pair, closed by default. */
export const Hero: Story = {
  render: () => (
    <Collapsible.Root className={styles.Collapsible}>
      <Collapsible.Trigger className={styles.Trigger}>
        Recovery keys
        <CaretRightIcon className={styles.Icon} />
      </Collapsible.Trigger>
      <Collapsible.Panel className={styles.Panel}>
        <div className={styles.Content}>
          <div>alien-bean-pasta</div>
          <div>wild-irish-burrito</div>
          <div>horse-battery-staple</div>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Recovery keys' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByText('alien-bean-pasta')).not.toBeInTheDocument();

    await userEvent.click(trigger);

    // Panel height animates via `--collapsible-panel-height`; wait for the
    // transition to settle before asserting the panel content is visible.
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(canvas.getByText('alien-bean-pasta')).toBeVisible());

    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await waitFor(() => expect(canvas.queryByText('alien-bean-pasta')).not.toBeInTheDocument());
  },
};

/**
 * `keepMounted` keeps the panel's DOM node present (hidden, not unmounted)
 * even while closed — useful for preserving scroll/focus/form state inside
 * the panel, or for driving a JS animation library across closes.
 */
export const KeepMounted: Story = {
  render: () => (
    <Collapsible.Root className={styles.Collapsible} defaultOpen={false}>
      <Collapsible.Trigger className={styles.Trigger}>
        Recovery keys
        <CaretRightIcon className={styles.Icon} />
      </Collapsible.Trigger>
      <Collapsible.Panel className={styles.Panel} keepMounted>
        <div className={styles.Content}>
          <div>alien-bean-pasta</div>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
  play: async ({ canvasElement }) => {
    // Closed, but present in the DOM — not unmounted like the default story.
    const panel = canvasElement.querySelector('[hidden]');
    await expect(panel).not.toBeNull();
    await expect(panel).toHaveTextContent('alien-bean-pasta');
  },
};

/**
 * `hiddenUntilFound` uses `hidden="until-found"` instead of unmounting or
 * `display:none`, so the browser's built-in Ctrl/Cmd+F find-in-page search
 * can locate and auto-expand collapsed content. Dispatching a `beforematch`
 * event (as the browser does right before revealing a match) opens the panel
 * the same way a real find-in-page hit would.
 */
export const HiddenUntilFound: Story = {
  render: () => (
    <Collapsible.Root className={styles.Collapsible} defaultOpen={false}>
      <Collapsible.Trigger className={styles.Trigger}>
        Recovery keys
        <CaretRightIcon className={styles.Icon} />
      </Collapsible.Trigger>
      <Collapsible.Panel className={styles.Panel} hiddenUntilFound>
        <div className={styles.Content}>
          <div>alien-bean-pasta</div>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
  play: async ({ canvasElement, canvas }) => {
    // Closed state uses the string value "until-found", not a plain boolean
    // `hidden` — the distinction the browser needs to keep the content
    // searchable while visually collapsed.
    const panel = canvasElement.querySelector('[hidden]');
    await expect(panel).toHaveAttribute('hidden', 'until-found');

    panel!.dispatchEvent(new window.Event('beforematch', { bubbles: true, cancelable: false }));

    await waitFor(() => expect(canvas.getByText('alien-bean-pasta')).toBeVisible());
  },
};
