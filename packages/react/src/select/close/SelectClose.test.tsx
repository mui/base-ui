import { expect } from 'chai';
import { Select } from '@base-ui/react/select';
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

describe('<Select.Close />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Close />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>{node}</Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );
    },
  }));

  it('renders when popup is closed', async () => {
    await render(
      <Select.Root>
        <Select.Close aria-label="Close select" />
        <Select.Trigger>Open</Select.Trigger>
      </Select.Root>,
    );

    expect(screen.queryByRole('button', { name: 'Close select' })).not.to.equal(null);
  });

  it('closes the select popup when clicked', async () => {
    const { user } = await render(
      <Select.Root defaultOpen>
        <Select.Trigger>Open</Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Close data-testid="close" />
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    expect(screen.queryByRole('listbox')).not.to.equal(null);

    await user.click(screen.getByTestId('close'));

    expect(screen.queryByRole('listbox')).to.equal(null);
  });

  describe('prop: visuallyHidden', () => {
    it('supports the `visuallyHidden` prop', async () => {
      await render(
        <Select.Root defaultOpen>
          <Select.Trigger>Open</Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Close visuallyHidden aria-label="Close select" />
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const close = screen.getByRole('button', { name: 'Close select' });
      expect(close.style.position).to.equal('fixed');
    });
  });

  it('enables modal focus management when `modal=true` and close is rendered', async () => {
    await render(
      <div>
        <button data-testid="outside">Outside</button>
        <Select.Root defaultOpen modal>
          <Select.Trigger>Open</Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Close visuallyHidden aria-label="Close select" />
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>,
    );

    const outside = screen.getByTestId('outside');

    await waitFor(() => {
      expect(isElementOrAncestorInert(outside)).to.equal(true);
    });
  });
});
