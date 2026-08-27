import { expect, vi } from 'vitest';
import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { useStore } from '@base-ui/utils/store';
import { useComboboxRootContext } from './root/ComboboxRootContext';
import { selectors, type ComboboxStore } from './store';

/**
 * Characterization tests for how `AriaCombobox` synchronizes external values into the store.
 *
 * These pin the *current* behavior so the state/context split and the synchronization rewrite can
 * be proven not to change it. They intentionally assert mechanism (transaction shape, timing)
 * rather than user-visible output, because that is precisely what the refactor is at risk of
 * changing invisibly.
 */
describe('combobox store synchronization', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  // The default renderer wraps in `React.StrictMode`, which double-renders and makes a raw render
  // count meaningless. The non-strict renderer is used only where the count itself is the subject.
  const { render, renderToString } = createRenderer();
  const { render: renderNonStrict } = createRenderer({ strict: false });

  function StoreProbe({ storeRef }: { storeRef: { current: ComboboxStore | null } }) {
    storeRef.current = useComboboxRootContext();
    return null;
  }

  /**
   * `selectionMode` is always `'none'` for `Autocomplete.Root`, and rendering the input inside the
   * positioner makes `inputInsidePopup` true. That is the configuration where the root's
   * `inputOwnsFormValue` formula disagrees with the one `ComboboxInput` writes from its ref
   * callback, so it is the only place the synchronization transaction is observable.
   */
  function InlineOwnershipFixture({
    inline,
    storeRef,
    children,
  }: {
    inline: boolean;
    storeRef: { current: ComboboxStore | null };
    children?: React.ReactNode;
  }) {
    return (
      <Autocomplete.Root items={['alpha', 'beta']} inline={inline} name="search">
        <StoreProbe storeRef={storeRef} />
        {children}
        <Autocomplete.Trigger data-testid="trigger" />
        <Autocomplete.Portal keepMounted>
          <Autocomplete.Positioner>
            <Autocomplete.Popup>
              <Autocomplete.Input data-testid="popup-input" />
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
    );
  }

  it('publishes an inline transition in a single store transaction', async () => {
    const storeRef: { current: ComboboxStore | null } = { current: null };

    // `keepMounted` is required: a closed `Combobox.Portal` renders `null`, so without it the
    // popup input never mounts, its ref callback never runs, and the test would pass vacuously.
    const { setProps } = await render(
      <InlineOwnershipFixture inline={false} storeRef={storeRef} />,
    );

    const store = storeRef.current!;

    const snapshots: Array<{ inline: boolean; inputOwnsFormValue: boolean }> = [];
    const unsubscribe = store.subscribe((state) => {
      snapshots.push({ inline: state.inline, inputOwnsFormValue: state.inputOwnsFormValue });
    });

    try {
      await setProps({ inline: true });
    } finally {
      unsubscribe();
    }

    // Splitting the synchronization into two writes would publish this intermediate snapshot.
    expect(snapshots.some((snapshot) => snapshot.inline && !snapshot.inputOwnsFormValue)).toBe(
      false,
    );

    const changed = snapshots.filter(
      (snapshot, index) =>
        index === 0 ||
        snapshot.inline !== snapshots[index - 1].inline ||
        snapshot.inputOwnsFormValue !== snapshots[index - 1].inputOwnsFormValue,
    );

    expect(changed).toHaveLength(1);
  });

  it('never exposes a torn inline/ownership pair to subscribers', async () => {
    const storeRef: { current: ComboboxStore | null } = { current: null };
    const observed: string[] = [];

    // Memoized so the parent's re-render does not count as a subscription re-render.
    const OwnershipProbe = React.memo(function OwnershipProbe() {
      const store = useComboboxRootContext();
      const inline = useStore(store, selectors.inline);
      const inputOwnsFormValue = useStore(store, selectors.inputOwnsFormValue);
      observed.push(`${inline}:${inputOwnsFormValue}`);
      return null;
    });

    const { setProps } = await renderNonStrict(
      <InlineOwnershipFixture inline={false} storeRef={storeRef}>
        <OwnershipProbe />
      </InlineOwnershipFixture>,
    );

    observed.length = 0;
    await setProps({ inline: true });

    // The `useStore` path must never surface the state the root and `ComboboxInput` disagree on.
    expect(observed).not.toContain('true:false');
    expect(observed[observed.length - 1]).toBe('true:true');
  });

  it('exposes real commands to a descendant ref callback on the first commit', async () => {
    // The vulnerable window is *during* commit, before ancestor layout effects run. A user
    // interaction happens after commit and cannot reach it, so the probe fires from a ref
    // callback. `Combobox.Trigger`'s ArrowDown handler reads the `setOpen` command off the store
    // at call time, so this exercises the earliest moment a part can invoke one — without naming
    // where the command is stored.
    const handleOpenChange = vi.fn();
    let dispatched = false;

    function EarliestCommandProbe() {
      return (
        <Autocomplete.Trigger
          data-testid="trigger"
          ref={(element: HTMLElement | null) => {
            if (element && !dispatched) {
              dispatched = true;
              element.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
              );
            }
          }}
        />
      );
    }

    await render(
      <Autocomplete.Root items={['alpha', 'beta']} onOpenChange={handleOpenChange}>
        <EarliestCommandProbe />
        <Autocomplete.Portal>
          <Autocomplete.Positioner>
            <Autocomplete.Popup>
              <Autocomplete.Input />
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>,
    );

    expect(dispatched).toBe(true);
    expect(handleOpenChange).toHaveBeenCalled();
    expect(handleOpenChange.mock.calls[0][0]).toBe(true);
  });

  it('keeps form value ownership stable under StrictMode double-rendering', async () => {
    const storeRef: { current: ComboboxStore | null } = { current: null };

    // `render` is the StrictMode renderer, so this exercises callback-ref replay and the
    // double-invoked render that re-runs the root's context assignment.
    await render(<InlineOwnershipFixture inline={false} storeRef={storeRef} />);

    const store = storeRef.current!;

    expect(store.state.inputInsidePopup).toBe(true);
    expect(store.state.inputOwnsFormValue).toBe(false);
    expect(screen.getByTestId('popup-input')).not.toHaveAttribute('name');
  });

  it('keeps combobox aria attributes across hydration', async () => {
    const { hydrate } = await renderToString(
      <Autocomplete.Root items={['alpha', 'beta']}>
        <Autocomplete.Input data-testid="input" />
        <Autocomplete.Portal>
          <Autocomplete.Positioner />
        </Autocomplete.Portal>
      </Autocomplete.Root>,
    );

    const serverInput = screen.getByTestId('input');
    expect(serverInput).toHaveAttribute('role', 'combobox');
    expect(serverInput).toHaveAttribute('aria-expanded', 'false');

    hydrate();

    const clientInput = screen.getByTestId('input');
    expect(clientInput).toHaveAttribute('role', 'combobox');
    expect(clientInput).toHaveAttribute('aria-expanded', 'false');
  });
});
