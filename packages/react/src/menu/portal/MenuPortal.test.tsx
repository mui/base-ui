import * as React from 'react';
import { expect } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Menu.Portal />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Portal keepMounted />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Menu.Root>{node}</Menu.Root>);
    },
  }));

  // The menu trigger already conveys the popup relationship via
  // aria-haspopup/aria-controls/aria-expanded, so the owner `span[aria-owns]`
  // is both redundant and invalid as a child of the menu role.
  it('does not render the aria-owns owner span', async () => {
    await render(
      <Menu.Root open>
        <Menu.Trigger>Toggle</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>Item</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await screen.findByRole('menu');
    expect(document.querySelector('span[aria-owns]')).toBe(null);
  });
});
