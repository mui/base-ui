import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Slider } from '@base-ui/react/slider';
import { Field } from '@base-ui/react/field';
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
    expect(storeRef.current!.select('value')).toBe(10);

    await setProps({ value: 40 });

    expect(storeRef.current!.select('value')).toBe(40);
    expect(screen.getByRole('slider')).toHaveValue('40');
  });

  it('clamps the value to updated bounds', async () => {
    function Fixture({ max }: { max: number }) {
      return (
        <Slider.Root value={50} max={max}>
          <Slider.Control>
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>
      );
    }

    const { setProps } = await render(<Fixture max={100} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '50');

    await setProps({ max: 30 });

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '30');
  });

  it('renders a NaN value without an update loop', async () => {
    await expect(async () => {
      await render(
        <Slider.Root value={NaN}>
          <Slider.Control>
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>,
      );
    }).toErrorDev(['Received NaN for the `value` attribute.']);

    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('commits once per value change when controlled', async () => {
    const validate = vi.fn(() => null);
    const onValueChange = vi.fn();

    function Fixture() {
      const [value, setValue] = React.useState<number[]>([20, 50]);
      return (
        <Field.Root validate={validate} validationMode="onChange">
          <Slider.Root
            value={value}
            onValueChange={(nextValue) => {
              onValueChange(nextValue);
              setValue(nextValue);
            }}
          >
            <Slider.Control>
              <Slider.Thumb />
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>
      );
    }

    const { user } = await render(<Fixture />);
    const [input] = screen.getAllByRole('slider');
    act(() => input.focus());
    validate.mockClear();

    await user.keyboard('[ArrowRight]');

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledTimes(1);
  });

  it('reports rejected changes against the controlled value', async () => {
    const storeRef: { current: SliderStore | null } = { current: null };
    const onValueChange = vi.fn();

    const { user } = await render(
      <Slider.Root value={0} onValueChange={onValueChange}>
        <StoreProbe storeRef={storeRef} />
        <Slider.Control>
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>,
    );

    const input = screen.getByRole('slider');
    act(() => input.focus());
    await user.keyboard('[ArrowRight]');
    await user.keyboard('[ArrowRight]');

    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange).toHaveBeenNthCalledWith(1, 1, expect.any(Object));
    expect(onValueChange).toHaveBeenNthCalledWith(2, 1, expect.any(Object));
    expect(input).toHaveAttribute('aria-valuenow', '0');
    expect(storeRef.current!.state.value).toBe(0);
  });

  it('falls back to the internal value when the controlled value is removed', async () => {
    const storeRef: { current: SliderStore | null } = { current: null };
    const onValueChange = vi.fn();

    function Fixture({ value }: { value: number | undefined }) {
      return (
        <Slider.Root value={value} onValueChange={onValueChange}>
          <StoreProbe storeRef={storeRef} />
          <Slider.Control>
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>
      );
    }

    const { setProps, user } = await render(<Fixture value={40} />);
    const input = screen.getByRole('slider');
    expect(input).toHaveAttribute('aria-valuenow', '40');

    await expect(async () => {
      await setProps({ value: undefined });
    }).toErrorDev([
      'A component is changing the controlled state of valueProp to be uncontrolled. Elements should not switch from uncontrolled to controlled (or vice versa).',
    ]);

    // Renders the internal (default) value, and commands compute from the same value.
    expect(input).toHaveAttribute('aria-valuenow', '0');
    expect(storeRef.current!.select('value')).toBe(0);

    act(() => input.focus());
    await user.keyboard('[ArrowRight]');

    expect(onValueChange).toHaveBeenCalledWith(1, expect.any(Object));
    expect(input).toHaveAttribute('aria-valuenow', '1');
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
    expect(storeRef.current!.state.active).toBe(0);
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
    const observedValues: string[] = [];

    function Fixture({ value }: { value: number }) {
      return (
        <Slider.Root value={value}>
          <Slider.Control>
            <Slider.Thumb
              inputRef={(input) => {
                if (input && observeOnUpdate) {
                  observedValues.push(input.value);
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

    expect(observedValues[0]).toBe('40');
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

  it('marks the field as touched on keyboard changes', async () => {
    const { user } = await render(
      <Field.Root>
        <Slider.Root data-testid="root">
          <Slider.Control>
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>
      </Field.Root>,
    );

    const root = screen.getByTestId('root');
    const input = screen.getByRole('slider');
    act(() => input.focus());
    expect(root).not.toHaveAttribute('data-touched');

    await user.keyboard('[ArrowRight]');

    expect(root).toHaveAttribute('data-touched', '');
  });

  it('uses the field name on the change event target', async () => {
    const onValueChange = vi
      .fn()
      .mockImplementation((newValue, details) => (details as any).event.target);

    await render(
      <Field.Root name="field-slider">
        <Slider.Root value={3} onValueChange={onValueChange}>
          <Slider.Control>
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>
      </Field.Root>,
    );

    fireEvent.change(screen.getByRole('slider'), { target: { value: 4 } });

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.results[0]?.value).toEqual({ value: 4, name: 'field-slider' });
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

    expect(storeRef.current!.state.active).toBe(-1);
    expect(stateRef.current!.activeThumbIndex).toBe(-1);
  });

  it('resets the active thumb before the disabled commit can be observed', async () => {
    const storeRef: { current: SliderStore | null } = { current: null };
    const stateRef: { current: SliderRootState | null } = { current: null };
    const observed: Array<{ disabled: boolean; active: number }> = [];

    function EffectProbe() {
      const store = useSliderRootContext();
      const { disabled } = useSliderRootPropsContext();
      React.useEffect(() => {
        observed.push({ disabled, active: store.state.active });
      });
      return null;
    }

    function Fixture({ disabled }: { disabled: boolean }) {
      return (
        <Slider.Root disabled={disabled}>
          <StoreProbe storeRef={storeRef} />
          <StateProbe stateRef={stateRef} />
          <EffectProbe />
        </Slider.Root>
      );
    }

    const { setProps } = await render(<Fixture disabled={false} />);

    act(() => storeRef.current!.setActive(0));
    expect(stateRef.current!.activeThumbIndex).toBe(0);
    observed.length = 0;

    await setProps({ disabled: true });

    expect(observed.some((entry) => entry.disabled && entry.active !== -1)).toBe(false);
    expect(observed.at(-1)).toEqual({ disabled: true, active: -1 });
    expect(stateRef.current!.activeThumbIndex).toBe(-1);
  });

  it('publishes interaction state once per command', async () => {
    const storeRef: { current: SliderStore | null } = { current: null };

    await render(
      <Slider.Root>
        <StoreProbe storeRef={storeRef} />
      </Slider.Root>,
    );

    const snapshots: Array<{ active: number; lastUsedThumbIndex: number }> = [];
    const unsubscribe = storeRef.current!.subscribe((storeState) => {
      snapshots.push({
        active: storeState.active,
        lastUsedThumbIndex: storeState.lastUsedThumbIndex,
      });
    });

    try {
      act(() => storeRef.current!.setActive(0));
      act(() => storeRef.current!.setActive(-1));
    } finally {
      unsubscribe();
    }

    expect(snapshots).toEqual([
      { active: 0, lastUsedThumbIndex: 0 },
      { active: -1, lastUsedThumbIndex: 0 },
    ]);
  });

  it('does not re-render the root for indicator measurements', async () => {
    const storeRef: { current: SliderStore | null } = { current: null };
    const rootRenders = vi.fn();

    await render(
      <Slider.Root
        render={(props) => {
          rootRenders();
          return <div {...props} />;
        }}
      >
        <StoreProbe storeRef={storeRef} />
      </Slider.Root>,
    );

    const store = storeRef.current!;
    const renderCount = rootRenders.mock.calls.length;
    const notifications = vi.fn();
    const unsubscribe = store.subscribe(notifications);

    try {
      act(() => store.setIndicatorPosition(0, 25));
      act(() => store.setIndicatorPosition(0, 25));
    } finally {
      unsubscribe();
    }

    expect(notifications).toHaveBeenCalledTimes(1);
    expect(store.state.indicatorPosition).toEqual([25, undefined]);
    expect(rootRenders).toHaveBeenCalledTimes(renderCount);
  });
});
