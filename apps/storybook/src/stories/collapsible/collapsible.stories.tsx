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
  parameters: { chromatic: { disableSnapshot: true } },
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

function ControlledCollapsibleDemo() {
  const [open, setOpen] = React.useState(false);
  const [lastReason, setLastReason] = React.useState<string | null>(null);

  return (
    <div>
      <div className={styles.ExternalControls}>
        <button type="button" className={styles.ExternalButton} onClick={() => setOpen((v) => !v)}>
          Toggle externally
        </button>
      </div>
      <Collapsible.Root
        className={styles.Collapsible}
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          setOpen(nextOpen);
          setLastReason(eventDetails.reason ?? null);
        }}
      >
        <Collapsible.Trigger className={styles.Trigger}>
          Recovery keys
          <CaretRightIcon className={styles.Icon} />
        </Collapsible.Trigger>
        <Collapsible.Panel className={styles.Panel}>
          <div className={styles.Content}>
            <div>alien-bean-pasta</div>
          </div>
        </Collapsible.Panel>
      </Collapsible.Root>
      <div className={styles.Log} data-testid="reason-log">
        last onOpenChange reason: {lastReason ?? 'none yet'}
      </div>
    </div>
  );
}

/**
 * `open` can be driven from anywhere, not just the Trigger — here, an
 * external button outside the Collapsible tree entirely. `onOpenChange`'s
 * `eventDetails.reason` distinguishes how the change happened: pressing the
 * Trigger reports `'trigger-press'`; the external button here calls
 * `setOpen` directly and never goes through `onOpenChange` at all, since it
 * isn't the Trigger driving the change.
 */
export const Controlled: Story = {
  render: () => <ControlledCollapsibleDemo />,
  play: async ({ canvas, userEvent }) => {
    const externalButton = canvas.getByRole('button', { name: 'Toggle externally' });
    const trigger = canvas.getByRole('button', { name: 'Recovery keys' });
    const reasonLog = canvas.getByTestId('reason-log');

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(reasonLog).toHaveTextContent('last onOpenChange reason: none yet');

    await userEvent.click(externalButton);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    // The external button sets `open` directly — no `onOpenChange` reason.
    await expect(reasonLog).toHaveTextContent('last onOpenChange reason: none yet');

    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    // Pressing the Trigger itself reports back through onOpenChange.
    await waitFor(() =>
      expect(reasonLog).toHaveTextContent('last onOpenChange reason: trigger-press'),
    );
  },
};

/**
 * The Panel's height is driven by `--collapsible-panel-height`
 * (`CollapsiblePanelCssVars`), written as an inline style on the Panel node
 * itself. This asserts the mechanism directly — the rendered height grows
 * from `0` while opening and returns to `0` while closing — rather than just
 * asserting the CSS recipe is present in the stylesheet.
 */
export const AnimatedHeight: Story = {
  render: () => (
    <Collapsible.Root className={styles.Collapsible}>
      <Collapsible.Trigger className={styles.Trigger}>
        Recovery keys
        <CaretRightIcon className={styles.Icon} />
      </Collapsible.Trigger>
      <Collapsible.Panel className={styles.Panel} data-testid="animated-panel" keepMounted>
        <div className={styles.Content}>
          <div>alien-bean-pasta</div>
          <div>wild-irish-burrito</div>
          <div>horse-battery-staple</div>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
  play: async ({ canvasElement, canvas, userEvent }) => {
    // `keepMounted` keeps the panel present (but hidden) at all times, so
    // its height can be measured before the very first open.
    const panel = canvasElement.querySelector('[data-testid="animated-panel"]') as HTMLElement;
    const trigger = canvas.getByRole('button', { name: 'Recovery keys' });

    await expect(panel.getBoundingClientRect().height).toBe(0);

    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(panel.getBoundingClientRect().height).toBeGreaterThan(0));
    await waitFor(() =>
      expect(panel.style.getPropertyValue('--collapsible-panel-height')).not.toBe('0px'),
    );

    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await waitFor(() => expect(panel.getBoundingClientRect().height).toBe(0));
  },
};

