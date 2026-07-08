import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { WildCards, WildCard } from './InTheWild';
// Sample captures live in the research corpus outside this package; same relative-import
// pattern as the MDX docs pages (e.g. select.mdx).
/* eslint-disable import/no-relative-packages */
import kumoUiComShot from '../../../../../research/d-real-world-usage/_captures/kumo-ui-com-hl.png';
import kumoUiComHighlight from '../../../../../research/d-real-world-usage/_captures/kumo-ui-com-hl-highlight.png';
import nextjsOrgShot from '../../../../../research/d-real-world-usage/_captures/nextjs-org-hl.png';
import nextjsOrgHighlight from '../../../../../research/d-real-world-usage/_captures/nextjs-org-hl-highlight.png';
import nineUiShot from '../../../../../research/d-real-world-usage/_captures/9ui-dev-hl.png';
import nineUiHighlight from '../../../../../research/d-real-world-usage/_captures/9ui-dev-hl-highlight.png';
import reuiShot from '../../../../../research/d-real-world-usage/_captures/reui-io-hl.png';
import reuiHighlight from '../../../../../research/d-real-world-usage/_captures/reui-io-hl-highlight.png';
/* eslint-enable import/no-relative-packages */

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
        highlightImage={kumoUiComHighlight}
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
        highlightImage={nextjsOrgHighlight}
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

/**
 * Cards backed by real `capture-highlight.mjs` output: each carries a second, component-
 * spotlighted screenshot plus the page's `route`/`selector`. The viewer exposes a
 * "Full page / Component" toggle and a copyable locator bar.
 */
export const WithComponentHighlight: Story = {
  render: () => (
    <WildCards>
      <WildCard
        repo="9ui.dev"
        title="9ui"
        href="https://9ui.dev"
        live="https://9ui.dev"
        pageUrl="https://www.9ui.dev"
        route="/"
        selector='[role="tablist"]'
        license="MIT"
        reuse="code-ok"
        image={nineUiShot}
        highlightImage={nineUiHighlight}
      >
        Tabs on the 9ui landing page, spotlighted on the page.
      </WildCard>
      <WildCard
        repo="reui.io"
        title="ReUI"
        href="https://reui.io"
        live="https://reui.io"
        pageUrl="https://reui.io"
        route="/"
        selector='[role="switch"]'
        license="MIT"
        reuse="code-ok"
        image={reuiShot}
        highlightImage={reuiHighlight}
      >
        A Switch on the ReUI home page, spotlighted on the page.
      </WildCard>
    </WildCards>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'View full size — 9ui' }));
    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());
    const viewer = within(dialog);

    // Opens on the Component (highlighted) view by default.
    const component = viewer.getByRole('button', { name: 'Component' });
    await waitFor(() => expect(component).toHaveAttribute('aria-pressed', 'true'));
    await expect(
      viewer.getByRole('img', { name: /Base UI component highlighted on the page/ }),
    ).toBeVisible();

    // Toggling to "Full page" swaps in the plain screenshot.
    const fullPage = viewer.getByRole('button', { name: 'Full page' });
    await userEvent.click(fullPage);
    await waitFor(() => expect(fullPage).toHaveAttribute('aria-pressed', 'true'));

    // The locator bar surfaces the CSS selector for later agent use.
    await expect(viewer.getByText('[role="tablist"]')).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

/**
 * Cards with a real screenshot capture sort ahead of GitHub OG-card fallbacks, even when
 * the fallback card is authored first. Here the OG-only "Fallbacky" card is written before
 * the captured "9ui" card, yet the carousel opens 9ui at position 1 of 2.
 */
export const SortsCapturesFirst: Story = {
  render: () => (
    <WildCards>
      <WildCard
        repo="example/fallbacky"
        title="Fallbacky"
        href="https://github.com/example/fallbacky"
        license="MIT"
        reuse="code-ok"
      >
        No local screenshot — falls back to the GitHub OG card.
      </WildCard>
      <WildCard
        repo="9ui.dev"
        title="9ui"
        href="https://9ui.dev"
        live="https://9ui.dev"
        license="MIT"
        reuse="code-ok"
        image={nineUiShot}
      >
        Backed by a real screenshot capture.
      </WildCard>
    </WildCards>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    // The captured card, though authored second, is first in the carousel order.
    await userEvent.click(canvas.getByRole('button', { name: 'View full size — 9ui' }));
    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(body.getByText('1 of 2')).toBeVisible();

    // Paging forward reaches the OG-fallback card.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(body.getByText('2 of 2')).toBeVisible());
    await expect(body.getByRole('link', { name: 'Fallbacky' })).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};
