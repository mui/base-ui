import * as React from 'react';
import {
  act,
  fireEvent,
  flushMicrotasks,
  screen,
  waitFor,
  ignoreActWarnings,
  reactMajor,
} from '@mui/internal-test-utils';
import { createRenderer, isJSDOM, popupConformanceTests } from '#test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Combobox } from '@base-ui/react/combobox';
import { Dialog } from '@base-ui/react/dialog';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { useStore } from '@base-ui/utils/store';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { REASONS } from '../../utils/reasons';
import { useComboboxRootContext } from './ComboboxRootContext';
import { selectors } from '../store';

function AsyncItemsCombobox() {
  const [items, setItems] = React.useState(['Apple', 'Banana', 'Cherry']);
  const [selectedValue, setSelectedValue] = React.useState<string | null>(null);

  return (
    <Combobox.Root
      items={items}
      onValueChange={(value: string | null) => {
        setSelectedValue(value);
      }}
      onOpenChangeComplete={(open) => {
        if (!open && selectedValue) {
          setItems([selectedValue]);
        }
      }}
    >
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
    </Combobox.Root>
  );
}

function SelectedIndexProbe() {
  const store = useComboboxRootContext();
  const selectedIndex = useStore(store, selectors.selectedIndex);

  return (
    <div data-testid="selected-index">{selectedIndex === null ? 'null' : `${selectedIndex}`}</div>
  );
}

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

  it('does not focus input when closing via trigger click (input inside popup)', async () => {
    const { user } = await render(
      <Combobox.Root items={['One', 'Two', 'Three']}>
        <Combobox.Trigger data-testid="trigger">
          <Combobox.Value />
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup aria-label="Demo">
              <Combobox.Input data-testid="input" aria-label="combobox-input" />
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
    await user.click(trigger);

    expect(await screen.findByRole('listbox')).not.to.equal(null);

    const input = await screen.findByRole('combobox', { name: 'combobox-input' });
    await waitFor(() => expect(input).toHaveFocus());

    await user.click(trigger);
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('does not cause infinite re-renders when items becomes undefined', async () => {
    const { rerender } = await render(
      <Combobox.Root items={[]} defaultOpen>
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

    rerender(
      <Combobox.Root items={undefined} defaultOpen>
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
  });

  describe('selection behavior', () => {
    describe('single', () => {
      it('fires onOpenChange once with reason item-press on mouse click', async () => {
        const items = ['apple', 'banana'];
        const onOpenChange = spy();

        const { user } = await render(
          <Combobox.Root items={items} onOpenChange={onOpenChange}>
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

        const input = screen.getByRole('combobox');
        await user.click(input);
        expect(screen.getByRole('listbox')).not.to.equal(null);

        onOpenChange.resetHistory();
        await user.click(screen.getByRole('option', { name: 'apple' }));

        await waitFor(() => {
          expect(screen.queryByRole('listbox')).to.equal(null);
        });

        expect(onOpenChange.callCount).to.equal(1);
        expect(onOpenChange.lastCall.args[0]).to.equal(false);
        expect(onOpenChange.lastCall.args[1].reason).to.equal(REASONS.itemPress);
        expect(onOpenChange.lastCall.args[1].event instanceof MouseEvent).to.equal(true);
      });

      it('fires onOpenChange once with reason item-press on Enter selection', async () => {
        const items = ['apple', 'banana'];
        const onOpenChange = spy();

        const { user } = await render(
          <Combobox.Root items={items} onOpenChange={onOpenChange}>
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

        const input = screen.getByRole('combobox');
        await user.click(input);
        await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

        await user.keyboard('{ArrowDown}');
        onOpenChange.resetHistory();
        await user.keyboard('{Enter}');

        await waitFor(() => {
          expect(screen.queryByRole('listbox')).to.equal(null);
        });

        expect(onOpenChange.callCount).to.equal(1);
        expect(onOpenChange.lastCall.args[0]).to.equal(false);
        expect(onOpenChange.lastCall.args[1].reason).to.equal(REASONS.itemPress);
        expect(onOpenChange.lastCall.args[1].event instanceof KeyboardEvent).to.equal(true);
      });

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

        expect(await screen.findByRole('listbox')).not.to.equal(null);
        expect(input).to.have.attribute('aria-expanded', 'true');

        const appleOption = await screen.findByText('apple');
        await user.click(appleOption);

        await waitFor(() => {
          expect(screen.queryByRole('listbox')).to.equal(null);
        });
        expect(input).to.have.attribute('aria-expanded', 'false');
      });

      it('syncs selected index when items change after close', async () => {
        const { user } = await render(<AsyncItemsCombobox />);

        const input = screen.getByTestId('input');
        await user.click(input);
        await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

        await user.click(screen.getByRole('option', { name: 'Cherry' }));
        await waitFor(() => expect(screen.queryByRole('listbox')).to.equal(null));

        await user.click(input);
        await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

        const cherryOption = screen.getByRole('option', { name: 'Cherry' });
        expect(cherryOption).to.have.attribute('data-selected', '');
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

        const appleOption = await screen.findByText('apple');
        await user.click(appleOption);

        expect(input).to.have.value('apple');

        await user.click(trigger);

        expect(await screen.findByText('apple')).not.to.equal(null);
        expect(await screen.findByText('banana')).not.to.equal(null);
        expect(await screen.findByText('cherry')).not.to.equal(null);
      });

      it('should reset input value to selected value when popup closes without selection', async () => {
        const items = ['apple', 'banana', 'cherry'];
        const onInputValueChange = spy();

        const { user } = await render(
          <Combobox.Root items={items} defaultValue="apple" onInputValueChange={onInputValueChange}>
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
        const appleOption = await screen.findByText('apple');
        await user.click(appleOption);

        expect(input).to.have.value('apple');

        await user.click(trigger);
        await user.type(input, 'xyz');
        expect(input).to.have.value('applexyz');

        await user.click(document.body);

        await waitFor(() => expect(input).to.have.value('apple'));
        expect(onInputValueChange.lastCall.args[0]).to.equal('apple');
        expect(onInputValueChange.lastCall.args[1].reason).to.equal('none');
      });

      it('should not auto-close during browser autofill', async () => {
        const items = ['apple', 'banana', 'cherry'];

        await render(
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

        const hiddenInput = screen.queryByRole('textbox', { hidden: true });
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

      it('resets selectedIndex when clearing all selections while open', async () => {
        const items = ['apple', 'banana', 'cherry'];

        function App() {
          const [value, setValue] = React.useState(items.slice(0, 2));

          return (
            <Combobox.Root items={items} multiple value={value} onValueChange={setValue}>
              <Combobox.Input data-testid="input" />
              <SelectedIndexProbe />
              <button type="button" data-testid="clear" onClick={() => setValue([])}>
                Clear
              </button>
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
            </Combobox.Root>
          );
        }

        const { user } = await render(<App />);

        expect(screen.queryByRole('listbox')).to.equal(null);

        await user.click(screen.getByTestId('input'));

        expect(await screen.findByRole('listbox')).not.to.equal(null);
        expect(screen.getByTestId('selected-index').textContent).to.equal('1');

        await user.click(screen.getByTestId('clear'));

        await waitFor(() => {
          expect(screen.getByTestId('selected-index').textContent).to.equal('null');
        });
      });

      it('re-syncs selectedIndex after an external controlled update when closing', async () => {
        const items = ['apple', 'banana', 'cherry'];

        function App() {
          const [value, setValue] = React.useState([items[0]]);

          return (
            <Combobox.Root items={items} multiple value={value} onValueChange={setValue}>
              <Combobox.Input data-testid="input" />
              <SelectedIndexProbe />
              <button type="button" data-testid="set-external" onClick={() => setValue([items[2]])}>
                Set external
              </button>
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
            </Combobox.Root>
          );
        }

        const { user } = await render(<App />);

        const input = screen.getByTestId('input');
        await user.click(input);
        expect(await screen.findByRole('listbox')).not.to.equal(null);

        await waitFor(() => {
          expect(screen.getByTestId('selected-index').textContent).to.equal('0');
        });

        await user.click(screen.getByTestId('set-external'));
        await waitFor(() => {
          expect(screen.queryByRole('listbox')).to.equal(null);
          expect(screen.getByTestId('selected-index').textContent).to.equal('2');
        });

        await user.click(input);
        expect(await screen.findByRole('listbox')).not.to.equal(null);

        await waitFor(() => {
          expect(screen.getByTestId('selected-index').textContent).to.equal('2');
        });
      });

      it('should create multiple hidden inputs for form submission', async () => {
        const items = ['a', 'b', 'c'];
        await render(
          <Combobox.Root multiple value={items} name="languages">
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

        items.forEach((item) => {
          const input = screen.getByDisplayValue(item);
          expect(input).to.have.attribute('type', 'hidden');
          expect(input.tagName).to.equal('INPUT');
        });
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

    it('clicking on "listbox" keeps the focus on the input', async () => {
      const items = ['apple', 'banana', 'cherry'];

      const { user } = await render(
        <Combobox.Root items={items}>
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

      const input = screen.getByRole('combobox');

      await user.click(input);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).not.to.equal(null);
      });

      const listbox = screen.getByRole('listbox');
      await user.click(listbox);
      expect(input).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(input).to.have.value('apple');
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
          <Combobox.Root inline defaultOpen>
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

    it('keeps input value on Enter when inline and no item is highlighted', async () => {
      const { user } = await render(
        <Combobox.Root inline items={['Apple', 'Banana']}>
          <Combobox.Input data-testid="input" />
          <Combobox.List>
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');

      await user.click(input);
      await user.type(input, 'Ba');

      expect(input).not.to.have.attribute('aria-activedescendant');
      expect(input).to.have.value('Ba');

      await user.keyboard('{Enter}');

      expect(input).to.have.value('Ba');
    });

    it('bubbles Escape key when list is empty and popup hidden with CSS', async () => {
      const onOuterKeyDown = spy();

      const { user } = await render(
        <div
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onOuterKeyDown();
            }
          }}
        >
          <Combobox.Root defaultOpen items={[]}>
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner data-testid="positioner">
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
          </Combobox.Root>
        </div>,
      );

      const positioner = await screen.findByTestId('positioner');
      positioner.style.display = 'none';

      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{Escape}');

      expect(onOuterKeyDown.callCount).to.equal(1);
    });

    it('does not bubble Escape key when Empty component is present', async () => {
      const onOuterKeyDown = spy();

      const { user } = await render(
        <div
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onOuterKeyDown();
            }
          }}
        >
          <Combobox.Root defaultOpen items={[]}>
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner data-testid="positioner">
                <Combobox.Popup>
                  <Combobox.List>
                    {(item: string) => (
                      <Combobox.Item key={item} value={item}>
                        {item}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                  <Combobox.Empty>No results.</Combobox.Empty>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </div>,
      );

      const positioner = await screen.findByTestId('positioner');
      positioner.style.display = 'none';

      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{Escape}');

      expect(onOuterKeyDown.callCount).to.equal(0);
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

      const trigger = screen
        .getAllByRole('combobox')
        .find((element) => element.tagName === 'BUTTON')!;
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
    const onInputValueChange = spy();
    const { user } = await render(
      <Combobox.Root name="test" onInputValueChange={onInputValueChange}>
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

    const input = screen.getByRole('combobox');

    fireEvent.change(
      screen.getAllByDisplayValue('').find((el) => el.getAttribute('name') === 'test')!,
      { target: { value: 'b' } },
    );
    await flushMicrotasks();
    expect(onInputValueChange.lastCall.args[0]).to.equal('b');
    expect(onInputValueChange.lastCall.args[1].reason).to.equal(REASONS.none);

    await user.click(input);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'b' })).to.have.attribute('aria-selected', 'true');
    });
  });

  it('shows all items when opening after browser autofill', async () => {
    const items = ['a', 'b', 'c'];
    const { user } = await render(
      <Combobox.Root name="test" items={items}>
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

    const input = screen.getByRole('combobox');

    fireEvent.change(
      screen.getAllByDisplayValue('').find((el) => el.getAttribute('name') === 'test')!,
      { target: { value: 'b' } },
    );
    await flushMicrotasks();

    await user.click(input);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).not.to.equal(null);
    });
    expect(screen.getByRole('option', { name: 'a' })).not.to.equal(null);
    expect(screen.getByRole('option', { name: 'b' })).not.to.equal(null);
    expect(screen.getByRole('option', { name: 'c' })).not.to.equal(null);
  });

  it('shows all items when opening after browser autofill with insertReplacementText', async () => {
    const items = ['a', 'b', 'c'];
    const { user } = await render(
      <Combobox.Root name="test" items={items}>
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

    const input = screen.getByRole('combobox');

    fireEvent.input(
      screen.getAllByDisplayValue('').find((el) => el.getAttribute('name') === 'test')!,
      { target: { value: 'b' }, inputType: 'insertReplacementText' },
    );
    await flushMicrotasks();

    await user.click(input);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).not.to.equal(null);
    });
    expect(screen.getByRole('option', { name: 'a' })).not.to.equal(null);
    expect(screen.getByRole('option', { name: 'b' })).not.to.equal(null);
    expect(screen.getByRole('option', { name: 'c' })).not.to.equal(null);
  });

  it('should handle browser autofill with object values', async () => {
    const items = [
      { country: 'United States', code: 'US' },
      { country: 'Canada', code: 'CA' },
    ];

    await render(
      <Combobox.Root
        name="country"
        items={items}
        itemToStringLabel={(item: (typeof items)[number]) => item.country}
        itemToStringValue={(item: (typeof items)[number]) => item.code}
        defaultOpen
      >
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {(item: (typeof items)[1]) => (
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

    fireEvent.change(
      // getByRole('textbox', { hidden: true, name: 'country' }) does not work
      screen.getAllByDisplayValue('').find((el) => el.getAttribute('name') === 'country')!,
      { target: { value: 'CA' } },
    );
    await flushMicrotasks();

    fireEvent.click(input);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Canada' })).to.have.attribute(
        'aria-selected',
        'true',
      );
    });
  });

  it('should pass autoComplete to the hidden input', async () => {
    await render(
      <Combobox.Root name="country" autoComplete="country">
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="US">United States</Combobox.Item>
                <Combobox.Item value="CA">Canada</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByRole('combobox');
    const hiddenInput = screen.getByRole('textbox', { hidden: true });

    expect(input).to.have.attribute('autocomplete', 'off');
    expect(input).not.to.have.attribute('name');
    expect(hiddenInput).to.have.attribute('name', 'country');
    expect(hiddenInput).not.to.have.attribute('id');
    expect(hiddenInput).to.have.attribute('autocomplete', 'country');
  });

  it('does not open on programmatic input events', async () => {
    await render(
      <Combobox.Root>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="Darlinghurst">Darlinghurst</Combobox.Item>
                <Combobox.Item value="Sydney">Sydney</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Darlinghurst' } });
    await flushMicrotasks();

    expect(screen.queryByRole('listbox')).to.equal(null);
  });

  it('opens on paste input events', async () => {
    await render(
      <Combobox.Root>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="Darlinghurst">Darlinghurst</Combobox.Item>
                <Combobox.Item value="Sydney">Sydney</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByRole('combobox');
    fireEvent.input(input, {
      target: { value: 'Darlinghurst' },
      inputType: 'insertFromPaste',
    });

    await waitFor(() => {
      expect(screen.getByRole('listbox')).not.to.equal(null);
    });
  });

  describe('prop: id', () => {
    it('sets the id on the input when it is outside the popup', async () => {
      await render(
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

      const input = screen.getByRole('combobox');
      await waitFor(() => {
        expect(input).to.have.attribute('id', 'test-id');
      });
    });

    it('sets the id on the trigger when the input is inside the popup', async () => {
      await render(
        <Combobox.Root id="test-id" defaultOpen>
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Input data-testid="input" />
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
      const input = screen.getByTestId('input');

      expect(trigger).to.have.attribute('id', 'test-id');
      expect(input).to.not.have.attribute('id', 'test-id');
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
      await render(
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

      const hiddenInput = screen.getByRole('textbox', { hidden: true });
      expect(hiddenInput).to.have.attribute('disabled');
    });
  });

  describe('prop: required', () => {
    it('does not mark the hidden input as required when selection exists in multiple mode', async () => {
      await render(
        <Combobox.Root multiple required name="languages" value={['a']}>
          <Combobox.Input />
        </Combobox.Root>,
      );

      const hiddenInput = screen.getByRole('textbox', { hidden: true });
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput).not.to.have.attribute('required');
    });

    it('keeps the hidden input required when no selection exists in multiple mode', async () => {
      await render(
        <Combobox.Root multiple required name="languages" value={[]}>
          <Combobox.Input />
        </Combobox.Root>,
      );

      const hiddenInput = screen.getByRole('textbox', { hidden: true });
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput).to.have.attribute('required');
    });
  });

  describe('prop: readOnly', () => {
    it('should render readOnly state on the input and disable interactions', async () => {
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
      await render(
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

      const hiddenInput = screen.getByRole('textbox', { hidden: true });
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
          itemToStringLabel={(item: (typeof items)[number]) => item.country}
          itemToStringValue={(item: (typeof items)[number]) => item.code}
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

    it('shows the label for a controlled object value not in items', async () => {
      const value = { country: 'Japan', code: 'JP' };

      await render(
        <Combobox.Root
          items={items}
          value={value}
          itemToStringLabel={(item) => item.country}
          itemToStringValue={(item) => item.code}
        >
          <Combobox.Input />
        </Combobox.Root>,
      );

      const input = screen.getByRole('combobox');
      expect(input).to.have.value('Japan');
    });
  });

  describe('prop: itemToStringValue', () => {
    const items = [
      { country: 'United States', code: 'US' },
      { country: 'Canada', code: 'CA' },
      { country: 'Australia', code: 'AU' },
    ];

    it('uses itemToStringValue for form submission', async () => {
      await render(
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

      const hiddenInput = screen.getByDisplayValue('US'); // input[name="country"]
      expect(hiddenInput.tagName).to.equal('INPUT');
      expect(hiddenInput).to.have.attribute('name', 'country');
    });

    it('uses itemToStringValue for multiple selection form submission', async () => {
      const values = [items[0], items[1]];
      await render(
        <Combobox.Root
          name="countries"
          items={items}
          itemToStringLabel={(item) => item.country}
          itemToStringValue={(item) => item.code}
          multiple
          defaultValue={values}
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

      values.forEach((value) => {
        const input = screen.getByDisplayValue(value.code);
        expect(input.tagName).to.equal('INPUT');
        expect(input).to.have.attribute('name', 'countries');
      });
    });
  });

  describe('initial input value derivation', () => {
    it('derives input from defaultValue on first mount when unspecified', async () => {
      await render(
        <Combobox.Root defaultValue="apple">
          <Combobox.Input />
        </Combobox.Root>,
      );

      expect(screen.getByRole('combobox')).to.have.value('apple');
    });

    it('derives input from defaultValue on first mount with items prop', async () => {
      const items = [{ value: 'apple', label: 'Apple' }];
      await render(
        <Combobox.Root items={items} defaultValue={items[0]}>
          <Combobox.Input />
        </Combobox.Root>,
      );

      expect(screen.getByRole('combobox')).to.have.value('Apple');
    });

    it('derives input from controlled value on first mount when unspecified', async () => {
      await render(
        <Combobox.Root value="banana">
          <Combobox.Input />
        </Combobox.Root>,
      );

      expect(screen.getByRole('combobox')).to.have.value('banana');
    });

    it('defaultInputValue overrides derivation when provided', async () => {
      await render(
        <Combobox.Root defaultValue="apple" defaultInputValue="x">
          <Combobox.Input />
        </Combobox.Root>,
      );

      expect(screen.getByRole('combobox')).to.have.value('x');
    });

    it('inputValue overrides derivation when provided', async () => {
      await render(
        <Combobox.Root value="apple" inputValue="x">
          <Combobox.Input />
        </Combobox.Root>,
      );

      expect(screen.getByRole('combobox')).to.have.value('x');
    });

    it('multiple mode initial input remains empty', async () => {
      const items = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ];
      await render(
        <Combobox.Root multiple items={items}>
          <Combobox.Input />
        </Combobox.Root>,
      );

      const input = screen.getAllByRole('combobox').find((element) => element.tagName === 'INPUT');

      expect(input).to.have.value('');
    });

    it('does not set input value for input-inside-popup pattern', async () => {
      await render(
        <Combobox.Root defaultOpen defaultValue="apple">
          <Combobox.Trigger>Trigger</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Input />
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getAllByRole('combobox').find((element) => element.tagName === 'INPUT');

      expect(input).to.have.value('');
    });
  });

  describe('input value synchronization', () => {
    it('updates derived input when controlled value changes externally', async () => {
      const items = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ];

      const { setProps } = await render(
        <Combobox.Root items={items} value={items[0]}>
          <Combobox.Input />
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      expect(input).to.have.value('Apple');

      await setProps({ value: items[1] });

      expect(input).to.have.value('Banana');
    });

    it('re-derives input when items array changes', async () => {
      const initialItems = [
        { value: 'a', label: 'Apple' },
        { value: 'b', label: 'Banana' },
      ];

      const { setProps } = await render(
        <Combobox.Root items={initialItems} value={initialItems[0]}>
          <Combobox.Input />
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      expect(input).to.have.value('Apple');

      const nextItems = [
        { value: 'a', label: 'Apricot' },
        { value: 'b', label: 'Banana' },
        { value: 'c', label: 'Cherry' },
      ];

      await setProps({ items: nextItems, value: nextItems[0] });
      expect(input).to.have.value('Apricot');

      const sameLengthDifferentItems = [
        { value: 'a', label: 'Ambrosia' },
        { value: 'b', label: 'Blue Java' },
        { value: 'c', label: 'Clementine' },
      ];

      await setProps({ items: sameLengthDifferentItems, value: sameLengthDifferentItems[0] });
      expect(input).to.have.value('Ambrosia');
    });

    it('restores derived input after items load asynchronously', async () => {
      const { setProps } = await render(
        <Combobox.Root items={[]} value="banana">
          <Combobox.Input />
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      expect(input).to.have.value('banana');

      await setProps({ items: ['apple', 'banana', 'bread'] });

      expect(input).to.have.value('banana');

      await setProps({ items: ['banana'] });

      expect(input).to.have.value('banana');
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

    it('does not close popup when filtering with input inside popup in multiple mode', async () => {
      const items = ['apple', 'apricot', 'banana'];
      const { user } = await render(
        <Combobox.Root multiple items={items}>
          <Combobox.Trigger data-testid="trigger">
            <Combobox.Value />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Input data-testid="input" />
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
      await user.click(trigger);

      const input = await screen.findByTestId('input');
      await user.type(input, 'app');
      await user.click(screen.getByRole('option', { name: 'apple' }));

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });
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
      expect(onInput.lastCall.args[1].reason).to.equal(REASONS.inputClear);
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
      expect(onInput.lastCall.args[1].reason).to.equal(REASONS.inputClear);
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

    it('resets filtered results after selecting when using a custom search stringifier', async () => {
      type Movie = { id: number; english: string; romaji: string };
      const movies: Movie[] = [
        { id: 1, english: 'Spirited Away', romaji: 'Sen to Chihiro no Kamikakushi' },
        { id: 2, english: 'My Neighbor Totoro', romaji: 'Tonari no Totoro' },
        { id: 3, english: 'Princess Mononoke', romaji: 'Mononoke Hime' },
      ];

      const stringifyMovie = (movie: Movie | null) =>
        movie ? `${movie.english} ${movie.romaji}` : '';

      function MultilingualFilterCombobox() {
        const [value, setValue] = React.useState<Movie | null>(null);
        const { contains } = Combobox.useFilter({ value });

        const filter = React.useCallback(
          (item: Movie | null, query: string) => {
            if (!item) {
              return false;
            }
            return contains(item, query, stringifyMovie);
          },
          [contains],
        );

        return (
          <Combobox.Root
            items={movies}
            value={value}
            onValueChange={setValue}
            filter={filter}
            itemToStringLabel={(movie) => movie?.english ?? ''}
          >
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(movie: Movie) => (
                      <Combobox.Item key={movie.id} value={movie}>
                        {movie.english}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user } = await render(<MultilingualFilterCombobox />);
      const input = screen.getByRole('combobox');

      await user.click(input);
      await screen.findByRole('listbox');

      await user.type(input, 'tonari');

      await waitFor(() => {
        expect(screen.queryByRole('option', { name: 'Spirited Away' })).to.equal(null);
      });

      await user.click(screen.getByRole('option', { name: 'My Neighbor Totoro' }));

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });

      await user.click(input);
      await screen.findByRole('listbox');

      await waitFor(() => {
        expect(screen.queryByRole('option', { name: 'Spirited Away' })).not.to.equal(null);
      });
    });
  });

  describe('prop: filteredItems', () => {
    it('resets external filteredItems when reopening after a selection', async () => {
      interface TestItem {
        id: number;
        label: string;
        label2: string;
      }

      const testItems: TestItem[] = [
        {
          id: 1,
          label: 'apple',
          label2: 'one',
        },
        {
          id: 2,
          label: 'orange',
          label2: 'two',
        },
        {
          id: 3,
          label: 'banana',
          label2: 'three',
        },
      ];

      function getItemLabelToFilter(item: TestItem | null) {
        return item ? `${item.label} ${item.label2}` : '';
      }

      function getItemLabelToDisplay(item: TestItem | null) {
        return item ? item.label || item.label2 : '';
      }

      function FilteredItemsCombobox() {
        const [searchValue, setSearchValue] = React.useState('');
        const [value, setValue] = React.useState<TestItem | null>(null);

        const deferredSearchValue = React.useDeferredValue(searchValue);

        const { contains } = Combobox.useFilter({ value });

        const resolvedSearchValue =
          searchValue === '' || deferredSearchValue === '' ? searchValue : deferredSearchValue;

        const filteredItems = React.useMemo(() => {
          return testItems.filter((item) =>
            contains(item, resolvedSearchValue, getItemLabelToFilter),
          );
        }, [contains, resolvedSearchValue]);

        return (
          <Combobox.Root
            items={testItems}
            filteredItems={filteredItems}
            inputValue={searchValue}
            onInputValueChange={setSearchValue}
            value={value}
            onValueChange={setValue}
            itemToStringLabel={getItemLabelToDisplay}
            isItemEqualToValue={(item, v) => item?.id === v?.id}
          >
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner sideOffset={4}>
                <Combobox.Popup>
                  <Combobox.Empty>No items found.</Combobox.Empty>
                  <Combobox.List>
                    {(item: TestItem) => (
                      <Combobox.Item key={item.id} value={item}>
                        <Combobox.ItemIndicator></Combobox.ItemIndicator>
                        {item.label}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user } = await render(<FilteredItemsCombobox />);
      const input = screen.getByRole('combobox');

      await user.click(input);
      await user.type(input, 'one');

      await waitFor(() => {
        expect(screen.queryByRole('option', { name: 'orange' })).to.equal(null);
      });

      await user.click(screen.getByRole('option', { name: 'apple' }));

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });

      await user.click(input);

      await waitFor(() => {
        expect(screen.queryByRole('option', { name: 'orange' })).not.to.equal(null);
      });
    });

    it('uses filteredItems when items prop is omitted', async () => {
      const fruits = ['Apple', 'Banana', 'Cherry'];

      function FilteredItemsOnlyCombobox() {
        const [value, setValue] = React.useState<string | null>(null);

        return (
          <Combobox.Root filteredItems={fruits} value={value} onValueChange={setValue}>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner sideOffset={4}>
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
          </Combobox.Root>
        );
      }

      const { user } = await render(<FilteredItemsOnlyCombobox />);
      const input = screen.getByTestId('input');

      await user.click(input);
      await screen.findByRole('listbox');
      await user.click(screen.getByRole('option', { name: 'Apple' }));

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });

      await user.click(input);
      await screen.findByRole('listbox');

      await waitFor(() => {
        expect(screen.queryByRole('option', { name: 'Banana' })).not.to.equal(null);
      });
    });

    it('highlights the externally filtered item order when filtering reorders items', async () => {
      const fruits = ['Apple', 'Banana', 'Zucchini'];
      const onItemHighlighted = spy();

      function ReorderingFilteredItemsCombobox() {
        const [input, setInput] = React.useState('');
        const filteredItems = React.useMemo(() => {
          if (input.length > 0) {
            return [...fruits].reverse();
          }
          return fruits;
        }, [input]);

        return (
          <Combobox.Root
            autoHighlight
            filteredItems={filteredItems}
            inputValue={input}
            onInputValueChange={setInput}
            onItemHighlighted={onItemHighlighted}
          >
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner sideOffset={4}>
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
          </Combobox.Root>
        );
      }

      const { user } = await render(<ReorderingFilteredItemsCombobox />);
      const input = screen.getByTestId('input');

      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      onItemHighlighted.resetHistory();

      await user.type(input, 'a');

      await waitFor(() => {
        expect(onItemHighlighted.callCount).to.be.greaterThan(0);
      });

      const [highlightedValue] = onItemHighlighted.lastCall.args;
      expect(highlightedValue).to.equal('Zucchini');
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

  describe('prop: autoHighlight', () => {
    it('does not auto-highlight on initial open when no selection', async () => {
      await render(
        <Combobox.Root items={['apple', 'banana', 'cherry']} autoHighlight defaultOpen>
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

      const input = screen.getByRole<HTMLInputElement>('combobox');
      expect(screen.getByRole('listbox')).not.to.equal(null);
      expect(input).not.to.have.attribute('aria-activedescendant');
    });

    it('shows the selected item as selected on initial open (no active highlight)', async () => {
      await render(
        <Combobox.Root
          items={['apple', 'banana', 'cherry']}
          defaultValue="banana"
          autoHighlight
          defaultOpen
        >
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

      const input = screen.getByRole<HTMLInputElement>('combobox');
      const banana = screen.getByRole('option', { name: 'banana' });

      expect(banana).to.have.attribute('aria-selected', 'true');
      // Highlight is applied only after filtering begins
      expect(input).not.to.have.attribute('aria-activedescendant');
    });

    it('highlights the first matching item after typing (single mode)', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana', 'cherry']} autoHighlight>
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

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await user.type(input, 'ch');

      const cherry = await screen.findByRole('option', { name: 'cherry' });
      expect(input).to.have.attribute('aria-activedescendant', cherry.id);
    });

    it('highlights the first matching item after IME composition', async () => {
      await render(
        <Combobox.Root items={['apple', 'banana', 'cherry']} autoHighlight openOnInputClick={false}>
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

      const input = screen.getByRole<HTMLInputElement>('combobox');
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: 'ch' } });
      fireEvent.compositionEnd(input, { data: 'ch' });

      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));
      const cherry = await screen.findByRole('option', { name: 'cherry' });
      await waitFor(() => expect(input).to.have.attribute('aria-activedescendant', cherry.id));
    });

    it('highlights the first matching item for a static list without the items prop', async () => {
      const { user } = await render(
        <Combobox.Root autoHighlight>
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="alpha">alpha</Combobox.Item>
                  <Combobox.Item value="alphabet">alphabet</Combobox.Item>
                  <Combobox.Item value="beta">beta</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'al');

      const alpha = screen.getByRole('option', { name: 'alpha' });
      await waitFor(() => expect(alpha).to.have.attribute('data-highlighted'));
      expect(input).to.have.attribute('aria-activedescendant', alpha.id);

      await user.type(input, ' ');
      expect(alpha).to.have.attribute('data-highlighted');
      expect(input).to.have.attribute('aria-activedescendant', alpha.id);
    });

    it('retains highlight when query is cleared back to empty', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana', 'cherry']} autoHighlight>
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

      const input = screen.getByRole<HTMLInputElement>('combobox');

      await user.type(input, 'a');
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });
      await waitFor(() => expect(input).to.have.attribute('aria-activedescendant'));

      await user.clear(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));
      await waitFor(() => expect(input).to.have.attribute('aria-activedescendant'));
    });

    it('retains highlight when clearing the query with input-change behavior', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana', 'cherry']} autoHighlight>
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

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      await user.type(input, 'ban');
      await screen.findByRole('option', { name: 'banana' });
      await waitFor(() => expect(input).to.have.attribute('aria-activedescendant'));
      const highlightedBefore = input.getAttribute('aria-activedescendant');
      expect(highlightedBefore).to.not.equal(null);

      await user.clear(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));
      await waitFor(() => expect(input).to.have.attribute('aria-activedescendant'));
    });

    it('highlights the first matching item after typing (multiple mode)', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana', 'cherry']} multiple autoHighlight>
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

      const input = screen.getByRole<HTMLInputElement>('combobox');

      await user.type(input, 'ba');
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });

      const activeId = input.getAttribute('aria-activedescendant');
      expect(activeId).to.not.equal(null);
      const activeEl = document.getElementById(activeId!);
      expect(activeEl?.textContent).to.equal('banana');
    });

    it('clears highlight after removing the highlighted chip while filtering (multiple mode)', async () => {
      const { user } = await render(
        <Combobox.Root
          items={['apple', 'banana', 'cherry']}
          multiple
          autoHighlight
          defaultOpen
          defaultValue={['apple']}
        >
          <Combobox.Chips>
            <Combobox.Value>
              {(value: string[]) => (
                <React.Fragment>
                  {value.map((item) => (
                    <Combobox.Chip key={item}>
                      {item}
                      <Combobox.ChipRemove aria-label={`Remove ${item}`} />
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input data-testid="input" />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
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

      await waitFor(() => {
        expect(screen.getByRole('listbox')).not.to.equal(null);
      });

      await user.type(input, 'a');
      await waitFor(() => expect(input).to.have.attribute('aria-activedescendant'));

      await user.click(screen.getByRole('button', { name: 'Remove apple', hidden: true }));

      await waitFor(() => expect(input.getAttribute('aria-activedescendant')).to.equal(null));
    });

    it('keeps the active item highlighted after clearing the last selected value', async () => {
      const items = [
        { id: 'js', value: 'JavaScript' },
        { id: 'ts', value: 'TypeScript' },
        { id: 'py', value: 'Python' },
        { id: 'rb', value: 'Ruby' },
      ];

      const { user } = await render(
        <Combobox.Root items={items} multiple>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item: (typeof items)[number]) => (
                    <Combobox.Item key={item.id} value={item}>
                      {item.value}
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

      await user.click(screen.getByRole('option', { name: 'JavaScript' }));
      await user.click(screen.getByRole('option', { name: 'TypeScript' }));

      await user.type(input, 'pyth');
      await user.click(screen.getByRole('option', { name: 'Python' }));

      await waitFor(() => expect(screen.queryByRole('listbox')).to.equal(null));

      input.focus();
      await user.keyboard('{ArrowDown}');
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      await user.hover(screen.getByRole('option', { name: 'JavaScript' }));
      await user.click(screen.getByRole('option', { name: 'JavaScript' }));
      await user.hover(screen.getByRole('option', { name: 'TypeScript' }));
      await user.click(screen.getByRole('option', { name: 'TypeScript' }));

      const pythonOption = screen.getByRole('option', { name: 'Python' });
      await user.hover(pythonOption);
      await user.click(pythonOption);

      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', pythonOption.id);
      });

      await user.keyboard('{ArrowDown}');
      const rubyOption = screen.getByRole('option', { name: 'Ruby' });
      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', rubyOption.id);
      });
    });

    it('does not shift highlight to the previous selected item on Enter deselect', async () => {
      const items = [
        { id: 'js', value: 'JavaScript' },
        { id: 'ts', value: 'TypeScript' },
        { id: 'py', value: 'Python' },
      ];

      const { user } = await render(
        <Combobox.Root items={items} multiple defaultValue={[items[0], items[1]]}>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item: (typeof items)[number]) => (
                    <Combobox.Item key={item.id} value={item}>
                      {item.value}
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

      const typeScriptOption = screen.getByRole('option', { name: 'TypeScript' });
      await user.hover(typeScriptOption);
      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', typeScriptOption.id);
      });

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(typeScriptOption).to.have.attribute('aria-selected', 'false');
        expect(input).to.have.attribute('aria-activedescendant', typeScriptOption.id);
      });
    });

    it('continues ArrowDown navigation from the Enter-selected item (multiple mode)', async () => {
      const items = [
        { id: 'js', value: 'JavaScript' },
        { id: 'ts', value: 'TypeScript' },
        { id: 'py', value: 'Python' },
      ];

      const { user } = await render(
        <Combobox.Root items={items} multiple>
          <Combobox.Chips>
            <Combobox.Value>
              {(value: (typeof items)[number][]) => (
                <React.Fragment>
                  {value.map((item) => (
                    <Combobox.Chip key={item.id} aria-label={item.value}>
                      {item.value}
                      <Combobox.ChipRemove aria-label={`Remove ${item.value}`} />
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input data-testid="input" />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item: (typeof items)[number]) => (
                    <Combobox.Item key={item.id} value={item}>
                      {item.value}
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

      const typeScriptOption = screen.getByRole('option', { name: 'TypeScript' });
      await user.hover(typeScriptOption);
      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', typeScriptOption.id);
      });

      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', typeScriptOption.id);
      });

      await user.keyboard('{ArrowDown}');

      const pythonOption = screen.getByRole('option', { name: 'Python' });
      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', pythonOption.id);
      });
    });

    it('clears active highlight when removing the highlighted chip item', async () => {
      const items = [
        { id: 'js', value: 'JavaScript' },
        { id: 'ts', value: 'TypeScript' },
        { id: 'py', value: 'Python' },
      ];

      const { user } = await render(
        <Combobox.Root items={items} multiple defaultValue={[items[0], items[1]]}>
          <Combobox.Chips>
            <Combobox.Value>
              {(value: (typeof items)[number][]) => (
                <React.Fragment>
                  {value.map((item) => (
                    <Combobox.Chip key={item.id} aria-label={item.value}>
                      {item.value}
                      <Combobox.ChipRemove aria-label={`Remove ${item.value}`} />
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input data-testid="input" />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item: (typeof items)[number]) => (
                    <Combobox.Item key={item.id} value={item}>
                      {item.value}
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

      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant');
      });

      const highlightedOption = document.getElementById(
        input.getAttribute('aria-activedescendant')!,
      );
      const highlightedLabel = highlightedOption?.textContent;
      expect(highlightedLabel).not.to.equal(null);

      await user.click(
        screen.getByRole('button', { name: `Remove ${highlightedLabel as string}`, hidden: true }),
      );

      await waitFor(() => {
        expect(input.getAttribute('aria-activedescendant')).to.equal(null);
      });
    });

    it('keeps highlight in sync after selecting then backspacing to a single match', async () => {
      const items = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];
      const { user } = await render(
        <Combobox.Root items={items} autoHighlight>
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

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      // Select index 4
      await user.click(screen.getByRole('option', { name: 'epsilon' }));
      await waitFor(() => expect(screen.queryByRole('listbox')).to.equal(null));

      // Reopen and press Backspace to narrow to a single match
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      // Backspace once: from 'epsilon' -> 'epsilo', which should still only match 'epsilon'
      await user.keyboard('{Backspace}');
      const epsilon = await screen.findByRole('option', { name: 'epsilon' });
      // With autoHighlight, the first (and only) item should be highlighted
      await waitFor(() => expect(input).to.have.attribute('aria-activedescendant', epsilon.id));
    });

    it('navigates on first ArrowDown after editing selection to a new matching query', async () => {
      const { user } = await render(
        <Combobox.Root items={['Apple', 'Grape', 'Grapefruit']} autoHighlight>
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

      // Open and select Apple
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));
      await user.click(screen.getByRole('option', { name: 'Apple' }));

      // Edit input to "Ape" (matches Grape and Grapefruit)
      await user.click(input);
      await user.clear(input);
      await user.type(input, 'Ape');
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      const grape = screen.getByRole('option', { name: 'Grape' });
      const grapefruit = screen.getByRole('option', { name: 'Grapefruit' });

      // With autoHighlight, first match is highlighted immediately
      await waitFor(() => expect(input).to.have.attribute('aria-activedescendant', grape.id));

      // One ArrowDown should move to the next match (no double keypress needed)
      await user.keyboard('{ArrowDown}');
      await waitFor(() => expect(input).to.have.attribute('aria-activedescendant', grapefruit.id));
    });

    it('updates highlighted callback with newly filtered first item', async () => {
      const onItemHighlighted = spy();
      const items = ['banana', 'apple', 'apricot'];

      const { user } = await render(
        <Combobox.Root
          items={items}
          autoHighlight
          defaultOpen
          onItemHighlighted={onItemHighlighted}
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

      const input = screen.getByRole('combobox');

      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));
      await user.click(input);
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(onItemHighlighted.callCount).to.be.greaterThan(0);
      });
      const [initialValue] = onItemHighlighted.lastCall.args;
      expect(initialValue).to.equal('banana');

      onItemHighlighted.resetHistory();

      await user.type(input, 'ap');

      await waitFor(() => {
        expect(onItemHighlighted.callCount).to.be.greaterThan(0);
      });
      const [nextValue, data] = onItemHighlighted.lastCall.args;
      expect(nextValue).to.equal('apple');
      expect(data.reason).to.equal('none');
      expect(data.index).to.equal(0);
    });

    it('fires a single clearing highlight on Enter selection', async () => {
      const onItemHighlighted = spy();

      const { user } = await render(
        <Combobox.Root
          items={['Apple', 'Apricot', 'Banana']}
          autoHighlight
          onItemHighlighted={onItemHighlighted}
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

      const input = screen.getByRole('combobox');

      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));
      await user.type(input, 'app');

      // Reset history to focus on close events only.
      onItemHighlighted.resetHistory();
      await user.keyboard('{Enter}');
      await flushMicrotasks();

      const clearingCalls = onItemHighlighted
        .getCalls()
        .filter((call) => call.args[0] === undefined);
      expect(clearingCalls.length).to.equal(1);
      const postClearCalls = onItemHighlighted
        .getCalls()
        .slice(onItemHighlighted.getCalls().indexOf(clearingCalls[0]) + 1);
      expect(postClearCalls.every((c) => c.args[0] === undefined)).to.equal(true);
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
      const [value, eventDetails] = onItemHighlighted.lastCall.args;
      expect(value).to.equal('a');
      expect(eventDetails.reason).to.equal('keyboard');
      expect(eventDetails.index).to.equal(0);
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

    it('keeps filtering responsive after selection when inline and open is controlled', async () => {
      const items = ['Apple', 'Apricot', 'Banana', 'Grape', 'Orange'];

      const { user } = await render(
        <Combobox.Root items={items} open inline>
          <Combobox.Input data-testid="input" />
          <Combobox.List>
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');

      await user.type(input, 'ap');

      await waitFor(() => {
        expect(screen.queryByRole('option', { name: 'Banana' })).to.equal(null);
      });

      await user.click(screen.getByRole('option', { name: 'Apple' }));

      await user.clear(input);
      await user.type(input, 'ba');

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Banana' })).not.to.equal(null);
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

  describe('dialog pattern', () => {
    const fruits = ['Apple', 'Apricot', 'Banana', 'Grape', 'Orange'];

    function DialogMultipleCombobox({ defaultOpen = true }: { defaultOpen?: boolean }) {
      const [open, setOpen] = React.useState(defaultOpen);
      return (
        <Combobox.Root multiple items={fruits} inline>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger>Trigger</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup aria-label="Fruit chooser">
                <Combobox.Chips>
                  <Combobox.Input data-testid="dialog-input" />
                  <Combobox.List>
                    {(item: string) => (
                      <Combobox.Item key={item} value={item}>
                        {item}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Chips>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </Combobox.Root>
      );
    }

    function DialogSingleCombobox({ defaultOpen = true }: { defaultOpen?: boolean }) {
      const [open, setOpen] = React.useState(defaultOpen);
      const inputId = React.useId();

      return (
        <Combobox.Root items={fruits} open={open} onOpenChange={setOpen} inline>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger data-testid="dialog-trigger">
              <Combobox.Value>
                {(value: string | null) => (value == null ? 'Select a fruit' : value)}
              </Combobox.Value>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup aria-label="Fruit chooser">
                <div>
                  <label htmlFor={inputId}>Fruit</label>
                  <Combobox.Input
                    id={inputId}
                    data-testid="dialog-input"
                    placeholder="e.g. Apple"
                  />
                </div>
                <Combobox.List>
                  {(item: string) => (
                    <Combobox.Item key={item} value={item}>
                      {item}
                    </Combobox.Item>
                  )}
                </Combobox.List>
                <Dialog.Close>Done</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </Combobox.Root>
      );
    }

    describe('multiple', () => {
      it('clears input after filtering, removes filter and highlight', async () => {
        const { user } = await render(<DialogMultipleCombobox />);

        const input = await screen.findByTestId('dialog-input');

        await user.type(input, 'ap');

        await waitFor(() => {
          expect(screen.queryByRole('option', { name: 'Banana' })).to.equal(null);
        });
        expect(screen.getByRole('option', { name: 'Apple' })).not.to.equal(null);
        expect(screen.getByRole('option', { name: 'Apricot' })).not.to.equal(null);

        await user.click(screen.getByRole('option', { name: 'Apple' }));

        expect(input).to.have.value('');
        await waitFor(() => {
          expect(screen.queryByRole('option', { name: 'Banana' })).not.to.equal(null);
        });
        expect(input).to.have.attribute('aria-activedescendant');
      });

      it('still filters after selecting an item', async () => {
        const { user } = await render(<DialogMultipleCombobox />);

        const input = await screen.findByTestId('dialog-input');

        await user.type(input, 'ap');

        await waitFor(() => {
          expect(screen.queryByRole('option', { name: 'Banana' })).to.equal(null);
        });
        expect(screen.getByRole('option', { name: 'Apple' })).not.to.equal(null);
        expect(screen.getByRole('option', { name: 'Apricot' })).not.to.equal(null);

        await user.click(screen.getByRole('option', { name: 'Apple' }));

        expect(input).to.have.value('');
        await waitFor(() => {
          expect(screen.queryByRole('option', { name: 'Banana' })).not.to.equal(null);
        });
        expect(input).to.have.attribute('aria-activedescendant');

        await user.type(input, 'ap');

        await waitFor(() => {
          expect(screen.queryByRole('option', { name: 'Banana' })).to.equal(null);
        });
      });

      it('retains highlight on selected item when not filtering', async () => {
        const { user } = await render(<DialogMultipleCombobox />);

        const input = await screen.findByTestId('dialog-input');

        await act(async () => {
          input.focus();
        });

        await user.keyboard('{ArrowDown}');
        await waitFor(() => {
          const apple = screen.getByRole('option', { name: 'Apple' });
          expect(input).to.have.attribute('aria-activedescendant', apple.id);
        });

        await user.keyboard('{Enter}');

        await waitFor(() => {
          const apple = screen.getByRole('option', { name: 'Apple' });
          expect(input).to.have.attribute('aria-activedescendant', apple.id);
        });
      });
    });

    describe('single', () => {
      it('closes the dialog after selecting an item and updates the trigger value', async () => {
        if (reactMajor <= 18) {
          ignoreActWarnings();
        }

        const { user } = await render(<DialogSingleCombobox defaultOpen={false} />);

        const trigger = screen.getByTestId('dialog-trigger');
        await user.click(trigger);

        await screen.findByRole('dialog', { name: 'Fruit chooser' });
        const input = await screen.findByTestId('dialog-input');

        await user.type(input, 'ap');
        await user.click(screen.getByRole('option', { name: 'Apple' }));

        await waitFor(() => {
          expect(screen.queryByRole('dialog', { name: 'Fruit chooser' })).to.equal(null);
        });

        await waitFor(() => {
          expect(trigger).to.have.text('Apple');
        });
      });

      it('clears the filter input when re-opening after a selection', async () => {
        if (reactMajor <= 18) {
          ignoreActWarnings();
        }

        const { user } = await render(<DialogSingleCombobox defaultOpen={false} />);

        const trigger = screen.getByTestId('dialog-trigger');
        await user.click(trigger);

        await screen.findByRole('dialog', { name: 'Fruit chooser' });
        const input = await screen.findByTestId('dialog-input');

        await user.type(input, 'ap');
        await user.click(screen.getByRole('option', { name: 'Apple' }));

        await waitFor(() => {
          expect(screen.queryByRole('dialog', { name: 'Fruit chooser' })).to.equal(null);
        });

        await user.click(trigger);

        await screen.findByRole('dialog', { name: 'Fruit chooser' });
        const reopenedInput = await screen.findByTestId('dialog-input');

        expect(reopenedInput).to.have.value('');
        await screen.findByRole('option', { name: 'Banana' });
      });

      it('restores highlight when the input regains focus', async () => {
        const { user } = await render(<DialogSingleCombobox />);

        const input = await screen.findByTestId('dialog-input');

        await act(async () => {
          input.focus();
        });

        await user.keyboard('{ArrowDown}');

        const apple = screen.getByRole('option', { name: 'Apple' });

        await waitFor(() => {
          expect(apple).to.have.attribute('data-highlighted');
          expect(input).to.have.attribute('aria-activedescendant', apple.id);
        });

        const done = screen.getByRole('button', { name: 'Done' });
        fireEvent.blur(input, { relatedTarget: done });
        fireEvent.focus(done);

        await waitFor(() => {
          expect(input).not.to.have.attribute('aria-activedescendant');
          expect(apple).not.to.have.attribute('data-highlighted');
        });

        fireEvent.blur(done, { relatedTarget: input });
        fireEvent.focus(input);

        await waitFor(() => {
          expect(apple).to.have.attribute('data-highlighted');
          expect(input).to.have.attribute('aria-activedescendant', apple.id);
        });
      });
    });
  });

  describe('Form', () => {
    const { render: renderFakeTimers, clock } = createRenderer({
      clockOptions: {
        shouldAdvanceTime: true,
      },
    });

    clock.withFakeTimers();

    it('submits stringified value to onFormSubmit when itemToStringValue is provided', async () => {
      const items = [
        { code: 'US', label: 'United States' },
        { code: 'CA', label: 'Canada' },
      ];
      const handleFormSubmit = spy();

      const { user } = await renderFakeTimers(
        <Form onFormSubmit={handleFormSubmit}>
          <Field.Root name="country">
            <Combobox.Root
              items={items}
              itemToStringLabel={(item) => item.label}
              itemToStringValue={(item) => item.code}
              defaultValue={items[0]}
            >
              <Combobox.Input />
              <Combobox.Portal>
                <Combobox.Positioner>
                  <Combobox.Popup>
                    <Combobox.List>
                      {(item: (typeof items)[number]) => (
                        <Combobox.Item key={item.code} value={item}>
                          {item.label}
                        </Combobox.Item>
                      )}
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      await user.click(screen.getByText('Submit'));

      expect(handleFormSubmit.callCount).to.equal(1);
      expect(handleFormSubmit.firstCall.args[0]).to.deep.equal({ country: 'US' });
    });

    describe('serialization for object values', () => {
      const items = [
        { value: 'US', label: 'United States' },
        { value: 'CA', label: 'Canada' },
        { value: 'AU', label: 'Australia' },
      ];

      it('serializes {value,label} objects using their value field', async () => {
        await render(
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

        const hiddenInput = screen.getByDisplayValue('CA');
        expect(hiddenInput.tagName).to.equal('INPUT');
        expect(hiddenInput).to.have.attribute('name', 'country');
      });

      it('serializes multiple {value,label} objects into multiple hidden inputs', async () => {
        const values = [items[0], items[2]];
        const { container } = await render(
          <Combobox.Root
            name="countries"
            items={items}
            itemToStringLabel={(item) => item.label}
            multiple
            defaultValue={values}
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

        // eslint-disable-next-line testing-library/no-container -- Can't avoid container here. A better test would be checking form submission.
        const hiddenInputs = container.querySelectorAll('input[name="countries"]');
        expect(hiddenInputs).to.have.length(values.length);
        values.forEach((item, index) => {
          expect(hiddenInputs[index]).to.have.value(item.value);
        });
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

        // eslint-disable-next-line testing-library/no-container -- Can't avoid container here. A better test would be checking form submission.
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

    it('focuses trigger and surfaces errors when input is inside popup', async () => {
      ignoreActWarnings();

      let submittedCalls = 0;

      const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        submittedCalls += 1;
      };

      const { user } = await render(
        <Form onSubmit={handleSubmit}>
          <Field.Root name="combobox">
            <Combobox.Root required>
              <Combobox.Trigger data-testid="trigger">
                <Combobox.Value />
              </Combobox.Trigger>
              <Combobox.Portal>
                <Combobox.Positioner>
                  <Combobox.Popup>
                    <Combobox.Input data-testid="input" />
                    <Combobox.List>
                      <Combobox.Item value="a">a</Combobox.Item>
                      <Combobox.Item value="b">b</Combobox.Item>
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
            <Field.Error match="valueMissing" data-testid="error">
              required
            </Field.Error>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      expect(screen.queryByTestId('error')).to.equal(null);

      await user.click(screen.getByText('Submit'));

      expect(submittedCalls).to.equal(0);

      const trigger = screen.getByTestId('trigger');

      await waitFor(() => expect(trigger).toHaveFocus());
      expect(trigger).to.have.attribute('data-invalid', '');

      const error = screen.getByTestId('error');
      expect(error).to.have.text('required');

      await user.click(trigger);

      const input = await screen.findByTestId('input');
      expect(input).not.to.have.attribute('data-invalid');
    });

    it('clears external errors on change', async () => {
      const { user } = await renderFakeTimers(
        <Form
          errors={{
            combobox: 'test',
          }}
        >
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
        </Form>,
      );

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

    it('submits on Enter when no item is highlighted (does not prevent)', async () => {
      let submittedCalls = 0;

      const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        submittedCalls += 1;
      };

      const { user } = await render(
        <Form onSubmit={handleSubmit}>
          <Field.Root name="q">
            <Combobox.Root items={['apple', 'banana']} openOnInputClick>
              <Combobox.Input />
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
            </Combobox.Root>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      // No navigation, so nothing highlighted
      await user.keyboard('{Enter}');

      expect(submittedCalls).to.equal(1);
    });

    it('prevents submit on Enter when an item is highlighted', async () => {
      let submittedCalls = 0;

      const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        submittedCalls += 1;
      };

      const { user } = await render(
        <Form onSubmit={handleSubmit}>
          <Field.Root name="q">
            <Combobox.Root items={['alpha', 'beta']} openOnInputClick>
              <Combobox.Input />
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
            </Combobox.Root>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(submittedCalls).to.equal(0);
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

    it('Field.Label links to Combobox.Trigger when input is inside popup and trigger has an explicit id', async () => {
      await render(
        <Field.Root>
          <Field.Label data-testid="label">Search</Field.Label>
          <Combobox.Root>
            <Combobox.Trigger data-testid="trigger" id="x-id">
              Open
            </Combobox.Trigger>
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.Input />
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

      const label = screen.getByTestId<HTMLLabelElement>('label');
      const trigger = screen.getByTestId('trigger');

      await waitFor(() => {
        expect(trigger).to.have.attribute('id', 'x-id');
        expect(label).to.have.attribute('for', 'x-id');
      });
    });

    it('does not apply validation ARIA attributes to input inside popup', async () => {
      const { user } = await render(
        <Field.Root invalid>
          <Combobox.Root>
            <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.Input data-testid="input" />
                  <Combobox.List>
                    <Combobox.Item value="a">a</Combobox.Item>
                    <Combobox.Item value="b">b</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
          <Field.Description data-testid="description" />
          <Field.Error data-testid="error" match />
        </Field.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      const description = screen.getByTestId('description');
      const error = screen.getByTestId('error');
      const triggerDescribedBy = trigger.getAttribute('aria-describedby');

      expect(trigger).to.have.attribute('aria-invalid', 'true');
      expect(triggerDescribedBy).to.contain(description.id);
      expect(triggerDescribedBy).to.contain(error.id);

      await user.click(trigger);

      const input = await screen.findByTestId('input');

      expect(input).not.to.have.attribute('aria-invalid');
      expect(input).not.to.have.attribute('aria-describedby');
      expect(input).not.to.have.attribute('data-valid');
      expect(input).not.to.have.attribute('data-invalid');
      expect(input).not.to.have.attribute('data-touched');
      expect(input).not.to.have.attribute('data-dirty');
      expect(input).not.to.have.attribute('data-filled');
      expect(input).not.to.have.attribute('data-focused');
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

    it('does not mark as touched when focus moves into the popup', async () => {
      const validateSpy = spy(() => 'error');

      await render(
        <React.Fragment>
          <Field.Root validationMode="onBlur" validate={validateSpy}>
            <Combobox.Root>
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
          </Field.Root>
          <button data-testid="outside">Outside</button>
        </React.Fragment>,
      );

      const trigger = screen.getByTestId('trigger');

      fireEvent.focus(trigger);
      fireEvent.click(trigger);

      await flushMicrotasks();

      const popup = screen.getByRole('dialog');

      fireEvent.blur(trigger, { relatedTarget: popup });
      fireEvent.focus(popup);

      await flushMicrotasks();

      expect(validateSpy.callCount).to.equal(0);
      expect(trigger).to.have.attribute('data-focused', '');
      expect(trigger).not.to.have.attribute('data-touched');
      expect(trigger).not.to.have.attribute('aria-invalid');
    });

    it('validates when the popup is blurred', async () => {
      const validateSpy = spy(() => 'error');

      await render(
        <React.Fragment>
          <Field.Root validationMode="onBlur" validate={validateSpy}>
            <Combobox.Root>
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
          </Field.Root>
          <button data-testid="outside">Outside</button>
        </React.Fragment>,
      );

      const trigger = screen.getByTestId('trigger');
      const outside = screen.getByTestId('outside');

      fireEvent.focus(trigger);
      fireEvent.click(trigger);

      await flushMicrotasks();

      const popup = screen.getByRole('dialog');

      fireEvent.blur(trigger, { relatedTarget: popup });
      fireEvent.focus(popup);

      fireEvent.blur(popup, { relatedTarget: outside });
      fireEvent.focus(outside);

      await waitFor(() => {
        expect(validateSpy.callCount).to.equal(1);
      });

      expect(trigger).to.have.attribute('data-touched', '');
      expect(trigger).not.to.have.attribute('data-focused');
      expect(trigger).to.have.attribute('aria-invalid', 'true');
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
        <Field.Root validationMode="onBlur" validate={() => 'error'}>
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

    it('passes raw value to validate when itemToStringValue is provided', async () => {
      const items = [
        { code: 'US', label: 'United States' },
        { code: 'CA', label: 'Canada' },
      ];
      const validateSpy = spy((value: unknown) => {
        expect(value).to.equal(items[0]);
        return 'error';
      });

      await render(
        <Field.Root validationMode="onBlur" validate={validateSpy}>
          <Combobox.Root
            items={items}
            defaultValue={items[0]}
            itemToStringLabel={(item) => item.label}
            itemToStringValue={(item) => item.code}
          >
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner />
            </Combobox.Portal>
          </Combobox.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');

      fireEvent.focus(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(validateSpy.callCount).to.equal(1);
      });
      expect(input).to.have.attribute('aria-invalid', 'true');
    });

    it('prop: validationMode=onSubmit', async () => {
      const { user } = await render(
        <Form>
          <Field.Root validate={(val) => (val === 'a' ? 'error' : null)}>
            <Combobox.Root required>
              <Combobox.Input data-testid="input" />
              <Combobox.Clear data-testid="clear" />
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
          </Field.Root>
          <button type="submit">submit</button>
        </Form>,
      );

      const input = screen.getByTestId('input');
      expect(input).not.to.have.attribute('aria-invalid');

      await user.click(screen.getByText('submit'));
      expect(input).to.have.attribute('aria-invalid', 'true');

      await user.click(input);

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(input).not.to.have.attribute('aria-invalid');

      const clear = screen.getByTestId('clear');
      await user.click(clear);

      expect(document.activeElement).to.equal(input);
      await user.keyboard('{Tab}');

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
          <Field.Label data-testid="label" nativeLabel={false} render={<span />} />
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

  describe('prop: isItemEqualToValue', () => {
    it('matches object values using the provided comparator', async () => {
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      await render(
        <Combobox.Root
          items={users}
          value={{ id: 2, name: 'Bob' }}
          itemToStringLabel={(item) => item.name}
          itemToStringValue={(item) => String(item.id)}
          isItemEqualToValue={(item, value) => item.id === value.id}
          defaultOpen
        >
          <Combobox.Input data-testid="input" />
          <span data-testid="value">
            <Combobox.Value />
          </span>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item) => (
                    <Combobox.Item key={item.id} value={item}>
                      {item.name}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('Bob');
      expect(screen.getByRole('option', { name: 'Bob' })).to.have.attribute(
        'aria-selected',
        'true',
      );
    });

    it('properly deselects object values using the provided comparator', async () => {
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      await render(
        <Combobox.Root
          items={users}
          defaultValue={[{ id: 2, name: 'Bob' }]}
          itemToStringLabel={(item) => item.name}
          itemToStringValue={(item) => String(item.id)}
          isItemEqualToValue={(item, value) => item.id === value.id}
          defaultOpen
          multiple
        >
          <Combobox.Input data-testid="input" />
          <span data-testid="value">
            <Combobox.Value />
          </span>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item) => (
                    <Combobox.Item key={item.id} value={item}>
                      {item.name}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const option = screen.getByRole('option', { name: 'Bob' });

      fireEvent.click(option);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Bob' })).to.have.attribute(
          'aria-selected',
          'false',
        );
      });
    });

    it('passes item as the first comparator argument in multiple mode', async () => {
      const users = [
        { id: 1, name: 'Alice', source: 'item' },
        { id: 2, name: 'Bob', source: 'item' },
      ];

      await render(
        <Combobox.Root
          items={users}
          defaultValue={[{ id: 2, name: 'Bob', source: 'selected' }]}
          itemToStringLabel={(item) => item.name}
          itemToStringValue={(item) => String(item.id)}
          isItemEqualToValue={(item, value) =>
            item.id === value.id && item.source === 'item' && value.source === 'selected'
          }
          defaultOpen
          multiple
        >
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item) => (
                    <Combobox.Item key={item.id} value={item}>
                      {item.name}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const option = screen.getByRole('option', { name: 'Bob' });
      expect(option).to.have.attribute('aria-selected', 'true');

      fireEvent.click(option);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Bob' })).to.have.attribute(
          'aria-selected',
          'false',
        );
      });
    });

    it('does not call comparator with null when clearing the value', async () => {
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      const compare = spy((item: any, value: any) => {
        if (value == null) {
          throw new Error('Compared against null');
        }
        return item.id === value.id;
      });

      const hiddenInputRef = React.createRef<HTMLInputElement>();

      const { user } = await render(
        <Combobox.Root
          items={users}
          defaultValue={users[0]}
          itemToStringLabel={(item) => item.name}
          itemToStringValue={(item) => String(item.id)}
          isItemEqualToValue={compare}
          inputRef={hiddenInputRef}
        >
          <Combobox.Trigger>
            <Combobox.Value data-testid="value" />
          </Combobox.Trigger>
          <Combobox.Clear data-testid="clear" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item) => (
                    <Combobox.Item key={item.id} value={item}>
                      {item.name}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const clear = await screen.findByTestId('clear');
      await user.click(clear);

      await waitFor(() => {
        expect(hiddenInputRef.current?.value ?? '').to.equal('');
      });

      expect(compare.callCount).to.be.greaterThan(0);
      compare.getCalls().forEach((call) => {
        expect(call.args[1]).not.to.equal(null);
      });
    });

    it('does not call comparator with undefined when items load asynchronously after opening', async () => {
      interface Country {
        code: string;
        label: string;
      }

      const loadedItems: Country[] = [
        { code: 'ca', label: 'Canada' },
        { code: 'us', label: 'United States' },
      ];

      const compare = spy((item: Country, value: Country) => {
        if (item == null || value == null) {
          throw new Error('Compared against undefined');
        }
        return item.code === value.code;
      });

      const handleInputValueChange = spy();
      const handleValueChange = spy();

      const { user, setProps } = await render(
        <Combobox.Root
          items={undefined}
          value={loadedItems[0]}
          inputValue=""
          onInputValueChange={handleInputValueChange}
          onValueChange={handleValueChange}
          itemToStringLabel={(item: Country) => item.label}
          isItemEqualToValue={compare}
          filter={null}
        >
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item: Country) => (
                    <Combobox.Item key={item.code} value={item}>
                      {item.label}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole('combobox');
      await user.click(input);

      await setProps({ items: loadedItems });

      const canada = await screen.findByRole('option', { name: 'Canada' });
      fireEvent.mouseMove(canada, { pointerType: 'mouse' });
      await waitFor(() => expect(canada).to.have.attribute('data-highlighted'));
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'United States' })).to.have.attribute(
          'data-highlighted',
        );
      });

      expect(compare.callCount).to.be.greaterThan(0);
      compare.getCalls().forEach((call) => {
        expect(call.args[0]).not.to.equal(null);
        expect(call.args[0]).not.to.equal(undefined);
        expect(call.args[1]).not.to.equal(null);
        expect(call.args[1]).not.to.equal(undefined);
      });
    });

    it('keeps showing items after selecting in controlled input-inside-popup async load flow', async () => {
      interface Country {
        code: string;
        label: string;
      }

      const loadedItems: Country[] = [
        { code: 'ca', label: 'Canada' },
        { code: 'us', label: 'United States' },
      ];

      function AsyncControlledCombobox(props: { countries: Country[] | undefined }) {
        const { countries } = props;
        const [country, setCountry] = React.useState<Country | null>(null);
        const [inputValue, setInputValue] = React.useState('');

        return (
          <Combobox.Root
            items={countries}
            filter={null}
            value={country}
            inputValue={inputValue}
            onInputValueChange={setInputValue}
            isItemEqualToValue={(item, selected) => item?.code === selected?.code}
            onValueChange={(value) => {
              if (country?.code === value?.code) {
                setCountry(null);
              } else {
                setCountry(value);
              }
            }}
          >
            <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.Input />
                  <Combobox.Empty data-testid="empty">No countries found.</Combobox.Empty>
                  <Combobox.List>
                    {(item: Country) => (
                      <Combobox.Item key={item.code} value={item}>
                        {item.label}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user, setProps } = await render(<AsyncControlledCombobox countries={undefined} />);

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await setProps({ countries: loadedItems });

      const canada = await screen.findByRole('option', { name: 'Canada' });
      fireEvent.mouseMove(canada, { pointerType: 'mouse' });
      await waitFor(() => expect(canada).to.have.attribute('data-highlighted'));

      await user.click(canada);
      await waitFor(() => expect(screen.queryByRole('listbox')).to.equal(null));

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Canada' })).not.to.equal(null);
        expect(screen.getByRole('option', { name: 'United States' })).not.to.equal(null);
      });
    });
  });

  describe('prop: highlightItemOnHover', () => {
    it('highlights an item on mouse move by default', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana', 'cherry']}>
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

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await user.click(input);

      const banana = screen.getByRole('option', { name: 'banana' });
      fireEvent.mouseMove(banana, { pointerType: 'mouse' });

      await waitFor(() => expect(banana).to.have.attribute('data-highlighted'));
      expect(input.getAttribute('aria-activedescendant')).to.equal(banana.id);
    });

    it('does not highlight items from mouse movement when disabled', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana', 'cherry']} highlightItemOnHover={false}>
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

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await user.click(input);

      const banana = screen.getByRole('option', { name: 'banana' });
      fireEvent.mouseMove(banana, { pointerType: 'mouse' });

      await waitFor(() => expect(input).not.to.have.attribute('aria-activedescendant'));
      expect(banana).not.to.have.attribute('data-highlighted');
    });
  });

  describe('prop: loopFocus', () => {
    it('loops focus from last to first item with ArrowDown by default', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana', 'cherry']}>
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

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await act(async () => input.focus());

      // ArrowUp opens and focuses last item
      await user.keyboard('{ArrowUp}');

      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      const options = screen.getAllByRole('option');

      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', options[2].id);
      });

      // Loop cycles through input
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(input).not.to.have.attribute('aria-activedescendant');
      });

      // Then to first item
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', options[0].id);
      });
    });

    it('loops focus from first to last item with ArrowUp by default', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana', 'cherry']}>
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

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await act(async () => input.focus());

      // ArrowDown opens and focuses first item
      await user.keyboard('{ArrowDown}');

      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      const options = screen.getAllByRole('option');

      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', options[0].id);
      });

      // Loop cycles through input
      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        expect(input).not.to.have.attribute('aria-activedescendant');
      });

      // Then to last item
      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', options[2].id);
      });
    });

    it('does not loop focus from last to first with ArrowDown when loopFocus={false}', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana', 'cherry']} loopFocus={false}>
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

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await act(async () => input.focus());

      // ArrowUp opens and focuses last item
      await user.keyboard('{ArrowUp}');

      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      const options = screen.getAllByRole('option');

      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', options[2].id);
      });

      // Should stay at last item (no loop)
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', options[2].id);
      });
    });

    it('does not loop focus from first to last with ArrowUp when loopFocus={false}', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana', 'cherry']} loopFocus={false}>
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

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await act(async () => input.focus());

      // ArrowDown opens and focuses first item
      await user.keyboard('{ArrowDown}');

      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));

      const options = screen.getAllByRole('option');

      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', options[0].id);
      });

      // Should stay at first item (no loop)
      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', options[0].id);
      });
    });
  });

  describe('within Composite', () => {
    it('should navigate between combobox and composite items', async () => {
      const { user } = await render(
        <CompositeRoot orientation="horizontal">
          <CompositeItem tag="button">Item 1</CompositeItem>
          <CompositeItem tag="button">Item 2</CompositeItem>
          <Combobox.Root>
            <Combobox.Input render={(props) => <CompositeItem tag="input" props={[props]} />} />
          </Combobox.Root>
        </CompositeRoot>,
      );

      const input = screen.getByRole('combobox');
      await user.click(input);

      await user.keyboard('{ArrowLeft}');
      const button2 = screen.getByRole('button', { name: 'Item 2' });
      expect(button2).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(input).toHaveFocus();
    });
  });
});
