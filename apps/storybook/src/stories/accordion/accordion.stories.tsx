import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Accordion } from '@base-ui/react/accordion';
import styles from './accordion.module.css';

/**
 * Stories follow research/c-components/accordion (Tier 2): the hero FAQ demo
 * (single-open by default), the `multiple` behavior (two panels open at
 * once), and a disabled item.
 *
 * Accordion deliberately does NOT support arrow-key navigation between
 * headers — mui/base-ui#4965 removed roving focus to align with the current
 * W3C APG Accordion pattern (w3c/aria-practices#3434), and the companion
 * #4961 removed `role="region"` from `Accordion.Root` (it already lived
 * correctly on `Accordion.Panel`). Only Tab/Shift+Tab moves focus between
 * triggers — these stories never assert arrow-key behavior.
 */
const meta = {
  title: 'Disclosure & structure/Accordion',
  component: Accordion.Root,
  subcomponents: {
    'Accordion.Item': Accordion.Item,
    'Accordion.Header': Accordion.Header,
    'Accordion.Trigger': Accordion.Trigger,
    'Accordion.Panel': Accordion.Panel,
  },
} satisfies Meta<typeof Accordion.Root>;

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

const faqItems = [
  {
    value: 'what-is',
    question: 'What is Base UI?',
    answer:
      'Base UI is a library of high-quality unstyled React components for design systems and web apps.',
  },
  {
    value: 'get-started',
    question: 'How do I get started?',
    answer:
      "Head to the Quick start guide in the docs. If you've used unstyled libraries before, you'll feel at home.",
  },
  {
    value: 'my-project',
    question: 'Can I use it for my project?',
    answer: 'Of course! Base UI is free and open source.',
  },
] as const;

/**
 * The docs hero demo: a 3-item FAQ accordion, single-open by default
 * (`multiple` is omitted, so opening one item always replaces the value
 * array rather than stacking).
 */
