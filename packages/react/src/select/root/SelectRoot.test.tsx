import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { Popover } from '@base-ui/react/popover';
import {
  act,
  fireEvent,
  flushMicrotasks,
  screen,
  waitFor,
  ignoreActWarnings,
  reactMajor,
} from '@mui/internal-test-utils';
import { createRenderer, isJSDOM, popupConformanceTests, wait } from '#test-utils';
import { expect } from 'vitest';
import { spy } from 'sinon';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';

describe('<Select.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describe('conformance', () => {
    beforeEach(() => {
      ignoreActWarnings();
    });

    popupConformanceTests({
      createComponent: (props) => (
        <Select.Root {...props.root}>
          <Select.Trigger {...props.trigger}>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal {...props.portal}>
            <Select.Positioner>
              <Select.Popup {...props.popup}>
                <Select.Item>Item</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      ),
      render,
      triggerMouseAction: 'click',
      expectedPopupRole: 'listbox',
      alwaysMounted: 'only-after-open',
    });
  });

  describe('prop: defaultValue', () => {
    it('should select the item by default', async () => {
      await render(
        <Select.Root defaultValue="b">
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      fireEvent.click(trigger);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b', hidden: false })).to.have.attribute(
        'data-selected',
        '',
      );
    });
  });

  describe('prop: value', () => {
    it('should select the item specified by the value prop', async () => {
      await render(
        <Select.Root value="b">
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      fireEvent.click(trigger);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b', hidden: false })).to.have.attribute(
        'data-selected',
        '',
      );
    });

    it('should update the selected item when the value prop changes', async () => {
      const { setProps } = await render(
        <Select.Root value="a">
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      fireEvent.click(trigger);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a', hidden: false })).to.have.attribute(
        'data-selected',
        '',
      );

      await setProps({ value: 'b' });

      expect(screen.getByRole('option', { name: 'b', hidden: false })).to.have.attribute(
        'data-selected',
        '',
      );
    });

    it('should not update the internal value if the controlled value prop does not change', async () => {
      const onValueChange = spy();
      await render(
        <Select.Root value="a" onValueChange={onValueChange}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).to.have.text('a');

      fireEvent.click(trigger);
      await flushMicrotasks();

      const optionB = screen.getByRole('option', { name: 'b' });
      fireEvent.click(optionB);
      await flushMicrotasks();

      expect(onValueChange.callCount).to.equal(0);
      expect(trigger).to.have.text('a');
    });

    it('updates <Select.Value /> label when the value prop changes before the popup opens', async () => {
      const { setProps } = await render(
        <Select.Root value="b">
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      expect(trigger).to.have.text('b');

      await setProps({ value: 'a' });
      await flushMicrotasks();

      expect(trigger).to.have.text('a');
    });
  });

  describe('prop: itemToStringValue', () => {
    it('uses itemToStringValue for form submission', async () => {
      const items = [
        { country: 'United States', code: 'US' },
        { country: 'Canada', code: 'CA' },
        { country: 'Australia', code: 'AU' },
      ];

      await render(
        <Select.Root
          name="country"
          defaultValue={items[0]}
          itemToStringLabel={(item) => item.country}
          itemToStringValue={(item) => item.code}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                {items.map((it) => (
                  <Select.Item key={it.code} value={it}>
                    {it.country}
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const hiddenInput = screen.getByRole('textbox', {
        hidden: true,
      });
      expect(hiddenInput).to.have.value('US');
    });

    it('uses itemToStringValue for multiple selection form submission', async () => {
      const items = [
        { country: 'United States', code: 'US' },
        { country: 'Canada', code: 'CA' },
        { country: 'Australia', code: 'AU' },
      ];

      const { container } = await render(
        <Select.Root
          name="countries"
          multiple
          defaultValue={[items[0], items[1]]}
          itemToStringLabel={(item) => item.country}
          itemToStringValue={(item) => item.code}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                {items.map((it) => (
                  <Select.Item key={it.code} value={it}>
                    {it.country}
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      // eslint-disable-next-line testing-library/no-container -- No appropriate method on screen since it's a type=hidden input
      const hiddenInputs = container.querySelectorAll('input[name="countries"]');
      expect(hiddenInputs).to.have.length(2);
      expect(hiddenInputs[0]).to.have.value('US');
      expect(hiddenInputs[1]).to.have.value('CA');
    });
  });

  describe('prop: itemToStringLabel', () => {
    const items = [
      { country: 'United States', code: 'US' },
      { country: 'Canada', code: 'CA' },
      { country: 'Australia', code: 'AU' },
    ];

    it('uses itemToStringLabel for trigger text when value is object', async () => {
      await render(
        <Select.Root
          defaultValue={items[1]}
          itemToStringLabel={(item) => item.country}
          itemToStringValue={(item) => item.code}
        >
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                {items.map((it) => (
                  <Select.Item key={it.code} value={it}>
                    {it.country}
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).to.have.text('Canada');
    });

    it('updates trigger text with itemToStringLabel after selecting object item', async () => {
      const { user } = await render(
        <Select.Root
          defaultOpen
          itemToStringLabel={(item: any) => item.country}
          itemToStringValue={(item: any) => item.code}
        >
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                {items.map((it) => (
                  <Select.Item key={it.code} value={it}>
                    {it.country}
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      await user.click(screen.getByRole('option', { name: 'Canada' }));
      expect(screen.getByTestId('trigger')).to.have.text('Canada');
    });
  });

  describe('prop: onValueChange', () => {
    const { render: renderFakeTimers, clock } = createRenderer({
      clockOptions: {
        shouldAdvanceTime: true,
      },
    });

    clock.withFakeTimers();

    it('should call onValueChange when an item is selected', async () => {
      if (reactMajor <= 18) {
        ignoreActWarnings();
      }

      const handleValueChange = spy();

      function App() {
        const [value, setValue] = React.useState<string | null>('');

        return (
          <Select.Root
            value={value}
            onValueChange={(newValue) => {
              setValue(newValue);
              handleValueChange(newValue);
            }}
          >
            <Select.Trigger data-testid="trigger">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="a">a</Select.Item>
                  <Select.Item value="b">b</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        );
      }

      const { user } = await renderFakeTimers(<App />);

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await flushMicrotasks();

      const option = screen.getByRole('option', { name: 'b' });
      await clock.tickAsync(200);
      await user.click(option);

      expect(handleValueChange.args[0][0]).to.equal('b');
    });

    it('is not called twice on select', async () => {
      if (reactMajor <= 18) {
        ignoreActWarnings();
      }

      const handleValueChange = spy();

      const { user } = await renderFakeTimers(
        <Select.Root onValueChange={handleValueChange}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await flushMicrotasks();

      const option = screen.getByRole('option', { name: 'b' });
      await clock.tickAsync(200);
      await user.click(option);

      expect(handleValueChange.callCount).to.equal(1);
    });
  });

  describe('prop: defaultOpen', () => {
    it('should open the select by default', async () => {
      await render(
        <Select.Root defaultOpen>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(screen.getByRole('listbox', { hidden: false })).toBeVisible();
    });

    it('should select an item and close when clicked while opened by default', async () => {
      const handleValueChange = spy();

      const { user } = await render(
        <Select.Root defaultOpen onValueChange={handleValueChange}>
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(screen.queryByRole('listbox')).toBeVisible();

      const optionB = screen.getByRole('option', { name: 'b' });

      fireEvent.mouseMove(optionB);
      await user.click(optionB);
      await flushMicrotasks();

      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.args[0][0]).to.equal('b');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });
    });
  });

  describe('prop: onOpenChange', () => {
    it('should call onOpenChange when the select is opened or closed', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <Select.Root onOpenChange={handleOpenChange}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await waitFor(() => {
        expect(handleOpenChange.callCount).to.equal(1);
      });
      expect(handleOpenChange.args[0][0]).to.equal(true);
    });
  });

  describe('BaseUIChangeEventDetails', () => {
    it('onOpenChange cancel() prevents opening while uncontrolled', async () => {
      await render(
        <Select.Root
          onOpenChange={(nextOpen, eventDetails) => {
            if (nextOpen) {
              eventDetails.cancel();
            }
          }}
        >
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(screen.queryByRole('listbox')).to.equal(null);
    });
  });

  it('should handle browser autofill', async () => {
    const { user } = await render(
      <Select.Root name="select">
        <Select.Trigger data-testid="trigger">
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="a">a</Select.Item>
              <Select.Item value="b">b</Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const trigger = screen.getByTestId('trigger');

    const selectInput = screen.getByRole('textbox', {
      hidden: true,
    });
    expect(selectInput).to.have.attribute('name', 'select');
    fireEvent.change(selectInput, { target: { value: 'b' } });
    await flushMicrotasks();

    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'b' })).to.have.attribute('data-selected', '');
    });
  });

  it('should pass autoComplete to the hidden input', async () => {
    await render(
      <Select.Root name="country" autoComplete="country">
        <Select.Trigger data-testid="trigger">
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="US">United States</Select.Item>
              <Select.Item value="CA">Canada</Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const hiddenInput = screen.getByRole('textbox', { hidden: true });
    expect(hiddenInput).to.have.attribute('name', 'country');
    expect(hiddenInput).to.have.attribute('autocomplete', 'country');
  });

  it('should handle browser autofill with object values', async () => {
    const items = [
      { country: 'United States', code: 'US' },
      { country: 'Canada', code: 'CA' },
    ];

    const { user } = await render(
      <Select.Root
        name="country"
        itemToStringLabel={(item: any) => item.country}
        itemToStringValue={(item: any) => item.code}
      >
        <Select.Trigger data-testid="trigger">
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              {items.map((it) => (
                <Select.Item key={it.code} value={it}>
                  {it.country}
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const trigger = screen.getByTestId('trigger');

    const selectInput = screen.getByRole('textbox', {
      hidden: true,
    });
    expect(selectInput).to.have.attribute('name', 'country');
    fireEvent.change(selectInput, { target: { value: 'CA' } });
    await flushMicrotasks();

    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Canada', hidden: false })).to.have.attribute(
        'data-selected',
        '',
      );
    });
  });

  describe('prop: modal', () => {
    it('should render an internal backdrop when `true`', async () => {
      const { user } = await render(
        <div>
          <Select.Root modal>
            <Select.Trigger data-testid="trigger">Open</Select.Trigger>
            <Select.Portal>
              <Select.Positioner data-testid="positioner">
                <Select.Popup>
                  <Select.Item>1</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <button>Outside</button>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });

      const positioner = screen.getByTestId('positioner');

      expect(positioner.previousElementSibling).to.have.attribute('role', 'presentation');
    });

    it('should not render an internal backdrop when `false`', async () => {
      const { user } = await render(
        <div>
          <Select.Root modal={false}>
            <Select.Trigger data-testid="trigger">Open</Select.Trigger>
            <Select.Portal>
              <Select.Positioner data-testid="positioner">
                <Select.Popup>
                  <Select.Item>1</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <button>Outside</button>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });

      const positioner = screen.getByTestId('positioner');

      expect(positioner.previousElementSibling).to.equal(null);
    });
  });

  describe('prop: actionsRef', () => {
    it('unmounts the select when the `unmount` method is called', async () => {
      const actionsRef = {
        current: {
          unmount: spy(),
        },
      };

      const { user } = await render(
        <Select.Root actionsRef={actionsRef}>
          <Select.Trigger data-testid="trigger">Open</Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item>1</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });

      await act(async () => {
        await new Promise((resolve) => {
          requestAnimationFrame(resolve);
        });
        actionsRef.current.unmount();
      });

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });
    });
  });

  describe.skipIf(isJSDOM)('select inside popover', () => {
    it('keeps the popover open when selecting via drag-to-select', async () => {
      ignoreActWarnings();

      function Test() {
        const [value, setValue] = React.useState<string | null>('one');
        return (
          <div>
            <span data-testid="selected-value">{value}</span>
            <Popover.Root defaultOpen>
              <Popover.Trigger>Open popover</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popover-popup">
                    <Select.Root value={value} onValueChange={setValue}>
                      <Select.Trigger data-testid="select-trigger">
                        <Select.Value placeholder="Pick one" />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Positioner>
                          <Select.Popup>
                            <Select.Item value="one">One</Select.Item>
                            <Select.Item value="two">Two</Select.Item>
                          </Select.Popup>
                        </Select.Positioner>
                      </Select.Portal>
                    </Select.Root>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const selectTrigger = screen.getByTestId('select-trigger');

      await user.pointer({ keys: '[MouseLeft>]', target: selectTrigger });

      const option = await screen.findByRole('option', { name: 'Two' });
      await user.pointer({ target: option });
      await wait(500);
      await user.pointer({ keys: '[/MouseLeft]', target: option });

      await waitFor(() => expect(screen.getByTestId('selected-value')).to.have.text('two'));
      await waitFor(() => expect(screen.queryByTestId('popover-popup')).not.toBe(null));
    });
  });

  describe.skipIf(isJSDOM)('prop: onOpenChangeComplete', () => {
    it('is called on close when there is no exit animation defined', async () => {
      const onOpenChangeComplete = spy();

      function Test() {
        const [open, setOpen] = React.useState(true);
        return (
          <div>
            <button onClick={() => setOpen(false)}>Close</button>
            <Select.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup data-testid="popup" />
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });

      expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
      expect(onOpenChangeComplete.lastCall.args[0]).to.equal(false);
    });

    it('is called on close when the exit animation finishes', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const onOpenChangeComplete = spy();

      function Test() {
        const style = `
          @keyframes test-anim {
            to {
              opacity: 0;
            }
          }

          .animation-test-indicator[data-ending-style] {
            animation: test-anim 1ms;
          }
        `;

        const [open, setOpen] = React.useState(true);

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={() => setOpen(false)}>Close</button>
            <Select.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup className="animation-test-indicator" data-testid="popup" />
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      expect(screen.queryByRole('listbox')).not.to.equal(null);

      // Wait for open animation to finish
      await waitFor(() => {
        expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
      });

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });

      expect(onOpenChangeComplete.lastCall.args[0]).to.equal(false);
    });

    it('is called on open when there is no enter animation defined', async () => {
      const onOpenChangeComplete = spy();

      function Test() {
        const [open, setOpen] = React.useState(false);
        return (
          <div>
            <button onClick={() => setOpen(true)}>Open</button>
            <Select.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup data-testid="popup" />
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });

      expect(onOpenChangeComplete.callCount).to.equal(2); // 1 in browser
      expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
    });

    it('is called on open when the enter animation finishes', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const onOpenChangeComplete = spy();

      function Test() {
        const style = `
          @keyframes test-anim {
            from {
              opacity: 0;
            }
          }

          .animation-test-indicator[data-starting-style] {
            animation: test-anim 1ms;
          }
        `;

        const [open, setOpen] = React.useState(false);

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={() => setOpen(true)}>Open</button>
            <Select.Root
              open={open}
              onOpenChange={setOpen}
              onOpenChangeComplete={onOpenChangeComplete}
            >
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup className="animation-test-indicator" data-testid="popup" />
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      // Wait for open animation to finish
      await waitFor(() => {
        expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
      });

      expect(screen.queryByRole('listbox')).not.to.equal(null);
    });

    it('does not get called on mount when not open', async () => {
      const onOpenChangeComplete = spy();

      await render(
        <Select.Root onOpenChangeComplete={onOpenChangeComplete}>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup data-testid="popup" />
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(onOpenChangeComplete.callCount).to.equal(0);
    });
  });

  describe('prop: disabled', () => {
    it('sets the disabled state', async () => {
      const handleOpenChange = spy();
      const { user } = await render(
        <Select.Root defaultValue="b" onOpenChange={handleOpenChange} disabled>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).to.have.attribute('disabled');
      expect(trigger).to.have.attribute('data-disabled');

      await user.keyboard('[Tab]');

      expect(expect(document.activeElement)).not.to.equal(trigger);

      await user.click(trigger);
      expect(handleOpenChange.callCount).to.equal(0);
    });

    it('updates the disabled state when the disabled prop changes', async () => {
      const handleOpenChange = spy();
      function App() {
        const [disabled, setDisabled] = React.useState(true);
        return (
          <React.Fragment>
            <button onClick={() => setDisabled(!disabled)}>toggle</button>
            <Select.Root defaultValue="b" onOpenChange={handleOpenChange} disabled={disabled}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="a">a</Select.Item>
                    <Select.Item value="b">b</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </React.Fragment>
        );
      }
      const { user } = await render(<App />);

      const trigger = screen.getByRole('combobox');
      expect(trigger).to.have.attribute('disabled');
      expect(trigger).to.have.attribute('data-disabled');

      await user.keyboard('[Tab]');

      expect(expect(document.activeElement)).not.to.equal(trigger);

      await user.click(trigger);
      expect(handleOpenChange.callCount).to.equal(0);

      await user.click(screen.getByRole('button', { name: 'toggle' }));

      expect(trigger).to.not.have.attribute('disabled');
      expect(trigger).to.not.have.attribute('data-disabled');

      await user.keyboard('[Tab]');
      expect(trigger).toHaveFocus();

      await user.click(trigger);
      await waitFor(() => {
        expect(handleOpenChange.callCount).to.equal(1);
      });
    });
  });

  describe('prop: readOnly', () => {
    it('sets the readOnly state', async () => {
      const handleOpenChange = spy();
      const { user } = await render(
        <Select.Root defaultValue="b" onOpenChange={handleOpenChange} readOnly>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
        </Select.Root>,
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).to.have.attribute('aria-readonly', 'true');
      expect(trigger).to.have.attribute('data-readonly');

      await user.keyboard('[Tab]');
      expect(trigger).toHaveFocus();

      await user.click(trigger);
      expect(handleOpenChange.callCount).to.equal(0);
    });

    it('should not open the select when clicked', async () => {
      const handleOpenChange = spy();
      const { user } = await render(
        <Select.Root onOpenChange={handleOpenChange} readOnly>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
        </Select.Root>,
      );

      const trigger = screen.getByRole('combobox');

      await user.click(trigger);
      expect(screen.queryByRole('listbox')).to.equal(null);
      expect(handleOpenChange.callCount).to.equal(0);
    });

    it('should not open the select when using keyboard', async () => {
      const handleOpenChange = spy();
      const { user } = await render(
        <Select.Root onOpenChange={handleOpenChange} readOnly>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
        </Select.Root>,
      );

      const trigger = screen.getByRole('combobox');

      await act(async () => {
        trigger.focus();
      });

      expect(screen.queryByRole('listbox')).to.equal(null);
      expect(document.activeElement).to.equal(trigger);

      await user.keyboard('[ArrowDown]');
      expect(screen.queryByRole('listbox')).to.equal(null);
      expect(handleOpenChange.callCount).to.equal(0);

      await user.keyboard('[Enter]');
      expect(screen.queryByRole('listbox')).to.equal(null);
      expect(handleOpenChange.callCount).to.equal(0);

      await user.keyboard('[Space]');
      expect(screen.queryByRole('listbox')).to.equal(null);
      expect(handleOpenChange.callCount).to.equal(0);
    });
  });

  describe('prop: id', () => {
    it('sets the id on the trigger', async () => {
      await render(
        <Select.Root id="test-id">
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).to.have.attribute('id', 'test-id');
    });

    it('sets a hidden input id when name is not provided', async () => {
      await render(
        <Select.Root id="test-id">
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
        </Select.Root>,
      );

      const hiddenInput = screen.getByRole('textbox', { hidden: true });
      expect(hiddenInput).to.have.attribute('id', 'test-id-hidden-input');
      expect(hiddenInput).not.to.have.attribute('name');
    });

    it('does not set a hidden input id when name is provided', async () => {
      await render(
        <Select.Root id="test-id" name="country">
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
        </Select.Root>,
      );

      const hiddenInput = screen.getByRole('textbox', { hidden: true });
      expect(hiddenInput).to.have.attribute('name', 'country');
      expect(hiddenInput).not.to.have.attribute('id');
    });
  });

  describe('with Field.Root parent', () => {
    it('should receive disabled prop from Field.Root', async () => {
      await render(
        <Field.Root disabled>
          <Select.Root>
            <Select.Trigger data-testid="trigger">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="a">a</Select.Item>
                  <Select.Item value="b">b</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Field.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).to.have.attribute('disabled');
    });

    it('should receive name prop from Field.Root', async () => {
      await render(
        <Field.Root name="field-select">
          <Select.Root>
            <Select.Trigger data-testid="trigger">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="a">a</Select.Item>
                  <Select.Item value="b">b</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Field.Root>,
      );

      const hiddenInput = screen.getByRole('textbox', { hidden: true });
      expect(hiddenInput).to.have.attribute('name', 'field-select');
    });
  });

  it('resets selected index when value is set to null without a null item', async () => {
    function App() {
      const [value, setValue] = React.useState<string | null>(null);
      return (
        <div>
          <button onClick={() => setValue('1')}>1</button>
          <button onClick={() => setValue('2')}>2</button>
          <button onClick={() => setValue(null)}>null</button>
          <Select.Root value={value} onValueChange={setValue}>
            <Select.Trigger data-testid="trigger">
              <Select.Value data-testid="value">{(val) => val ?? 'initial'}</Select.Value>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="1">1</Select.Item>
                  <Select.Item value="2">2</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </div>
      );
    }

    const { user } = await render(<App />);

    await user.click(screen.getByText('initial'));

    await user.click(screen.getByRole('button', { name: '1' }));
    expect(screen.getByTestId('value')).to.have.text('1');

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByTestId('value')).to.have.text('2');

    await user.click(screen.getByRole('button', { name: 'null' }));
    expect(screen.getByTestId('value')).to.have.text('initial');

    await user.click(screen.getByTestId('trigger'));
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: '2' })).not.to.have.attribute(
        'data-selected',
        '',
      );
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
            <Select.Root
              defaultValue={items[0]}
              itemToStringLabel={(item) => item.label}
              itemToStringValue={(item) => item.code}
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value={items[0]}>United States</Select.Item>
                    <Select.Item value={items[1]}>Canada</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      await user.click(screen.getByText('Submit'));

      expect(handleFormSubmit.callCount).to.equal(1);
      expect(handleFormSubmit.firstCall.args[0]).to.deep.equal({ country: 'US' });
    });

    it('triggers native HTML validation on submit', async () => {
      const { user } = await render(
        <Form>
          <Field.Root name="test" data-testid="field">
            <Select.Root required>
              <Select.Trigger data-testid="trigger">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner />
              </Select.Portal>
            </Select.Root>
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

    it('clears external errors on change', async () => {
      ignoreActWarnings();

      const { user } = await renderFakeTimers(
        <Form
          errors={{
            select: 'test',
          }}
        >
          <Field.Root name="select">
            <Select.Root>
              <Select.Trigger data-testid="trigger">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="a">a</Select.Item>
                    <Select.Item value="b">b</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>,
      );

      expect(screen.getByTestId('error')).to.have.text('test');

      const trigger = screen.getByTestId('trigger');
      expect(trigger).to.have.attribute('aria-invalid', 'true');

      await user.click(trigger);
      await flushMicrotasks();

      const option = screen.getByRole('option', { name: 'b' });
      await clock.tickAsync(200);
      await user.click(option);

      expect(screen.queryByTestId('error')).to.equal(null);
      expect(trigger).not.to.have.attribute('aria-invalid');
    });

    it('revalidates immediately after form submission errors', async () => {
      ignoreActWarnings();

      const { user } = await renderFakeTimers(
        <Form>
          <Field.Root name="select">
            <Select.Root required>
              <Select.Trigger data-testid="trigger">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="a">a</Select.Item>
                    <Select.Item value="b">b</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <Field.Error match="valueMissing" data-testid="error">
              required
            </Field.Error>
          </Field.Root>
          <button type="submit" data-testid="submit">
            Submit
          </button>
        </Form>,
      );

      const submit = screen.getByTestId('submit');
      await user.click(submit);

      expect(screen.getByTestId('error')).to.have.text('required');
      const trigger = screen.getByTestId('trigger');
      expect(trigger).to.have.attribute('aria-invalid', 'true');

      await user.click(trigger);
      await flushMicrotasks();
      await clock.tickAsync(200);
      await user.click(screen.getByRole('option', { name: 'b' }));

      expect(screen.queryByTestId('error')).to.equal(null);
      expect(trigger).not.to.have.attribute('aria-invalid');
    });
  });

  describe('Field', () => {
    const { render: renderFakeTimers, clock } = createRenderer({
      clockOptions: {
        shouldAdvanceTime: true,
      },
    });

    clock.withFakeTimers();

    it('[data-touched]', async () => {
      await render(
        <Field.Root>
          <Select.Root>
            <Select.Trigger data-testid="trigger" />
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="">Select</Select.Item>
                  <Select.Item value="1">Option 1</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Field.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      expect(trigger).not.to.have.attribute('data-dirty');

      fireEvent.focus(trigger);
      fireEvent.blur(trigger);

      await flushMicrotasks();

      expect(trigger).to.have.attribute('data-touched', '');
    });

    it('[data-dirty]', async () => {
      ignoreActWarnings();

      const { user } = await renderFakeTimers(
        <Field.Root>
          <Select.Root>
            <Select.Trigger data-testid="trigger" />
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="">Select</Select.Item>
                  <Select.Item value="1">Option 1</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Field.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      expect(trigger).not.to.have.attribute('data-dirty');

      await user.click(trigger);
      await flushMicrotasks();
      await clock.tickAsync(200);

      const option = screen.getByRole('option', { name: 'Option 1' });

      // Arrow Down to focus the Option 1
      await user.keyboard('{ArrowDown}');
      await user.click(option);
      await flushMicrotasks();

      expect(trigger).to.have.attribute('data-dirty', '');
    });

    describe('[data-filled]', () => {
      it('adds [data-filled] attribute when filled', async () => {
        ignoreActWarnings();

        const { user } = await renderFakeTimers(
          <Field.Root>
            <Select.Root>
              <Select.Trigger data-testid="trigger" />
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="">Select</Select.Item>
                    <Select.Item value="1">Option 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Field.Root>,
        );

        const trigger = screen.getByTestId('trigger');

        expect(trigger).not.to.have.attribute('data-filled');

        await user.click(trigger);
        await flushMicrotasks();
        await clock.tickAsync(200);

        const option = screen.getByRole('option', { name: 'Option 1' });

        // Arrow Down to focus the Option 1
        await user.keyboard('{ArrowDown}');
        await user.click(option);
        await flushMicrotasks();

        expect(trigger).to.have.attribute('data-filled', '');

        await user.click(trigger);

        await flushMicrotasks();

        const select = screen.getByRole('listbox');

        expect(select).not.to.have.attribute('data-filled');
      });

      it('adds [data-filled] attribute when already filled', async () => {
        await render(
          <Field.Root>
            <Select.Root defaultValue="1">
              <Select.Trigger data-testid="trigger" />
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="1">Option 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Field.Root>,
        );

        const trigger = screen.getByTestId('trigger');

        expect(trigger).to.have.attribute('data-filled');
      });

      it('does not add [data-filled] attribute when multiple value is empty', async () => {
        ignoreActWarnings();
        const { user } = await renderFakeTimers(
          <Field.Root>
            <Select.Root multiple>
              <Select.Trigger data-testid="trigger" />
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="">Select</Select.Item>
                    <Select.Item value="1">Option 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Field.Root>,
        );

        const trigger = screen.getByTestId('trigger');

        expect(trigger).not.to.have.attribute('data-filled');

        await user.click(trigger);
        await flushMicrotasks();
        await clock.tickAsync(200);

        const option = screen.getByRole('option', { name: 'Option 1' });

        await user.click(option);
        await flushMicrotasks();

        expect(trigger).to.have.attribute('data-filled', '');

        await user.click(option);
        await flushMicrotasks();

        expect(trigger).not.to.have.attribute('data-filled');
      });

      it('does not add [data-filled] attribute when multiple defaultValue is empty array', async () => {
        ignoreActWarnings();

        const { user } = await renderFakeTimers(
          <Field.Root>
            <Select.Root multiple defaultValue={[]}>
              <Select.Trigger data-testid="trigger" />
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="">Select</Select.Item>
                    <Select.Item value="1">Option 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Field.Root>,
        );

        const trigger = screen.getByTestId('trigger');

        expect(trigger).not.to.have.attribute('data-filled');

        await user.click(trigger);
        await flushMicrotasks();
        await clock.tickAsync(200);

        const option = screen.getByRole('option', { name: 'Option 1' });

        await user.click(option);
        await flushMicrotasks();

        expect(trigger).to.have.attribute('data-filled', '');

        await user.click(option);
        await flushMicrotasks();

        expect(trigger).not.to.have.attribute('data-filled');
      });
    });

    it('[data-focused]', async () => {
      await render(
        <Field.Root>
          <Select.Root>
            <Select.Trigger data-testid="trigger" />
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="">Select</Select.Item>
                  <Select.Item value="1">Option 1</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Field.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      expect(trigger).not.to.have.attribute('data-focused');

      fireEvent.focus(trigger);

      expect(trigger).to.have.attribute('data-focused', '');

      fireEvent.blur(trigger);

      expect(trigger).not.to.have.attribute('data-focused');
    });

    it('does not mark as touched when focus moves into the popup', async () => {
      const validateSpy = spy(() => 'error');

      await render(
        <React.Fragment>
          <Field.Root validationMode="onBlur" validate={validateSpy}>
            <Select.Root>
              <Select.Trigger data-testid="trigger" />
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="1">Option 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Field.Root>
          <button data-testid="outside">Outside</button>
        </React.Fragment>,
      );

      const trigger = screen.getByTestId('trigger');

      fireEvent.focus(trigger);
      fireEvent.click(trigger);

      await flushMicrotasks();

      const listbox = screen.getByRole('listbox');

      fireEvent.blur(trigger, { relatedTarget: listbox });
      fireEvent.focus(listbox);

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
            <Select.Root>
              <Select.Trigger data-testid="trigger" />
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="1">Option 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Field.Root>
          <button data-testid="outside">Outside</button>
        </React.Fragment>,
      );

      const trigger = screen.getByTestId('trigger');
      const outside = screen.getByTestId('outside');

      fireEvent.focus(trigger);
      fireEvent.click(trigger);

      await flushMicrotasks();

      const listbox = screen.getByRole('listbox');

      fireEvent.blur(trigger, { relatedTarget: listbox });
      fireEvent.focus(listbox);

      fireEvent.blur(listbox, { relatedTarget: outside });
      fireEvent.focus(outside);

      await waitFor(() => {
        expect(validateSpy.callCount).to.equal(1);
      });

      // The above `waitFor` might not ensure re-render has finished
      await waitFor(() => {
        expect(trigger).to.have.attribute('data-touched', '');
      });
      expect(trigger).not.to.have.attribute('data-focused');
      expect(trigger).to.have.attribute('aria-invalid', 'true');
    });

    it('prop: validate', async () => {
      await render(
        <Field.Root validationMode="onBlur" validate={() => 'error'}>
          <Select.Root>
            <Select.Trigger data-testid="trigger" />
            <Select.Portal>
              <Select.Positioner />
            </Select.Portal>
          </Select.Root>
        </Field.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      expect(trigger).not.to.have.attribute('aria-invalid');

      fireEvent.focus(trigger);
      fireEvent.blur(trigger);

      await flushMicrotasks();

      expect(trigger).to.have.attribute('aria-invalid', 'true');
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
          <Select.Root
            defaultValue={items[0]}
            itemToStringLabel={(item) => item.label}
            itemToStringValue={(item) => item.code}
          >
            <Select.Trigger data-testid="trigger">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner />
            </Select.Portal>
          </Select.Root>
        </Field.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      fireEvent.focus(trigger);
      fireEvent.blur(trigger);

      await waitFor(() => {
        expect(validateSpy.callCount).to.equal(1);
      });
      expect(trigger).to.have.attribute('aria-invalid', 'true');
    });

    it('prop: validateMode=onSubmit', async () => {
      ignoreActWarnings();

      const { user } = await render(
        <Form>
          <Field.Root validate={(val) => (val === '2' ? 'error' : null)}>
            <Select.Root required>
              <Select.Trigger />
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="1">Option 1</Select.Item>
                    <Select.Item value="2">Option 2</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Field.Root>
          <button type="submit">submit</button>
        </Form>,
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).not.to.have.attribute('aria-invalid');

      await user.click(screen.getByText('submit'));
      expect(trigger).to.have.attribute('aria-invalid', 'true');

      // Arrow Down to focus Option 1 (valid)
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      expect(trigger).not.to.have.attribute('aria-invalid');

      await user.click(trigger);
      // Arrow Down to focus Option 2 (invalid)
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      expect(trigger).to.have.attribute('aria-invalid', 'true');

      await user.click(trigger);
      // Arrow Down to focus Option 1 (valid)
      await user.keyboard('{ArrowUp}');
      await user.keyboard('{Enter}');
      await flushMicrotasks();
      expect(trigger).to.not.have.attribute('aria-invalid');
    });

    // flaky in real browser
    it.skipIf(!isJSDOM)('prop: validationMode=onChange', async () => {
      ignoreActWarnings();
      const { user } = await render(
        <Field.Root
          validationMode="onChange"
          validate={(value) => {
            return value === '1' ? 'error' : null;
          }}
        >
          <Select.Root>
            <Select.Trigger data-testid="trigger">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="1">Option 1</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Field.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      expect(trigger).not.to.have.attribute('aria-invalid');

      await user.click(trigger);

      await flushMicrotasks();

      // Arrow Down to focus the Option 1
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(trigger).to.have.attribute('aria-invalid', 'true');
    });

    it('revalidates when the controlled value changes externally', async () => {
      const validateSpy = spy((value: unknown) => ((value as string) === 'b' ? 'error' : null));

      function App() {
        const [value, setValue] = React.useState('a');

        return (
          <React.Fragment>
            <Field.Root validationMode="onChange" validate={validateSpy} name="flavor">
              <Select.Root value={value} onValueChange={(next) => setValue(next as string)}>
                <Select.Trigger data-testid="trigger">
                  <Select.Value />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner>
                    <Select.Popup>
                      <Select.Item value="a">Option A</Select.Item>
                      <Select.Item value="b">Option B</Select.Item>
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
            </Field.Root>
            <button type="button" onClick={() => setValue('b')}>
              Select externally
            </button>
          </React.Fragment>
        );
      }

      await render(<App />);

      const trigger = screen.getByTestId('trigger');
      const toggle = screen.getByText('Select externally');

      expect(trigger).not.to.have.attribute('aria-invalid');
      const initialCallCount = validateSpy.callCount;

      fireEvent.click(toggle);
      await flushMicrotasks();

      expect(validateSpy.callCount).to.equal(initialCallCount + 1);
      expect(validateSpy.lastCall.args[0]).to.equal('b');
      expect(trigger).to.have.attribute('aria-invalid', 'true');
    });

    // flaky in real browser
    it.skipIf(!isJSDOM)('prop: validationMode=onBlur', async () => {
      ignoreActWarnings();
      const { user } = await render(
        <Field.Root
          validationMode="onBlur"
          validate={(value) => {
            return value === '1' ? 'error' : null;
          }}
        >
          <Select.Root>
            <Select.Trigger data-testid="trigger">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="1">Option 1</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <Field.Error data-testid="error" />
        </Field.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      expect(trigger).not.to.have.attribute('aria-invalid');

      await user.click(trigger);

      await flushMicrotasks();

      // Arrow Down to focus the Option 1
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      fireEvent.blur(trigger);

      await flushMicrotasks();

      await waitFor(() => {
        expect(trigger).to.have.attribute('aria-invalid', 'true');
      });
    });

    it('Field.Label', async () => {
      await render(
        <Field.Root>
          <Select.Root>
            <Select.Trigger data-testid="trigger" />
            <Select.Portal>
              <Select.Positioner />
            </Select.Portal>
          </Select.Root>
          <Field.Label data-testid="label" nativeLabel={false} render={<span />} />
        </Field.Root>,
      );

      expect(screen.getByTestId('trigger')).to.have.attribute(
        'aria-labelledby',
        screen.getByTestId('label').id,
      );
    });

    it('Field.Label links to trigger and focuses it', async () => {
      const { user } = await render(
        <Field.Root>
          <Field.Label data-testid="label">Font</Field.Label>
          <Select.Root>
            <Select.Trigger data-testid="trigger">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="sans">Sans-serif</Select.Item>
                  <Select.Item value="serif">Serif</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Field.Root>,
      );

      const label = screen.getByTestId<HTMLLabelElement>('label');
      const trigger = screen.getByTestId('trigger');

      expect(label).to.have.attribute('for', trigger.id);
      expect(trigger).to.have.attribute('id', label?.htmlFor);

      await user.click(label);

      expect(screen.getByRole('listbox')).toHaveFocus();
    });

    it('Field.Label links to trigger when trigger has an explicit id', async () => {
      const { user } = await render(
        <Field.Root>
          <Field.Label data-testid="label">Font</Field.Label>
          <Select.Root>
            <Select.Trigger data-testid="trigger" id="x-id">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="sans">Sans-serif</Select.Item>
                  <Select.Item value="serif">Serif</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Field.Root>,
      );

      const label = screen.getByTestId<HTMLLabelElement>('label');
      const trigger = screen.getByTestId('trigger');

      expect(trigger).to.have.attribute('id', 'x-id');
      expect(label).to.have.attribute('for', 'x-id');
      expect(trigger).to.have.attribute('id', label?.htmlFor);

      await user.click(label);

      expect(screen.getByRole('listbox')).toHaveFocus();
    });

    it('Field.Description', async () => {
      await render(
        <Field.Root>
          <Select.Root>
            <Select.Trigger data-testid="trigger" />
            <Select.Portal>
              <Select.Positioner />
            </Select.Portal>
          </Select.Root>
          <Field.Description data-testid="description" />
        </Field.Root>,
      );

      expect(screen.getByTestId('trigger')).to.have.attribute(
        'aria-describedby',
        screen.getByTestId('description').id,
      );
    });
  });

  describe('dynamic items', () => {
    const { render: renderFakeTimers, clock } = createRenderer({
      clockOptions: {
        shouldAdvanceTime: true,
      },
    });

    clock.withFakeTimers();

    it('skips null items when navigating', async () => {
      function DynamicMenu() {
        const [itemsFiltered, setItemsFiltered] = React.useState(false);

        return (
          <Select.Root
            onOpenChange={(newOpen) => {
              if (newOpen) {
                setTimeout(() => {
                  setItemsFiltered(true);
                }, 0);
              }
            }}
            onOpenChangeComplete={(newOpen) => {
              if (!newOpen) {
                setItemsFiltered(false);
              }
            }}
          >
            <Select.Trigger>Toggle</Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item>Add to Library</Select.Item>
                  {!itemsFiltered && (
                    <React.Fragment>
                      <Select.Item>Add to Playlist</Select.Item>
                      <Select.Item>Play Next</Select.Item>
                      <Select.Item>Play Last</Select.Item>
                    </React.Fragment>
                  )}
                  <Select.Item>Favorite</Select.Item>
                  <Select.Item>Share</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        );
      }

      const { user } = await renderFakeTimers(<DynamicMenu />);

      const trigger = screen.getByText('Toggle');

      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}'); // Share
      await user.keyboard('{ArrowDown}'); // Share still

      expect(screen.queryByRole('option', { name: 'Share' })).toHaveFocus();
    });

    it('unselects the selected item if removed', async () => {
      function DynamicMenu() {
        const [items, setItems] = React.useState(['a', 'b', 'c']);
        const [selectedItem, setSelectedItem] = React.useState<string | null>('a');

        return (
          <div>
            <button
              onClick={() => {
                setItems((prev) => prev.filter((item) => item !== 'a'));
              }}
            >
              Remove
            </button>

            <button
              onClick={() => {
                setItems(['a', 'b', 'c']);
              }}
            >
              Add
            </button>
            <div data-testid="value">{selectedItem}</div>

            <Select.Root value={selectedItem} onValueChange={setSelectedItem}>
              <Select.Trigger>Toggle</Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    {items.map((item) => (
                      <Select.Item key={item} value={item}>
                        {item}
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        );
      }

      const { user } = await renderFakeTimers(<DynamicMenu />);

      const trigger = screen.getByText('Toggle');

      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{ArrowDown}');

      expect(screen.queryByRole('option', { name: 'a' })).to.have.attribute('data-selected');
      expect(screen.getByTestId('value')).to.have.text('a');

      fireEvent.click(screen.getByText('Remove'));

      expect(screen.queryByRole('option', { name: 'b' })).not.to.have.attribute('data-selected');

      fireEvent.click(screen.getByText('Add'));

      expect(screen.queryByRole('option', { name: 'a' })).not.to.have.attribute('data-selected');
    });

    it('resets to default when the selected item is removed from the list', async () => {
      if (reactMajor <= 18) {
        ignoreActWarnings();
      }

      function Test() {
        const [items, setItems] = React.useState(['a', 'b', 'c']);
        return (
          <div>
            <Select.Root defaultValue="b">
              <Select.Trigger data-testid="trigger">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    {items.map((it) => (
                      <Select.Item key={it} value={it}>
                        {it}
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <button
              data-testid="remove-c"
              onClick={() => setItems((prev) => prev.filter((i) => i !== 'c'))}
            >
              Remove C
            </button>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await user.click(screen.getByRole('option', { name: 'c' }));

      await user.click(screen.getByTestId('remove-c'));

      await waitFor(() => {
        expect(trigger).to.have.text('b');
      });

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'b' })).to.have.attribute('data-selected', '');
      });
    });

    it('resets via onValueChange and does not break in controlled mode when the selected item is removed', async () => {
      if (reactMajor <= 18) {
        ignoreActWarnings();
      }

      function TestControlled() {
        const [items, setItems] = React.useState(['a', 'b', 'c']);
        const [value, setValue] = React.useState<string | null>('c');
        return (
          <div>
            <Select.Root value={value} onValueChange={setValue}>
              <Select.Trigger data-testid="trigger">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    {items.map((it) => (
                      <Select.Item key={it} value={it}>
                        {it}
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <button
              data-testid="remove-c"
              onClick={() => setItems((prev) => prev.filter((i) => i !== 'c'))}
            >
              Remove C
            </button>
          </div>
        );
      }

      const { user } = await render(<TestControlled />);

      const trigger = screen.getByTestId('trigger');
      expect(trigger).to.have.text('c');

      await user.click(screen.getByTestId('remove-c'));

      // Opening should not break; and no option is selected since the value is missing from list
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeVisible();
      });

      const options = await screen.findAllByRole('option');
      options.forEach((opt) => {
        expect(opt).not.to.have.attribute('data-selected');
      });
    });

    it('falls back to null when both selected and initial default are removed (uncontrolled)', async () => {
      if (reactMajor <= 18) {
        ignoreActWarnings();
      }

      function Test() {
        const [items, setItems] = React.useState(['a', 'b', 'c']);
        return (
          <div>
            <Select.Root defaultValue="b">
              <Select.Trigger data-testid="trigger">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    {items.map((it) => (
                      <Select.Item key={it} value={it}>
                        {it}
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <button
              data-testid="remove-b"
              onClick={() => setItems((prev) => prev.filter((i) => i !== 'b'))}
            >
              Remove B
            </button>
            <button
              data-testid="remove-c"
              onClick={() => setItems((prev) => prev.filter((i) => i !== 'c'))}
            >
              Remove C
            </button>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await user.click(screen.getByRole('option', { name: 'c' }));

      await user.click(screen.getByTestId('remove-b'));
      await user.click(screen.getByTestId('remove-c'));

      // Now no fallback remains; value should reset to null
      await waitFor(() => {
        expect(trigger).to.have.text('');
      });

      await user.click(trigger);

      const options = await screen.findAllByRole('option');
      options.forEach((opt) => {
        expect(opt).not.to.have.attribute('data-selected');
      });
    });

    it('falls back to null when both selected and initial default are removed (controlled)', async () => {
      if (reactMajor <= 18) {
        ignoreActWarnings();
      }

      function TestControlled() {
        const [items, setItems] = React.useState(['a', 'b', 'c']);
        const [value, setValue] = React.useState<string | null>('c');
        return (
          <div>
            <Select.Root value={value} onValueChange={setValue}>
              <Select.Trigger data-testid="trigger">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    {items.map((it) => (
                      <Select.Item key={it} value={it}>
                        {it}
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <button
              data-testid="remove-b"
              onClick={() => setItems((prev) => prev.filter((i) => i !== 'b'))}
            >
              Remove B
            </button>
            <button
              data-testid="remove-c"
              onClick={() => setItems((prev) => prev.filter((i) => i !== 'c'))}
            >
              Remove C
            </button>
          </div>
        );
      }

      const { user } = await render(<TestControlled />);
      const trigger = screen.getByTestId('trigger');

      await user.click(screen.getByTestId('remove-b'));
      await user.click(screen.getByTestId('remove-c'));

      await user.click(trigger);

      const options = await screen.findAllByRole('option');
      options.forEach((opt) => {
        expect(opt).not.to.have.attribute('data-selected');
      });
    });
  });

  describe('typeahead', () => {
    it('starts from the first match after value reset (closed)', async () => {
      function App() {
        const [value, setValue] = React.useState<string | null>(null);
        return (
          <React.Fragment>
            <button data-testid="reset" onClick={() => setValue(null)}>
              Reset
            </button>
            <Select.Root value={value} onValueChange={setValue}>
              <Select.Trigger data-testid="trigger">
                <Select.Value data-testid="value" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="a1">A1</Select.Item>
                    <Select.Item value="a2">A2</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </React.Fragment>
        );
      }

      const { user } = await render(<App />);

      const trigger = screen.getByTestId('trigger');
      const valueEl = screen.getByTestId('value');
      const resetBtn = screen.getByTestId('reset');

      act(() => trigger.focus());
      await user.keyboard('a');
      expect(valueEl.textContent).to.equal('a1');

      await user.click(resetBtn);

      act(() => trigger.focus());
      await user.keyboard('a');
      expect(valueEl.textContent).to.equal('a1');
    });

    it('does not jump matches after a closed-state value reset', async () => {
      function App() {
        const [value, setValue] = React.useState<string | null>('dog');
        return (
          <React.Fragment>
            <button data-testid="set-car" onClick={() => setValue('car')}>
              Set car
            </button>
            <Select.Root value={value} onValueChange={setValue}>
              <Select.Trigger data-testid="trigger">
                <Select.Value data-testid="value" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="car">car</Select.Item>
                    <Select.Item value="cat">cat</Select.Item>
                    <Select.Item value="dog">dog</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </React.Fragment>
        );
      }

      const { user } = await render(<App />);

      const trigger = screen.getByTestId('trigger');
      const valueEl = screen.getByTestId('value');
      const setCarButton = screen.getByTestId('set-car');

      expect(valueEl.textContent).to.equal('dog');

      await user.click(setCarButton);
      expect(valueEl.textContent).to.equal('car');

      await act(async () => trigger.focus());
      await user.keyboard('c');
      expect(valueEl.textContent).to.equal('cat');

      await user.keyboard('a');
      expect(valueEl.textContent).to.equal('cat');
    });
  });

  describe('prop: multiple', () => {
    it('removes selections that no longer exist', async () => {
      function Test() {
        const [items, setItems] = React.useState(['a', 'b', 'c']);
        return (
          <div>
            <Select.Root multiple defaultValue={['a', 'c']}>
              <Select.Trigger data-testid="trigger">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    {items.map((it) => (
                      <Select.Item key={it} value={it}>
                        {it}
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <button
              data-testid="remove-a"
              onClick={() => setItems((prev) => prev.filter((i) => i !== 'a'))}
            >
              Remove A
            </button>
            <button
              data-testid="remove-c"
              onClick={() => setItems((prev) => prev.filter((i) => i !== 'c'))}
            >
              Remove C
            </button>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'a' })).to.have.attribute('data-selected', '');
      });
      expect(screen.getByRole('option', { name: 'c' })).to.have.attribute('data-selected', '');

      // Remove one of the selected items; remaining selection should persist
      await user.click(screen.getByTestId('remove-c'));

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'a' })).to.have.attribute('data-selected', '');
      });
      expect(screen.queryByRole('option', { name: 'c' })).to.equal(null);

      // Remove the last selected item; selection should become empty
      await user.click(screen.getByTestId('remove-a'));

      await user.click(trigger);

      const options = await screen.findAllByRole('option');
      options.forEach((opt) => {
        expect(opt).not.to.have.attribute('data-selected');
      });
    });

    it('should allow multiple selections when multiple is true', async () => {
      const handleValueChange = spy();

      function App() {
        const [value, setValue] = React.useState<any[]>([]);

        return (
          <Select.Root
            multiple
            value={value}
            onValueChange={(newValue) => {
              setValue(newValue);
              handleValueChange(newValue);
            }}
          >
            <Select.Trigger data-testid="trigger">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="a">a</Select.Item>
                  <Select.Item value="b">b</Select.Item>
                  <Select.Item value="c">c</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        );
      }

      const { user } = await render(<App />);

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await flushMicrotasks();

      const optionA = await screen.findByRole('option', { name: 'a' });
      await user.click(optionA);
      await flushMicrotasks();

      expect(handleValueChange.args[0][0]).to.deep.equal(['a']);
      expect(optionA).to.have.attribute('data-selected', '');

      const optionB = screen.getByRole('option', { name: 'b' });
      await user.click(optionB);
      await flushMicrotasks();

      expect(handleValueChange.args[1][0]).to.deep.equal(['a', 'b']);
      expect(optionA).to.have.attribute('data-selected', '');
      expect(optionB).to.have.attribute('data-selected', '');

      expect(screen.getByRole('listbox')).not.to.equal(null);
    });

    it('should deselect items when clicked again in multiple mode', async () => {
      const handleValueChange = spy();

      function App() {
        const [value, setValue] = React.useState(['a', 'b']);

        return (
          <Select.Root
            multiple
            value={value}
            onValueChange={(newValue) => {
              setValue(newValue);
              handleValueChange(newValue);
            }}
          >
            <Select.Trigger data-testid="trigger">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="a">a</Select.Item>
                  <Select.Item value="b">b</Select.Item>
                  <Select.Item value="c">c</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        );
      }

      const { user } = await render(<App />);

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await flushMicrotasks();

      const optionA = await screen.findByRole('option', { name: 'a' });
      const optionB = screen.getByRole('option', { name: 'b' });

      expect(optionA).to.have.attribute('data-selected', '');
      expect(optionB).to.have.attribute('data-selected', '');

      await user.click(optionA);
      await flushMicrotasks();

      expect(handleValueChange.args[0][0]).to.deep.equal(['b']);
      expect(optionA).not.to.have.attribute('data-selected');
      expect(optionB).to.have.attribute('data-selected', '');
    });

    it('keeps the active index on a deselected item in multiple mode', async () => {
      const { user } = await render(
        <Select.Root multiple value={['a']}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
                <Select.Item value="c">c</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);

      const optionB = await screen.findByRole('option', { name: 'b' });

      await user.click(optionB);

      await waitFor(() => {
        expect(optionB).to.have.attribute('data-highlighted');
      });

      await user.click(optionB);

      await waitFor(() => {
        expect(optionB).to.have.attribute('data-highlighted');
      });
    });

    it('should handle defaultValue as array in multiple mode', async () => {
      await render(
        <Select.Root multiple defaultValue={['a', 'c']}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
                <Select.Item value="c">c</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a' })).to.have.attribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'b' })).not.to.have.attribute('data-selected');
      expect(screen.getByRole('option', { name: 'c' })).to.have.attribute('data-selected', '');
    });

    it('should serialize multiple values correctly for form submission', async () => {
      const { container } = await render(
        <Select.Root multiple name="select" value={['a', 'c']}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
                <Select.Item value="c">c</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      // eslint-disable-next-line testing-library/no-container -- No appropriate method on screen since it's a hidden input without any type
      const hiddenInputs = container.querySelectorAll(
        '[name="select"]',
      ) as NodeListOf<HTMLInputElement>;
      expect(hiddenInputs).to.have.length(2);
      const values = Array.from(hiddenInputs).map((input) => input.value);
      expect(values).to.deep.equal(['a', 'c']);
    });

    it('should serialize empty array as empty string in multiple mode', async () => {
      const { container } = await render(
        <Select.Root multiple name="select">
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
                <Select.Item value="c">c</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      // In multiple mode with empty array, no hidden inputs with name should exist
      // eslint-disable-next-line testing-library/no-container -- No appropriate method on screen since it's a hidden input without any type
      const namedHiddenInputs = container.querySelectorAll('[name="select"]');
      expect(namedHiddenInputs).to.have.length(0);

      // But the main input should have the serialized empty value for Field validation purposes
      // eslint-disable-next-line testing-library/no-container -- No appropriate method on screen since it's a hidden input without any type
      const mainInput = container.querySelector<HTMLInputElement>('input[aria-hidden="true"]');
      expect(mainInput).not.to.equal(null);
      expect(mainInput?.value).to.equal('');
    });

    it('does not mark the hidden input as required when selection exists', async () => {
      await render(
        <Select.Root multiple required name="select" value={['a']}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
        </Select.Root>,
      );

      const hiddenInput = screen.getByRole('textbox', { hidden: true });
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput).not.to.have.attribute('required');
    });

    it('keeps the hidden input required when no selection exists', async () => {
      await render(
        <Select.Root multiple required name="select" value={[]}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
        </Select.Root>,
      );

      const hiddenInput = screen.getByRole('textbox', { hidden: true });
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput).to.have.attribute('required');
    });

    it('should not close popup when selecting items in multiple mode', async () => {
      const { user } = await render(
        <Select.Root multiple>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
                <Select.Item value="c">c</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await flushMicrotasks();

      await waitFor(() => {
        expect(screen.getByRole('listbox')).not.to.equal(null);
      });

      const optionA = await screen.findByRole('option', { name: 'a' });
      await user.click(optionA);
      await flushMicrotasks();

      expect(screen.getByRole('listbox')).not.to.equal(null);

      const optionB = screen.getByRole('option', { name: 'b' });
      await user.click(optionB);
      await flushMicrotasks();

      expect(screen.getByRole('listbox')).not.to.equal(null);
    });

    it('should close popup in single select mode', async () => {
      const { user } = await render(
        <Select.Root>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
                <Select.Item value="c">c</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await flushMicrotasks();

      await waitFor(() => {
        expect(screen.getByRole('listbox')).not.to.equal(null);
      });

      const optionA = await screen.findByRole('option', { name: 'a' });
      await user.click(optionA);
      await flushMicrotasks();

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });
    });

    it('should update selected items when value prop changes', async () => {
      const { setProps } = await render(
        <Select.Root multiple value={['a']}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
                <Select.Item value="c">c</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(await screen.findByRole('option', { name: 'a' })).to.have.attribute(
        'data-selected',
        '',
      );
      expect(screen.getByRole('option', { name: 'b' })).not.to.have.attribute('data-selected');

      await setProps({ value: ['a', 'b', 'c'] });

      expect(screen.getByRole('option', { name: 'a' })).to.have.attribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'b' })).to.have.attribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'c' })).to.have.attribute('data-selected', '');
    });
  });

  describe('prop: isItemEqualToValue', () => {
    it('matches object values using the provided comparator', async () => {
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      await render(
        <Select.Root
          value={{ id: 2, name: 'Bob' }}
          itemToStringLabel={(item) => item.name}
          itemToStringValue={(item) => String(item.id)}
          isItemEqualToValue={(item, value) => item.id === value.id}
        >
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                {users.map((user) => (
                  <Select.Item key={user.id} value={user}>
                    {user.name}
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).to.have.text('Bob');

      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Bob' })).to.have.attribute('data-selected', '');
      });
    });

    it('passes item as the first comparator argument in multiple mode', async () => {
      const users = [
        { id: 1, name: 'Alice', source: 'item' },
        { id: 2, name: 'Bob', source: 'item' },
      ];

      await render(
        <Select.Root
          multiple
          defaultOpen
          defaultValue={[{ id: 2, name: 'Bob', source: 'selected' }]}
          itemToStringLabel={(item) => item.name}
          itemToStringValue={(item) => String(item.id)}
          isItemEqualToValue={(item, value) =>
            item.id === value.id && item.source === 'item' && value.source === 'selected'
          }
        >
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                {users.map((user) => (
                  <Select.Item key={user.id} value={user}>
                    {user.name}
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const option = screen.getByRole('option', { name: 'Bob' });
      expect(option).to.have.attribute('data-selected', '');

      fireEvent.click(option);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Bob' })).not.to.have.attribute('data-selected');
      });
    });
  });

  describe('prop: highlightItemOnHover', () => {
    it('highlights an item on mouse move by default', async () => {
      const { user } = await render(
        <Select.Root defaultOpen>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
                <Select.Item value="c">c</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const optionB = screen.getByRole('option', { name: 'b' });
      await user.hover(optionB);

      await waitFor(() => {
        expect(optionB).to.have.attribute('data-highlighted');
      });
    });

    it('does not highlight items from mouse movement when disabled', async () => {
      const { user } = await render(
        <Select.Root defaultOpen highlightItemOnHover={false}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
                <Select.Item value="c">c</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const optionB = screen.getByRole('option', { name: 'b' });
      await user.hover(optionB);

      await flushMicrotasks();

      expect(optionB).not.to.have.attribute('data-highlighted');
    });

    it('does not remove highlight when mousing out of popup when disabled', async () => {
      const { user } = await render(
        <Select.Root defaultOpen highlightItemOnHover={false}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
                <Select.Item value="c">c</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const optionA = screen.getByRole('option', { name: 'a' });
      await user.hover(optionA);

      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(optionA).to.have.attribute('data-highlighted');
      });

      const popup = screen.getByRole('listbox');
      await user.unhover(popup);

      await waitFor(() => {
        expect(optionA).to.have.attribute('data-highlighted');
      });
    });
  });
});
