import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Slider } from '@base-ui/react/slider';
import { useSliderRootContext, useSliderRootPropsContext } from './root/SliderRootContext';
import type { SliderStore } from './store';
import type { SliderRootState } from './root/SliderRoot';

describe('slider store', () => {
  const { render } = createRenderer();

  function StoreProbe({ storeRef }: { storeRef: { current: SliderStore | null } }) {
    storeRef.current = useSliderRootContext();
    return null;
  }

  function StateProbe({ stateRef }: { stateRef: { current: SliderRootState | null } }) {
    stateRef.current = useSliderRootPropsContext().state;
    return null;
  }

  it('publishes external values in a single transaction', async () => {
    const storeRef: { current: SliderStore | null } = { current: null };

    function Fixture({ disabled, max }: { disabled: boolean; max: number }) {
      return (
        <Slider.Root disabled={disabled} max={max}>
          <StoreProbe storeRef={storeRef} />
          <Slider.Control>
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>
      );
    }

    const { setProps } = await render(<Fixture disabled={false} max={100} />);
    const store = storeRef.current!;
    const snapshots: Array<{ disabled: boolean; max: number }> = [];
    const unsubscribe = store.subscribe((storeState) => {
      snapshots.push({
        disabled: storeState.disabled,
        max: storeState.max,
      });
    });

    try {
      await setProps({ disabled: true, max: 200 });
    } finally {
      unsubscribe();
    }

    expect(snapshots.some((snapshot) => snapshot.disabled && snapshot.max === 100)).toBe(false);
    expect(snapshots.some((snapshot) => !snapshot.disabled && snapshot.max === 200)).toBe(false);
    expect(snapshots).toContainEqual({ disabled: true, max: 200 });
  });

  it('synchronizes a controlled value through the store', async () => {
    const storeRef: { current: SliderStore | null } = { current: null };

    function Fixture({ value }: { value: number }) {
      return (
        <Slider.Root value={value}>
          <StoreProbe storeRef={storeRef} />
          <Slider.Control>
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>
      );
    }

    const { setProps } = await render(<Fixture value={10} />);
    const initialValue = storeRef.current!.select('value');
    const initialValues = storeRef.current!.select('values', initialValue, 0, 100);

    await setProps({ value: 40 });

    const value = storeRef.current!.select('value');
    const values = storeRef.current!.select('values', value, 0, 100);
    expect(value).toBe(40);
    expect(values).toEqual([40]);
    expect(values).not.toBe(initialValues);
    expect(screen.getByRole('slider')).toHaveValue('40');
  });

  it('provides commands to descendant ref callbacks on the first commit', async () => {
    const storeRef: { current: SliderStore | null } = { current: null };
    const stateRef: { current: SliderRootState | null } = { current: null };
    let invoked = false;

    function CommandProbe() {
      const store = useSliderRootContext();
      storeRef.current = store;

      return (
        <div
          ref={(element) => {
            if (element && !invoked) {
              invoked = true;
              store.setActive(0);
            }
          }}
        />
      );
    }

    await render(
      <Slider.Root>
        <CommandProbe />
        <StateProbe stateRef={stateRef} />
        <Slider.Control>
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>,
    );

    expect(invoked).toBe(true);
    expect(storeRef.current!.state.interaction.active).toBe(0);
    expect(stateRef.current!.activeThumbIndex).toBe(0);
  });

  it('uses the current disabled prop during descendant ref callbacks', async () => {
    let observeOnUpdate = false;
    let observedDisabled: boolean | undefined;

    function DisabledProbe() {
      const { disabled } = useSliderRootPropsContext();

      return (
        <div
          ref={(element) => {
            if (element && observeOnUpdate) {
              observedDisabled = disabled;
            }
          }}
        />
      );
    }

    function Fixture({ disabled }: { disabled: boolean }) {
      return (
        <Slider.Root disabled={disabled}>
          <DisabledProbe />
        </Slider.Root>
      );
    }

    const { setProps } = await render(<Fixture disabled={false} />);

    observeOnUpdate = true;
    await setProps({ disabled: true });

    expect(observedDisabled).toBe(true);
  });

  it('uses the current controlled value during descendant ref callbacks', async () => {
    let observeOnUpdate = false;
    let observedValue: string | undefined;

    function Fixture({ value }: { value: number }) {
      return (
        <Slider.Root value={value}>
          <Slider.Control>
            <Slider.Thumb
              inputRef={(input) => {
                if (input && observeOnUpdate) {
                  observedValue = input.value;
                }
              }}
            />
          </Slider.Control>
        </Slider.Root>
      );
    }

    const { setProps } = await render(<Fixture value={10} />);

    observeOnUpdate = true;
    await setProps({ value: 40 });

    expect(observedValue).toBe('40');
  });

  it('uses the latest value change callbacks', async () => {
    const initialOnValueChange = vi.fn();
    const initialOnValueCommitted = vi.fn();
    const nextOnValueChange = vi.fn();
    const nextOnValueCommitted = vi.fn();

    function Fixture(props: {
      onValueChange: (value: number | number[]) => void;
      onValueCommitted: (value: number | readonly number[]) => void;
    }) {
      return (
        <Slider.Root defaultValue={0} {...props}>
          <Slider.Control>
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>
      );
    }

    const { setProps, user } = await render(
      <Fixture onValueChange={initialOnValueChange} onValueCommitted={initialOnValueCommitted} />,
    );

    await setProps({
      onValueChange: nextOnValueChange,
      onValueCommitted: nextOnValueCommitted,
    });

    const input = screen.getByRole('slider');
    act(() => input.focus());
    await user.keyboard('[ArrowRight]');

    expect(initialOnValueChange).not.toHaveBeenCalled();
    expect(initialOnValueCommitted).not.toHaveBeenCalled();
    expect(nextOnValueChange).toHaveBeenCalledWith(1, expect.any(Object));
    expect(nextOnValueCommitted).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('keeps the active thumb reset while disabled', async () => {
    const storeRef: { current: SliderStore | null } = { current: null };
    const stateRef: { current: SliderRootState | null } = { current: null };

    await render(
      <Slider.Root disabled>
        <StoreProbe storeRef={storeRef} />
        <StateProbe stateRef={stateRef} />
      </Slider.Root>,
    );

    act(() => {
      storeRef.current!.setActive(0);
    });

    expect(storeRef.current!.state.interaction.active).toBe(-1);
    expect(stateRef.current!.activeThumbIndex).toBe(-1);
  });

  it('resets the active thumb in one transaction when becoming disabled', async () => {
    const storeRef: { current: SliderStore | null } = { current: null };
    const stateRef: { current: SliderRootState | null } = { current: null };

    function Fixture({ disabled }: { disabled: boolean }) {
      return (
        <Slider.Root disabled={disabled}>
          <StoreProbe storeRef={storeRef} />
          <StateProbe stateRef={stateRef} />
        </Slider.Root>
      );
    }

    const { setProps } = await render(<Fixture disabled={false} />);

    act(() => storeRef.current!.setActive(0));

    const snapshots: Array<{ active: number; disabled: boolean }> = [];
    const unsubscribe = storeRef.current!.subscribe((storeState) => {
      snapshots.push({
        active: storeState.interaction.active,
        disabled: storeState.disabled,
      });
    });

    try {
      await setProps({ disabled: true });
    } finally {
      unsubscribe();
    }

    expect(snapshots.some((snapshot) => snapshot.disabled && snapshot.active !== -1)).toBe(false);
    expect(storeRef.current!.state.interaction.active).toBe(-1);
    expect(stateRef.current!.activeThumbIndex).toBe(-1);
  });

  it('publishes interaction state once per command', async () => {
    const storeRef: { current: SliderStore | null } = { current: null };

    await render(
      <Slider.Root>
        <StoreProbe storeRef={storeRef} />
      </Slider.Root>,
    );

    const snapshots: number[] = [];
    const unsubscribe = storeRef.current!.subscribe((storeState) => {
      snapshots.push(storeState.interaction.active);
    });

    try {
      act(() => storeRef.current!.setActive(0));
    } finally {
      unsubscribe();
    }

    expect(snapshots).toEqual([0]);
  });

  it('does not notify public-state subscribers for indicator measurements', async () => {
    const storeRef: { current: SliderStore | null } = { current: null };
    const renderSpy = vi.fn();

    const PublicStateProbe = React.memo(function PublicStateProbe() {
      useSliderRootPropsContext();
      renderSpy();
      return null;
    });

    await render(
      <Slider.Root>
        <StoreProbe storeRef={storeRef} />
        <PublicStateProbe />
      </Slider.Root>,
    );

    const renderCount = renderSpy.mock.calls.length;

    act(() => {
      storeRef.current!.set('indicatorPosition', [25, 75]);
    });

    expect(renderSpy).toHaveBeenCalledTimes(renderCount);
  });
});