/**
 * Root-level `disabled`: the Trigger never toggles the panel (click or
 * keyboard) and `onOpenChange` never fires, but the Trigger stays focusable
 * (`focusableWhenDisabled`) instead of being removed from the tab order.
 */
export const Disabled: Story = {
  render: () => {
    function DisabledDemo() {
      const onOpenChange = () => {
        throw new Error('onOpenChange must not be called while disabled');
      };
      return (
        <Collapsible.Root className={styles.Collapsible} disabled onOpenChange={onOpenChange}>
          <Collapsible.Trigger className={styles.Trigger}>
            Recovery keys
            <CaretRightIcon className={styles.Icon} />
          </Collapsible.Trigger>
          <Collapsible.Panel className={styles.Panel}>
            <div className={styles.Content}>
              <div>alien-bean-pasta</div>
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      );
    }
    return <DisabledDemo />;
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Recovery keys' });

    trigger.focus();
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute('data-disabled');

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByText('alien-bean-pasta')).not.toBeInTheDocument();

    await userEvent.keyboard('{Enter}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/**
 * A `Collapsible.Panel` can contain an entirely independent, nested
 * `Collapsible.Root`. Unlike Accordion, Collapsible does not coordinate with
 * any siblings at all — the outer panel can be closed without first closing
 * the inner one, and vice versa.
 */
export const Nested: Story = {
  render: () => (
    <Collapsible.Root className={styles.Collapsible}>
      <Collapsible.Trigger className={styles.Trigger}>
        Recovery keys
        <CaretRightIcon className={styles.Icon} />
      </Collapsible.Trigger>
      <Collapsible.Panel className={styles.Panel}>
        <div className={styles.Content}>
          <div>alien-bean-pasta</div>
          <Collapsible.Root className={`${styles.Collapsible} ${styles.NestedCollapsible}`}>
            <Collapsible.Trigger className={styles.Trigger}>
              Backup phrase
              <CaretRightIcon className={styles.Icon} />
            </Collapsible.Trigger>
            <Collapsible.Panel className={styles.Panel}>
              <div className={styles.Content}>
                <div>horse-battery-staple</div>
              </div>
            </Collapsible.Panel>
          </Collapsible.Root>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const outerTrigger = canvas.getByRole('button', { name: 'Recovery keys' });
    await userEvent.click(outerTrigger);
    await waitFor(() => expect(outerTrigger).toHaveAttribute('aria-expanded', 'true'));

    const innerTrigger = canvas.getByRole('button', { name: 'Backup phrase' });
    await userEvent.click(innerTrigger);
    await waitFor(() => expect(innerTrigger).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(canvas.getByText('horse-battery-staple')).toBeVisible());

    // Closing the outer one does not require the inner one to close first —
    // no forced coordination, unlike Accordion.
    await userEvent.click(outerTrigger);
    await waitFor(() => expect(outerTrigger).toHaveAttribute('aria-expanded', 'false'));
  },
};

/** A single Collapsible composed inside a settings-card layout, showing it works normally embedded in ordinary surrounding markup rather than as a standalone widget. */
export const WithinCard: Story = {
  render: () => (
    <div className={styles.Card}>
      <div className={styles.CardHeader}>Security</div>
      <div className={styles.CardBody}>
        <Collapsible.Root className={styles.Collapsible}>
          <Collapsible.Trigger className={styles.Trigger}>
            Recovery keys
            <CaretRightIcon className={styles.Icon} />
          </Collapsible.Trigger>
          <Collapsible.Panel className={styles.Panel}>
            <div className={styles.Content}>
              <div>alien-bean-pasta</div>
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      </div>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Recovery keys' });
    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(canvas.getByText('alien-bean-pasta')).toBeVisible());
  },
};
