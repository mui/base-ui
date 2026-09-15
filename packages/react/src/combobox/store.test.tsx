import { expect, vi, describe, beforeEach, it } from 'vitest';
import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { useComboboxRootContext } from './root/ComboboxRootContext';
import type { ComboboxStore } from './store';

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

  const { render, renderToString } = createRenderer();

  /**
   * Every rendered control carrying the form name. Queried by attribute rather than by role
   * because the controls that can carry it span three shapes: the visible `combobox` input, the
   * visually hidden `textbox`, and the `type="hidden"` inputs that `multiple` mode renders, which
   * expose no role at all.
   */
  function namedControls(name: string) {
    return Array.from(document.querySelectorAll(`[name="${name}"]`));
  }

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
    withPopupInput = true,
  }: {
    inline: boolean;
    storeRef: { current: ComboboxStore | null };
    children?: React.ReactNode;
    withPopupInput?: boolean;
  }) {
    return (
      <Autocomplete.Root items={['alpha', 'beta']} inline={inline} name="search">
        <StoreProbe storeRef={storeRef} />
        {children}
        <Autocomplete.Trigger data-testid="trigger" />
        <Autocomplete.Portal keepMounted>
          <Autocomplete.Positioner>
            <Autocomplete.Popup>
              {withPopupInput && <Autocomplete.Input data-testid="popup-input" />}
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

    // Catches a forward split (inline published before ownership).
    expect(snapshots.some((snapshot) => snapshot.inline && !snapshot.inputOwnsFormValue)).toBe(
      false,
    );

    // Catches a reverse-order split (ownership published before inline), which the assertion
    // above cannot see. Both assertions are load-bearing; neither subsumes the other.
    //
    // The projections are deduplicated on purpose: this transition legitimately emits three
    // notifications, one from the synchronization effect and two more from prop-bag identity
    // churn on the same re-render. Asserting a raw notification count fails on correct code.
    const changed = snapshots.filter(
      (snapshot, index) =>
        index === 0 ||
        snapshot.inline !== snapshots[index - 1].inline ||
        snapshot.inputOwnsFormValue !== snapshots[index - 1].inputOwnsFormValue,
    );

    expect(changed).toHaveLength(1);
  });

  it('settles inputOwnsFormValue through the useStore path when inline is set', async () => {
    const storeRef: { current: ComboboxStore | null } = { current: null };
    const observed: string[] = [];

    // Memoized so it re-renders from its own store subscription, not from the parent.
    const OwnershipProbe = React.memo(function OwnershipProbe() {
      const store = useComboboxRootContext();
      const inline = store.useState('inline');
      const inputOwnsFormValue = store.useState('inputOwnsFormValue');
      observed.push(`${inline}:${inputOwnsFormValue}`);
      return null;
    });

    const { setProps } = await render(
      <InlineOwnershipFixture inline={false} storeRef={storeRef}>
        <OwnershipProbe />
      </InlineOwnershipFixture>,
    );

    observed.length = 0;
    await setProps({ inline: true });

    // This does NOT detect a split transaction: React batches the two listener sweeps, so
    // `useStore` re-reads only the settled snapshot either way. Transaction shape is guarded by
    // the test above, which subscribes to the store directly. What this pins is that the
    // subscription path converges on the value the root computes, not the one `ComboboxInput`
    // wrote from its ref callback.
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

  it('gives form value ownership to the hidden input when the input is inside the popup', async () => {
    const storeRef: { current: ComboboxStore | null } = { current: null };

    // `render` is the StrictMode renderer, so this exercises callback-ref replay and the
    // double-invoked render that re-runs the root's context assignment.
    const { setProps } = await render(
      <InlineOwnershipFixture inline={false} storeRef={storeRef} />,
    );

    const store = storeRef.current!;

    expect(store.state.inputInsidePopup).toBe(true);
    expect(store.state.inputOwnsFormValue).toBe(false);
    // Ownership is a two-sided invariant: asserting only that the popup input lacks the name
    // would still pass if the name were dropped from both controls and the form submitted
    // nothing at all.
    expect(screen.getByTestId('popup-input')).not.toHaveAttribute('name');
    expect(namedControls('search')).toHaveLength(1);
    expect(namedControls('search')[0]).toHaveAttribute('aria-hidden', 'true');

    // Unmounting and remounting the popup input replays its ref callback, which is the other
    // writer of `inputOwnsFormValue`.
    await setProps({ withPopupInput: false });
    expect(namedControls('search')).toHaveLength(1);

    await setProps({ withPopupInput: true });
    expect(store.state.inputOwnsFormValue).toBe(false);
    expect(screen.getByTestId('popup-input')).not.toHaveAttribute('name');
    expect(namedControls('search')).toHaveLength(1);
    expect(namedControls('search')[0]).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps form value ownership across hydration', async () => {
    // The complementary configuration to the test above: the input is not inside a popup, so it
    // owns the form value itself. The existing SSR suite already covers the ARIA attributes
    // (`ComboboxRoot.test.tsx`), so this asserts the ownership that survives into hydration.
    const { hydrate } = await renderToString(
      <Autocomplete.Root items={['alpha', 'beta']} name="search">
        <Autocomplete.Input data-testid="input" />
        <Autocomplete.Portal>
          <Autocomplete.Positioner />
        </Autocomplete.Portal>
      </Autocomplete.Root>,
    );

    expect(screen.getByTestId('input')).toHaveAttribute('role', 'combobox');
    expect(namedControls('search')).toHaveLength(1);
    expect(namedControls('search')[0]).toBe(screen.getByTestId('input'));

    hydrate();

    expect(screen.getByTestId('input')).toHaveAttribute('role', 'combobox');
    expect(namedControls('search')).toHaveLength(1);
    expect(namedControls('search')[0]).toBe(screen.getByTestId('input'));
  });
});
