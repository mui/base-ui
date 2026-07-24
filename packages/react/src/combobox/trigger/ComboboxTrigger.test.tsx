import * as React from 'react';
import { expect, vi } from 'vitest';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { Field } from '@base-ui/react/field';
import { REASONS } from '../../internals/reasons';
import { useComboboxRootContext } from '../root/ComboboxRootContext';

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

    expect(trigger).toHaveAttribute('tabindex', '-1');

    await user.click(input);
    expect(trigger).toHaveAttribute('tabindex', '-1');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('tabindex', '-1');
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
      expect(trigger).toHaveAttribute('disabled');
    });

    it('should inherit disabled state from ComboboxRoot', async () => {
      await render(
        <Combobox.Root disabled>
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveAttribute('disabled');
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
      expect(trigger).toHaveAttribute('disabled');
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

      expect(screen.queryByRole('listbox')).toBe(null);
    });

    it('ignores native keydown events on a disabled non-native trigger', async () => {
      const onOpenChange = vi.fn();
      await render(
        <Combobox.Root onOpenChange={onOpenChange}>
          <Combobox.Trigger disabled nativeButton={false} render={<div />} data-testid="trigger" />
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
        );
      });

      expect(onOpenChange).not.toHaveBeenCalled();
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
      expect(trigger).toHaveAttribute('disabled');
    });
  });

  it.each([
    {
      name: 'single selection',
      control: (
        <Combobox.Root defaultValue="apple">
          <Combobox.Trigger data-testid="trigger" />
        </Combobox.Root>
      ),
      expectedValue: 'apple',
    },
    {
      name: 'no selection',
      control: (
        <Autocomplete.Root defaultValue="query">
          <Autocomplete.Trigger data-testid="trigger" />
        </Autocomplete.Root>
      ),
      expectedValue: 'query',
    },
  ])('validates the $name value when blurred', async ({ control, expectedValue }) => {
    const validate = vi.fn();
    await render(
      <Field.Root validationMode="onBlur" validate={validate}>
        {control}
      </Field.Root>,
    );

    const trigger = screen.getByTestId('trigger');
    fireEvent.focus(trigger);
    fireEvent.blur(trigger);

    expect(validate).toHaveBeenCalledWith(expectedValue, expect.anything());
  });

  it('ignores a pending mouseup after the trigger unmounts', async () => {
    const onOpenChange = vi.fn();

    function Test({ showTrigger }: { showTrigger: boolean }) {
      return (
        <Combobox.Root onOpenChange={onOpenChange}>
          {showTrigger && <Combobox.Trigger data-testid="trigger" />}
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Input />
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      );
    }

    const { rerender } = await render(<Test showTrigger />);
    fireEvent.mouseDown(screen.getByTestId('trigger'));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything()));
    onOpenChange.mockClear();

    await rerender(<Test showTrigger={false} />);

    fireEvent.mouseUp(document.body, { clientX: 100, clientY: 100 });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('does not select when closed typeahead matches a sparse label without a value', async () => {
    const onValueChange = vi.fn();

    function SparseRegistry() {
      const store = useComboboxRootContext();
      useIsoLayoutEffect(() => {
        store.state.labelsRef.current[0] = 'apple';
        delete store.state.valuesRef.current[0];
      }, [store]);
      return null;
    }

    const { user } = await render(
      <Combobox.Root onValueChange={onValueChange}>
        <SparseRegistry />
        <Combobox.Trigger>Open</Combobox.Trigger>
      </Combobox.Root>,
    );

    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await user.keyboard('a');

    expect(onValueChange).not.toHaveBeenCalled();
  });

  describe('prop: readOnly', () => {
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

      expect(screen.queryByRole('listbox')).toBe(null);
    });

    it.each(['ArrowDown', 'ArrowUp'])('does not open on %s when readOnly', async (key) => {
      const onOpenChange = vi.fn();
      const { user } = await render(
        <Combobox.Root readOnly onOpenChange={onOpenChange}>
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Input />
                <Combobox.List>
                  <Combobox.Item value="a">a</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      trigger.focus();
      await user.keyboard(`{${key}}`);

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.queryByRole('listbox')).toBe(null);
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
      expect(await screen.findByRole('listbox')).not.toBe(null);
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
      expect(await screen.findByRole('listbox')).not.toBe(null);

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBe(null);
      });
    });

    it('should call onOpenChange when toggling', async () => {
      const handleOpenChange = vi.fn();
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
        expect(handleOpenChange.mock.calls.length).toBe(1);
      });
      expect(handleOpenChange.mock.calls[0][0]).toBe(true);
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
      expect(screen.getByRole('listbox')).not.toBe(null);
      expect(screen.getByRole('combobox')).toHaveFocus();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).toBe(null);

      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{ArrowUp}');
      expect(screen.queryByRole('listbox')).not.toBe(null);
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
      expect(screen.queryByRole('listbox')).toBe(null);
      await user.keyboard('{ArrowUp}');
      expect(screen.queryByRole('listbox')).toBe(null);
    });

    it('fires with reason trigger-press when Trigger is clicked', async () => {
      const onOpenChange = vi.fn();
      const { user } = await render(
        <Combobox.Root onOpenChange={onOpenChange}>
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
      await user.click(trigger);

      await waitFor(() => {
        expect(onOpenChange.mock.calls.length).toBe(1);
      });
      expect(onOpenChange.mock.lastCall?.[0]).toBe(true);
      expect(onOpenChange.mock.lastCall?.[1].reason).toBe(REASONS.triggerPress);
    });
  });

  describe('drag selection', () => {
    it('commits selection when the input is outside the popup', async () => {
      const handleValueChange = vi.fn();

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
      await waitFor(() => expect(option).toHaveAttribute('data-highlighted'));

      fireEvent.mouseUp(option, { button: 0 });

      await waitFor(() => {
        expect(handleValueChange.mock.calls.length).toBe(1);
      });
      expect(handleValueChange.mock.calls[0][0]).toBe('beta');
    });

    it('commits selection when the input is inside the popup and the pointer is released over an item', async () => {
      const handleValueChange = vi.fn();

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
      await waitFor(() => expect(option).toHaveAttribute('data-highlighted'));

      fireEvent.mouseUp(option, { button: 0 });

      await waitFor(() => {
        expect(handleValueChange.mock.calls.length).toBe(1);
      });
      expect(handleValueChange.mock.calls[0][0]).toBe('beta');
    });

    it.skipIf(isJSDOM)(
      'does not double-commit when a non-primary touch lands on another item',
      async () => {
        const handleValueChange = vi.fn();

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
        const alpha = await screen.findByRole('option', { name: 'Alpha' });
        const beta = await screen.findByRole('option', { name: 'Beta' });

        // Highlight Alpha so a stray drag-select would be able to commit it.
        fireEvent.mouseMove(alpha, { pointerType: 'mouse' });
        await waitFor(() => expect(alpha).toHaveAttribute('data-highlighted'));

        // Primary touch presses Alpha; a second, non-primary touch lands on Beta.
        // Without the `isPrimary` guard the shared ref would flip to Beta, making
        // Alpha's release read as a drag-select and commit once on `mouseup` and
        // again on the following `click`.
        fireEvent.pointerDown(alpha, { pointerType: 'touch', isPrimary: true, button: 0 });
        fireEvent.pointerDown(beta, { pointerType: 'touch', isPrimary: false, button: 0 });
        fireEvent.mouseUp(alpha, { button: 0 });
        fireEvent.click(alpha, { button: 0 });

        await waitFor(() => {
          expect(handleValueChange.mock.calls.length).toBe(1);
        });
        expect(handleValueChange.mock.calls[0][0]).toBe('alpha');
      },
    );

    it.skipIf(isJSDOM)(
      'commits a later drag-select onto an item whose earlier pointerdown never released',
      async () => {
        const handleValueChange = vi.fn();

        const { user } = await render(
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

        // Press an item, then close before any matching `mouseup` arrives. The
        // closed-state effect must clear the shared pointerdown ref, otherwise the
        // stale entry makes the next drag-select onto Alpha read as a same-item tap
        // and never commit.
        fireEvent.pointerDown(trigger, { pointerType: 'mouse', button: 0 });
        fireEvent.mouseDown(trigger, { button: 0 });
        await screen.findByRole('listbox');
        const alpha = await screen.findByRole('option', { name: 'Alpha' });
        fireEvent.pointerDown(alpha, { pointerType: 'touch', isPrimary: true, button: 0 });

        await user.keyboard('{Escape}');
        await waitFor(() => {
          expect(screen.queryByRole('listbox')).toBe(null);
        });

        // Reopen and drag-select onto Alpha (gesture starts on the trigger).
        fireEvent.pointerDown(trigger, { pointerType: 'mouse', button: 0 });
        fireEvent.mouseDown(trigger, { button: 0 });
        await screen.findByRole('listbox');
        const alphaReopened = await screen.findByRole('option', { name: 'Alpha' });
        fireEvent.mouseMove(alphaReopened, { pointerType: 'mouse' });
        await waitFor(() => expect(alphaReopened).toHaveAttribute('data-highlighted'));
        fireEvent.mouseUp(alphaReopened, { button: 0 });

        await waitFor(() => {
          expect(handleValueChange.mock.calls.length).toBe(1);
        });
        expect(handleValueChange.mock.calls[0][0]).toBe('alpha');
      },
    );

    it('does not commit selection if the pointer never hovers the item', async () => {
      const handleValueChange = vi.fn();

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
        expect(handleValueChange.mock.calls.length).toBe(0);
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
        expect(screen.queryByRole('listbox')).toBe(null);
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

      expect(listbox.isConnected).toBe(true);
    });

    it('closes the popup when the release is more than 5px outside the trigger bounds', async () => {
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
        DOMRect.fromRect({ x: 100, y: 100, width: 100, height: 40 });

      fireEvent.pointerDown(trigger, { pointerType: 'mouse', button: 0 });
      fireEvent.mouseDown(trigger, { button: 0 });

      await screen.findByRole('listbox');

      fireEvent.mouseUp(document.body, { button: 0, clientX: 94, clientY: 120 });

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBe(null);
      });
    });
  });

  describe('aria attributes', () => {
    it('sets aria-required attribute when required (input inside popup)', async () => {
      await render(
        <Combobox.Root required>
          <Combobox.Trigger data-testid="trigger" />
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveAttribute('aria-required', 'true');
    });

    it('does not set aria-required attribute when the input is outside the popup', async () => {
      await render(
        <Combobox.Root required>
          <Combobox.Input />
          <Combobox.Trigger data-testid="trigger" />
        </Combobox.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).not.toHaveAttribute('aria-required');
    });

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

      expect(trigger).toHaveAttribute('tabindex', '0');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger).not.toHaveAttribute('aria-controls');
    });

    it('sets all aria attributes on the trigger when open', async () => {
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

      await screen.findByRole('listbox');
      const popup = screen.getByRole('dialog');

      expect(trigger).toHaveAttribute('tabindex', '0');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(popup.id).not.toBe('');
      expect(trigger).toHaveAttribute('aria-controls', popup.id);
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

      expect(trigger).not.toHaveTextContent('apple');

      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('a');

      expect(trigger).toHaveTextContent('apple');
      expect(screen.queryByRole('listbox')).toBe(null);
    });

    it('selects item when typing after the popup has been opened and closed (items prop)', async () => {
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

      // Opening mounts the list (rendered labels overwrite the derived ones) and closing
      // unmounts it, clearing the registered labels. Typeahead must still work afterwards.
      await user.click(trigger);
      await screen.findByRole('listbox');
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBe(null);
      });
      // Focus returns to the trigger asynchronously after close.
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });

      await user.keyboard('b');

      await waitFor(() => {
        expect(trigger).toHaveTextContent('banana');
      });
    });

    it.each([false, true])(
      'cycles to the next matching item when typing after open/close (no items prop, keepMounted %s)',
      async (keepMounted) => {
        const { user } = await render(
          <Combobox.Root defaultValue="apple">
            <Combobox.Trigger data-testid="trigger">
              <Combobox.Value data-testid="value" />
            </Combobox.Trigger>
            <Combobox.Portal keepMounted={keepMounted}>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Item value="apple">apple</Combobox.Item>
                    <Combobox.Item value="apricot">apricot</Combobox.Item>
                    <Combobox.Item value="banana">banana</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>,
        );

        const trigger = screen.getByTestId('trigger');

        await user.click(trigger);
        await screen.findByRole('listbox');
        await user.keyboard('{Escape}');
        await waitFor(() => {
          expect(screen.queryByRole('listbox')).toBe(null);
        });
        await waitFor(() => {
          expect(trigger).toHaveFocus();
        });

        // Typeahead starts matching after the selected item, like a native select.
        await user.keyboard('a');
        await waitFor(() => {
          expect(trigger).toHaveTextContent('apricot');
        });
      },
    );

    it('cycles from the selected item after reordering items while closed (no items prop)', async () => {
      function App() {
        const [order, setOrder] = React.useState(['apple', 'apricot', 'banana']);

        return (
          <div>
            <Combobox.Root defaultValue="apple">
              <Combobox.Trigger data-testid="trigger">
                <Combobox.Value data-testid="value" />
              </Combobox.Trigger>
              <Combobox.Portal>
                <Combobox.Positioner>
                  <Combobox.Popup>
                    <Combobox.List>
                      {order.map((item) => (
                        <Combobox.Item key={item} value={item}>
                          {item}
                        </Combobox.Item>
                      ))}
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
            <button
              type="button"
              data-testid="reorder"
              onClick={() => setOrder(['apricot', 'apple', 'banana'])}
            >
              reorder
            </button>
          </div>
        );
      }

      const { user } = await render(<App />);
      const trigger = screen.getByTestId('trigger');

      // Open and close so the trigger path force-mounts the list.
      await user.click(trigger);
      await screen.findByRole('listbox');
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBe(null);
      });
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });

      // Reorder while closed: apple moves from index 0 to index 1.
      fireEvent.click(screen.getByTestId('reorder'));
      await flushMicrotasks();

      // Typeahead starts after the selected item; from apple it wraps to apricot.
      await user.keyboard('a');
      await waitFor(() => {
        expect(trigger).toHaveTextContent('apricot');
      });
    });

    it('only matches mounted indexed item labels when typing on the focused trigger', async () => {
      function TestComponent() {
        const [showBanana, setShowBanana] = React.useState(true);

        return (
          <Combobox.Root>
            <Combobox.Trigger data-testid="trigger">
              <Combobox.Value />
            </Combobox.Trigger>
            <button type="button" onClick={() => setShowBanana(false)}>
              Remove banana
            </button>
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Item value="apple" index={0}>
                      Apple
                    </Combobox.Item>
                    {showBanana && (
                      <Combobox.Item value="banana" index={1}>
                        Banana
                      </Combobox.Item>
                    )}
                    <Combobox.Item value="blueberry" index={2}>
                      Blueberry
                    </Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user } = await render(<TestComponent />);
      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await screen.findByRole('listbox');

      await user.click(screen.getByRole('button', { name: 'Remove banana' }));
      await waitFor(() => {
        expect(screen.queryByRole('option', { name: 'Banana' })).toBe(null);
      });
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBe(null);
      });

      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('b');

      await waitFor(() => {
        expect(trigger).toHaveTextContent('blueberry');
      });
    });
  });

  describe('data state attributes', () => {
    it.skipIf(isJSDOM)('sets data-popup-side to the current popup side', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple']}>
          <Combobox.Trigger data-testid="trigger">Trigger</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner side="right">
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
      expect(trigger).not.toHaveAttribute('data-popup-side');

      await user.click(trigger);

      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBe(null));
      expect(trigger).toHaveAttribute('data-popup-side', 'right');

      await user.click(document.body);

      await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));
      expect(trigger).not.toHaveAttribute('data-popup-side');
    });

    it('toggles data-list-empty when the filtered list is empty', async () => {
      const { user } = await render(
        <Combobox.Root items={[]}>
          <Combobox.Trigger data-testid="trigger">Trigger</Combobox.Trigger>
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

      await waitFor(() => expect(screen.getByRole('listbox')).not.toBe(null));
      expect(trigger).toHaveAttribute('data-list-empty');
    });

    it('has data-placeholder when no value is selected', async () => {
      await render(
        <Combobox.Root>
          <Combobox.Trigger data-testid="trigger">
            <Combobox.Value placeholder="Select" />
          </Combobox.Trigger>
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
      expect(trigger).toHaveAttribute('data-placeholder');
    });

    it('does not have data-placeholder when value is selected', async () => {
      await render(
        <Combobox.Root defaultValue="a">
          <Combobox.Trigger data-testid="trigger">
            <Combobox.Value placeholder="Select" />
          </Combobox.Trigger>
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
      expect(trigger).not.toHaveAttribute('data-placeholder');
    });

    it('has data-placeholder when multiple mode has empty array', async () => {
      await render(
        <Combobox.Root multiple defaultValue={[]}>
          <Combobox.Trigger data-testid="trigger">
            <Combobox.Value placeholder="Select" />
          </Combobox.Trigger>
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
      expect(trigger).toHaveAttribute('data-placeholder');
    });

    it('does not have data-placeholder when multiple mode has a default value', async () => {
      await render(
        <Combobox.Root multiple defaultValue={['a']}>
          <Combobox.Trigger data-testid="trigger">
            <Combobox.Value placeholder="Select" />
          </Combobox.Trigger>
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
      expect(trigger).not.toHaveAttribute('data-placeholder');
    });
  });

  describe('keyboard: Escape (input-inside-popup pattern)', () => {
    function InsidePopupCombobox(props: {
      defaultValue?: string | string[] | null;
      value?: string | string[] | null;
      multiple?: boolean;
      onValueChange?: (value: any, details: any) => void;
      disabled?: boolean;
      readOnly?: boolean;
      triggerDisabled?: boolean;
    }) {
      const { defaultValue, value, multiple, onValueChange, disabled, readOnly, triggerDisabled } =
        props;
      const items = ['apple', 'banana', 'cherry'];
      return (
        <Combobox.Root
          items={items}
          defaultValue={defaultValue as any}
          value={value as any}
          multiple={multiple as any}
          onValueChange={onValueChange}
          disabled={disabled}
          readOnly={readOnly}
        >
          <Combobox.Trigger data-testid="trigger" disabled={triggerDisabled}>
            <Combobox.Value placeholder="Select a fruit" />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Input data-testid="input" />
                <Combobox.List>
                  {items.map((item) => (
                    <Combobox.Item key={item} value={item}>
                      {item}
                    </Combobox.Item>
                  ))}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      );
    }

    // Positive 1: single-value selected, popup closed, Escape on Trigger clears
    it('clears the selected value when Escape is pressed on Trigger', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(
        <InsidePopupCombobox defaultValue="apple" onValueChange={onValueChange} />,
      );

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{Escape}');

      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange.mock.calls[0][0]).toBe(null);
    });

    // Positive 2: multi-value mode, popup closed, Escape clears to empty array
    it('clears multi-select values to an empty array on Escape', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(
        <InsidePopupCombobox
          multiple
          defaultValue={['apple', 'banana']}
          onValueChange={onValueChange}
        />,
      );

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{Escape}');

      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange.mock.calls[0][0]).toEqual([]);
    });

    // Negative 1: Tab on Trigger does not clear value
    it('does not clear value on Tab', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(
        <InsidePopupCombobox defaultValue="apple" onValueChange={onValueChange} />,
      );

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{Tab}');

      expect(onValueChange).not.toHaveBeenCalled();
    });

    // Negative 2: input-outside-popup pattern is unchanged (Trigger Escape no-op)
    it('does not clear from Trigger when Input is outside the Popup', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(
        <Combobox.Root
          items={['apple', 'banana']}
          defaultValue="apple"
          onValueChange={onValueChange}
        >
          <Combobox.Input data-testid="input" />
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
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

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{Escape}');

      expect(onValueChange).not.toHaveBeenCalled();
    });

    // Negative 3: with the popup open, Escape is handled by the dismiss behavior
    // (it closes the popup); neither the Trigger nor the Input runs its clear branch,
    // so the value is preserved and no change event fires.
    it('does not clear the value from Trigger when the popup is open', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(
        <InsidePopupCombobox defaultValue="apple" onValueChange={onValueChange} />,
      );

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);

      // Popup opens and focus moves to the Input.
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBe(null);
      });

      await user.keyboard('{Escape}');

      // Escape closes the popup...
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBe(null);
      });
      // ...but does not clear the selected value.
      expect(onValueChange).not.toHaveBeenCalled();
    });

    // Edge 1: no value selected, Escape on Trigger is a no-op
    it('is a no-op when no value is selected', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(<InsidePopupCombobox onValueChange={onValueChange} />);

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{Escape}');

      // Nothing to clear: the value is already empty, so no change event fires.
      expect(onValueChange).not.toHaveBeenCalled();
    });

    // Edge 2: Trigger-level disabled blocks the clear
    it('does not clear when Trigger is disabled', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(
        <InsidePopupCombobox defaultValue="apple" onValueChange={onValueChange} triggerDisabled />,
      );

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{Escape}');

      expect(onValueChange).not.toHaveBeenCalled();
    });

    // Edge 3: Root-level disabled blocks the clear
    it('does not clear when Combobox.Root is disabled', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(
        <InsidePopupCombobox defaultValue="apple" onValueChange={onValueChange} disabled />,
      );

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{Escape}');

      expect(onValueChange).not.toHaveBeenCalled();
    });

    // Edge 4: Root-level readOnly blocks the clear
    it('does not clear when Combobox.Root is readOnly', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(
        <InsidePopupCombobox defaultValue="apple" onValueChange={onValueChange} readOnly />,
      );

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{Escape}');

      expect(onValueChange).not.toHaveBeenCalled();
    });

    // Edge 5: controlled value flows through onValueChange with the cleared value
    it('respects controlled value flow when clearing', async () => {
      function Controlled() {
        const [value, setValue] = React.useState<string | null>('apple');
        return (
          <Combobox.Root
            items={['apple', 'banana']}
            value={value}
            onValueChange={(next) => setValue(next as string | null)}
          >
            <Combobox.Trigger data-testid="trigger">
              <Combobox.Value placeholder="pick" />
            </Combobox.Trigger>
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.Input />
                  <Combobox.List>
                    <Combobox.Item value="apple">apple</Combobox.Item>
                    <Combobox.Item value="banana">banana</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user } = await render(<Controlled />);

      const trigger = screen.getByTestId('trigger');
      expect(trigger.textContent).toContain('apple');

      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(trigger.textContent).not.toContain('apple');
      });
    });

    // Edge 6: change-event details carry the escape-key reason
    it('passes REASONS.escapeKey in the change-event details', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(
        <InsidePopupCombobox defaultValue="apple" onValueChange={onValueChange} />,
      );

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{Escape}');

      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange.mock.calls[0][1].reason).toBe(REASONS.escapeKey);
    });

    // Edge 7: controlled inputValue is cleared through the Trigger Escape path,
    // mirroring ComboboxInput so a reopened popup does not show a stale query.
    it('clears a controlled inputValue on Escape', async () => {
      const onInputValueChange = vi.fn();

      function ControlledInputValue() {
        const [value, setValue] = React.useState<string | null>('apple');
        const [inputValue, setInputValue] = React.useState('apple');
        return (
          <Combobox.Root
            items={['apple', 'banana']}
            value={value}
            onValueChange={(next) => setValue(next as string | null)}
            inputValue={inputValue}
            onInputValueChange={(next, details) => {
              onInputValueChange(next, details);
              setInputValue(next);
            }}
          >
            <Combobox.Trigger data-testid="trigger">
              <Combobox.Value placeholder="pick" />
            </Combobox.Trigger>
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.Input data-testid="input" />
                  <Combobox.List>
                    <Combobox.Item value="apple">apple</Combobox.Item>
                    <Combobox.Item value="banana">banana</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user } = await render(<ControlledInputValue />);

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{Escape}');

      expect(onInputValueChange).toHaveBeenCalledTimes(1);
      expect(onInputValueChange.mock.calls[0][0]).toBe('');
      expect(onInputValueChange.mock.calls[0][1].reason).toBe(REASONS.escapeKey);

      // Reopening the popup shows an empty query rather than the stale value.
      await user.click(trigger);
      const input = await screen.findByTestId('input');
      expect(input).toHaveValue('');
    });
  });
});
