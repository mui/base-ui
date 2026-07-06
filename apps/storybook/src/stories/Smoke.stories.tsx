import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from '@base-ui/react/switch';

// Temporary smoke test: proves Storybook compiles and renders @base-ui/react
// from the workspace source aliases. Replaced by real per-component stories.
const meta = {
  title: 'Smoke/Switch',
  component: Switch.Root,
} satisfies Meta<typeof Switch.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Switch.Root defaultChecked aria-label="Smoke test switch">
      <Switch.Thumb />
    </Switch.Root>
  ),
};
