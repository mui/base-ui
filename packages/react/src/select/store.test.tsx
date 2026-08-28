import { expect, vi } from 'vitest';
import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Select } from '@base-ui/react/select';
import { useSelectRootContext } from './root/SelectRootContext';
import type { SelectStore } from './store';
import { createChangeEventDetails } from '../internals/createBaseUIEventDetails';
import { REASONS } from '../internals/reasons';

describe('select store synchronization', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  function StoreProbe({ storeRef }: { storeRef: { current: SelectStore | null } }) {
    storeRef.current = useSelectRootContext();
    return null;
  }

  function SynchronizationFixture({
    id,
    modal,
    disabled,
    storeRef,
  }: {
    id: string;
    modal: boolean;
    disabled: boolean;
    storeRef: { current: SelectStore | null };
  }) {
    return (
      <Select.Root id={id} modal={modal} disabled={disabled}>
        <StoreProbe storeRef={storeRef} />
        <Select.Trigger />
      </Select.Root>
    );
  }

  it('publishes synchronized values in a single store transaction', async () => {
    const storeRef: { current: SelectStore | null } = { current: null };
    const { setProps } = await render(
      <SynchronizationFixture id="first" modal disabled={false} storeRef={storeRef} />,
    );

    const store = storeRef.current!;
    const snapshots: Array<{ id: string | undefined; modal: boolean; disabled: boolean }> = [];
    const unsubscribe = store.subscribe((state) => {
      snapshots.push({ id: state.id, modal: state.modal, disabled: state.disabled });
    });

    try {
      await setProps({ id: 'second', modal: false, disabled: true });
    } finally {
      unsubscribe();
    }

    expect(snapshots.some((snapshot) => snapshot.id === 'second' && snapshot.modal)).toBe(false);
    expect(snapshots.some((snapshot) => snapshot.id === 'first' && !snapshot.modal)).toBe(false);
    expect(snapshots.some((snapshot) => snapshot.id === 'second' && !snapshot.disabled)).toBe(
      false,
    );
    expect(snapshots.some((snapshot) => snapshot.id === 'first' && snapshot.disabled)).toBe(false);
    expect(snapshots).toContainEqual({ id: 'second', modal: false, disabled: true });
  });

  it('provides setOpen to a descendant ref callback on the first commit', async () => {
    const handleOpenChange = vi.fn();
    let invoked = false;

    function CommandProbe() {
      const store = useSelectRootContext();

      return (
        <div
          ref={(element) => {
            if (element && !invoked) {
              invoked = true;
              store.context.setOpen(true, createChangeEventDetails(REASONS.none));
            }
          }}
        />
      );
    }

    await render(
      <Select.Root onOpenChange={handleOpenChange}>
        <CommandProbe />
        <Select.Trigger />
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="alpha">alpha</Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    expect(invoked).toBe(true);
    expect(handleOpenChange).toHaveBeenCalled();
    expect(handleOpenChange.mock.calls[0][0]).toBe(true);
  });

  it('synchronizes an updated disabled prop after descendant ref callbacks', async () => {
    const handleValueChange = vi.fn();
    let clickOnUpdate = false;
    let clicked = false;

    function Fixture({ disabled }: { disabled: boolean }) {
      return (
        <Select.Root defaultOpen disabled={disabled} onValueChange={handleValueChange}>
          <Select.Trigger />
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item
                  data-testid="item"
                  value="alpha"
                  ref={(element) => {
                    if (element && clickOnUpdate && !clicked) {
                      clicked = true;
                      element.click();
                    }
                  }}
                >
                  alpha
                </Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      );
    }

    const { setProps, user } = await render(<Fixture disabled={false} />);
    await user.hover(screen.getByTestId('item'));

    clickOnUpdate = true;
    await setProps({ disabled: true });

    // The root synchronizes its props in a layout effect, after descendant ref callbacks run.
    // The item receives the new state in the follow-up render.
    expect(clicked).toBe(true);
    expect(handleValueChange).toHaveBeenCalledTimes(1);
    expect(handleValueChange.mock.calls[0][0]).toBe('alpha');
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
