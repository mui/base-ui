import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { screen, flushMicrotasks, waitFor, act } from '@mui/internal-test-utils';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';

describe('<NavigationMenu.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<NavigationMenu.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
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

  it.skipIf(isJSDOM)('handles focus and positioner height', async () => {
    await render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>Overview</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="#">Quick Start</NavigationMenu.Link>
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
    await act(async () => {
      overviewButton.focus();
    });

    await userEvent.keyboard('{ArrowDown}');
    await flushMicrotasks();

    const positioner = screen.getByTestId('positioner');
    expect(
      parseInt(getComputedStyle(positioner).getPropertyValue('--positioner-height'), 10),
    ).to.be.approximately(18, 1);

    const overviewLink = screen.getByRole('link', { name: 'Quick Start' });
    await waitFor(() => {
      expect(overviewLink).toHaveFocus();
    });

    await userEvent.tab({ shift: true });

    await waitFor(() => {
      expect(overviewButton).toHaveFocus();
    });

    await userEvent.keyboard('{ArrowRight}');
    const handbookButton = screen.getByRole('button', { name: 'Handbook' });
    await waitFor(() => {
      expect(handbookButton).toHaveFocus();
    });

    await userEvent.keyboard('{ArrowDown}');
    await flushMicrotasks();

    expect(
      parseInt(getComputedStyle(positioner).getPropertyValue('--positioner-height'), 10),
    ).to.be.approximately(36, 1);

    const handbookLink = screen.getByRole('link', { name: 'Styling Base UI components' });
    await waitFor(() => {
      expect(handbookLink).toHaveFocus();
    });

    await userEvent.tab({ shift: true });
    await waitFor(() => {
      expect(handbookButton).toHaveFocus();
    });

    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => {
      expect(overviewButton).toHaveFocus();
    });

    await userEvent.keyboard('{ArrowDown}');
    await flushMicrotasks();
    expect(
      parseInt(getComputedStyle(positioner).getPropertyValue('--positioner-height'), 10),
    ).to.be.approximately(18, 1);
  });

  it.skipIf(isJSDOM)('handles positioner width correctly', async () => {
    await render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>noContent</NavigationMenu.Trigger>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>withContent</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="#">Styling Base UI components</NavigationMenu.Link>
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

    const noContentButton = screen.getByRole('button', { name: 'noContent' });
    const withContentButton = screen.getByRole('button', { name: 'withContent' });

    await userEvent.pointer([
      { target: withContentButton },
      { target: noContentButton, releasePrevious: true },
      { target: withContentButton, releasePrevious: true },
    ]);

    await waitFor(() => {
      const handbookLink = screen.getByRole('link', { name: 'Styling Base UI components' });

      expect(handbookLink).toBeVisible();
    });

    const positioner = await screen.findByTestId('positioner');

    expect(
      parseInt(getComputedStyle(positioner).getPropertyValue('--positioner-width'), 10),
    ).to.be.approximately(183, 1);
  });

  it.skipIf(isJSDOM)('repositions the positioner when switching triggers via hover', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    await render(
      <NavigationMenu.Root>
        <NavigationMenu.List style={{ display: 'flex' }}>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>Overview</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="#">Overview Link</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>Handbook</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="#">Handbook Link</NavigationMenu.Link>
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
    const handbookButton = screen.getByRole('button', { name: 'Handbook' });

    await user.pointer([{ target: overviewButton }]);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Overview Link' })).toBeVisible();
    });

    const positioner = screen.getByTestId('positioner');
    const firstLeft = positioner.getBoundingClientRect().left;

    await user.pointer([{ target: handbookButton, releasePrevious: true }]);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Handbook Link' })).toBeVisible();
    });

    await waitFor(() => {
      const secondLeft = positioner.getBoundingClientRect().left;
      expect(Math.abs(secondLeft - firstLeft)).to.be.greaterThan(20);
    });
  });
});
