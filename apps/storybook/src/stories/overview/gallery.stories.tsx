import type { Meta, StoryObj } from '@storybook/react-vite';
import { GalleryGrid } from './GalleryGrid';

/**
 * CSF twin of the Overview/Gallery docs page: Chromatic cannot snapshot docs pages,
 * so this story renders the same GalleryGrid as a regular story. It is deliberately
 * NOT excluded via `parameters: { chromatic: { disableSnapshot: true } }` — one
 * snapshot covering every component family under the Mealdrop theme.
 */
const meta = {
  title: 'Overview/All components',
  component: GalleryGrid,
  tags: ['kitchen-sink'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof GalleryGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {};

/** Dark-theme variant of Grid — the whole dark semantic layer in one snapshot. */
export const Dark: Story = {
  ...Grid,
  globals: { theme: 'dark' },
};
