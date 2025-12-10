import { expect } from 'chai';
import { spy } from 'sinon';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Autocomplete } from '@base-ui/react/autocomplete';

describe('<Autocomplete.Item />', () => {
  const { render } = createRenderer();

  describe('prop: onClick', () => {
    it('calls onClick when clicked with a pointer', async () => {
      const handleClick = spy();
      const { user } = await render(
        <Autocomplete.Root items={['apple', 'banana']} openOnInputClick>
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: string) => (
                    <Autocomplete.Item key={item} value={item} onClick={handleClick}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);

      const option = screen.getByRole('option', { name: 'banana' });
      await user.click(option);

      expect(handleClick.callCount).to.equal(1);
    });

    it('calls onClick when selected with Enter key (via root interaction)', async () => {
      const handleClick = spy();
      const { user } = await render(
        <Autocomplete.Root items={['one', 'two']} openOnInputClick>
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: string) => (
                    <Autocomplete.Item key={item} value={item} onClick={handleClick}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      // Move highlight to an option then press Enter to select it
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(handleClick.callCount).to.equal(1);
    });
  });
});