export const Hero: Story = {
  render: () => (
    <Accordion.Root className={styles.Accordion} defaultValue={['what-is']}>
      {faqItems.map((item) => (
        <Accordion.Item key={item.value} value={item.value} className={styles.Item}>
          <Accordion.Header className={styles.Header}>
            <Accordion.Trigger className={styles.Trigger}>
              {item.question}
              <PlusIcon className={styles.Icon} />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={styles.Panel}>
            <div className={styles.Content}>{item.answer}</div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    // Item 1 starts open (defaultValue=['what-is']).
    await expect(canvas.getByText(faqItems[0].answer)).toBeVisible();

    const trigger2 = canvas.getByRole('button', { name: faqItems[1].question });
    await expect(trigger2).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger2);

    // Single-open mode: opening item 2 replaces item 1 in the value array.
    // Panel height animates via `--accordion-panel-height`, so wait for the
    // transition to finish before asserting either side of the swap.
    await waitFor(() => expect(trigger2).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(canvas.getByText(faqItems[1].answer)).toBeVisible());
    await waitFor(() => expect(canvas.queryByText(faqItems[0].answer)).not.toBeInTheDocument());
  },
};

/** Dark-theme variant of Hero (visual only — the interaction assertions stay on the light story). */
export const Dark: Story = {
  render: Hero.render,
  globals: { theme: 'dark' },
};

/**
 * `multiple` allows more than one panel to be open simultaneously — opening
 * item 2 no longer replaces item 1's open state.
 */
export const OpenMultiple: Story = {
  render: () => (
    <Accordion.Root className={styles.Accordion} multiple>
      {faqItems.map((item) => (
        <Accordion.Item key={item.value} value={item.value} className={styles.Item}>
          <Accordion.Header className={styles.Header}>
            <Accordion.Trigger className={styles.Trigger}>
              {item.question}
              <PlusIcon className={styles.Icon} />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={styles.Panel}>
            <div className={styles.Content}>{item.answer}</div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger1 = canvas.getByRole('button', { name: faqItems[0].question });
    const trigger2 = canvas.getByRole('button', { name: faqItems[1].question });

    await userEvent.click(trigger1);
    await waitFor(() => expect(trigger1).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(canvas.getByText(faqItems[0].answer)).toBeVisible());

    await userEvent.click(trigger2);
    await waitFor(() => expect(trigger2).toHaveAttribute('aria-expanded', 'true'));

    // Both panels are open simultaneously — the defining behavior of `multiple`.
    await waitFor(() => expect(canvas.getByText(faqItems[0].answer)).toBeVisible());
    await waitFor(() => expect(canvas.getByText(faqItems[1].answer)).toBeVisible());
  },
};

/**
 * A disabled item's trigger stays focusable (`focusableWhenDisabled`) but
 * never toggles open, whether by click or keyboard; sibling items are
 * unaffected.
 */
export const DisabledItem: Story = {
  render: () => (
    <Accordion.Root className={styles.Accordion} defaultValue={[]}>
      <Accordion.Item value="what-is" className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            {faqItems[0].question}
            <PlusIcon className={styles.Icon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>{faqItems[0].answer}</div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="get-started" disabled className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            {faqItems[1].question}
            <PlusIcon className={styles.Icon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>{faqItems[1].answer}</div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const disabledTrigger = canvas.getByRole('button', { name: faqItems[1].question });

    // Disabled but discoverable: it stays focusable via Tab, per the
    // library-wide `focusableWhenDisabled` composite-widget convention.
    disabledTrigger.focus();
    await expect(disabledTrigger).toHaveFocus();

    await userEvent.click(disabledTrigger);
    await expect(disabledTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByText(faqItems[1].answer)).not.toBeInTheDocument();

    // Sibling item still works normally.
    const enabledTrigger = canvas.getByRole('button', { name: faqItems[0].question });
    await userEvent.click(enabledTrigger);
    await waitFor(() => expect(enabledTrigger).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(canvas.getByText(faqItems[0].answer)).toBeVisible());
  },
};

function ControlledAccordionDemo() {
  const [value, setValue] = React.useState<string[]>(['what-is']);

  return (
    <div>
      <div className={styles.ExternalControls}>
        {faqItems.map((item) => (
          <button
            key={item.value}
            type="button"
            className={styles.ExternalButton}
            onClick={() => setValue([item.value])}
          >
            Open “{item.question}”
          </button>
        ))}
      </div>
      <Accordion.Root className={styles.Accordion} value={value} onValueChange={setValue}>
        {faqItems.map((item) => (
          <Accordion.Item key={item.value} value={item.value} className={styles.Item}>
            <Accordion.Header className={styles.Header}>
              <Accordion.Trigger className={styles.Trigger}>
                {item.question}
                <PlusIcon className={styles.Icon} />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className={styles.Panel}>
              <div className={styles.Content}>{item.answer}</div>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
}

/**
 * External `value`/`onValueChange` state, driven by buttons outside the
 * accordion entirely. Clicking an external button opens that item exactly as
 * clicking its own `Trigger` would, and clicking a `Trigger` reports back
 * through `onValueChange` so the external state stays in sync.
 */
export const ControlledValue: Story = {
  render: () => <ControlledAccordionDemo />,
  play: async ({ canvas, userEvent }) => {
    const openItem2Button = canvas.getByRole('button', {
      name: `Open “${faqItems[1].question}”`,
    });
    const trigger2 = canvas.getByRole('button', { name: faqItems[1].question });

    await userEvent.click(openItem2Button);
    await waitFor(() => expect(trigger2).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(canvas.getByText(faqItems[1].answer)).toBeVisible());
    // Single mode: opening item 2 externally replaced item 1, same as a click.
    await waitFor(() => expect(canvas.queryByText(faqItems[0].answer)).not.toBeInTheDocument());

    const trigger3 = canvas.getByRole('button', { name: faqItems[2].question });
    await userEvent.click(trigger3);
    await waitFor(() => expect(trigger3).toHaveAttribute('aria-expanded', 'true'));
    // Clicking a Trigger directly reports back through onValueChange too.
    await waitFor(() => expect(trigger2).toHaveAttribute('aria-expanded', 'false'));
  },
};

/**
 * The Panel's height is driven entirely by `--accordion-panel-height`
 * (`AccordionPanelCssVars`), the same measurement engine Collapsible uses.
 * This asserts the mechanism directly: the panel's rendered height grows from
 * `0` while opening and settles back to `0` while closing, rather than just
 * asserting the CSS recipe is present in the stylesheet.
 */
export const AnimatedPanelHeight: Story = {
  render: () => (
    <Accordion.Root className={styles.Accordion} defaultValue={[]}>
      <Accordion.Item value={faqItems[0].value} className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            {faqItems[0].question}
            <PlusIcon className={styles.Icon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel} data-testid="animated-panel" keepMounted>
          <div className={styles.Content}>{faqItems[0].answer}</div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  ),
  play: async ({ canvasElement, canvas, userEvent }) => {
    // `keepMounted` keeps the panel present (but hidden) at all times, so
    // its height can be measured before the very first open.
    const panel = canvasElement.querySelector('[data-testid="animated-panel"]') as HTMLElement;
    const trigger = canvas.getByRole('button', { name: faqItems[0].question });

    await expect(panel.getBoundingClientRect().height).toBe(0);

    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(panel.getBoundingClientRect().height).toBeGreaterThan(0));
    // `--accordion-panel-height` mirrors the measured content height while open.
    await waitFor(() =>
      expect(panel.style.getPropertyValue('--accordion-panel-height')).not.toBe('0px'),
    );

    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await waitFor(() => expect(panel.getBoundingClientRect().height).toBe(0));
  },
};

/**
 * `hiddenUntilFound` (Root or Panel level) uses `hidden="until-found"` instead
 * of unmounting, so the browser's native Ctrl/Cmd+F find-in-page search can
 * locate and auto-expand a closed panel — mirroring Collapsible's own
 * `hiddenUntilFound` contract (`AccordionPanel` delegates to
 * `useCollapsiblePanel` directly).
 */
export const HiddenUntilFound: Story = {
  render: () => (
    <Accordion.Root className={styles.Accordion} defaultValue={[]} hiddenUntilFound>
      {faqItems.map((item) => (
        <Accordion.Item key={item.value} value={item.value} className={styles.Item}>
          <Accordion.Header className={styles.Header}>
            <Accordion.Trigger className={styles.Trigger}>
              {item.question}
              <PlusIcon className={styles.Icon} />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={styles.Panel}>
            <div className={styles.Content}>{item.answer}</div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
  play: async ({ canvasElement, canvas }) => {
    const panels = canvasElement.querySelectorAll('[hidden]');
    // Every closed panel stays mounted with `hidden="until-found"`, not a
    // plain boolean `hidden` and not unmounted.
    await expect(panels.length).toBe(faqItems.length);
    panels.forEach((panel) => {
      expect(panel).toHaveAttribute('hidden', 'until-found');
    });

    const firstPanel = panels[0];
    firstPanel.dispatchEvent(new window.Event('beforematch', { bubbles: true, cancelable: false }));

    await waitFor(() => expect(canvas.getByText(faqItems[0].answer)).toBeVisible());
  },
};

/**
 * `multiple` and a disabled item combined: two enabled items can both stay
 * open simultaneously, while the disabled item in between never toggles and
 * doesn't participate in either item's open/close.
 */
export const MultipleWithDisabled: Story = {
  render: () => (
    <Accordion.Root className={styles.Accordion} multiple defaultValue={[]}>
      <Accordion.Item value={faqItems[0].value} className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            {faqItems[0].question}
            <PlusIcon className={styles.Icon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>{faqItems[0].answer}</div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value={faqItems[1].value} disabled className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            {faqItems[1].question}
            <PlusIcon className={styles.Icon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>{faqItems[1].answer}</div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value={faqItems[2].value} className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            {faqItems[2].question}
            <PlusIcon className={styles.Icon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>{faqItems[2].answer}</div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger1 = canvas.getByRole('button', { name: faqItems[0].question });
    const disabledTrigger = canvas.getByRole('button', { name: faqItems[1].question });
    const trigger3 = canvas.getByRole('button', { name: faqItems[2].question });

    await userEvent.click(trigger1);
    await waitFor(() => expect(trigger1).toHaveAttribute('aria-expanded', 'true'));

    await userEvent.click(trigger3);
    await waitFor(() => expect(trigger3).toHaveAttribute('aria-expanded', 'true'));
    // Both enabled items stay open simultaneously under `multiple`.
    await expect(trigger1).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(disabledTrigger);
    await expect(disabledTrigger).toHaveAttribute('aria-expanded', 'false');
    // The disabled item never joins the open set, and the two enabled items
    // are unaffected by the attempted click on it.
    await expect(trigger1).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger3).toHaveAttribute('aria-expanded', 'true');
  },
};

/**
 * An `Accordion.Panel` can contain an entirely independent, nested
 * `Accordion.Root`. Each root owns its own value/context, so opening an inner
 * item has no effect on the outer accordion's open/closed items, and vice
 * versa.
 */
export const NestedAccordion: Story = {
  render: () => (
    <Accordion.Root className={styles.Accordion} defaultValue={['what-is']}>
      <Accordion.Item value="what-is" className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            {faqItems[0].question}
            <PlusIcon className={styles.Icon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>
            {faqItems[0].answer}
            <Accordion.Root className={`${styles.Accordion} ${styles.NestedAccordion}`}>
              <Accordion.Item value="license" className={styles.Item}>
                <Accordion.Header className={styles.Header}>
                  <Accordion.Trigger className={styles.Trigger}>
                    What license is it under?
                    <PlusIcon className={styles.Icon} />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel className={styles.Panel}>
                  <div className={styles.Content}>MIT.</div>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="get-started" className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            {faqItems[1].question}
            <PlusIcon className={styles.Icon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>{faqItems[1].answer}</div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const innerTrigger = canvas.getByRole('button', { name: 'What license is it under?' });
    await userEvent.click(innerTrigger);
    await waitFor(() => expect(innerTrigger).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(canvas.getByText('MIT.')).toBeVisible());

    // The outer item that contains the nested accordion is still open, and
    // opening the inner item didn't close the outer one's sibling state.
    const outerTrigger1 = canvas.getByRole('button', { name: faqItems[0].question });
    await expect(outerTrigger1).toHaveAttribute('aria-expanded', 'true');

    const outerTrigger2 = canvas.getByRole('button', { name: faqItems[1].question });
    await userEvent.click(outerTrigger2);
    await waitFor(() => expect(outerTrigger2).toHaveAttribute('aria-expanded', 'true'));
    // Outer single-mode replace closed item 1 (and, with it, the nested
    // accordion currently mounted inside its panel) — the inner item's own
    // open state is irrelevant to the outer swap.
    await waitFor(() => expect(outerTrigger1).toHaveAttribute('aria-expanded', 'false'));
  },
};

/**
 * Accordion deliberately has no roving-tabindex/arrow-key navigation between
 * headers ([#4965](https://github.com/mui/base-ui/pull/4965)) — only native
 * Tab/Shift+Tab order moves focus between triggers. This story documents that
 * absence explicitly rather than leaving it untested.
 */
export const KeyboardTabFlow: Story = {
  render: () => (
    <Accordion.Root className={styles.Accordion} defaultValue={[]}>
      {faqItems.map((item) => (
        <Accordion.Item key={item.value} value={item.value} className={styles.Item}>
          <Accordion.Header className={styles.Header}>
            <Accordion.Trigger className={styles.Trigger}>
              {item.question}
              <PlusIcon className={styles.Icon} />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={styles.Panel}>
            <div className={styles.Content}>{item.answer}</div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger1 = canvas.getByRole('button', { name: faqItems[0].question });
    const trigger2 = canvas.getByRole('button', { name: faqItems[1].question });

    trigger1.focus();
    await expect(trigger1).toHaveFocus();

    // No accordion-specific ArrowDown behavior — focus never moves.
    await userEvent.keyboard('{ArrowDown}');
    await expect(trigger1).toHaveFocus();
    await expect(trigger2).not.toHaveFocus();

    // Tab moves focus via ordinary native DOM order instead.
    await userEvent.tab();
    await waitFor(() => expect(trigger2).toHaveFocus());

    // Space toggles the focused trigger on keyup, matching native <button>.
    await userEvent.keyboard(' ');
    await waitFor(() => expect(trigger2).toHaveAttribute('aria-expanded', 'true'));
  },
};
