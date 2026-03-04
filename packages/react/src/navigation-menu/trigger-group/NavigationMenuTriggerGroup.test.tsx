import { expect } from 'chai';
import { fireEvent, screen, flushMicrotasks, waitFor } from '@mui/internal-test-utils';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { createRenderer, describeConformance } from '#test-utils';

function TestNavigationMenu() {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.TriggerGroup data-testid="group-1">
            <NavigationMenu.TriggerLink data-testid="trigger-link-1" href="#item-1">
              Item 1
            </NavigationMenu.TriggerLink>
            <NavigationMenu.Trigger data-testid="trigger-1">Open</NavigationMenu.Trigger>
          </NavigationMenu.TriggerGroup>
          <NavigationMenu.Content data-testid="popup-1">
            <NavigationMenu.Link href="#link-1">Link 1</NavigationMenu.Link>
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
    </NavigationMenu.Root>
  );
}

function TestNavigationMenuWithTwoGroups() {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.TriggerGroup data-testid="group-1">
            <NavigationMenu.TriggerLink data-testid="trigger-link-1" href="#item-1">
              Item 1
            </NavigationMenu.TriggerLink>
            <NavigationMenu.Trigger data-testid="trigger-1">Open 1</NavigationMenu.Trigger>
          </NavigationMenu.TriggerGroup>
          <NavigationMenu.Content data-testid="popup-1">
            <NavigationMenu.Link href="#link-1">Link 1</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="item-2">
          <NavigationMenu.TriggerGroup data-testid="group-2">
            <NavigationMenu.TriggerLink data-testid="trigger-link-2" href="#item-2">
              Item 2
            </NavigationMenu.TriggerLink>
            <NavigationMenu.Trigger data-testid="trigger-2">Open 2</NavigationMenu.Trigger>
          </NavigationMenu.TriggerGroup>
          <NavigationMenu.Content data-testid="popup-2">
            <NavigationMenu.Link href="#link-2">Link 2</NavigationMenu.Link>
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
    </NavigationMenu.Root>
  );
}

