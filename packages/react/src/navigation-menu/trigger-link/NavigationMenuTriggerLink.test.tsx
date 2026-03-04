import { expect } from 'chai';
import { fireEvent, screen, flushMicrotasks } from '@mui/internal-test-utils';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { createRenderer, describeConformance } from '#test-utils';

function TestNavigationMenu(props: { active?: boolean } = {}) {
  const { active = false } = props;

  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.TriggerGroup data-testid="group-1">
            <NavigationMenu.TriggerLink data-testid="trigger-link-1" href="#item-1" active={active}>
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
        <NavigationMenu.Positioner>
          <NavigationMenu.Popup>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

describe('<NavigationMenu.TriggerLink />', () => {
  const { render } = createRenderer();

  describeConformance(<NavigationMenu.TriggerLink />, () => ({
    refInstanceof: window.HTMLAnchorElement,
    render(node) {
      return render(
        <NavigationMenu.Root>
          <NavigationMenu.List>
            <NavigationMenu.Item>
              <NavigationMenu.TriggerGroup>{node}</NavigationMenu.TriggerGroup>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>,
      );
    },
  }));

  it('sets aria-current="page" when active', async () => {
    await render(<TestNavigationMenu active />);

    expect(screen.getByRole('link', { name: 'Item 1' })).to.have.attribute('aria-current', 'page');
  });

  it('adds data-popup-open when the item is open', async () => {
    await render(<TestNavigationMenu />);

    fireEvent.click(screen.getByTestId('trigger-1'));
    await flushMicrotasks();

    expect(screen.getByTestId('trigger-link-1')).to.have.attribute('data-popup-open');
  });

  it('closes the menu when focus moves outside from the trigger link', async () => {
    await render(
      <div>
        <button data-testid="outside">Outside</button>
        <TestNavigationMenu />
      </div>,
    );

    fireEvent.click(screen.getByTestId('trigger-1'));
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).not.to.equal(null);

    const triggerLink = screen.getByTestId('trigger-link-1');
    const outsideButton = screen.getByTestId('outside');

    fireEvent.focus(triggerLink);
    fireEvent.blur(triggerLink, {
      relatedTarget: outsideButton,
    });
    await flushMicrotasks();

    expect(screen.queryByTestId('popup-1')).to.equal(null);
    expect(screen.getByTestId('trigger-1')).to.have.attribute('aria-expanded', 'false');
  });
});
