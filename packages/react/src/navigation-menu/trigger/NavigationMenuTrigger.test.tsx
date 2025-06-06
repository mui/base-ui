import * as React from 'react';
import { NavigationMenu } from '@base-ui-components/react/navigation-menu';
import { createRenderer, describeConformance } from '#test-utils';
import { expect } from 'chai';
import { screen, flushMicrotasks } from '@mui/internal-test-utils';
import userEvent from '@testing-library/user-event';

describe('<NavigationMenu.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<NavigationMenu.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(
        <NavigationMenu.Root>
          <NavigationMenu.List>
            <NavigationMenu.Item>{node}</NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>,
      );
    },
  }));

  it('handles focus and positioner height', async () => {
    await render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>Overview</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="#">Quick Start Install and</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>Handbook</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="#">Styling Base UI components</NavigationMenu.Link>
            </NavigationMenu.Content>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="#">Second Link</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.Portal>
          <NavigationMenu.Positioner data-testid="positioner">
            <NavigationMenu.Popup>
              <NavigationMenu.Viewport />
            </NavigationMenu.Popup>
          </NavigationMenu.Positioner>
        </NavigationMenu.Portal>
      </NavigationMenu.Root>,
    );

    const overviewButton = screen.getByRole('button', { name: 'Overview' });
    overviewButton.focus();
    expect(overviewButton).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await flushMicrotasks();

    const positioner = screen.getByTestId('positioner');
    expect(getComputedStyle(positioner).getPropertyValue('--positioner-height')).to.equal('18px');

    const overviewLink = screen.getByRole('link', { name: 'Quick Start Install and' });

    expect(overviewLink).to.have.attribute('data-highlighted');

    await userEvent.tab({ shift: true });

    expect(overviewButton).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    const handbookButton = screen.getByRole('button', { name: 'Handbook' });
    expect(handbookButton).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await flushMicrotasks();

    expect(getComputedStyle(positioner).getPropertyValue('--positioner-height')).to.equal('36px');

    const handbookLink = screen.getByRole('link', { name: 'Styling Base UI components' });
    expect(handbookLink).to.have.attribute('data-highlighted');

    await userEvent.tab({ shift: true });
    expect(handbookButton).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(overviewButton).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await flushMicrotasks();
    expect(getComputedStyle(positioner).getPropertyValue('--positioner-height')).to.equal('18px');
  });
});