function TestNavigationMenuWithPlainLink() {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.TriggerGroup data-testid="group-1">
            <NavigationMenu.TriggerLink data-testid="trigger-link-1" href="#item-1">
              Item 1
            </NavigationMenu.TriggerLink>
            <NavigationMenu.Trigger data-testid="trigger-1">Open 1</NavigationMenu.Trigger>
          </NavigationMenu.TriggerGroup>
          <NavigationMenu.Content data-testid="popup-1">
            <NavigationMenu.Link href="#link-1">Link 1</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item value="item-2">
          <NavigationMenu.TriggerGroup data-testid="group-2">
            <NavigationMenu.TriggerLink data-testid="trigger-link-2" href="#item-2">
              Item 2
            </NavigationMenu.TriggerLink>
            <NavigationMenu.Trigger data-testid="trigger-2">Open 2</NavigationMenu.Trigger>
          </NavigationMenu.TriggerGroup>
          <NavigationMenu.Content data-testid="popup-2">
            <NavigationMenu.Link href="#link-2">Link 2</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <li>
          <a data-testid="github-link" href="https://github.com/mui/base-ui">
            GitHub
          </a>
        </li>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner data-testid="positioner">
          <NavigationMenu.Popup>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

describe('<NavigationMenu.TriggerGroup />', () => {
  const { render, clock } = createRenderer({
    clockOptions: {
      shouldAdvanceTime: true,
    },
  });

  clock.withFakeTimers();

  describeConformance(<NavigationMenu.TriggerGroup />, () => ({
    refInstanceof: window.HTMLDivElement,
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

  it('opens on hover with mouse input', async () => {
    await render(<TestNavigationMenu />);
    const group = screen.getByTestId('group-1');

    fireEvent.mouseEnter(group);
    fireEvent.mouseMove(group);
    clock.tick(50);
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).not.to.equal(null);
    expect(screen.getByTestId('trigger-1')).to.have.attribute('aria-expanded', 'true');
  });

  it('does not open on click alone', async () => {
    await render(<TestNavigationMenu />);
    const group = screen.getByTestId('group-1');

    fireEvent.click(group);
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).to.equal(null);
    expect(screen.getByTestId('trigger-1')).to.have.attribute('aria-expanded', 'false');
  });

  it('allows a nested trigger to open on click', async () => {
    await render(<TestNavigationMenu />);

    fireEvent.click(screen.getByTestId('trigger-1'));
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).not.to.equal(null);
    expect(screen.getByTestId('trigger-1')).to.have.attribute('aria-expanded', 'true');
  });

  it('focuses the first menu item when opening with a nested trigger click', async () => {
    await render(<TestNavigationMenu />);

    fireEvent.click(screen.getByTestId('trigger-1'));
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).not.to.equal(null);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Link 1' })).toHaveFocus();
    });
  });

  it('returns focus to a nested trigger when closing with Escape', async () => {
    const { user } = await render(<TestNavigationMenu />);
    const trigger = screen.getByTestId('trigger-1');

    fireEvent.click(trigger);
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).not.to.equal(null);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Link 1' })).toHaveFocus();
    });

    await user.keyboard('{Escape}');
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).to.equal(null);
    expect(trigger).toHaveFocus();
  });

  it('closes when tabbing out of the nav list in TriggerGroup layout', async () => {
    const { user } = await render(
      <div>
        <TestNavigationMenu />
        <button data-testid="outside">Outside</button>
      </div>,
    );
    const trigger = screen.getByTestId('trigger-1');
    const outside = screen.getByTestId('outside');

    fireEvent.click(trigger);
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).not.to.equal(null);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Link 1' })).toHaveFocus();
    });

    await user.tab();

    if (outside !== document.activeElement) {
      await user.tab();
    }
    if (outside !== document.activeElement) {
      await user.tab();
    }
    if (outside !== document.activeElement) {
      await user.tab();
    }

    expect(outside).toHaveFocus();
    expect(screen.queryByTestId('popup-1')).to.equal(null);
    expect(trigger).to.have.attribute('aria-expanded', 'false');
  });

  it('closes when tabbing out from a plain list link in TriggerGroup layout', async () => {
    const { user } = await render(
      <div>
        <TestNavigationMenuWithPlainLink />
        <button data-testid="outside">Outside</button>
      </div>,
    );
    const group = screen.getByTestId('group-1');
    const trigger = screen.getByTestId('trigger-1');
    const githubLink = screen.getByTestId('github-link');
    const outside = screen.getByTestId('outside');

    fireEvent.mouseEnter(group);
    fireEvent.mouseMove(group);
    clock.tick(50);
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).not.to.equal(null);

    githubLink.focus();
    expect(githubLink).toHaveFocus();

    await user.tab();

    if (outside !== document.activeElement) {
      await user.tab();
    }
    if (outside !== document.activeElement) {
      await user.tab();
    }
    if (outside !== document.activeElement) {
      await user.tab();
    }

    expect(outside).toHaveFocus();
    expect(screen.queryByTestId('popup-1')).to.equal(null);
    expect(trigger).to.have.attribute('aria-expanded', 'false');
  });

  it('closes when pointer leaves the group to an outside element', async () => {
    await render(<TestNavigationMenu />);
    const group = screen.getByTestId('group-1');

    fireEvent.mouseEnter(group);
    fireEvent.mouseMove(group);
    clock.tick(50);
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).not.to.equal(null);

    fireEvent.mouseLeave(group, { relatedTarget: document.body });
    clock.tick(50);
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).to.equal(null);
    expect(screen.getByTestId('trigger-1')).to.have.attribute('aria-expanded', 'false');
  });

  it('keeps the popup open when moving pointer from group to popup', async () => {
    await render(<TestNavigationMenu />);
    const group = screen.getByTestId('group-1');

    fireEvent.mouseEnter(group);
    fireEvent.mouseMove(group);
    clock.tick(50);
    await flushMicrotasks();

    const popup = screen.getByTestId('popup-1');
    fireEvent.mouseLeave(group, { relatedTarget: popup });
    clock.tick(50);
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).not.to.equal(null);
  });

  it('keeps the popup open when moving pointer from popup back to group', async () => {
    await render(<TestNavigationMenu />);
    const group = screen.getByTestId('group-1');

    fireEvent.mouseEnter(group);
    fireEvent.mouseMove(group);
    clock.tick(50);
    await flushMicrotasks();

    const popup = screen.getByTestId('popup-1');
    const positioner = screen.getByTestId('positioner');

    fireEvent.mouseLeave(group, { relatedTarget: popup });
    fireEvent.mouseLeave(positioner, { relatedTarget: group });
    fireEvent.mouseEnter(group);
    fireEvent.mouseMove(group);
    clock.tick(50);
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).not.to.equal(null);
  });

  it('switches the active item when hovering another group while open', async () => {
    await render(<TestNavigationMenuWithTwoGroups />);

    fireEvent.mouseEnter(screen.getByTestId('group-1'));
    fireEvent.mouseMove(screen.getByTestId('group-1'));
    clock.tick(50);
    await flushMicrotasks();

    expect(screen.getByTestId('trigger-1')).to.have.attribute('aria-expanded', 'true');

    fireEvent.mouseEnter(screen.getByTestId('group-2'));
    fireEvent.mouseMove(screen.getByTestId('group-2'));
    clock.tick(50);
    await flushMicrotasks();

    expect(screen.getByTestId('trigger-1')).to.have.attribute('aria-expanded', 'false');
    expect(screen.getByTestId('trigger-2')).to.have.attribute('aria-expanded', 'true');
    expect(screen.queryByTestId('popup-2')).not.to.equal(null);
  });

  it('sets activation direction when switching groups on hover', async () => {
    await render(<TestNavigationMenuWithTwoGroups />);

    fireEvent.mouseEnter(screen.getByTestId('group-1'));
    fireEvent.mouseMove(screen.getByTestId('group-1'));
    clock.tick(50);
    await flushMicrotasks();

    fireEvent.mouseEnter(screen.getByTestId('group-2'));
    fireEvent.mouseMove(screen.getByTestId('group-2'));
    clock.tick(50);
    await flushMicrotasks();

    expect(screen.getByTestId('popup-2')).to.have.attribute('data-activation-direction', 'right');
  });
});
