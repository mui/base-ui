import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM, popupConformanceTests } from '#test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';

describe('<Select.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  popupConformanceTests({
    createComponent: (props) => (
      <Select.Root {...props.root}>
        <Select.Trigger {...props.trigger}>
          <Select.Value>Item</Select.Value>
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

  describe('prop: defaultValue', () => {
    it('should select the item by default', async () => {
      await render(
        <Select.Root defaultValue="b">
          <Select.Trigger data-testid="trigger">
            <Select.Value>a</Select.Value>
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
            <Select.Value>a</Select.Value>
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
            <Select.Value>a</Select.Value>
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
            <Select.Value>a</Select.Value>
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
  });

  describe('prop: onValueChange', () => {
    const { render: renderFakeTimers, clock } = createRenderer({
      clockOptions: {
        shouldAdvanceTime: true,
      },
    });

    clock.withFakeTimers();

    it('should call onValueChange when an item is selected', async () => {
      const handleValueChange = spy();

      function App() {
        const [value, setValue] = React.useState('');

        return (
          <Select.Root
            value={value}
            onValueChange={(newValue) => {
              setValue(newValue);
              handleValueChange(newValue);
            }}
          >
            <Select.Trigger data-testid="trigger">
              <Select.Value>a</Select.Value>
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
      clock.tick(200);
      await user.click(option);

      expect(handleValueChange.args[0][0]).to.equal('b');
    });

    it('is not called twice on select', async () => {
      const handleValueChange = spy();

      const { user } = await renderFakeTimers(
        <Select.Root onValueChange={handleValueChange}>
          <Select.Trigger data-testid="trigger">
            <Select.Value>a</Select.Value>
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
      clock.tick(200);
      await user.click(option);

      expect(handleValueChange.callCount).to.equal(1);
    });
  });

  describe('prop: defaultOpen', () => {
    it('should open the select by default', async () => {
      await render(
        <Select.Root defaultOpen>
          <Select.Trigger data-testid="trigger">
            <Select.Value>a</Select.Value>
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
  });

  describe('prop: onOpenChange', () => {
    it('should call onOpenChange when the select is opened or closed', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <Select.Root onOpenChange={handleOpenChange}>
          <Select.Trigger data-testid="trigger">
            <Select.Value>a</Select.Value>
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

  it('should handle browser autofill', async () => {
    const { container } = await render(
      <Select.Root name="select">
        <Select.Trigger data-testid="trigger">
          <Select.Value>a</Select.Value>
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

    fireEvent.change(container.querySelector('[name="select"]')!, { target: { value: 'b' } });

    await flushMicrotasks();

    expect(screen.getByRole('option', { name: 'b', hidden: true })).to.have.attribute(
      'data-selected',
      '',
    );
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
            <Select.Value>a</Select.Value>
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
      expect(trigger).to.have.attribute('aria-disabled', 'true');
      expect(trigger).to.have.attribute('data-disabled');

      await user.keyboard('[Tab]');

      expect(expect(document.activeElement)).to.not.equal(trigger);

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
                <Select.Value>a</Select.Value>
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
      expect(trigger).to.have.attribute('aria-disabled', 'true');
      expect(trigger).to.have.attribute('data-disabled');

      await user.keyboard('[Tab]');

      expect(expect(document.activeElement)).to.not.equal(trigger);

      await user.click(trigger);
      expect(handleOpenChange.callCount).to.equal(0);

      await user.click(screen.getByRole('button', { name: 'toggle' }));

      expect(trigger).to.not.have.attribute('aria-disabled');
      expect(trigger).to.not.have.attribute('data-disabled');

      await user.keyboard('[Tab]');
      expect(trigger).toHaveFocus();

      await user.click(trigger);
      await waitFor(() => {
        expect(handleOpenChange.callCount).to.equal(1);
      });
    });
  });

  describe('prop: id', () => {
    it('sets the id on the hidden input', async () => {
      const { container } = await render(
        <Select.Root id="test-id">
          <Select.Trigger>
            <Select.Value>a</Select.Value>
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

      const input = container.querySelector('input');
      expect(input).to.have.attribute('id', 'test-id');
    });
  });

  describe('with Field.Root parent', () => {
    it('should receive disabled prop from Field.Root', async () => {
      await render(
        <Field.Root disabled>
          <Select.Root>
            <Select.Trigger data-testid="trigger">
              <Select.Value>a</Select.Value>
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
      expect(trigger).to.have.attribute('aria-disabled', 'true');
    });

    it('should receive name prop from Field.Root', async () => {
      await render(
        <Field.Root name="field-select">
          <Select.Root>
            <Select.Trigger data-testid="trigger">
              <Select.Value>a</Select.Value>
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
              <Select.Value data-testid="value">initial</Select.Value>
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

    it('triggers native HTML validation on submit', async () => {
      const { user } = await render(
        <Form>
          <Field.Root name="test" data-testid="field">
            <Select.Root required>
              <Select.Trigger data-testid="trigger">
                <Select.Value>a</Select.Value>
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

    it('clears errors on change', async () => {
      function App() {
        const [errors, setErrors] = React.useState<Record<string, string | string[]>>({
          select: 'test',
        });
        return (
          <Form errors={errors} onClearErrors={setErrors}>
            <Field.Root name="select">
              <Select.Root>
                <Select.Trigger data-testid="trigger">
                  <Select.Value>a</Select.Value>
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
          </Form>
        );
      }

      const { user } = await renderFakeTimers(<App />);

      expect(screen.getByTestId('error')).to.have.text('test');

      const trigger = screen.getByTestId('trigger');
      expect(trigger).to.have.attribute('aria-invalid', 'true');

      await user.click(trigger);
      await flushMicrotasks();

      const option = screen.getByRole('option', { name: 'b' });
      clock.tick(200);
      await user.click(option);

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
      clock.tick(200);

      const option = screen.getByRole('option', { name: 'Option 1' });

      // Arrow Down to focus the Option 1
      await user.keyboard('{ArrowDown}');
      await user.click(option);
      await flushMicrotasks();

      expect(trigger).to.have.attribute('data-dirty', '');
    });

    describe('[data-filled]', () => {
      it('adds [data-filled] attribute when filled', async () => {
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
        clock.tick(200);

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

    it('prop: validate', async () => {
      await render(
        <Field.Root validate={() => 'error'}>
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

    // flaky in real browser
    it.skipIf(!isJSDOM)('prop: validationMode=onChange', async () => {
      const { user } = await render(
        <Field.Root
          validationMode="onChange"
          validate={(value) => {
            return value === '1' ? 'error' : null;
          }}
        >
          <Select.Root>
            <Select.Trigger data-testid="trigger">
              <Select.Value>Select an option</Select.Value>
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

    // flaky in real browser
    it.skipIf(!isJSDOM)('prop: validationMode=onBlur', async () => {
      const { user } = await render(
        <Field.Root
          validationMode="onBlur"
          validate={(value) => {
            return value === '1' ? 'error' : null;
          }}
        >
          <Select.Root>
            <Select.Trigger data-testid="trigger">
              <Select.Value>Select an option</Select.Value>
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
          <Field.Label data-testid="label" render={<span />} />
        </Field.Root>,
      );

      expect(screen.getByTestId('trigger')).to.have.attribute(
        'aria-labelledby',
        screen.getByTestId('label').id,
      );
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
        const [selectedItem, setSelectedItem] = React.useState('a');

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

      expect(screen.queryByRole('option', { name: 'a' })).to.have.attribute('data-selected');
    });
  });

  describe('multiple', () => {
    const { render: renderFakeTimers, clock } = createRenderer({
      clockOptions: {
        shouldAdvanceTime: true,
      },
    });

    clock.withFakeTimers();

    it('should allow selecting multiple items (uncontrolled)', async () => {
      const { user } = await renderFakeTimers(
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

      const optionA = screen.getByRole('option', { name: 'a' });
      const optionB = screen.getByRole('option', { name: 'b' });

      await user.click(optionA);
      expect(optionA).to.have.attribute('data-selected', '');

      expect(screen.getByRole('listbox')).not.to.equal(null);

      await user.click(optionB);
      expect(optionA).to.have.attribute('data-selected', '');
      expect(optionB).to.have.attribute('data-selected', '');

      await user.click(optionA);
      expect(optionA).not.to.have.attribute('data-selected');
      expect(optionB).to.have.attribute('data-selected', '');

      expect(screen.getByRole('listbox')).not.to.equal(null);
    });

    it('should allow selecting multiple items (controlled)', async () => {
      function App() {
        const [value, setValue] = React.useState<string[]>([]);
        return (
          <Select.Root multiple value={value} onValueChange={setValue}>
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

      const { user } = await renderFakeTimers(<App />);
      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await flushMicrotasks();

      const optionA = screen.getByRole('option', { name: 'a' });
      const optionB = screen.getByRole('option', { name: 'b' });

      await user.click(optionA);
      expect(optionA).to.have.attribute('data-selected', '');

      expect(screen.getByRole('listbox')).not.to.equal(null);

      await user.click(optionB);
      expect(optionA).to.have.attribute('data-selected', '');
      expect(optionB).to.have.attribute('data-selected', '');

      expect(screen.getByRole('listbox')).not.to.equal(null);
    });

    it('should submit all selected values in a form (uncontrolled)', async () => {
      let submitted: any = null;
      function App() {
        return (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              submitted = data.getAll('fruits');
            }}
          >
            <Select.Root name="fruits" multiple>
              <Select.Trigger data-testid="trigger">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="apple">Apple</Select.Item>
                    <Select.Item value="banana">Banana</Select.Item>
                    <Select.Item value="mango">Mango</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <button type="submit">Submit</button>
          </form>
        );
      }
      const { user } = await renderFakeTimers(<App />);
      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await flushMicrotasks();
      await user.click(screen.getByRole('option', { name: 'Apple' }));
      await user.click(screen.getByRole('option', { name: 'Mango' }));
      await user.click(screen.getByText('Submit'));

      expect(submitted).to.deep.equal(['apple', 'mango']);
    });

    it('should submit all selected values in a form (controlled)', async () => {
      let submitted: any = null;
      function App() {
        const [value, setValue] = React.useState<string[]>([]);
        return (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              submitted = data.getAll('fruits');
            }}
          >
            <Select.Root name="fruits" multiple value={value} onValueChange={setValue}>
              <Select.Trigger data-testid="trigger">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="apple">Apple</Select.Item>
                    <Select.Item value="banana">Banana</Select.Item>
                    <Select.Item value="mango">Mango</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <button type="submit">Submit</button>
          </form>
        );
      }
      const { user } = await renderFakeTimers(<App />);
      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await flushMicrotasks();

      await user.click(screen.getByRole('option', { name: 'Apple' }));
      await user.click(screen.getByRole('option', { name: 'Banana' }));
      await user.click(screen.getByText('Submit'));

      expect(submitted).to.deep.equal(['apple', 'banana']);
    });
  });
});
