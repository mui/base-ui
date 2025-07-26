import * as React from 'react';
import { NavigationMenu } from '@base-ui-components/react/navigation-menu';
import { expect } from 'chai';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<NavigationMenu.Link />', () => {
  const { render } = createRenderer();

  describeConformance(<NavigationMenu.Link />, () => ({
    refInstanceof: window.HTMLAnchorElement,
    render(node) {
      return render(
        <NavigationMenu.Root>
          <NavigationMenu.List>{node}</NavigationMenu.List>
        </NavigationMenu.Root>,
      );
    },
  }));

  describe('prop: closeOnClick', () => {
    it('closes the popup when clicking the link by default (true)', async () => {
      const { user } = await render(
        <NavigationMenu.Root defaultValue="1">
          <NavigationMenu.List>
            <NavigationMenu.Item value="1">
              <NavigationMenu.Link>link</NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>

          <NavigationMenu.Portal>
            <NavigationMenu.Positioner>
              <NavigationMenu.Popup>
                <NavigationMenu.Viewport>content</NavigationMenu.Viewport>
              </NavigationMenu.Popup>
            </NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        </NavigationMenu.Root>,
      );

      expect(screen.getByText('content')).not.to.equal(null);

      await user.click(screen.getByText('link'));

      await waitFor(() => {
        expect(screen.queryByText('content')).to.equal(null);
      });
    });

    it('does not close the popup when false', async () => {
      const { user } = await render(
        <NavigationMenu.Root defaultValue="1">
          <NavigationMenu.List>
            <NavigationMenu.Item value="1">
              <NavigationMenu.Link closeOnClick={false}>link</NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>

          <NavigationMenu.Portal>
            <NavigationMenu.Positioner>
              <NavigationMenu.Popup>
                <NavigationMenu.Viewport>content</NavigationMenu.Viewport>
              </NavigationMenu.Popup>
            </NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        </NavigationMenu.Root>,
      );

      expect(screen.getByText('content')).not.to.equal(null);

      await user.click(screen.getByText('link'));

      await waitFor(() => {
        expect(screen.queryByText('content')).not.to.equal(null);
      });
    });
  });
});
