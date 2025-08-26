import * as React from 'react';
import { expect } from 'chai';
import { screen, flushMicrotasks, waitFor } from '@mui/internal-test-utils';
import { NavigationMenu } from '@base-ui-components/react/navigation-menu';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

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

  it.skipIf(!isJSDOM)('closes the menu when clicking a link', async () => {
    const { user } = await render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item value="item-1">
            <NavigationMenu.Trigger data-testid="trigger-1">Item 1</NavigationMenu.Trigger>
            <NavigationMenu.Content data-testid="popup-1">
              <NavigationMenu.Link href="#link-1">Link 1</NavigationMenu.Link>
            </NavigationMenu.Content>
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

    const trigger = screen.getByTestId('trigger-1');

    await user.click(trigger);
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).not.to.equal(null);
    expect(trigger).to.have.attribute('aria-expanded', 'true');

    const link = screen.getByRole('link', { name: 'Link 1' });
    await user.click(link);

    await waitFor(() => expect(screen.queryByTestId('popup-1')).to.equal(null));
    expect(trigger).to.have.attribute('aria-expanded', 'false');
  });

  describe('prop: active', () => {
    it('when `true`, renders with aria-current="page"', async () => {
      await render(
        <NavigationMenu.Root>
          <NavigationMenu.List>
            <NavigationMenu.Item>
              <NavigationMenu.Link href="#" active>
                active
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>,
      );
      expect(screen.getByRole('link', { name: 'active' })).to.have.attribute(
        'aria-current',
        'page',
      );
    });

    it('when `false`, does not render with aria-current="page"', async () => {
      await render(
        <NavigationMenu.Root>
          <NavigationMenu.List>
            <NavigationMenu.Item>
              <NavigationMenu.Link href="#" active={false}>
                inactive
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>,
      );
      expect(screen.getByRole('link', { name: 'inactive' })).not.to.have.attribute('aria-current');
    });
  });
});
