import { expect } from 'chai';
import { Combobox } from '@base-ui/react/combobox';
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

describe('<Combobox.Close />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Close />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render(node) {
      return render(
        <Combobox.Root open>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>{node}</Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );
    },
  }));

  it('renders when popup is closed', async () => {
    await render(
      <Combobox.Root items={['Apple']}>
        <Combobox.Close aria-label="Close combobox" />
        <Combobox.Input />
      </Combobox.Root>,
    );

    expect(screen.queryByRole('button', { name: 'Close combobox' })).not.to.equal(null);
  });

  it('closes the combobox popup when clicked', async () => {
    const { user } = await render(
      <Combobox.Root defaultOpen items={['Apple']}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Close data-testid="close" />
              <Combobox.List>
                <Combobox.Item value="Apple">Apple</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(screen.queryByRole('listbox')).not.to.equal(null);

    await user.click(screen.getByTestId('close'));

    expect(screen.queryByRole('listbox')).to.equal(null);
  });

  describe('prop: visuallyHidden', () => {
    it('supports the `visuallyHidden` prop', async () => {
      await render(
        <Combobox.Root defaultOpen items={['Apple']}>
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Close visuallyHidden aria-label="Close combobox" />
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const close = screen.getByRole('button', { name: 'Close combobox' });
      expect(close.style.position).to.equal('fixed');
    });
  });

  it('enables modal focus management when `modal=true` and close is rendered', async () => {
    await render(
      <div>
        <button data-testid="outside">Outside</button>
        <Combobox.Root defaultOpen modal items={['Apple']}>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Input />
                <Combobox.Close visuallyHidden aria-label="Close combobox" />
                <Combobox.List>
                  <Combobox.Item value="Apple">Apple</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      </div>,
    );

    const outside = screen.getByTestId('outside');

    await waitFor(() => {
      expect(isElementOrAncestorInert(outside)).to.equal(true);
    });
  });
});
