import * as React from 'react';
import { Switch } from '@base-ui/react/switch';

export function App() {
  return (
    <main>
      <h1>Base UI Storybook host app</h1>
      <p>This Vite app exists to host the Storybook for Base UI. Run Storybook instead.</p>
      <Switch.Root defaultChecked>
        <Switch.Thumb />
      </Switch.Root>
    </main>
  );
}
