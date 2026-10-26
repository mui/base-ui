import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { reactMajor, screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<NavigationMenu.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<NavigationMenu.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<NavigationMenu.Root>{node}</NavigationMenu.Root>);
    },
  }));

  describe.skipIf(reactMajor < 19)('React.Activity', () => {
    const Activity = (
      React as typeof React & {
        Activity: React.ComponentType<{ mode: 'visible' | 'hidden'; children: React.ReactNode }>;
      }
    ).Activity;

    it('moves content to a replacement viewport after removing a hidden inline viewport', async () => {
      function TestCase({ stage }: { stage: 'inline' | 'hidden' | 'positioned' }) {
        return (
          <NavigationMenu.Root defaultValue="item">
            <NavigationMenu.List>
              <NavigationMenu.Item value="item">
                <NavigationMenu.Trigger>Item</NavigationMenu.Trigger>
                <NavigationMenu.Content>Menu content</NavigationMenu.Content>
              </NavigationMenu.Item>
            </NavigationMenu.List>
            {stage === 'positioned' ? (
              <NavigationMenu.Portal>
                <NavigationMenu.Positioner>
                  <NavigationMenu.Popup>
                    <NavigationMenu.Viewport data-testid="positioned-viewport" />
                  </NavigationMenu.Popup>
                </NavigationMenu.Positioner>
              </NavigationMenu.Portal>
            ) : (
              <Activity mode={stage === 'hidden' ? 'hidden' : 'visible'}>
                <NavigationMenu.Viewport data-testid="inline-viewport" />
              </Activity>
            )}
          </NavigationMenu.Root>
        );
      }

      // StrictMode's effect replay on the replacement viewport can clear the stale target.
      const { rerender } = await render(<TestCase stage="inline" />, { strict: false });
      const inlineViewport = screen.getByTestId('inline-viewport');
      expect(inlineViewport).toHaveTextContent('Menu content');

      await rerender(<TestCase stage="hidden" />);
      expect(inlineViewport).not.toBeVisible();

      await rerender(<TestCase stage="positioned" />);
      expect(inlineViewport.isConnected).toBe(false);
      expect(screen.getByTestId('positioned-viewport')).toHaveTextContent('Menu content');
    });
  });
});
