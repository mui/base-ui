import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { MiniPlayground } from './MiniPlayground';

/**
 * Internal harness for `MiniPlayground` (not part of the public component surface
 * documented in the MDX pages). Tagged `research` so it stays out of the sidebar by
 * default.
 */
const meta = {
  title: 'Utilities/MiniPlayground (internal)',
  tags: ['research'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const trivialCode = `<button type="button" className="Greeting">
  Hello, world!
</button>`;

const trivialCss = `.Greeting {
  padding: 0.5rem 1rem;
  border: 1px solid black;
}`;

function TrivialExample() {
  return <button type="button">Hello, world!</button>;
}

/** A trivial inline example exercising every tab: Preview (live), JSX, HTML (live-captured), CSS. */
export const Basic: Story = {
  render: () => (
    <MiniPlayground
      title="Trivial example"
      source={{
        repo: 'example/example',
        href: 'https://github.com/example/example',
        license: 'MIT',
      }}
      code={trivialCode}
      css={trivialCss}
    >
      <TrivialExample />
    </MiniPlayground>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('button', { name: 'Hello, world!' })).toBeVisible();

    const jsxTab = canvas.getByRole('tab', { name: 'JSX' });
    await userEvent.click(jsxTab);
    await waitFor(() => expect(jsxTab).toHaveAttribute('aria-selected', 'true'));
    // The JSX/CSS tabs render via Storybook's `SyntaxHighlighter`, which tokenizes the
    // source into many nested `<span>`s and mounts asynchronously (React.lazy + an
    // effect), so match on the panel's aggregate text content rather than a single node.
    const jsxPanel = canvas.getByRole('tabpanel', { name: 'JSX' });
    await waitFor(() => expect(jsxPanel.textContent).toMatch(/Hello, world!/));

    const htmlTab = canvas.getByRole('tab', { name: 'HTML' });
    await userEvent.click(htmlTab);
    await waitFor(() => expect(htmlTab).toHaveAttribute('aria-selected', 'true'));
    const htmlPre = canvas.getByText(/<button/);
    await expect(htmlPre).toBeVisible();
    await expect(htmlPre.textContent).not.toBe('');
  },
};
