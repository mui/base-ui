import { Combobox } from '@base-ui/react/combobox';
import { fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { spy } from 'sinon';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { expect } from 'chai';

describe('<Combobox.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Item />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Combobox.Root>{node}</Combobox.Root>);
    },
  }));

  it('selects item and closes in single mode', async () => {
    await render(
      <Combobox.Root defaultOpen>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="one">one</Combobox.Item>
                <Combobox.Item value="two">two</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    fireEvent.click(screen.getByRole('option', { name: 'two' }));
    await flushMicrotasks();

    expect(input).to.have.value('two');
    expect(screen.queryByRole('listbox')).to.equal(null);
  });

  describe('prop: onClick', () => {
    it('calls onClick when clicked with a pointer', async () => {
      const handleClick = spy();
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana']} openOnInputClick>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item: string) => (
                    <Combobox.Item key={item} value={item} onClick={handleClick}>
                      {item}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
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
        <Combobox.Root items={['one', 'two']} openOnInputClick>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item: string) => (
                    <Combobox.Item key={item} value={item} onClick={handleClick}>
                      {item}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(handleClick.callCount).to.equal(1);
    });
  });

  it('does not select disabled item', async () => {
    await render(
      <Combobox.Root defaultOpen>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="one">one</Combobox.Item>
                <Combobox.Item value="two" disabled>
                  two
                </Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    fireEvent.click(screen.getByRole('option', { name: 'two' }));
    await flushMicrotasks();

    expect(input).to.have.value('');
  });

  it('Enter selects highlighted item', async () => {
    const { user } = await render(
      <Combobox.Root>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="one">one</Combobox.Item>
                <Combobox.Item value="two">two</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(input).to.have.value('one'));
    expect(screen.queryByRole('listbox')).to.equal(null);
  });

  it('multiple mode toggles selection and stays open', async () => {
    const { user } = await render(
      <Combobox.Root multiple>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="a">a</Combobox.Item>
                <Combobox.Item value="b">b</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    await waitFor(() => {
      expect(screen.getByRole('listbox')).not.to.equal(null);
    });

    const a = screen.getByRole('option', { name: 'a' });
    await user.click(a);
    expect(a).to.have.attribute('aria-selected', 'true');
    expect(screen.getByRole('listbox')).not.to.equal(null);

    await user.click(a);
    expect(a).not.to.have.attribute('aria-selected', 'true');
  });

  it('reflects selected value with aria-selected when reopening', async () => {
    const { user } = await render(
      <Combobox.Root defaultValue="two">
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="one">one</Combobox.Item>
                <Combobox.Item value="two">two</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'two' })).to.have.attribute(
        'aria-selected',
        'true',
      ),
    );
  });

  describe.skipIf(!isJSDOM)('link handling', () => {
    it('clicking a link inside an item does not select or close (anchor with href)', async () => {
      const { user } = await render(
        <Combobox.Root defaultOpen>
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item
                    value="one"
                    render={<a href="/somewhere" />}
                    data-testid="link-one"
                  >
                    one
                  </Combobox.Item>
                  <Combobox.Item value="two">two</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      const link = screen.getByTestId('link-one');

      await user.click(link);

      await waitFor(() => expect(input.value).to.equal(''));
      expect(screen.queryByRole('listbox')).not.to.equal(null);
    });

    it('clicking a hash link inside an item does not select and closes popup (anchor with #hash)', async () => {
      const { user } = await render(
        <Combobox.Root defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="one" render={<a href="#section" />} data-testid="link-hash">
                    one
                  </Combobox.Item>
                  <Combobox.Item value="two">two</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      const link = screen.getByTestId('link-hash');

      await user.click(link);

      await waitFor(() => expect(input.value).to.equal(''));
      expect(screen.queryByRole('listbox')).to.equal(null);
    });

    it('clicking an anchor without href behaves like normal item (selects and closes)', async () => {
      const { user } = await render(
        <Combobox.Root defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="one" render={<a />} data-testid="anchor-no-href">
                    one
                  </Combobox.Item>
                  <Combobox.Item value="two">two</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      await user.click(screen.getByTestId('anchor-no-href'));

      await waitFor(() => expect(input.value).to.equal('one'));
      expect(screen.queryByRole('listbox')).to.equal(null);
    });
  });
});
