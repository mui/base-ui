import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Separator } from '@base-ui/react/separator';
import { Menu } from '@base-ui/react/menu';
import { Toolbar } from '@base-ui/react/toolbar';
import styles from './separator.module.css';

/**
 * Stories follow research/c-components/separator (Tier 3): the kept hero demo
 * plus the mandatory horizontal/vertical orientation pair with ARIA-contract
 * plays (`role="separator"`, `aria-orientation`, `data-orientation`).
 */
const meta = {
  title: 'Disclosure & structure/Separator',
  component: Separator,
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero demo: a vertical separator dividing two clusters of nav links. */
export const Hero: Story = {
  render: () => (
    <div className={styles.Container}>
      <a href="#" className={styles.Link}>
        Home
      </a>
      <a href="#" className={styles.Link}>
        Pricing
      </a>
      <a href="#" className={styles.Link}>
        Blog
      </a>
      <a href="#" className={styles.Link}>
        Support
      </a>

      <Separator orientation="vertical" className={styles.Separator} />

      <a href="#" className={styles.Link}>
        Log in
      </a>
      <a href="#" className={styles.Link}>
        Sign up
      </a>
    </div>
  ),
};

/** Dark-theme variant of Hero (Chromatic coverage of the dark semantic layer). */
export const Dark: Story = {
  ...Hero,
  globals: { theme: 'dark' },
};

/** Default `orientation="horizontal"` (full width, thin height) between stacked content — `role="separator"` with `aria-orientation="horizontal"` and the matching `data-orientation` styling hook (mandatory orientation story, story-plan #1). */
export const Horizontal: Story = {
  render: () => (
    <div className={styles.Stack}>
      <p className={styles.Text}>Section one</p>
      <Separator className={styles.HorizontalSeparator} />
      <p className={styles.Text}>Section two</p>
    </div>
  ),
  play: async ({ canvas }) => {
    const separator = canvas.getByRole('separator');
    await expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  },
};

/** `orientation="vertical"` between inline content, mirroring the hero demo's nav-link pattern — flips both `aria-orientation` and `data-orientation` (mandatory orientation story, story-plan #2). */
export const Vertical: Story = {
  render: () => (
    <div className={styles.Row}>
      <span className={styles.Text}>Left</span>
      <Separator orientation="vertical" className={styles.VerticalSeparator} />
      <span className={styles.Text}>Right</span>
    </div>
  ),
  play: async ({ canvas }) => {
    const separator = canvas.getByRole('separator');
    await expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    await expect(separator).toHaveAttribute('data-orientation', 'vertical');
  },
};

/**
 * `Menu.Separator` is a re-export of `Separator` (`packages/react/src/menu/index.parts.ts`),
 * used between `Menu.Group`s to divide unrelated clusters of items — the
 * component's own grouping-semantics anatomy (story-plan #3). `defaultOpen`
 * keeps the popup visible for the static demo instead of requiring a click.
 */
export const InMenu: Story = {
  render: () => (
    <Menu.Root defaultOpen modal={false}>
      <Menu.Trigger className={styles.Link}>Edit</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4}>
          <Menu.Popup className={styles.Popup}>
            <Menu.Group>
              <Menu.GroupLabel className={styles.GroupLabel}>Clipboard</Menu.GroupLabel>
              <Menu.Item className={styles.Item}>Cut</Menu.Item>
              <Menu.Item className={styles.Item}>Copy</Menu.Item>
              <Menu.Item className={styles.Item}>Paste</Menu.Item>
            </Menu.Group>
            <Separator className={styles.MenuSeparator} />
            <Menu.Group>
              <Menu.GroupLabel className={styles.GroupLabel}>Selection</Menu.GroupLabel>
              <Menu.Item className={styles.Item}>Select all</Menu.Item>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
};

function ToolbarSeparatorOrientationExample() {
  const [orientation, setOrientation] = React.useState<'horizontal' | 'vertical'>('horizontal');
  return (
    <div className={styles.Stack}>
      <button
        type="button"
        onClick={() =>
          setOrientation((current) => (current === 'horizontal' ? 'vertical' : 'horizontal'))
        }
      >
        Toolbar orientation: {orientation} (click to flip)
      </button>
      <Toolbar.Root
        aria-label="Formatting"
        orientation={orientation}
        className={orientation === 'vertical' ? styles.ToolbarVertical : styles.ToolbarHorizontal}
      >
        <Toolbar.Group aria-label="Text style">
          <button type="button" className={styles.Link}>
            B
          </button>
        </Toolbar.Group>
        <Toolbar.Separator data-testid="toolbar-separator" />
        <Toolbar.Group aria-label="Alignment">
          <button type="button" className={styles.Link}>
            Left
          </button>
        </Toolbar.Group>
      </Toolbar.Root>
    </div>
  );
}

/**
 * `Toolbar.Separator` auto-inverts its orientation relative to the hosting
 * `Toolbar.Root`'s own `orientation` (`ToolbarSeparator.tsx`: a horizontal
 * toolbar renders vertical separators, and vice versa) unless overridden by
 * an explicit `orientation` prop on the Separator itself. Flipping the
 * toolbar's own orientation live demonstrates the inversion is dynamic, not
 * a one-time default (brief §6/§10).
 */
export const InToolbar: Story = {
  render: () => <ToolbarSeparatorOrientationExample />,
  play: async ({ canvas, userEvent }) => {
    const separator = canvas.getByTestId('toolbar-separator');
    const toggle = canvas.getByRole('button', { name: /Toolbar orientation/ });

    // Horizontal toolbar -> vertical separator.
    await expect(separator).toHaveAttribute('data-orientation', 'vertical');

    await userEvent.click(toggle);

    // Vertical toolbar -> horizontal separator.
    await expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  },
};
