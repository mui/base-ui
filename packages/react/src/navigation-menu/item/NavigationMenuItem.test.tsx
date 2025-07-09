import * as React from 'react';
import { NavigationMenu } from '@base-ui-components/react/navigation-menu';
import { expect } from 'chai';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<NavigationMenu.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<NavigationMenu.Item />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<NavigationMenu.Root>{node}</NavigationMenu.Root>);
    },
  }));

  describe('prop: openOnHover', () => {
    it('opens the popup when hovering the trigger by default (true)', async () => {
      const { user } = await render(
        <NavigationMenu.Root>
          <NavigationMenu.List>
            <NavigationMenu.Item>
              <NavigationMenu.Trigger>trigger</NavigationMenu.Trigger>
              <NavigationMenu.Content>content</NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>

          <NavigationMenu.Portal>
            <NavigationMenu.Positioner>
              <NavigationMenu.Popup>
                <NavigationMenu.Viewport />
              </NavigationMenu.Popup>
            </NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        </NavigationMenu.Root>,
      );

      expect(screen.queryByText('content')).to.equal(null);

      await user.hover(screen.getByText('trigger'));

      await waitFor(() => {
        expect(screen.getByText('content')).not.to.equal(null);
      });
    });

    it('does not open the popup when hovering the trigger if false', async () => {
      const { user } = await render(
        <NavigationMenu.Root>
          <NavigationMenu.List>
            <NavigationMenu.Item openOnHover={false}>
              <NavigationMenu.Trigger>trigger</NavigationMenu.Trigger>
              <NavigationMenu.Content>content</NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>

          <NavigationMenu.Portal>
            <NavigationMenu.Positioner>
              <NavigationMenu.Popup>
                <NavigationMenu.Viewport />
              </NavigationMenu.Popup>
            </NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        </NavigationMenu.Root>,
      );

      expect(screen.queryByText('content')).to.equal(null);

      await user.hover(screen.getByText('trigger'));

      await waitFor(() => {
        expect(screen.queryByText('content')).to.equal(null);
      });
    });
  });
});
