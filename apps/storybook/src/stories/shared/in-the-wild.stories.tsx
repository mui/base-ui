import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { WildCards, WildCard } from './InTheWild';
// Sample captures live in the research corpus outside this package; same relative-import
// pattern as the MDX docs pages (e.g. select.mdx).
// eslint-disable-next-line import/no-relative-packages
import kumoUiComShot from '../../../../../research/d-real-world-usage/_captures/kumo-ui-com.png';
// eslint-disable-next-line import/no-relative-packages
import nextjsOrgShot from '../../../../../research/d-real-world-usage/_captures/nextjs-org.png';

/**
 * Internal harness for `WildCards`/`WildCard`'s fullscreen viewer (not part of the public
 * component surface documented in the MDX pages). Tagged `research` so it stays out of the
 * sidebar by default.
 */
const meta = {
  title: 'Utilities/InTheWild (internal)',
  tags: ['research'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two sample cards; clicking the first thumbnail opens the shared Dialog viewer, ArrowRight advances the carousel, and Escape closes it. */
export const Viewer: Story = {
  render: () => (
    <WildCards>
      <WildCard
        repo="cloudflare/kumo"
        title="kumo"
        href="https://github.com/cloudflare/kumo"
        live="https://kumo-ui.com"
        license="MIT"
        reuse="code-ok"
        image={kumoUiComShot}
      >
        Sample entry one.
      </WildCard>
      <WildCard
        repo="vercel/next.js"
        title="Next.js"
        href="https://github.com/vercel/next.js"
        live="https://nextjs.org"
        license="MIT"
        reuse="code-ok"
        image={nextjsOrgShot}
      >
        Sample entry two.
      </WildCard>
    </WildCards>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    const firstThumbnail = canvas.getByRole('button', { name: 'View full size — kumo' });
    await userEvent.click(firstThumbnail);

    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(body.getByText('1 of 2')).toBeVisible();

    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(body.getByText('2 of 2')).toBeVisible());

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};
