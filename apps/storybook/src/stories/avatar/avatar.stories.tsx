import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Avatar } from '@base-ui/react/avatar';
import styles from './avatar.module.css';

/**
 * Stories follow research/c-components/avatar (Tier 3): the kept hero demo
 * (image + initials-only) plus the mandatory broken-image-to-fallback play
 * exercising the async image-loading-status state machine.
 */
const meta = {
  title: 'Status & display/Avatar',
  component: Avatar.Root,
  subcomponents: {
    'Avatar.Image': Avatar.Image,
    'Avatar.Fallback': Avatar.Fallback,
  },
} satisfies Meta<typeof Avatar.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: an image avatar with a delayed initials fallback, next to a second avatar with plain text children and no `Image`/`Fallback` parts at all — the docs-sanctioned "no photo available" pattern. */
export const Hero: Story = {
  render: () => (
    <div className={styles.Row}>
      <Avatar.Root className={styles.Root}>
        <Avatar.Image
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
          width="48"
          height="48"
          alt="Jane Doe"
          className={styles.Image}
        />
        <Avatar.Fallback delay={600} className={styles.Fallback}>
          LT
        </Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root className={styles.Root}>LT</Avatar.Root>
    </div>
  ),
};

/** A broken/unreachable `src` makes the off-DOM loading probe resolve to `error`, so `Avatar.Fallback` renders in its place — the mandatory image-load-fallback contract (brief §6/§10, story-plan #1). Status resolves asynchronously in a real browser (no mocking, unlike the unit tests), so the play function awaits the fallback text rather than asserting synchronously, then confirms the `<img>` never mounted. */
export const BrokenImageFallback: Story = {
  render: () => (
    <Avatar.Root className={styles.Root}>
      <Avatar.Image
        src="/does-not-exist-broken-avatar.jpg"
        alt="Jane Doe"
        className={styles.Image}
      />
      <Avatar.Fallback className={styles.Fallback}>JD</Avatar.Fallback>
    </Avatar.Root>
  ),
  play: async ({ canvas }) => {
    const fallback = await canvas.findByText('JD');
    await expect(fallback).toBeVisible();
    await expect(canvas.queryByRole('img')).not.toBeInTheDocument();
  },
};
