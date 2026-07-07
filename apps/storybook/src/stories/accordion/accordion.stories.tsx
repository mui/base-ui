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
  tags: ['ai-generated'],
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
