import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { mergeProps } from '@base-ui/react/merge-props';
import { Toggle } from '@base-ui/react/toggle';
import styles from './merge-props.module.css';

/**
 * Stories follow research/c-components/merge-props (Tier 3 utils floor): the
 * merge contract's two least-obvious facts — handlers run right-to-left, and
 * `preventBaseUIHandler()` can cancel the internal one — are shown live via a
 * visible event log, mirroring the docs' own `prevent-base-ui-handler` demo
 * (story-plan.md).
 */
const meta = {
  title: 'Utilities/mergeProps',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function HandlerOrderExample() {
  const [locked, setLocked] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);

  const pushLog = (line: string) => setLog((prev) => [...prev, line]);

  return (
    <div className={styles.Container}>
      <div className={styles.ToggleRow}>
        <Toggle
          aria-label="Favorite"
          pressed={pressed}
          onPressedChange={(next) => {
            pushLog('Base UI internal: onPressedChange');
            setPressed(next);
          }}
          className={styles.Toggle}
          render={(props) => (
            <button
              type="button"
              {...mergeProps<'button'>(props, {
                onClick(event) {
                  pushLog('user: onClick');
                  if (locked) {
                    event.preventBaseUIHandler();
                  }
                },
              })}
            >
              {pressed ? 'Favorited' : 'Favorite'}
            </button>
          )}
        />
        <span className={styles.Label}>{locked ? '(locked)' : '(unlocked)'}</span>
      </div>

      <label className={styles.Label}>
        <input
          type="checkbox"
          checked={locked}
          onChange={(event) => setLocked(event.target.checked)}
        />{' '}
        Lock (calls preventBaseUIHandler)
      </label>

      <ol className={styles.Log} aria-label="Handler call order">
        {log.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ol>
    </div>
  );
}

/** `mergeProps(props, { onClick })` puts the user's handler rightmost, so it runs *before* Base UI's internal one and can call `event.preventBaseUIHandler()` to stop it from running at all — without touching `preventDefault()`/`stopPropagation()`. Unlocked, both handlers fire in order; locked, only the user's does and the pressed state freezes. */
export const HandlerOrderAndCancellation: Story = {
  render: () => <HandlerOrderExample />,
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole('button', { name: 'Favorite' });

    await userEvent.click(toggle);
    await expect(canvas.getByText('user: onClick')).toBeVisible();
    await expect(canvas.getByText('Base UI internal: onPressedChange')).toBeVisible();
    await expect(toggle).toHaveAttribute('data-pressed');

    await userEvent.click(canvas.getByLabelText('Lock (calls preventBaseUIHandler)'));
    await userEvent.click(toggle);

    // Locked: the user handler still runs (and logs) but cancels Base UI's
    // internal one, so no second "Base UI internal" line appears and the
    // pressed state stays frozen.
    await expect(canvas.getAllByText(/^Base UI internal:/)).toHaveLength(1);
    await expect(toggle).toHaveAttribute('data-pressed');
  },
};
