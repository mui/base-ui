import * as React from 'react';
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

/**
 * `delay` (default `0`) is Base UI's answer to the classic flash-of-fallback
 * problem (brief §6/§10, PR #5147 clarifying `delay={0}` means "immediate, no
 * wait"): with no `delay`, the fallback for a broken image appears the
 * instant loading resolves to `error`; with `delay={600}` (the hero demo's
 * value), the fallback is deliberately withheld for 600ms even after the
 * image has already failed, so a fast-resolving load never flashes fallback
 * content first. Static comparison, no play — the difference is a timing
 * behavior best seen, not asserted against a fixed clock in a browser test.
 */
export const DefaultDelay: Story = {
  render: () => (
    <div className={styles.Row}>
      <Avatar.Root className={styles.Root}>
        <Avatar.Image
          src="/does-not-exist-broken-avatar.jpg"
          alt="No delay"
          className={styles.Image}
        />
        <Avatar.Fallback className={styles.Fallback}>0ms</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root className={styles.Root}>
        <Avatar.Image
          src="/does-not-exist-broken-avatar.jpg"
          alt="600ms delay"
          className={styles.Image}
        />
        <Avatar.Fallback delay={600} className={styles.Fallback}>
          600
        </Avatar.Fallback>
      </Avatar.Root>
    </div>
  ),
};

/**
 * `alt` guidance is not documented on the live docs page, and neither hero
 * demo passes `alt` at all (brief §7 — a genuine, flagged gap). Two valid
 * resolutions: informative (the avatar is the sole identifier for the
 * person, e.g. in a comments list) vs. decorative (the name is already shown
 * as adjacent text, so `alt=""` avoids redundant announcement).
 */
export const AltTextVariations: Story = {
  render: () => (
    <div className={styles.Row}>
      <div>
        <Avatar.Root className={styles.Root}>
          <Avatar.Image
            src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
            alt="Jane Doe"
            className={styles.Image}
          />
          <Avatar.Fallback className={styles.Fallback}>JD</Avatar.Fallback>
        </Avatar.Root>
        <p className={styles.Output}>Informative: avatar is the sole identifier.</p>
      </div>
      <div className={styles.Row}>
        <Avatar.Root className={styles.Root}>
          <Avatar.Image
            src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
            alt=""
            className={styles.Image}
          />
          <Avatar.Fallback className={styles.Fallback}>JD</Avatar.Fallback>
        </Avatar.Root>
        <span className={styles.Output}>Jane Doe</span>
      </div>
    </div>
  ),
};

function LoadingStatusExample() {
  const [statuses, setStatuses] = React.useState<string[]>([]);
  return (
    <div className={styles.Row}>
      <Avatar.Root className={styles.Root}>
        <Avatar.Image
          src="/does-not-exist-broken-avatar.jpg"
          alt="Jane Doe"
          className={styles.Image}
          onLoadingStatusChange={(status) => setStatuses((current) => [...current, status])}
        />
        <Avatar.Fallback className={styles.Fallback}>JD</Avatar.Fallback>
      </Avatar.Root>
      <span className={styles.Output}>Statuses: {statuses.join(', ') || 'none yet'}</span>
    </div>
  );
}

/**
 * `onLoadingStatusChange` fires with every `idle` -> `loading`/`error`/`loaded`
 * transition, independent of the `Fallback` part rendering at all
 * (`AvatarImage.test.tsx` "prop: onLoadingStatusChange") — useful for driving
 * a custom loading indicator instead of (or alongside) `Avatar.Fallback`.
 */
export const OnLoadingStatusChangeCallback: Story = {
  render: () => <LoadingStatusExample />,
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/error/)).toBeVisible();
  },
};
