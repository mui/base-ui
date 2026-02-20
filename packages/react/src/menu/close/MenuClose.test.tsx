import { expect } from 'chai';
import { Menu } from '@base-ui/react/menu';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

function isElementOrAncestorInert(element: HTMLElement) {
  let current: HTMLElement | null = element;
  while (current) {
    if (
      current.getAttribute('aria-hidden') === 'true' ||
      current.hasAttribute('inert') ||
      current.hasAttribute('data-base-ui-inert')
    ) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

describe('<Menu.Close />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Close />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render(node) {
      return render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>{node}</Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );
    },
  }));

  it('renders when menu is closed', async () => {
    await render(
      <Menu.Root>
        <Menu.Close aria-label="Close menu" />
      </Menu.Root>,
    );

    expect(screen.queryByRole('button', { name: 'Close menu' })).not.to.equal(null);
  });

  it('closes the menu when clicked', async () => {
    const { user } = await render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Close data-testid="close" />
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    expect(screen.queryByRole('menu')).not.to.equal(null);

    await user.click(screen.getByTestId('close'));

    expect(screen.queryByRole('menu')).to.equal(null);
  });

  describe('prop: visuallyHidden', () => {
    it('supports the `visuallyHidden` prop', async () => {
      await render(
        <Menu.Root defaultOpen>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Close visuallyHidden aria-label="Close menu" />
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const close = screen.getByRole('button', { name: 'Close menu' });
      expect(close.style.position).to.equal('fixed');
    });
  });

  it('enables modal focus management when `modal=true` and close is rendered', async () => {
    await render(
      <div>
        <button data-testid="outside">Outside</button>
        <Menu.Root defaultOpen modal>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Close visuallyHidden aria-label="Close menu" />
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>,
    );

    const outside = screen.getByTestId('outside');

    await waitFor(() => {
      expect(isElementOrAncestorInert(outside)).to.equal(true);
    });
  });
});
