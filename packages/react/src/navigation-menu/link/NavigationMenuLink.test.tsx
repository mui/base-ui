import * as React from 'react';
import { expect } from 'chai';
import { screen, flushMicrotasks } from '@mui/internal-test-utils';
import { NavigationMenu } from '@base-ui-components/react/navigation-menu';
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

  it('closes the menu when clicking a link', async () => {
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

    expect(screen.queryByTestId('popup-1')).to.equal(null);
    expect(trigger).to.have.attribute('aria-expanded', 'false');
  });
});
