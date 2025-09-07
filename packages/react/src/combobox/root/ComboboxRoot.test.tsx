import * as React from 'react';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM, popupConformanceTests } from '#test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Combobox } from '@base-ui-components/react/combobox';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';

describe('<Combobox.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  popupConformanceTests({
    createComponent: (props) => (
      <Combobox.Root {...props.root}>
        <Combobox.Input data-testid="trigger" />
        <Combobox.Portal {...props.portal}>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List {...props.popup}>
                <Combobox.Item value="item">Item</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ),
    render,
    triggerMouseAction: 'click',
    expectedPopupRole: 'listbox',
    combobox: true,
  });

  describe('selection behavior', () => {
    describe('single', () => {
      it('should auto-close popup after selection when open state is uncontrolled', async () => {
        const items = ['apple', 'banana', 'cherry'];

        const { user } = await render(
          <Combobox.Root items={items}>
            <Combobox.Input data-testid="input" />
            <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
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

        const input = screen.getByTestId('input');
        const trigger = screen.getByTestId('trigger');
        await user.click(trigger);

        expect(screen.getByRole('listbox')).not.to.equal(null);
        expect(input).to.have.attribute('aria-expanded', 'true');

        await user.click(screen.getByText('apple'));

        expect(screen.queryByRole('listbox')).to.equal(null);
        expect(input).to.have.attribute('aria-expanded', 'false');
      });

      it('should not auto-close popup when open state is controlled', async () => {
        const items = ['apple', 'banana', 'cherry'];

        const { user } = await render(
          <Combobox.Root items={items} open>
            <Combobox.Input data-testid="input" />
            <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
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

        await user.click(screen.getByText('apple'));
        expect(screen.getByRole('listbox')).not.to.equal(null);
      });

      it('should show all items when query is empty with enhanced filter', async () => {
        const items = ['apple', 'banana', 'cherry'];

        await render(
          <Combobox.Root items={items} defaultOpen>
            <Combobox.Input data-testid="input" />
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

        expect(screen.queryByText('apple')).not.to.equal(null);
        expect(screen.queryByText('banana')).not.to.equal(null);
        expect(screen.queryByText('cherry')).not.to.equal(null);
      });

      it('should show all items when query matches current selection', async () => {
        const items = ['apple', 'banana', 'cherry'];

        const { user } = await render(
          <Combobox.Root items={items} defaultValue="apple">
            <Combobox.Input data-testid="input" />
            <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(item) => (
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

        const input = screen.getByTestId('input');
        const trigger = screen.getByTestId('trigger');

        await user.click(trigger);
        await user.click(screen.getByText('apple'));

        expect(input).to.have.value('apple');

        await user.click(trigger);

        expect(screen.queryByText('apple')).not.to.equal(null);
        expect(screen.queryByText('banana')).not.to.equal(null);
        expect(screen.queryByText('cherry')).not.to.equal(null);
      });

      it('should reset input value to selected value when popup closes without selection', async () => {
        const items = ['apple', 'banana', 'cherry'];

        const { user } = await render(
          <Combobox.Root items={items} defaultValue="apple">
            <Combobox.Input data-testid="input" />
            <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(item) => (
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

        const input = screen.getByTestId('input');
        const trigger = screen.getByTestId('trigger');

        await user.click(trigger);
        await user.click(screen.getByText('apple'));

        expect(input).to.have.value('apple');

        await user.click(trigger);
        await user.clear(input);
        await user.type(input, 'xyz');
        expect(input).to.have.value('xyz');

        await user.click(document.body);

        expect(input).to.have.value('apple');
      });

      it('should not auto-close during browser autofill', async () => {
        const items = ['apple', 'banana', 'cherry'];

        const { container } = await render(
          <Combobox.Root items={items} name="test" defaultOpen>
            <Combobox.Input data-testid="input" />
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

        expect(screen.getByRole('listbox')).not.to.equal(null);

        const hiddenInput = container.querySelector('[name="test"]');
        fireEvent.change(hiddenInput!, { target: { value: 'apple' } });

        await flushMicrotasks();

        expect(screen.getByRole('listbox')).not.to.equal(null);
      });
    });

    describe('multiple', () => {
      it('should handle multiple selection', async () => {
        const handleValueChange = spy();

        const { user } = await render(
          <Combobox.Root multiple onValueChange={handleValueChange}>
            <Combobox.Input />
            <Combobox.List>
              <Combobox.Item value="a">a</Combobox.Item>
              <Combobox.Item value="b">b</Combobox.Item>
              <Combobox.Item value="c">c</Combobox.Item>
            </Combobox.List>
          </Combobox.Root>,
        );

        const optionA = screen.getByRole('option', { name: 'a' });
        await user.click(optionA);

        expect(handleValueChange.callCount).to.equal(1);
        expect(handleValueChange.args[0][0]).to.deep.equal(['a']);

        const optionB = screen.getByRole('option', { name: 'b' });
        await user.click(optionB);

        expect(handleValueChange.callCount).to.equal(2);
        expect(handleValueChange.args[1][0]).to.deep.equal(['a', 'b']);
      });

      it('should create multiple hidden inputs for form submission', async () => {
        const { container } = await render(
          <Combobox.Root multiple value={['a', 'b']} name="languages">
            <Combobox.Input />
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

        const hiddenInputs = container.querySelectorAll('input[type="hidden"][name="languages"]');
        expect(hiddenInputs).to.have.length(2);
        expect(hiddenInputs[0]).to.have.attribute('value', 'a');
        expect(hiddenInputs[1]).to.have.attribute('value', 'b');
      });

      it('should handle disabled state with chips', async () => {
        const { user } = await render(
          <Combobox.Root multiple disabled defaultValue={['a', 'b']}>
            <Combobox.Input data-testid="input" />
            <Combobox.Chips>
              <Combobox.Chip data-testid="chip-a">
                <Combobox.ChipRemove data-testid="remove-a" />
              </Combobox.Chip>
              <Combobox.Chip data-testid="chip-b">
                <Combobox.ChipRemove data-testid="remove-b" />
              </Combobox.Chip>
            </Combobox.Chips>
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Item value="a">a</Combobox.Item>
                    <Combobox.Item value="b">b</Combobox.Item>
                    <Combobox.Item value="c">c</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>,
        );

        const chipA = screen.getByTestId('chip-a');
        const removeA = screen.getByTestId('remove-a');

        expect(chipA).to.have.attribute('aria-disabled', 'true');
        expect(removeA).to.have.attribute('aria-disabled', 'true');

        await user.click(removeA);
        expect(screen.getByTestId('chip-a')).not.to.equal(null);
      });

      it('should handle readOnly state with chips', async () => {
        const { user } = await render(
          <Combobox.Root multiple readOnly defaultValue={['a', 'b']}>
            <Combobox.Input data-testid="input" />
            <Combobox.Chips>
              <Combobox.Chip data-testid="chip-a">
                <Combobox.ChipRemove data-testid="remove-a" />
              </Combobox.Chip>
              <Combobox.Chip data-testid="chip-b">
                <Combobox.ChipRemove data-testid="remove-b" />
              </Combobox.Chip>
            </Combobox.Chips>
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Item value="a">a</Combobox.Item>
                    <Combobox.Item value="b">b</Combobox.Item>
                    <Combobox.Item value="c">c</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>,
        );

        const chipA = screen.getByTestId('chip-a');
        const removeA = screen.getByTestId('remove-a');

        expect(chipA).to.have.attribute('aria-readonly', 'true');
        expect(removeA).to.have.attribute('aria-readonly', 'true');

        await user.click(removeA);
        expect(screen.getByTestId('chip-a')).not.to.equal(null);
      });
    });
  });

  describe('keyboard interaction', () => {
    it('focuses first item on ArrowDown and last item on ArrowUp', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                  <Combobox.Item value="banana">banana</Combobox.Item>
                  <Combobox.Item value="cherry">cherry</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');

      await act(async () => input.focus());

      await user.keyboard('{ArrowDown}');
      await waitFor(() => {
        const first = screen.getByRole('option', { name: 'apple' });
        expect(input).to.have.attribute('aria-activedescendant', first.id);
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });

      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        const last = screen.getByRole('option', { name: 'cherry' });
        expect(input).to.have.attribute('aria-activedescendant', last.id);
      });
    });

    it('opens, navigates with ArrowDown, and Enter selects', async () => {
      const items = ['apple', 'banana', 'cherry'];

      const { user } = await render(
        <Combobox.Root items={items}>
          <Combobox.Input data-testid="input" />
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

      const input = screen.getByTestId('input');

      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      // Highlight first item and select it
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(screen.queryByRole('listbox')).to.equal(null);
      expect(input).to.have.value('apple');
    });

    it('Enter selects with manual indices provided to items', async () => {
      const items = ['apple', 'banana', 'cherry'];

      const { user } = await render(
        <Combobox.Root items={items}>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item: string, index: number) => (
                    <Combobox.Item key={item} value={item} index={index}>
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
      await waitFor(() => {
        expect(screen.getByRole('listbox')).not.to.equal(null);
      });

      await user.type(input, 'c'); // filter to "cherry"
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(input).to.have.value('cherry');
      });
    });

    it('Escape closes the popup without committing when nothing highlighted', async () => {
      const { user } = await render(
        <Combobox.Root defaultOpen items={['a', 'b']}>
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
      expect(screen.queryByRole('listbox')).not.to.equal(null);

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).to.equal(null);
      expect(input).to.have.value('');
    });

    it('bubbles Escape key when rendered inline without Positioner/Popup', async () => {
      const onOuterKeyDown = spy();

      const { user } = await render(
        <div
          data-testid="outer"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onOuterKeyDown();
            }
          }}
        >
          <Combobox.Root defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              <Combobox.Item value="a">a</Combobox.Item>
              <Combobox.Item value="b">b</Combobox.Item>
            </Combobox.List>
          </Combobox.Root>
        </div>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).not.to.equal(null);
      });

      await user.keyboard('{Escape}');

      expect(onOuterKeyDown.callCount).to.equal(1);
    });
  });

  describe('aria attributes', () => {
    it('sets all aria attributes on the input when closed', async () => {
      await render(
        <Combobox.Root>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner />
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');

      expect(input).to.attribute('role', 'combobox');
      expect(input).to.have.attribute('aria-expanded', 'false');
      expect(input).to.have.attribute('aria-autocomplete', 'list');
      expect(input).to.have.attribute('aria-haspopup', 'listbox');
      expect(input).not.to.have.attribute('aria-controls');
      expect(input).not.to.have.attribute('aria-activedescendant');
    });

    it('sets all aria attributes on the input when open', async () => {
      await render(
        <Combobox.Root defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List />
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      const listbox = screen.getByRole('listbox');

      expect(input).to.have.attribute('role', 'combobox');
      expect(input).to.have.attribute('aria-expanded', 'true');
      expect(input).to.have.attribute('aria-autocomplete', 'list');
      expect(input).to.have.attribute('aria-haspopup', 'listbox');
      expect(input).to.have.attribute('aria-controls', listbox.id);
      expect(input).not.to.have.attribute('aria-activedescendant');
    });

    it('sets correct attributes on the item when highlighted', async () => {
      const { user } = await render(
        <Combobox.Root defaultOpen>
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

      const input = screen.getByRole('combobox');

      await user.click(input);

      expect(input).not.to.have.attribute('aria-activedescendant');

      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'a' })).to.have.attribute(
          'aria-selected',
          'false',
        );
      });
      expect(screen.getByRole('option', { name: 'b' })).to.have.attribute('aria-selected', 'false');
      expect(input).to.have.attribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'a' }).id,
      );

      await user.keyboard('{Enter}');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'a' })).to.have.attribute(
          'aria-selected',
          'true',
        );
      });
      expect(screen.getByRole('option', { name: 'b' })).to.have.attribute('aria-selected', 'false');
    });

    it('sets aria-controls="dialog" attribute on trigger', async () => {
      const { user } = await render(
        <Combobox.Root defaultOpen>
          <Combobox.Trigger>trigger</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Input data-testid="input" />
                <Combobox.List />
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'trigger' });
      const listbox = screen.getByRole('listbox');

      expect(trigger).to.have.attribute('aria-controls', listbox.id);
      expect(trigger).to.have.attribute('aria-expanded', 'true');

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).to.have.attribute('aria-expanded', 'false');
      });
      expect(trigger).not.to.have.attribute('aria-controls');
    });
  });

  it('should handle browser autofill', async () => {
    const { container } = await render(
      <Combobox.Root name="combobox" defaultOpen>
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

    await flushMicrotasks();

    fireEvent.change(container.querySelector('[name="combobox"]')!, { target: { value: 'b' } });

    await flushMicrotasks();

    expect(screen.getByRole('option', { name: 'b', hidden: false })).to.have.attribute(
      'aria-selected',
      'true',
    );
  });

  describe('prop: id', () => {
    it('sets the id on the hidden input', async () => {
      const { container } = await render(
        <Combobox.Root id="test-id">
          <Combobox.Input />
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

      const hiddenInput = container.querySelector('input[aria-hidden="true"]');
      expect(hiddenInput).to.have.attribute('id', 'test-id');
    });
  });

  describe('prop: disabled', () => {
    it('should render disabled state on all interactive components', async () => {
      const { user } = await render(
        <Combobox.Root disabled>
          <Combobox.Input data-testid="input" />
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="a" data-testid="item-a">
                    a
                  </Combobox.Item>
                  <Combobox.Item value="b" data-testid="item-b">
                    b
                  </Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      const trigger = screen.getByTestId('trigger');

      expect(input).to.have.attribute('disabled');
      expect(trigger).to.have.attribute('disabled');

      // Verify interactions are disabled
      await user.click(trigger);
      expect(screen.queryByRole('listbox')).to.equal(null);
    });

    it('should not open popup when disabled', async () => {
      const { user } = await render(
        <Combobox.Root disabled>
          <Combobox.Input data-testid="input" />
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

      const input = screen.getByTestId('input');
      const trigger = screen.getByTestId('trigger');

      await user.click(input);
      expect(screen.queryByRole('listbox')).to.equal(null);

      await user.click(trigger);
      expect(screen.queryByRole('listbox')).to.equal(null);
    });

    it('should prevent keyboard interactions when disabled', async () => {
      const { user } = await render(
        <Combobox.Root disabled>
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

      await user.type(input, 'a');
      expect(screen.queryByRole('listbox')).to.equal(null);
    });

    it('should set disabled attribute on hidden input', async () => {
      const { container } = await render(
        <Combobox.Root disabled name="test">
          <Combobox.Input />
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

      const hiddenInput = container.querySelector('input[aria-hidden="true"]');
      expect(hiddenInput).to.have.attribute('disabled');
    });
  });

  describe('prop: readOnly', () => {
    it('should render readOnly state on all interactive components', async () => {
      const { user } = await render(
        <Combobox.Root readOnly>
          <Combobox.Input data-testid="input" />
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="a" data-testid="item-a">
                    a
                  </Combobox.Item>
                  <Combobox.Item value="b" data-testid="item-b">
                    b
                  </Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      const trigger = screen.getByTestId('trigger');

      expect(input).to.have.attribute('aria-readonly', 'true');
      expect(input).to.have.attribute('readonly');
      expect(trigger).to.have.attribute('aria-readonly', 'true');

      // Verify interactions are disabled
      await user.click(trigger);
      expect(screen.queryByRole('listbox')).to.equal(null);
    });

    it('should not open popup when readOnly', async () => {
      const { user } = await render(
        <Combobox.Root readOnly>
          <Combobox.Input data-testid="input" />
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

      const input = screen.getByTestId('input');
      const trigger = screen.getByTestId('trigger');

      await user.click(input);
      expect(screen.queryByRole('listbox')).to.equal(null);

      await user.click(trigger);
      expect(screen.queryByRole('listbox')).to.equal(null);
    });

    it('should prevent keyboard interactions when readOnly', async () => {
      const { user } = await render(
        <Combobox.Root readOnly>
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

      await user.type(input, 'a');
      expect(screen.queryByRole('listbox')).to.equal(null);
    });

    it('should set readOnly attribute on hidden input', async () => {
      const { container } = await render(
        <Combobox.Root readOnly name="test">
          <Combobox.Input />
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

      const hiddenInput = container.querySelector('input[aria-hidden="true"]');
      expect(hiddenInput).to.have.attribute('readonly');
    });

    it('should prevent value changes when readOnly with items', async () => {
      const handleValueChange = spy();
      const { user } = await render(
        <Combobox.Root readOnly onValueChange={handleValueChange} defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="a" data-testid="item-a">
                    a
                  </Combobox.Item>
                  <Combobox.Item value="b" data-testid="item-b">
                    b
                  </Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const itemA = screen.getByTestId('item-a');
      await user.click(itemA);

      expect(handleValueChange.callCount).to.equal(0);
    });
  });

  describe('prop: itemToStringLabel', () => {
    const items = [
      { country: 'United States', code: 'US' },
      { country: 'Canada', code: 'CA' },
      { country: 'Australia', code: 'AU' },
    ];

    it('uses itemToStringLabel for input value synchronization', async () => {
      const { user } = await render(
        <Combobox.Root
          items={items}
          itemToStringLabel={(item) => item.country}
          itemToStringValue={(item) => item.code}
          defaultOpen
        >
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item: { country: string; code: string }) => (
                    <Combobox.Item key={item.code} value={item}>
                      {item.country}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole('combobox');
      await user.click(screen.getByText('Canada'));
      expect(input).to.have.value('Canada');
    });
  });

  describe('prop: itemToStringValue', () => {
    const items = [
      { country: 'United States', code: 'US' },
      { country: 'Canada', code: 'CA' },
      { country: 'Australia', code: 'AU' },
    ];

    it('uses itemToStringValue for form submission', async () => {
      const { container } = await render(
        <Combobox.Root
          name="country"
          items={items}
          itemToStringLabel={(item) => item.country}
          itemToStringValue={(item) => item.code}
          defaultValue={items[0]}
        >
          <Combobox.Input />
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

      const hiddenInput = container.querySelector('input[name="country"]');
      expect(hiddenInput).to.have.value('US');
    });

    it('uses itemToStringValue for multiple selection form submission', async () => {
      const { container } = await render(
        <Combobox.Root
          name="countries"
          items={items}
          itemToStringLabel={(item) => item.country}
          itemToStringValue={(item) => item.code}
          multiple
          defaultValue={[items[0], items[1]]}
        >
          <Combobox.Input />
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

      const hiddenInputs = container.querySelectorAll('input[name="countries"]');
      expect(hiddenInputs).to.have.length(2);
      expect(hiddenInputs[0]).to.have.value('US');
      expect(hiddenInputs[1]).to.have.value('CA');
    });
  });

  describe('prop: grid', () => {
    it('sets grid roles when grid is enabled and rows are used', async () => {
      await render(
        <Combobox.Root grid defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Row>
                    <Combobox.Item value="1">1</Combobox.Item>
                    <Combobox.Item value="2">2</Combobox.Item>
                    <Combobox.Item value="3">3</Combobox.Item>
                  </Combobox.Row>
                  <Combobox.Row>
                    <Combobox.Item value="4">4</Combobox.Item>
                    <Combobox.Item value="5">5</Combobox.Item>
                    <Combobox.Item value="6">6</Combobox.Item>
                  </Combobox.Row>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const grid = screen.getByRole('grid');
      expect(grid).not.to.equal(null);
      const cells = screen.getAllByRole('gridcell');
      expect(cells).to.have.length(6);
    });

    it('arrow keys navigate across rows and columns in grid mode', async () => {
      const onItemHighlighted = spy();
      const { user } = await render(
        <Combobox.Root grid onItemHighlighted={onItemHighlighted} defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Row>
                    <Combobox.Item value="1">1</Combobox.Item>
                    <Combobox.Item value="2">2</Combobox.Item>
                    <Combobox.Item value="3">3</Combobox.Item>
                  </Combobox.Row>
                  <Combobox.Row>
                    <Combobox.Item value="4">4</Combobox.Item>
                    <Combobox.Item value="5">5</Combobox.Item>
                    <Combobox.Item value="6">6</Combobox.Item>
                  </Combobox.Row>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('grid')).not.to.equal(null));

      await user.keyboard('{ArrowDown}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('1'));

      await user.keyboard('{ArrowRight}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('2'));

      await user.keyboard('{ArrowRight}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('3'));

      await user.keyboard('{ArrowDown}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('6'));

      await user.keyboard('{ArrowLeft}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('5'));

      await user.keyboard('{ArrowUp}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('2'));
    });

    it('supports uneven rows navigation', async () => {
      const onItemHighlighted = spy();
      const { user } = await render(
        <Combobox.Root grid onItemHighlighted={onItemHighlighted} defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Row>
                    <Combobox.Item value="1">1</Combobox.Item>
                    <Combobox.Item value="2">2</Combobox.Item>
                    <Combobox.Item value="3">3</Combobox.Item>
                  </Combobox.Row>
                  <Combobox.Row>
                    <Combobox.Item value="4">4</Combobox.Item>
                    <Combobox.Item value="5">5</Combobox.Item>
                  </Combobox.Row>
                  <Combobox.Row>
                    <Combobox.Item value="6">6</Combobox.Item>
                    <Combobox.Item value="7">7</Combobox.Item>
                    <Combobox.Item value="8">8</Combobox.Item>
                    <Combobox.Item value="9">9</Combobox.Item>
                    <Combobox.Item value="10">10</Combobox.Item>
                  </Combobox.Row>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('grid')).not.to.equal(null));

      await user.keyboard('{ArrowDown}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('1'));

      await user.keyboard('{ArrowRight}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('2'));

      await user.keyboard('{ArrowRight}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('3'));

      // Down from last col (3) to shorter row should clamp to last item (5)
      await user.keyboard('{ArrowDown}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('5'));

      // Up from clamped item (5) should return to same column in previous row (2)
      await user.keyboard('{ArrowUp}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('2'));

      // From 2, move down to 5 (same column), then down to 7 in the longer row
      await user.keyboard('{ArrowDown}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('5'));

      await user.keyboard('{ArrowDown}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('7'));

      // Left within last row goes to 6, up to first col in previous row (4)
      await user.keyboard('{ArrowLeft}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('6'));

      await user.keyboard('{ArrowUp}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('4'));
    });

    it('supports uneven rows navigation within groups', async () => {
      const onItemHighlighted = spy();
      const { user } = await render(
        <Combobox.Root grid onItemHighlighted={onItemHighlighted} defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Group>
                    <Combobox.Row>
                      <Combobox.Item value="1">1</Combobox.Item>
                      <Combobox.Item value="2">2</Combobox.Item>
                      <Combobox.Item value="3">3</Combobox.Item>
                    </Combobox.Row>
                  </Combobox.Group>
                  <Combobox.Group>
                    <Combobox.Row>
                      <Combobox.Item value="4">4</Combobox.Item>
                      <Combobox.Item value="5">5</Combobox.Item>
                    </Combobox.Row>
                  </Combobox.Group>
                  <Combobox.Group>
                    <Combobox.Row>
                      <Combobox.Item value="6">6</Combobox.Item>
                      <Combobox.Item value="7">7</Combobox.Item>
                      <Combobox.Item value="8">8</Combobox.Item>
                      <Combobox.Item value="9">9</Combobox.Item>
                      <Combobox.Item value="10">10</Combobox.Item>
                    </Combobox.Row>
                  </Combobox.Group>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('grid')).not.to.equal(null));

      await user.keyboard('{ArrowDown}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('1'));

      await user.keyboard('{ArrowRight}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('2'));

      await user.keyboard('{ArrowRight}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('3'));

      await user.keyboard('{ArrowDown}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('5'));

      await user.keyboard('{ArrowUp}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('2'));

      await user.keyboard('{ArrowDown}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('5'));

      await user.keyboard('{ArrowDown}');
      await waitFor(() => expect(onItemHighlighted.lastCall.args[0]).to.equal('7'));
    });
  });

  describe('prop: multiple', () => {
    it('"single" selects and closes, then reopens with selection focused', async () => {
      const { user } = await render(
        <Combobox.Root defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="a">a</Combobox.Item>
                  <Combobox.Item value="b">b</Combobox.Item>
                  <Combobox.Item value="c">c</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(screen.getByRole('option', { name: 'b' }));
      expect(screen.queryByRole('listbox')).to.equal(null);
      expect(input).to.have.value('b');

      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));
      expect(screen.getByRole('option', { name: 'b' })).to.have.attribute('aria-selected', 'true');
    });

    it('"multiple" clears uncontrolled input after select when filtering', async () => {
      const { user } = await render(
        <Combobox.Root multiple>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                  <Combobox.Item value="banana">banana</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.type(input, 'app');
      await flushMicrotasks();
      await user.click(screen.getByRole('option', { name: 'apple' }));
      await flushMicrotasks();

      // After selecting while filtering, uncontrolled input clears
      expect(input).to.have.value('');
    });

    it('"multiple" clears typed input on close when no selection made', async () => {
      const onInput = spy();
      const { user } = await render(
        <Combobox.Root multiple defaultOpen onInputValueChange={onInput}>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                  <Combobox.Item value="banana">banana</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.type(input, 'app');
      await flushMicrotasks();

      // Close without selecting
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('listbox')).to.equal(null);
      expect(input).to.have.value('');
      expect(onInput.lastCall.args[0]).to.equal('');
      expect(onInput.lastCall.args[1].reason).to.equal('input-clear');
    });

    it('"single" clears typed input on close when no selection made (input outside popup)', async () => {
      const onInput = spy();
      const { user } = await render(
        <Combobox.Root defaultOpen onInputValueChange={onInput}>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                  <Combobox.Item value="banana">banana</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.type(input, 'zz');
      await flushMicrotasks();

      // Close without selecting
      await user.keyboard('{Escape}');

      await waitFor(() => expect(screen.queryByRole('listbox')).to.equal(null));
      expect(input).to.have.value('');
      expect(onInput.lastCall.args[0]).to.equal('');
      expect(onInput.lastCall.args[1].reason).to.equal('input-clear');
    });
  });

  describe('prop: filter', () => {
    it('uses custom filter to narrow results', async () => {
      const items = ['alpha', 'beta', 'alphabet', 'alpine'];
      const startsWith = (item: string, q: string) => item.toLowerCase().startsWith(q);

      const { user } = await render(
        <Combobox.Root items={items} filter={(item, q) => startsWith(String(item), q)}>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item) => (
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

      const input = screen.getByTestId('input');
      await user.type(input, 'alp');
      await flushMicrotasks();

      // Only beta should be filtered out
      expect(screen.queryByText('beta')).to.equal(null);
      expect(screen.queryByText('alpha')).not.to.equal(null);
      expect(screen.queryByText('alphabet')).not.to.equal(null);
      expect(screen.queryByText('alpine')).not.to.equal(null);
    });
  });

  describe('prop: openOnInputClick', () => {
    it('opens on input click by default', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Input data-testid="input" />
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

      const input = screen.getByTestId('input');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      // Click input again should not toggle closed automatically
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));
    });

    it('does not open on input click when false, but opens on typing', async () => {
      const { user } = await render(
        <Combobox.Root openOnInputClick={false}>
          <Combobox.Input data-testid="input" />
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

      const input = screen.getByTestId('input');
      await user.click(input);
      expect(screen.queryByRole('listbox')).to.equal(null);

      await user.type(input, 'a');
      expect(screen.queryByRole('listbox')).not.to.equal(null);
    });
  });

  describe('prop: onItemHighlighted', () => {
    it('fires on keyboard navigation', async () => {
      const items = ['a', 'b', 'c'];
      const onItemHighlighted = spy();

      const { user } = await render(
        <Combobox.Root items={items} onItemHighlighted={onItemHighlighted}>
          <Combobox.Input data-testid="input" />
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

      const input = screen.getByTestId('input');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(onItemHighlighted.callCount).to.be.greaterThan(0);
      });
      const [value, data] = onItemHighlighted.lastCall.args;
      expect(value).to.equal('a');
      expect(data).to.deep.equal({ type: 'keyboard', index: 0 });
    });

    it('fires with undefined on close', async () => {
      const onItemHighlighted = spy();

      const { user } = await render(
        <Combobox.Root defaultOpen onItemHighlighted={onItemHighlighted}>
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

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      await user.click(document.body);
      await flushMicrotasks();

      const [, data] = onItemHighlighted.lastCall.args;
      expect(onItemHighlighted.lastCall.args[0]).to.equal(undefined);
      expect(data.index).to.equal(-1);
    });
  });

  describe('prop: open', () => {
    it('controls the open state', async () => {
      const { setProps, user } = await render(
        <Combobox.Root open={false}>
          <Combobox.Input />
          <Combobox.Trigger>Open</Combobox.Trigger>
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

      const input = screen.getByRole('combobox');

      await user.click(input);
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });

      await setProps({ open: true });
      await waitFor(() => {
        expect(screen.getByRole('listbox')).not.to.equal(null);
      });

      await user.click(document.body);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).not.to.equal(null);
      });
    });
  });

  describe('prop: onOpenChange', () => {
    it('fires when opening and closing', async () => {
      const onOpenChange = spy();

      const { user } = await render(
        <Combobox.Root onOpenChange={onOpenChange}>
          <Combobox.Input />
          <Combobox.Trigger>Open</Combobox.Trigger>
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

      const input = screen.getByRole('combobox');

      await user.click(input);
      await waitFor(() => {
        expect(onOpenChange.callCount).to.be.greaterThan(0);
      });
      expect(onOpenChange.lastCall.args[0]).to.equal(true);

      // Close by clicking outside
      await user.click(document.body);
      await waitFor(() => {
        expect(onOpenChange.lastCall.args[0]).to.equal(false);
      });
    });
  });

  describe('prop: defaultOpen', () => {
    it('opens by default', async () => {
      await render(
        <Combobox.Root defaultOpen>
          <Combobox.Input />
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

      expect(screen.getByRole('listbox')).not.to.equal(null);
    });

    it('remains uncontrolled (can be closed via interaction)', async () => {
      const { user } = await render(
        <Combobox.Root defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Trigger>Open</Combobox.Trigger>
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

      expect(screen.getByRole('listbox')).not.to.equal(null);

      await user.click(document.body);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });
    });

    it('is overridden by controlled open={false}', async () => {
      await render(
        <Combobox.Root defaultOpen open={false}>
          <Combobox.Input data-testid="input" />
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

      expect(screen.queryByRole('listbox')).to.equal(null);
    });

    it('respects controlled open={true}', async () => {
      await render(
        <Combobox.Root defaultOpen open>
          <Combobox.Input data-testid="input" />
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

      expect(screen.getByRole('listbox')).not.to.equal(null);
    });
  });

  describe('prop: limit', () => {
    it('limits the number of items displayed when no groups are used', async () => {
      const items = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
      await render(
        <Combobox.Root items={items} limit={3} defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item) => (
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

      // Should only show the first 3 items
      expect(screen.getByRole('option', { name: 'apple' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'banana' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'cherry' })).not.to.equal(null);
      expect(screen.queryByRole('option', { name: 'date' })).to.equal(null);
      expect(screen.queryByRole('option', { name: 'elderberry' })).to.equal(null);
    });

    it('limits the number of items displayed when groups are used', async () => {
      const items = [
        {
          value: 'citrus',
          items: ['orange', 'lemon', 'lime'],
        },
        {
          value: 'berries',
          items: ['strawberry', 'blueberry', 'raspberry'],
        },
      ];

      await render(
        <Combobox.Root items={items} limit={4} defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(group) => (
                    <Combobox.Group key={group.value} items={group.items}>
                      <Combobox.GroupLabel>{group.value}</Combobox.GroupLabel>
                      <Combobox.Collection>
                        {(item) => (
                          <Combobox.Item key={item} value={item}>
                            {item}
                          </Combobox.Item>
                        )}
                      </Combobox.Collection>
                    </Combobox.Group>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      // Should show first 4 items across groups
      expect(screen.getByRole('option', { name: 'orange' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'lemon' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'lime' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'strawberry' })).not.to.equal(null);
      // These should be limited out
      expect(screen.queryByRole('option', { name: 'blueberry' })).to.equal(null);
      expect(screen.queryByRole('option', { name: 'raspberry' })).to.equal(null);

      // Group labels should still be visible
      expect(screen.getByText('citrus')).not.to.equal(null);
      expect(screen.getByText('berries')).not.to.equal(null);
    });

    it('respects limit when filtering items', async () => {
      const items = ['apple', 'apricot', 'avocado', 'banana', 'blueberry'];
      const { user } = await render(
        <Combobox.Root items={items} limit={2} defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item) => (
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

      const input = screen.getByTestId('input');

      // Type 'a' to filter items starting with 'a'
      await user.type(input, 'a');
      await flushMicrotasks();

      // Should only show first 2 filtered items
      expect(screen.getByRole('option', { name: 'apple' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'apricot' })).not.to.equal(null);
      expect(screen.queryByRole('option', { name: 'avocado' })).to.equal(null);
      expect(screen.queryByRole('option', { name: 'banana' })).to.equal(null);
      expect(screen.queryByRole('option', { name: 'blueberry' })).to.equal(null);
    });

    it('shows all items when limit is -1 (default)', async () => {
      const items = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
      await render(
        <Combobox.Root items={items} limit={-1} defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item) => (
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

      // Should show all items
      expect(screen.getByRole('option', { name: 'apple' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'banana' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'cherry' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'date' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'elderberry' })).not.to.equal(null);
    });

    it('handles limit of 0 gracefully', async () => {
      const items = ['apple', 'banana', 'cherry'];
      await render(
        <Combobox.Root items={items} limit={0} defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item) => (
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

      // Should show no items
      expect(screen.queryByRole('option', { name: 'apple' })).to.equal(null);
      expect(screen.queryByRole('option', { name: 'banana' })).to.equal(null);
      expect(screen.queryByRole('option', { name: 'cherry' })).to.equal(null);
    });

    it('preserves order of items when applying limit across groups', async () => {
      const items = [
        {
          value: 'groupA',
          items: ['A1', 'A2'],
        },
        {
          value: 'groupB',
          items: ['B1', 'B2', 'B3'],
        },
      ];

      await render(
        <Combobox.Root items={items} limit={3} defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(group) => (
                    <Combobox.Group key={group.value} items={group.items}>
                      <Combobox.GroupLabel>Group {group.value.slice(-1)}</Combobox.GroupLabel>
                      <Combobox.Collection>
                        {(item) => (
                          <Combobox.Item key={item} value={item}>
                            {item}
                          </Combobox.Item>
                        )}
                      </Combobox.Collection>
                    </Combobox.Group>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      // Should show first 3 items in order: A1, A2, B1
      expect(screen.getByRole('option', { name: 'A1' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'A2' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'B1' })).not.to.equal(null);
      expect(screen.queryByRole('option', { name: 'B2' })).to.equal(null);
      expect(screen.queryByRole('option', { name: 'B3' })).to.equal(null);
    });

    it('does not limit items when not using items prop', async () => {
      await render(
        <Combobox.Root limit={2} defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                  <Combobox.Item value="banana">banana</Combobox.Item>
                  <Combobox.Item value="cherry">cherry</Combobox.Item>
                  <Combobox.Item value="date">date</Combobox.Item>
                  <Combobox.Item value="elderberry">elderberry</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      // Should show all items because limit only works with items prop
      expect(screen.getByRole('option', { name: 'apple' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'banana' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'cherry' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'date' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'elderberry' })).not.to.equal(null);
    });

    it('updates displayed items when limit changes', async () => {
      const items = ['apple', 'banana', 'cherry', 'date'];
      const { setProps } = await render(
        <Combobox.Root items={items} limit={2} defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item) => (
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

      // Initially shows 2 items
      expect(screen.getByRole('option', { name: 'apple' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'banana' })).not.to.equal(null);
      expect(screen.queryByRole('option', { name: 'cherry' })).to.equal(null);
      expect(screen.queryByRole('option', { name: 'date' })).to.equal(null);

      // Update limit to 3
      await setProps({ limit: 3 });
      await flushMicrotasks();

      // Now shows 3 items
      expect(screen.getByRole('option', { name: 'apple' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'banana' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'cherry' })).not.to.equal(null);
      expect(screen.queryByRole('option', { name: 'date' })).to.equal(null);
    });
  });

  describe('Form', () => {
    const { render: renderFakeTimers, clock } = createRenderer({
      clockOptions: {
        shouldAdvanceTime: true,
      },
    });

    clock.withFakeTimers();

    describe('serialization for object values', () => {
      const items = [
        { value: 'US', label: 'United States' },
        { value: 'CA', label: 'Canada' },
        { value: 'AU', label: 'Australia' },
      ];

      it('serializes {value,label} objects using their value field', async () => {
        const { container } = await render(
          <Combobox.Root
            name="country"
            items={items}
            itemToStringLabel={(item) => item.label}
            defaultValue={items[1]}
          >
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(item: { value: string; label: string }) => (
                      <Combobox.Item key={item.value} value={item}>
                        {item.label}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>,
        );

        const hiddenInput = container.querySelector('input[name="country"]');
        expect(hiddenInput).to.have.value('CA');
      });

      it('serializes multiple {value,label} objects into multiple hidden inputs', async () => {
        const { container } = await render(
          <Combobox.Root
            name="countries"
            items={items}
            itemToStringLabel={(item) => item.label}
            multiple
            defaultValue={[items[0], items[2]]}
          >
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(item: { value: string; label: string }) => (
                      <Combobox.Item key={item.value} value={item}>
                        {item.label}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>,
        );

        const hiddenInputs = container.querySelectorAll('input[name="countries"]');
        expect(hiddenInputs).to.have.length(2);
        expect(hiddenInputs[0]).to.have.value('US');
        expect(hiddenInputs[1]).to.have.value('AU');
      });

      it('falls back to itemToStringValue when object lacks value', async () => {
        const codeItems = [
          { code: 'US', name: 'United States' },
          { code: 'CA', name: 'Canada' },
          { code: 'AU', name: 'Australia' },
        ];

        const { container } = await render(
          <Combobox.Root
            name="country"
            items={codeItems}
            itemToStringLabel={(item) => item.name}
            itemToStringValue={(item) => item.code}
            defaultValue={codeItems[0]}
          >
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(item: { code: string; name: string }) => (
                      <Combobox.Item key={item.code} value={item}>
                        {item.name}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>,
        );

        const hiddenInput = container.querySelector('input[name="country"]');
        expect(hiddenInput).to.have.value('US');
      });
    });

    it('triggers native HTML validation on submit', async () => {
      const { user } = await render(
        <Form>
          <Field.Root name="test" data-testid="field">
            <Combobox.Root required>
              <Combobox.Input data-testid="input" />
              <Combobox.Portal>
                <Combobox.Positioner />
              </Combobox.Portal>
            </Combobox.Root>
            <Field.Error match="valueMissing" data-testid="error">
              required
            </Field.Error>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      const submit = screen.getByText('Submit');

      expect(screen.queryByTestId('error')).to.equal(null);

      await user.click(submit);

      const error = screen.getByTestId('error');
      expect(error).to.have.text('required');
    });

    it('clears errors on change', async () => {
      function App() {
        const [errors, setErrors] = React.useState<Record<string, string | string[]>>({
          combobox: 'test',
        });
        return (
          <Form errors={errors} onClearErrors={setErrors}>
            <Field.Root name="combobox">
              <Combobox.Root>
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
              </Combobox.Root>
              <Field.Error data-testid="error" />
            </Field.Root>
          </Form>
        );
      }

      const { user } = await renderFakeTimers(<App />);

      expect(screen.getByTestId('error')).to.have.text('test');

      const input = screen.getByTestId('input');
      expect(input).to.have.attribute('aria-invalid', 'true');

      await user.click(input);
      await flushMicrotasks();

      const option = screen.getByRole('option', { name: 'b' });
      clock.tick(200);
      await user.click(option);

      expect(screen.queryByTestId('error')).to.equal(null);
      expect(input).not.to.have.attribute('aria-invalid');
    });
  });

  describe('Field', () => {
    const { render: renderFakeTimers, clock } = createRenderer({
      clockOptions: {
        shouldAdvanceTime: true,
      },
    });

    clock.withFakeTimers();

    it('should receive disabled prop from Field.Root', async () => {
      await render(
        <Field.Root disabled>
          <Combobox.Root>
            <Combobox.Input data-testid="input" />
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
          </Combobox.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).to.have.attribute('disabled');

      const trigger = screen.getByTestId('trigger');
      expect(trigger).to.have.attribute('disabled');
    });

    it('should receive name prop from Field.Root', async () => {
      await render(
        <Field.Root name="field-combobox">
          <Combobox.Root>
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
          </Combobox.Root>
        </Field.Root>,
      );

      const hiddenInput = screen.getByRole('textbox', { hidden: true });
      expect(hiddenInput).to.have.attribute('name', 'field-combobox');
    });

    it('[data-touched]', async () => {
      await render(
        <Field.Root>
          <Combobox.Root>
            <Combobox.Input data-testid="input" />
            <Combobox.Trigger data-testid="trigger" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Item value="">Select</Combobox.Item>
                    <Combobox.Item value="1">Option 1</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');
      const trigger = screen.getByTestId('trigger');

      expect(input).not.to.have.attribute('data-dirty');
      expect(trigger).not.to.have.attribute('data-dirty');

      fireEvent.focus(input);
      fireEvent.blur(input);

      await flushMicrotasks();

      expect(input).to.have.attribute('data-touched', '');
      expect(trigger).to.have.attribute('data-touched', '');
    });

    it('[data-dirty]', async () => {
      const { user } = await renderFakeTimers(
        <Field.Root>
          <Combobox.Root>
            <Combobox.Input data-testid="input" />
            <Combobox.Trigger data-testid="trigger" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Item value="">Select</Combobox.Item>
                    <Combobox.Item value="1">Option 1</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');
      const trigger = screen.getByTestId('trigger');

      expect(input).not.to.have.attribute('data-dirty');
      expect(trigger).not.to.have.attribute('data-dirty');

      await user.click(input);
      await flushMicrotasks();
      clock.tick(200);

      const option = screen.getByRole('option', { name: 'Option 1' });

      // Arrow Down to focus the Option 1
      await user.keyboard('{ArrowDown}');
      await user.click(option);
      await flushMicrotasks();

      expect(input).to.have.attribute('data-dirty', '');
      expect(trigger).to.have.attribute('data-dirty', '');
    });

    describe('[data-filled]', () => {
      it('adds [data-filled] attribute when filled', async () => {
        const { user } = await renderFakeTimers(
          <Field.Root>
            <Combobox.Root>
              <Combobox.Input data-testid="input" />
              <Combobox.Trigger data-testid="trigger" />
              <Combobox.Portal>
                <Combobox.Positioner>
                  <Combobox.Popup>
                    <Combobox.List>
                      <Combobox.Item value="">Select</Combobox.Item>
                      <Combobox.Item value="1">Option 1</Combobox.Item>
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
          </Field.Root>,
        );

        const input = screen.getByTestId('input');
        const trigger = screen.getByTestId('trigger');

        expect(input).not.to.have.attribute('data-filled');
        expect(trigger).not.to.have.attribute('data-filled');

        await user.click(input);
        await flushMicrotasks();
        clock.tick(200);

        const option = screen.getByRole('option', { name: 'Option 1' });

        // Arrow Down to focus the Option 1
        await user.keyboard('{ArrowDown}');
        await user.click(option);
        await flushMicrotasks();

        expect(input).to.have.attribute('data-filled', '');
        expect(trigger).to.have.attribute('data-filled', '');

        await user.click(input);

        await flushMicrotasks();

        const listbox = screen.getByRole('listbox');

        expect(listbox).not.to.have.attribute('data-filled');
      });

      it('adds [data-filled] attribute when already filled', async () => {
        await render(
          <Field.Root>
            <Combobox.Root defaultValue="1">
              <Combobox.Input data-testid="input" />
              <Combobox.Trigger data-testid="trigger" />
              <Combobox.Portal>
                <Combobox.Positioner>
                  <Combobox.Popup>
                    <Combobox.List>
                      <Combobox.Item value="1">Option 1</Combobox.Item>
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
          </Field.Root>,
        );

        const input = screen.getByTestId('input');
        const trigger = screen.getByTestId('trigger');

        expect(input).to.have.attribute('data-filled');
        expect(trigger).to.have.attribute('data-filled');
      });
    });

    it('[data-focused]', async () => {
      await render(
        <Field.Root>
          <Combobox.Root>
            <Combobox.Input data-testid="input" />
            <Combobox.Trigger data-testid="trigger" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Item value="">Select</Combobox.Item>
                    <Combobox.Item value="1">Option 1</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');
      const trigger = screen.getByTestId('trigger');

      expect(input).not.to.have.attribute('data-focused');
      expect(trigger).not.to.have.attribute('data-focused');

      fireEvent.focus(input);

      expect(input).to.have.attribute('data-focused', '');
      expect(trigger).to.have.attribute('data-focused', '');

      fireEvent.blur(input);

      expect(input).not.to.have.attribute('data-focused');
      expect(trigger).not.to.have.attribute('data-focused');
    });

    it('[data-invalid]', async () => {
      await render(
        <Field.Root invalid>
          <Combobox.Root>
            <Combobox.Input data-testid="input" />
            <Combobox.Trigger data-testid="trigger" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Item value="1">Option 1</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');
      const trigger = screen.getByTestId('trigger');

      expect(input).to.have.attribute('data-invalid', '');
      expect(trigger).to.have.attribute('data-invalid', '');
    });

    it('[data-valid]', async () => {
      const { user } = await render(
        <Field.Root validationMode="onBlur">
          <Combobox.Root>
            <Combobox.Input data-testid="input" required />
            <Combobox.Trigger data-testid="trigger" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Item value="1">Option 1</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');
      const trigger = screen.getByTestId('trigger');

      expect(input).not.to.have.attribute('data-valid');
      expect(input).not.to.have.attribute('data-invalid');
      expect(trigger).not.to.have.attribute('data-valid');
      expect(trigger).not.to.have.attribute('data-invalid');

      // Select an option to produce a valid value, then blur to commit
      fireEvent.focus(input);
      await user.click(input);
      const option = await screen.findByRole('option', { name: 'Option 1' });

      await user.click(option);
      fireEvent.blur(input);

      await waitFor(() => expect(input).to.have.attribute('data-valid', ''));
      expect(trigger).to.have.attribute('data-valid', '');
      expect(input).not.to.have.attribute('data-invalid');
      expect(trigger).not.to.have.attribute('data-invalid');
    });

    it('prop: validate', async () => {
      await render(
        <Field.Root validate={() => 'error'}>
          <Combobox.Root>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner />
            </Combobox.Portal>
          </Combobox.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');

      expect(input).not.to.have.attribute('aria-invalid');

      fireEvent.focus(input);
      fireEvent.blur(input);

      await flushMicrotasks();

      expect(input).to.have.attribute('aria-invalid', 'true');
    });

    // flaky in real browser
    it.skipIf(!isJSDOM)('prop: validationMode=onChange', async () => {
      const { user } = await render(
        <Field.Root
          validationMode="onChange"
          validate={(value) => {
            return value === '1' ? 'error' : null;
          }}
        >
          <Combobox.Root>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Item value="1">Option 1</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');

      expect(input).not.to.have.attribute('aria-invalid');

      await user.click(input);

      await flushMicrotasks();

      // Arrow Down to focus the Option 1
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(input).to.have.attribute('aria-invalid', 'true');
    });

    // flaky in real browser
    it.skipIf(!isJSDOM)('prop: validationMode=onBlur', async () => {
      const { user } = await render(
        <Field.Root
          validationMode="onBlur"
          validate={(value) => {
            return value === '1' ? 'error' : null;
          }}
        >
          <Combobox.Root>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Item value="1">Option 1</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
          <Field.Error data-testid="error" />
        </Field.Root>,
      );

      const input = screen.getByTestId('input');

      expect(input).not.to.have.attribute('aria-invalid');

      await user.click(input);

      await flushMicrotasks();

      // Arrow Down to focus the Option 1
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      fireEvent.blur(input);

      await flushMicrotasks();

      await waitFor(() => {
        expect(input).to.have.attribute('aria-invalid', 'true');
      });
    });

    it('Field.Label', async () => {
      await render(
        <Field.Root>
          <Combobox.Root>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner />
            </Combobox.Portal>
          </Combobox.Root>
          <Field.Label data-testid="label" render={<span />} />
        </Field.Root>,
      );

      expect(screen.getByTestId('input')).to.have.attribute(
        'aria-labelledby',
        screen.getByTestId('label').id,
      );
    });

    it('Field.Description', async () => {
      await render(
        <Field.Root>
          <Combobox.Root>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner />
            </Combobox.Portal>
          </Combobox.Root>
          <Field.Description data-testid="description" />
        </Field.Root>,
      );

      expect(screen.getByTestId('input')).to.have.attribute(
        'aria-describedby',
        screen.getByTestId('description').id,
      );
    });
  });
});
