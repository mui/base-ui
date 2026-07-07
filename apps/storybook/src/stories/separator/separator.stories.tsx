import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Separator } from '@base-ui/react/separator';
import styles from './separator.module.css';

/**
 * Stories follow research/c-components/separator (Tier 3): the kept hero demo
 * plus the mandatory horizontal/vertical orientation pair with ARIA-contract
 * plays (`role="separator"`, `aria-orientation`, `data-orientation`).
 */
const meta = {
  title: 'Disclosure & structure/Separator',
  component: Separator,
  tags: ['ai-generated'],
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
