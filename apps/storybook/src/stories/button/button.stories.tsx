import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Button } from '@base-ui/react/button';
import styles from './button.module.css';

/**
 * Stories follow research/c-components/button (Tier 3): the kept docs hero demo,
 * plus the two behaviors that justify Button's own existence per its decision
 * log (#2138/#2225 -> #2363) — `focusableWhenDisabled` and Enter/Space
 * activation synthesized on a non-`<button>` tag via `render`.
 */
const meta = {
  title: 'Actions/Button',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: a plain Button with default styling. */
export const Hero: Story = {
  render: () => <Button className={styles.Button}>Submit</Button>,
};

function FocusableWhenDisabledExample() {
  const [clicks, setClicks] = React.useState(0);
  return (
    <div className={styles.Row}>
      <Button
        disabled
        focusableWhenDisabled
        className={styles.Button}
        onClick={() => setClicks((count) => count + 1)}
      >
        Submit
      </Button>
      <span className={styles.Output}>Clicks: {clicks}</span>
    </div>
  );
}

/**
 * `focusableWhenDisabled` is Button's raison d'être (#2363): a native `disabled`
 * button is removed from the tab order entirely, which hides loading/pending
 * buttons from assistive technology and breaks focus continuity. This prop
 * keeps the button reachable via Tab while still suppressing activation.
 */
export const FocusableWhenDisabled: Story = {
  render: () => <FocusableWhenDisabledExample />,
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Submit' });
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toHaveAttribute('tabindex', '0');

    // The whole point of focusableWhenDisabled: a disabled button still
    // receives focus and stays in the tab order.
    await userEvent.tab();
    await expect(button).toHaveFocus();

    // Activation is still fully suppressed while disabled.
    await userEvent.click(button);
    await expect(canvas.getByText('Clicks: 0')).toBeVisible();
  },
};

function RenderCompositionExample() {
  const [activations, setActivations] = React.useState(0);
  return (
    <div className={styles.Row}>
      <Button
        render={<div />}
        nativeButton={false}
        className={styles.Button}
        onClick={() => setActivations((count) => count + 1)}
      >
        Custom tag
      </Button>
      <span className={styles.Output}>Activations: {activations}</span>
    </div>
  );
}

/**
 * `render` + `nativeButton={false}` lets Button render as another tag (e.g. a
 * `<div>`) while remaining accessible: Base UI synthesizes the Enter/Space ->
 * click activation a real `<button>` gets from the browser for free.
 */
export const RenderComposition: Story = {
  render: () => <RenderCompositionExample />,
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Custom tag' });
    await expect(button.tagName).toBe('DIV');

    await userEvent.tab();
    await expect(button).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByText('Activations: 1')).toBeVisible();

    await userEvent.keyboard(' ');
    await expect(canvas.getByText('Activations: 2')).toBeVisible();
  },
};
