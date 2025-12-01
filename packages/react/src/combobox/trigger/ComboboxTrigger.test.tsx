import { Combobox } from '@base-ui-components/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { Field } from '@base-ui-components/react/field';
import { spy } from 'sinon';

describe('<Combobox.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render(node) {
      return render(<Combobox.Root>{node}</Combobox.Root>);
    },
  }));

  it('sets tabIndex to -1 when not used as the main anchor', async () => {
    const { user } = await render(
      <Combobox.Root>
        <Combobox.Input />
        <Combobox.Trigger data-testid="trigger" />
      </Combobox.Root>,
    );

    const input = screen.getByRole('combobox');
    const trigger = screen.getByTestId('trigger');

    expect(trigger).to.have.attribute('tabindex', '-1');

    await user.click(input);
    expect(trigger).to.have.attribute('tabindex', '-1');

    await user.click(trigger);
    expect(trigger).to.have.attribute('tabindex', '-1');
  });

  describe('prop: disabled', () => {
    it('should render aria-disabled attribute when disabled', async () => {
      await render(
        <Combobox.Root>
          <Combobox.Trigger disabled data-testid="trigger">
            Open
          </Combobox.Trigger>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).to.have.attribute('disabled');
    });

    it('should inherit disabled state from ComboboxRoot', async () => {
      await render(
        <Combobox.Root disabled>
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).to.have.attribute('disabled');
    });

    it('should inherit disabled state from Field.Root', async () => {
      await render(
        <Field.Root disabled>
          <Combobox.Root>
            <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
          </Combobox.Root>
        </Field.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).to.have.attribute('disabled');
    });

    it('should not open popup when disabled', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Trigger disabled data-testid="trigger">
            Open
          </Combobox.Trigger>
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

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);

      expect(screen.queryByRole('listbox')).to.equal(null);
    });

    it('should prioritize local disabled over root disabled', async () => {
      await render(
        <Combobox.Root disabled={false}>
          <Combobox.Trigger disabled data-testid="trigger">
            Open
          </Combobox.Trigger>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).to.have.attribute('disabled');
    });
  });

  describe('prop: readOnly', () => {
    it('should render aria-readonly attribute when readOnly', async () => {
      await render(
        <Combobox.Root readOnly>
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).to.have.attribute('aria-readonly', 'true');
    });

    it('should not open popup when readOnly', async () => {
      const { user } = await render(
        <Combobox.Root readOnly>
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
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

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);

      expect(screen.queryByRole('listbox')).to.equal(null);
    });

    it('should not toggle when readOnly=false (control)', async () => {
      const { user } = await render(
        <Combobox.Root readOnly={false}>
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="a">a</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);
      expect(await screen.findByRole('listbox')).not.to.equal(null);
    });
  });

  describe('interaction behavior', () => {
    it('should toggle popup when enabled', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Input />
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
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

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      expect(await screen.findByRole('listbox')).not.to.equal(null);

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });
    });

    it('should call onOpenChange when toggling', async () => {
      const handleOpenChange = spy();
      const { user } = await render(
        <Combobox.Root onOpenChange={handleOpenChange}>
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
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

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);

      await waitFor(() => {
        expect(handleOpenChange.callCount).to.equal(1);
      });
      expect(handleOpenChange.args[0][0]).to.equal(true);
    });

    it('opens popup when pressing ArrowDown or ArrowUp', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Trigger data-testid="trigger" />
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List />
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('listbox')).not.to.equal(null);
      expect(screen.getByRole('combobox')).toHaveFocus();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).to.equal(null);

      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{ArrowUp}');
      expect(screen.queryByRole('listbox')).not.to.equal(null);
      expect(screen.getByRole('combobox')).toHaveFocus();
    });

    it('does not open on ArrowDown/ArrowUp when reference is a textarea', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Trigger>Open</Combobox.Trigger>
          <textarea aria-label="notes" />
        </Combobox.Root>,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      await user.keyboard('{ArrowDown}');
      expect(screen.queryByRole('listbox')).to.equal(null);
      await user.keyboard('{ArrowUp}');
      expect(screen.queryByRole('listbox')).to.equal(null);
    });
  });

  describe('drag selection', () => {
    it('commits selection when the input is outside the popup', async () => {
      const handleValueChange = spy();

      await render(
        <Combobox.Root onValueChange={handleValueChange}>
          <Combobox.Input />
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="alpha">Alpha</Combobox.Item>
                  <Combobox.Item value="beta">Beta</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.pointerDown(trigger, { pointerType: 'mouse', button: 0 });
      fireEvent.mouseDown(trigger, { button: 0 });

      await screen.findByRole('listbox');
      const option = await screen.findByRole('option', { name: 'Beta' });

      fireEvent.mouseMove(option, { pointerType: 'mouse' });
      await waitFor(() => expect(option).to.have.attribute('data-highlighted'));

      fireEvent.mouseUp(option, { button: 0 });

      await waitFor(() => {
        expect(handleValueChange.callCount).to.equal(1);
      });
      expect(handleValueChange.firstCall.args[0]).to.equal('beta');
    });

    it('commits selection when the input is inside the popup and the pointer is released over an item', async () => {
      const handleValueChange = spy();

      await render(
        <Combobox.Root onValueChange={handleValueChange}>
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Input />
                <Combobox.List>
                  <Combobox.Item value="alpha">Alpha</Combobox.Item>
                  <Combobox.Item value="beta">Beta</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.pointerDown(trigger, { pointerType: 'mouse', button: 0 });
      fireEvent.mouseDown(trigger, { button: 0 });

      await screen.findByRole('listbox');
      const option = await screen.findByRole('option', { name: 'Beta' });

      fireEvent.mouseMove(option, { pointerType: 'mouse' });
      await waitFor(() => expect(option).to.have.attribute('data-highlighted'));

      fireEvent.mouseUp(option, { button: 0 });

      await waitFor(() => {
        expect(handleValueChange.callCount).to.equal(1);
      });
      expect(handleValueChange.firstCall.args[0]).to.equal('beta');
    });

    it('does not commit selection if the pointer never hovers the item', async () => {
      const handleValueChange = spy();

      await render(
        <Combobox.Root onValueChange={handleValueChange}>
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Input />
                <Combobox.List>
                  <Combobox.Item value="alpha">Alpha</Combobox.Item>
                  <Combobox.Item value="beta">Beta</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.pointerDown(trigger, { pointerType: 'mouse', button: 0 });
      fireEvent.mouseDown(trigger, { button: 0 });

      await screen.findByRole('listbox');
      const option = await screen.findByRole('option', { name: 'Beta' });

      fireEvent.mouseUp(option, { button: 0 });

      await waitFor(() => {
        expect(handleValueChange.callCount).to.equal(0);
      });
    });
  });

  describe('cancel-open', () => {
    it('closes the popup when mouseup occurs outside the trigger bounds', async () => {
      await render(
        <Combobox.Root>
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="alpha">Alpha</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.pointerDown(trigger, { pointerType: 'mouse', button: 0 });
      fireEvent.mouseDown(trigger, { button: 0 });

      await screen.findByRole('listbox');

      fireEvent.mouseUp(document.body, { button: 0, clientX: 999, clientY: 999 });

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });
    });

    it('keeps the popup open when mouseup remains near the trigger bounds', async () => {
      await render(
        <Combobox.Root>
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="alpha">Alpha</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      trigger.getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          right: 100,
          bottom: 40,
          width: 100,
          height: 40,
          x: 0,
          y: 0,
          toJSON() {
            return {};
          },
        }) as DOMRect;

      fireEvent.pointerDown(trigger, { pointerType: 'mouse', button: 0 });
      fireEvent.mouseDown(trigger, { button: 0 });

      const listbox = await screen.findByRole('listbox');

      fireEvent.mouseUp(document.body, { button: 0, clientX: 1, clientY: 1 });

      expect(listbox.isConnected).to.equal(true);
    });
  });

  describe('aria attributes', () => {
    it('sets all aria attributes on the input when closed', async () => {
      await render(
        <Combobox.Root>
          <Combobox.Trigger data-testid="trigger" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List />
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      expect(trigger).to.have.attribute('tabindex', '0');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(trigger).to.have.attribute('aria-haspopup', 'dialog');
      expect(trigger).not.to.have.attribute('aria-controls');
    });

    it('sets all aria attributes on the input when open', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Trigger data-testid="trigger" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List />
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);

      const listbox = await screen.findByRole('listbox');

      expect(trigger).to.have.attribute('tabindex', '0');
      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(trigger).to.have.attribute('aria-haspopup', 'dialog');
      expect(trigger).to.have.attribute('aria-controls', listbox.id);
    });
  });

  describe('typeahead', () => {
    it('selects item when typing on focused trigger (input inside popup)', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana', 'cherry']}>
          <Combobox.Trigger data-testid="trigger">
            <Combobox.Value data-testid="value" />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item: string) => (
                    <Combobox.Item key={item} value={item}>
                      {item}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      expect(trigger).not.to.have.text('apple');

      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('a');

      expect(trigger).to.have.text('apple');
      expect(screen.queryByRole('listbox')).to.equal(null);
    });
  });
});
