'use client';
import * as React from 'react';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useOnFirstRender } from '@base-ui/utils/useOnFirstRender';
import { usePreviousValue } from '@base-ui/utils/usePreviousValue';
import { warn } from '@base-ui/utils/warn';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '@base-ui/utils/empty';
import {
  useClick,
  useDismiss,
  useFloatingRootContext,
  useListNavigation,
  useTypeahead,
} from '../../floating-ui-react';
import {
  SelectFloatingContext,
  SelectRootContext,
  SelectRootPropsContext,
  type SelectRootPropsContextValue,
} from './SelectRootContext';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useRegisterFieldControl } from '../../internals/field-register-control/useRegisterFieldControl';
import { useLabelableId } from '../../internals/labelable-provider/useLabelableId';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import { selectors, type SelectStoreContext, type State as StoreState } from '../store';
import {
  type BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { useDisabledIndex } from '../../internals/list/useDisabledIndex';
import { shouldScrollItemIntoView } from '../../internals/list/scrollActivation';
import { useFormContext } from '../../internals/form-context/FormContext';
import { type Group, stringifyAsLabel, stringifyAsValue } from '../../internals/resolveValueLabel';
import {
  defaultItemEquality,
  findItemIndex,
  findSelectionIndex,
  isSelectedValueDirty,
} from '../../internals/itemEquality';
import { useValueChanged } from '../../internals/useValueChanged';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { getMaxScrollOffset, normalizeScrollOffset } from '../../utils/scrollEdges';
import { FOCUSABLE_POPUP_PROPS } from '../../utils/popups';
import { mergeProps } from '../../merge-props';
import { NOOP } from '../../internals/noop';
import {
  createListVirtualizationRegistry,
  type RegisteredVirtualizer,
} from '../../internals/virtualization/ListVirtualizationRegistry';
import { SelectVirtualizationContext } from './SelectVirtualizationContext';
import {
  ListVirtualizationOwnerContext,
  type ListVirtualizationOwner,
} from '../../internals/virtualization/ListVirtualizationHostContext';
import { getSelectCollection, getSelectItemLabel } from '../utils/getSelectCollection';
import { getItemValue } from '../../internals/resolveValueLabel';

/**
 * Names the part a `<Virtualizer>` must be placed in. Published at the root, so one put anywhere
 * else in the tree — where it needs no host if it carries its own `items` — is still reported.
 */
const VIRTUALIZATION_OWNER: ListVirtualizationOwner = {
  componentName: 'Select',
  listPartName: 'Select.List',
};

/**
 * Groups all parts of the select.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectRoot<Value, Multiple extends boolean | undefined = false>(
  props: SelectRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const {
    id,
    value: valueProp,
    defaultValue = null,
    onValueChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    name: nameProp,
    form,
    autoComplete,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    modal = true,
    actionsRef,
    inputRef,
    onOpenChangeComplete,
    items,
    multiple = false,
    itemToStringLabel,
    itemToStringValue,
    isItemDisabled,
    isItemEqualToValue = defaultItemEquality,
    highlightItemOnHover = true,
    children,
  } = props;

  const { clearErrors } = useFormContext();
  const {
    setDirty,
    setTouched,
    setFocused,
    validityData,
    setFilled,
    name: fieldName,
    disabled: fieldDisabled,
    validation,
    validationMode,
  } = useFieldRootContext();

  const generatedId = useLabelableId({ id });

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: multiple ? (defaultValue ?? EMPTY_ARRAY) : defaultValue,
    name: 'Select',
    state: 'value',
  });

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'Select',
    state: 'open',
  });

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const scrollHandlerRef = React.useRef<((el: HTMLDivElement) => void) | null>(null);
  const scrollArrowsMountedCountRef = React.useRef(0);
  const valueRef = React.useRef<HTMLSpanElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const typingRef = React.useRef(false);
  const firstItemTextRef = React.useRef<HTMLElement | null>(null);
  const selectedItemTextRef = React.useRef<HTMLElement | null>(null);
  const selectionRef = React.useRef({
    allowSelectedMouseUp: false,
    allowUnselectedMouseUp: false,
    dragY: 0,
  });
  const alignItemWithTriggerActiveRef = React.useRef(false);
  const initialValueRef = React.useRef(value);
  const keyboardActiveRef = React.useRef(false);
  const virtualizationRegistry = useRefWithInit(createListVirtualizationRegistry).current;

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  const { openMethod, triggerProps: interactionTypeProps } = useOpenInteractionType(open);

  const store = useRefWithInit(
    () =>
      new ReactStore<StoreState, SelectStoreContext, typeof selectors>(
        {
          id: generatedId,
          labelId: undefined,
          modal,
          multiple,
          itemToStringLabel,
          itemToStringValue,
          isItemDisabled,
          isItemEqualToValue,
          value,
          open,
          mounted,
          transitionStatus,
          items,
          forceMount: false,
          openMethod: null,
          activeIndex: null,
          highlightType: 'none',
          selectedIndex: null,
          popupProps: EMPTY_OBJECT,
          triggerProps: EMPTY_OBJECT,
          triggerElement: null,
          positionerElement: null,
          listElement: null,
          popupSide: null,
          scrollUpArrowVisible: false,
          scrollDownArrowVisible: false,
          hasScrollArrows: false,
        },
        {
          setValue: NOOP,
          setOpen: NOOP,
          setActiveIndex: NOOP,
          handleScrollArrowVisibility: NOOP,
          onOpenChangeComplete: NOOP,
          componentName: 'Select',
          virtualizationRegistry,
          keyboardActiveRef,
          listRef,
          popupRef,
          scrollHandlerRef,
          scrollArrowsMountedCountRef,
          valueRef,
          valuesRef,
          labelsRef,
          typingRef,
          selectionRef,
          firstItemTextRef,
          selectedItemTextRef,
          alignItemWithTriggerActiveRef,
          initialValueRef,
        },
        selectors,
      ),
  ).current;

  /**
   * The registered virtualizer, held in React state so parts that choose props from it re-render
   * before paint. Effects read `virtualizationRegistry.virtualizer` instead — layout effects run
   * child-first, so registration is already visible to them on the commit that performs it, while
   * this value is still one render behind.
   */
  const [registeredVirtualizer, setRegisteredVirtualizer] =
    React.useState<RegisteredVirtualizer | null>(null);
  const handleVirtualizerChange = useStableCallback((virtualizer: RegisteredVirtualizer | null) => {
    setRegisteredVirtualizer(virtualizer);
  });
  useOnFirstRender(() => {
    virtualizationRegistry.onVirtualizerChange = handleVirtualizerChange;
  });

  /**
   * The collection the built-in virtualizer windows. A flat array keeps its identity, so the
   * engine's per-row geometry survives renders that did not change the items.
   */
  const collection = React.useMemo(() => getSelectCollection(items), [items]);

  const projectedValuesCacheRef = React.useRef<{
    collection: ReadonlyArray<unknown>;
    values: any[];
  } | null>(null);
  const itemToStringLabelRef = useValueAsRef(itemToStringLabel);
  const deriveItemLabel = useStableCallback((item: unknown) =>
    getSelectItemLabel(item, itemToStringLabelRef.current),
  );

  const activeIndex = store.useState('activeIndex');
  const selectedIndex = store.useState('selectedIndex');
  const triggerElement = store.useState('triggerElement');
  const positionerElement = store.useState('positionerElement');

  /**
   * The selected index as `useListNavigation` sees it, held still between collection changes.
   *
   * The hook re-runs its "bring the selected item into view" effect on every `selectedIndex` change
   * while open (`useListNavigation.ts:387-406`, with `forceScrollIntoView`). A static list never
   * changes it while open, so that only ever fired once; a virtualized one keeps it current for the
   * whole collection, which would turn each selection change into a jump to whichever value happens
   * to be last — the one the user just deselected, for instance.
   *
   * Committed state rather than a ref read during render, for two reasons. `Store.set` ignores an
   * unchanged value, so a pin written to a ref would never reach the hooks on a boundary where the
   * index happens to be numerically the same as before. And a ref advanced during render can be
   * moved by a render React then discards.
   *
   * `null` means no pin: the raw `selectedIndex` is passed through, which is what a static list
   * always gets. A pin carries the collection it was computed for, so "nothing is selected" is
   * `{ index: null }` and is distinct from having no pin at all.
   */
  const [navigationPin, setNavigationPin] = React.useState<{
    collection: ReadonlyArray<unknown>;
    index: number | null;
  } | null>(null);

  const navigationSelectedIndex = navigationPin == null ? selectedIndex : navigationPin.index;

  const previousOpenMethod = usePreviousValue(openMethod);
  const renderedOpenMethod = openMethod ?? previousOpenMethod;

  const serializedValue = React.useMemo(() => {
    // In multiple mode the shared input is nameless; per-value entries are submitted via
    // `hiddenInputs`. Its value is therefore irrelevant, and passing the whole array to
    // `stringifyAsValue` would invoke a user `itemToStringValue` with an array it doesn't expect.
    if (multiple) {
      return '';
    }
    return stringifyAsValue(value, itemToStringValue);
  }, [multiple, value, itemToStringValue]);

  const fieldStringValue = React.useMemo(() => {
    if (multiple && Array.isArray(value)) {
      return value.map((currentValue) => stringifyAsValue(currentValue, itemToStringValue));
    }
    return stringifyAsValue(value, itemToStringValue);
  }, [multiple, value, itemToStringValue]);

  const controlRef = useValueAsRef(triggerElement);
  const getStringifiedValueForForm = useStableCallback(() => fieldStringValue);

  useRegisterFieldControl(
    controlRef,
    generatedId,
    value,
    getStringifiedValueForForm,
    !disabled,
    nameProp,
  );

  // Mirror the `hasSelectedValue` store selector so the Field's filled state agrees with the
  // trigger/value placeholder semantics (a value serializing to `''` counts as empty).
  const hasSelectedValue = multiple
    ? Array.isArray(value) && value.length > 0
    : value != null && serializedValue !== '';

  useIsoLayoutEffect(() => {
    setFilled(hasSelectedValue);
  }, [hasSelectedValue, setFilled]);

  useIsoLayoutEffect(
    function prefillVirtualizedMetadata() {
      // Only a registered virtualizer hands collection ownership to the root. Read live rather
      // than from `registeredVirtualizer`: this effect runs after the virtualizer's own, so on the
      // commit that registers it the state has not been applied yet.
      if (virtualizationRegistry.virtualizer == null) {
        return undefined;
      }

      // A windowed list leaves most items unmounted, so they cannot register their own value or
      // label. Deriving both from `items` keeps selection, typeahead, and autofill working across
      // the whole collection, and keeps a row scrolling out of the window from deleting them.
      // Values depend only on the collection, so they are reused when the effect re-runs because
      // `itemToStringLabel` changed identity — which the documented inline form does on every
      // render of the component that renders the root. Labels are the half that must re-derive.
      let values = projectedValuesCacheRef.current;
      if (values == null || values.collection !== collection.items) {
        values = { collection: collection.items, values: collection.items.map(getItemValue) };
        projectedValuesCacheRef.current = values;
      }
      const labels = collection.items.map(deriveItemLabel);

      if (process.env.NODE_ENV !== 'production') {
        const emptyLabelIndex = labels.findIndex(
          (label, index) =>
            label === '' &&
            collection.items[index] != null &&
            typeof collection.items[index] === 'object',
        );
        if (emptyLabelIndex !== -1 && itemToStringLabelRef.current == null) {
          warn(
            `The item at index ${emptyLabelIndex} has no label, so typeahead cannot match it. ` +
              'Give items a `label` property, or pass `itemToStringLabel` to <Select.Root>.',
          );
        }
      }

      valuesRef.current = values.values;
      labelsRef.current = labels;

      return () => {
        // Only reset the array this effect assigned. After a virtualized→static handover the static
        // items re-write their entries from their own effects once their indices settle, so clearing
        // the array this effect owns does not strand them; clearing an array a later owner has since
        // installed would.
        if (valuesRef.current === values.values) {
          valuesRef.current = [];
        }
        if (labelsRef.current === labels) {
          labelsRef.current = [];
        }

        // Once ownership really ends, static items write into the array this cache is holding —
        // `SelectItem` assigns into whatever `valuesRef` points at. Reusing it on a later
        // registration with the same `items` would serve a projection somebody else has edited.
        // A re-run for a changed `itemToStringLabel` keeps the entry, which is what it exists for.
        if (virtualizationRegistry.virtualizer == null) {
          projectedValuesCacheRef.current = null;
        }
      };
    },
    // `itemToStringLabel` is a dependency because the labels it produced are cached in `labelsRef`:
    // dropping it would leave typeahead matching the previous locale's strings indefinitely. The
    // docs ask for a stable callback for that reason — an unstable one re-derives every label on
    // each render of the component that renders the root.
    [
      collection,
      deriveItemLabel,
      itemToStringLabel,
      itemToStringLabelRef,
      registeredVirtualizer,
      virtualizationRegistry,
    ],
  );

  useIsoLayoutEffect(
    function syncSelectedIndex() {
      const nextIndex = findSelectionIndex(valuesRef.current, value, isItemEqualToValue, multiple);

      if (nextIndex === null) {
        selectedItemTextRef.current = null;
      }

      // A static list defers this while open: mounted items own `selectedIndex`, and moving it
      // under an open popup would drag list navigation's selected item with it. A virtualized list
      // has no such owner — most items are unmounted — so the root keeps it current instead.
      if (open && virtualizationRegistry.virtualizer == null) {
        return;
      }

      store.set('selectedIndex', nextIndex);
    },
    [
      multiple,
      open,
      value,
      isItemEqualToValue,
      store,
      // The root owns `selectedIndex` while virtualized, so a replaced collection has to re-run
      // this: no mounted item is left to correct it.
      collection,
      registeredVirtualizer,
      virtualizationRegistry,
    ],
  );

  // The collection the last owned prune ran against, or `null` until an owned session has seen a
  // non-empty one. The first collection's exemption is keyed to identity rather than to a run
  // counter: this effect also re-runs when the registered handle changes identity (the commit after
  // a registration lands, and every `enabled` toggle) and when `value` or the comparer changes, and
  // none of those replaces the collection. The static path prunes only from a map change, and the
  // only map change a windowed list has is the collection itself being replaced — so a re-run
  // against the collection this session was handed is exempt just as its first sighting was. The
  // navigation pin above keys on the same `collection.items` identity for the same reason.
  const lastPrunedCollectionRef = React.useRef<ReadonlyArray<unknown> | null>(null);

  useIsoLayoutEffect(
    function pruneVirtualizedSelection() {
      // The static path prunes from `onMapChange`, which fires whenever the mounted set changes —
      // for a windowed list that is every scroll commit, and each one costs a full-collection scan
      // per selected value. Here it is keyed on the things that can actually invalidate a
      // selection, and runs after the prefill, so `valuesRef` already describes the new collection.
      if (virtualizationRegistry.virtualizer == null) {
        lastPrunedCollectionRef.current = null;
        return;
      }

      const values = valuesRef.current;

      // An empty projection is a collection that has not arrived — async items, or a refetch under
      // an open popup — not one the selection has left. Returning *before* the collection is
      // recorded is what the static path does, and it matters: recording it here would let the next
      // non-empty collection be matched against nothing and exempted from pruning too.
      if (values.length === 0) {
        return;
      }

      const previousCollection = lastPrunedCollectionRef.current;
      lastPrunedCollectionRef.current = collection.items;

      // The first collection an owned session sees is the one it was handed: a value outside it may
      // belong to a page that has not loaded, or be a structurally equal object the default
      // comparer cannot match. Pruning there destroys a valid selection, which is what a static
      // list has always declined to do — and it declines again for anything short of the collection
      // being replaced, so a re-run against the same collection (a registration landing, an
      // `enabled` toggle, a `value` change) is exempt too.
      if (previousCollection == null || previousCollection === collection.items) {
        return;
      }

      const eventDetails = createChangeEventDetails(REASONS.none);
      // The comparer is contracted to accept whatever the application put in `items`, which is what
      // `valuesRef` holds; the generic parameter describes the selected value, not the collection.
      const selectedValue: any = value;

      if (!multiple && selectedValue !== null) {
        if (findItemIndex(values, selectedValue, isItemEqualToValue) === -1) {
          // `any` for the same reason the positioner's prune uses it: the ref holds whatever the
          // application first passed, which the comparer is contracted to accept.
          const initialSelectedValue: any = initialValueRef.current;
          const hasInitial =
            initialSelectedValue != null &&
            findItemIndex(values, initialSelectedValue, isItemEqualToValue) !== -1;
          const nextValue = hasInitial ? initialSelectedValue : null;
          store.context.setValue(nextValue, eventDetails);

          if (nextValue === null) {
            store.set('selectedIndex', null);
            selectedItemTextRef.current = null;
          }
        }
        return;
      }

      if (multiple && Array.isArray(selectedValue)) {
        const nextValue = selectedValue.filter(
          (selectedItemValue) =>
            findItemIndex(values, selectedItemValue, isItemEqualToValue) !== -1,
        );
        if (nextValue.length !== selectedValue.length) {
          store.context.setValue(nextValue, eventDetails);

          if (nextValue.length === 0) {
            store.set('selectedIndex', null);
            selectedItemTextRef.current = null;
          }
        }
      }
    },
    [
      collection,
      value,
      multiple,
      isItemEqualToValue,
      registeredVirtualizer,
      store,
      virtualizationRegistry,
    ],
  );

  useIsoLayoutEffect(
    function commitNavigationPin() {
      // Declared after the prefill and the index sync, so `valuesRef` and the store already
      // describe the current collection.
      const owned = open && virtualizationRegistry.virtualizer != null;
      // Read outside the updater: React may invoke it during render, and twice under StrictMode.
      const nextIndex = store.state.selectedIndex;

      setNavigationPin((previous) => {
        if (!owned) {
          // A static list, or a closed one, always passes the raw index through.
          return previous == null ? previous : null;
        }

        // Only two things move the pin: ownership beginning, and the collection being replaced.
        // A value change must not, or every selection would drag the list to whichever row the
        // hook then decides to bring into view.
        if (previous != null && previous.collection === collection.items) {
          return previous;
        }

        return { collection: collection.items, index: nextIndex };
      });
    },
    [collection, open, registeredVirtualizer, store, virtualizationRegistry],
  );

  useValueChanged(value, () => {
    clearErrors(name);
    setDirty(isSelectedValueDirty(value, validityData.initialValue, isItemEqualToValue));

    validation.change(value);
  });

  const setOpen = useStableCallback(
    (nextOpen: boolean, eventDetails: SelectRoot.ChangeEventDetails) => {
      onOpenChange?.(nextOpen, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setOpenUnwrapped(nextOpen);

      if (
        !nextOpen &&
        (eventDetails.reason === REASONS.focusOut || eventDetails.reason === REASONS.outsidePress)
      ) {
        setTouched(true);
        setFocused(false);

        if (validationMode === 'onBlur') {
          validation.commit(value);
        }
      }
    },
  );

  /**
   * Moves the highlight together with the reason it moved. Every write to `activeIndex` goes
   * through here so the two can never describe different interactions.
   */
  const setActiveIndex = useStableCallback(
    (nextActiveIndex: number | null, highlightType: StoreState['highlightType']) => {
      store.update({ activeIndex: nextActiveIndex, highlightType });
    },
  );

  const handleUnmount = useStableCallback(() => {
    setMounted(false);
    store.update({
      activeIndex: null,
      highlightType: 'none',
      openMethod: null,
      scrollUpArrowVisible: false,
      scrollDownArrowVisible: false,
    });
    onOpenChangeComplete?.(false);
  });

  useOpenChangeComplete({
    enabled: !actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  const setValue = useStableCallback(
    (nextValue: any, eventDetails: SelectRoot.ChangeEventDetails) => {
      onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(nextValue);
    },
  );

  const handleScrollArrowVisibility = useStableCallback((scroller: HTMLElement) => {
    const maxScrollTop = getMaxScrollOffset(scroller.scrollHeight, scroller.clientHeight);
    const scrollTop = normalizeScrollOffset(scroller.scrollTop, maxScrollTop);
    const shouldShowUp = scrollTop > 0;
    const shouldShowDown = scrollTop < maxScrollTop;

    store.set('scrollUpArrowVisible', shouldShowUp);
    store.set('scrollDownArrowVisible', shouldShowDown);
  });

  // Shared with Combobox: the consumer predicate answers for items that are not rendered, and a
  // missing element is only disabled in a list that discovers its items from the DOM. With an
  // `items` prop an index exists before its element does — outside a virtualizer's window, or not
  // registered yet when the popup opens — so it stays reachable.
  const { isIndexDisabled } = useDisabledIndex({
    getItemValue: (index) => valuesRef.current[index],
    hasItemCollection: items != null,
    isItemDisabled,
    listRef,
  });

  const floatingContext = useFloatingRootContext({
    open,
    onOpenChange: setOpen,
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
  });

  // `readOnly` locks the value, not the interaction: the popup can be opened and browsed so the
  // user can see the available options and which one is selected. Committing a value is blocked
  // separately in `SelectItem` and in the hidden input's autofill handler.
  const click = useClick(floatingContext, {
    enabled: !disabled,
    event: 'mousedown',
  });

  const dismiss = useDismiss(floatingContext);

  const listNavigation = useListNavigation(floatingContext, {
    enabled: !disabled,
    listRef,
    activeIndex,
    selectedIndex: navigationSelectedIndex,
    // Without the prop this stays `EMPTY_ARRAY`, which is what keeps attribute-disabled items
    // being skipped on open by the hook's own DOM check (see mui/base-ui#2604).
    disabledIndices: isItemDisabled ? isIndexDisabled : EMPTY_ARRAY,
    scrollItemIntoView: () => shouldScrollItemIntoView(virtualizationRegistry),
    onNavigate(nextActiveIndex, event) {
      // Retain the highlight while transitioning out.
      if (nextActiveIndex === null && !open) {
        return;
      }

      // A highlight the pointer produced must not scroll the list: the cursor is already on the
      // item, and scrolling would slide a different one under it. `event` is absent when the hook
      // syncs the highlight from an effect, which is neither.
      let highlightType: StoreState['highlightType'] = 'none';
      if (event) {
        highlightType = keyboardActiveRef.current ? 'keyboard' : 'pointer';
      }

      setActiveIndex(nextActiveIndex, highlightType);
    },
    focusItemOnHover: highlightItemOnHover,
  });

  const typeahead = useTypeahead(floatingContext, {
    // Typeahead on an open popup only moves the highlight, so it remains available while
    // `readOnly`. The closed-trigger variant commits a value instead, so it doesn't.
    enabled: !disabled && (open || (!readOnly && !multiple)),
    listRef: labelsRef,
    activeIndex,
    selectedIndex: navigationSelectedIndex,
    // Skip disabled items while matching so typeahead advances to the next selectable item
    // (a click can never select a disabled item and native `<select>` skips them too). The
    // element half of the predicate resolves the disabled state from the attribute-only
    // `isElementDisabled` so the hidden, force-mounted items used for closed-trigger typeahead
    // aren't dropped by the `elementsRef`/visibility filter that `disabledIndices` deliberately
    // sidesteps; the `isItemDisabled` half also covers items that are not rendered at all.
    disabledIndices: isIndexDisabled,
    onMatch(index) {
      if (open) {
        setActiveIndex(index, 'keyboard');
      } else {
        setValue(valuesRef.current[index], createChangeEventDetails(REASONS.none));
      }
    },
    onTyping(typing) {
      typingRef.current = typing;
    },
  });

  // `Select.Trigger` applies the id itself from the store, so it's deliberately not merged here.
  const mergedTriggerProps = React.useMemo(
    () =>
      mergeProps(
        typeahead.reference,
        listNavigation.reference,
        dismiss.reference,
        click.reference,
        interactionTypeProps,
      ),
    [
      click.reference,
      typeahead.reference,
      listNavigation.reference,
      dismiss.reference,
      interactionTypeProps,
    ],
  );

  const popupProps = React.useMemo(
    () =>
      mergeProps(
        FOCUSABLE_POPUP_PROPS,
        typeahead.floating,
        listNavigation.floating,
        dismiss.floating,
      ),
    [typeahead.floating, listNavigation.floating, dismiss.floating],
  );

  const itemProps =
    (listNavigation.item as React.HTMLProps<HTMLElement> | undefined) ?? EMPTY_OBJECT;

  store.useContextCallback('setValue', setValue);
  store.useContextCallback('setOpen', setOpen);
  store.useContextCallback('setActiveIndex', setActiveIndex);
  store.useContextCallback('handleScrollArrowVisibility', handleScrollArrowVisibility);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  // The prop bags must be in the store before the parts render. `useSyncedValues` writes in a
  // layout effect, after all descendants have rendered.
  useOnFirstRender(() => {
    store.update({
      popupProps,
      triggerProps: mergedTriggerProps,
    });
  });

  store.useSyncedValues({
    id: generatedId,
    modal,
    multiple,
    value,
    open,
    mounted,
    transitionStatus,
    popupProps,
    triggerProps: mergedTriggerProps,
    items,
    itemToStringLabel,
    itemToStringValue,
    isItemDisabled,
    isItemEqualToValue,
    openMethod: renderedOpenMethod,
  });

  const rootPropsContextValue: SelectRootPropsContextValue = React.useMemo(
    () => ({
      disabled,
      readOnly,
      required,
      multiple,
      highlightItemOnHover,
      itemProps,
    }),
    [disabled, readOnly, required, multiple, highlightItemOnHover, itemProps],
  );

  const ref = useMergedRefs(inputRef, validation.inputRef);

  const hiddenInputName = multiple ? undefined : name;

  const hiddenInputs = React.useMemo(() => {
    if (!multiple || !Array.isArray(value) || !name) {
      return null;
    }

    return value.map((v) => {
      const currentSerializedValue = stringifyAsValue(v, itemToStringValue);
      return (
        <input
          key={currentSerializedValue}
          type="hidden"
          form={form}
          name={name}
          value={currentSerializedValue}
          disabled={disabled}
        />
      );
    });
  }, [multiple, value, form, name, itemToStringValue, disabled]);

  return (
    <SelectRootContext.Provider value={store}>
      <SelectRootPropsContext.Provider value={rootPropsContextValue}>
        <SelectFloatingContext.Provider value={floatingContext}>
          <SelectVirtualizationContext.Provider value={registeredVirtualizer}>
            <ListVirtualizationOwnerContext.Provider value={VIRTUALIZATION_OWNER}>
              {children}
            </ListVirtualizationOwnerContext.Provider>
          </SelectVirtualizationContext.Provider>
        </SelectFloatingContext.Provider>
      </SelectRootPropsContext.Provider>
      <input
        {...validation.getValidationProps(disabled, {
          onFocus() {
            // Move focus to the trigger element when the hidden input is focused.
            store.state.triggerElement?.focus({
              // Supported in Chrome from 144 (January 2026)
              focusVisible: true,
            });
          },
          // Handle browser autofill.
          onChange(event: React.ChangeEvent<HTMLInputElement>) {
            // Workaround for https://github.com/react/react/issues/9023
            if (event.nativeEvent.defaultPrevented || disabled || readOnly) {
              return;
            }

            const nextValue = event.currentTarget.value;
            const details = createChangeEventDetails(REASONS.none, event.nativeEvent);

            function handleChange() {
              if (multiple) {
                // Browser autofill only writes a single scalar value.
                return;
              }

              // Preserve the original serialized matching, then fall back to rendered text,
              // which browsers can autofill for primitive values like
              // `value="US">United States`.
              const nextValueLower = nextValue.toLowerCase();
              let matchingIndex = valuesRef.current.findIndex(
                (candidate) =>
                  stringifyAsValue(candidate, itemToStringValue).toLowerCase() === nextValueLower ||
                  stringifyAsLabel(candidate, itemToStringLabel).toLowerCase() === nextValueLower,
              );

              if (matchingIndex === -1) {
                matchingIndex = valuesRef.current.findIndex((_, index) => {
                  const renderedLabel = labelsRef.current[index];
                  return renderedLabel != null && renderedLabel.toLowerCase() === nextValueLower;
                });
              }

              const matchingValue = valuesRef.current[matchingIndex];
              if (matchingValue != null) {
                // `setValue` may be canceled by `onValueChange`; rely on `useValueChanged` to
                // mark the field dirty and run validation only when the value actually changes.
                setValue(matchingValue, details);
              }
            }

            store.set('forceMount', true);
            queueMicrotask(handleChange);
          },
        })}
        id={generatedId && hiddenInputName == null ? `${generatedId}-hidden-input` : undefined}
        form={form}
        name={hiddenInputName}
        autoComplete={autoComplete}
        value={serializedValue}
        disabled={disabled}
        required={required && !(multiple && hasSelectedValue)}
        readOnly={readOnly}
        ref={ref}
        style={name ? visuallyHiddenInput : visuallyHidden}
        tabIndex={-1}
        aria-hidden
        suppressHydrationWarning
      />
      {hiddenInputs}
    </SelectRootContext.Provider>
  );
}

type SelectValueType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;

export interface SelectRootProps<Value, Multiple extends boolean | undefined = false> {
  children?: React.ReactNode;
  /**
   * A ref to access the hidden input element.
   */
  inputRef?: React.Ref<HTMLInputElement> | undefined;
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined;
  /**
   * Identifies the form that owns the hidden input.
   * Useful when the select is rendered outside the form.
   */
  form?: string | undefined;
  /**
   * Provides a hint to the browser for autofill.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
   */
  autoComplete?: string | undefined;
  /**
   * The id of the Select.
   */
  id?: string | undefined;
  /**
   * Whether the user must choose a value before submitting a form.
   * @default false
   */
  required?: boolean | undefined;
  /**
   * Whether the user should be unable to choose a different option from the select popup.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether multiple items can be selected.
   * @default false
   */
  multiple?: Multiple | undefined;
  /**
   * Whether moving the pointer over items should highlight them.
   * Disabling this prop allows CSS `:hover` to be differentiated from the `:focus` (`data-highlighted`) state.
   * @default true
   */
  highlightItemOnHover?: boolean | undefined;
  /**
   * Whether the select popup is initially open.
   *
   * To render a controlled select popup, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the select popup is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: SelectRootChangeEventDetails) => void) | undefined;
  /**
   * Event handler called after any animations complete when the select popup is opened or closed.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  /**
   * Whether the select popup is currently open.
   */
  open?: boolean | undefined;
  /**
   * Determines if the select enters a modal state when open.
   * - `true`: user interaction is limited to the select: document page scroll is locked and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   *
   * On touch devices, a `true` modal blocks outside taps but leaves the page scrollable unless the popup spans nearly the full viewport width, matching native iOS behavior.
   * @default true
   */
  modal?: boolean | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: Manually unmounts the select.
   * Call this after any externally controlled closing animation finishes.
   */
  actionsRef?: React.RefObject<SelectRootActions | null> | undefined;
  /**
   * Data structure of the items rendered in the select popup.
   * When specified, `<Select.Value>` renders the label of the selected item instead of the raw value.
   * An array is also the collection a `<Virtualizer>` windows, in which case it must be flat —
   * grouped items and the object form below cannot be virtualized.
   * @example
   * ```tsx
   * const items = {
   *   sans: 'Sans-serif',
   *   serif: 'Serif',
   *   mono: 'Monospace',
   *   cursive: 'Cursive',
   * };
   * <Select.Root items={items} />
   * ```
   */
  items?:
    | Record<string, React.ReactNode>
    | ReadonlyArray<{ label: React.ReactNode; value: any }>
    | ReadonlyArray<Group<any>>
    | ReadonlyArray<unknown>
    | undefined;
  /**
   * When the item values are objects (`<Select.Item value={object}>`), this function converts the object value to a string representation for display in the trigger.
   * If the shape of the object is `{ value, label }`, the label will be used automatically without needing to specify this prop.
   * Keep it referentially stable when the list is virtualized: its results are derived once per collection and cached for typeahead, so a new identity on every render re-derives a label for every item.
   */
  itemToStringLabel?: ((itemValue: Value) => string) | undefined;
  /**
   * When the item values are objects (`<Select.Item value={object}>`), this function converts the object value to a string representation for form submission.
   * If the shape of the object is `{ value, label }`, the value will be used automatically without needing to specify this prop.
   */
  itemToStringValue?: ((itemValue: Value) => string) | undefined;
  /**
   * Determines whether an item is disabled from its value and its index in the list.
   *
   * Use this prop when the disabled state must be known before an item is rendered, such as when
   * virtualizing the list. The `disabled` prop only marks a rendered item; this callback is what
   * makes keyboard navigation and typeahead skip disabled items, and gives rendered items their
   * disabled state.
   */
  isItemDisabled?: ((itemValue: Value, index: number) => boolean) | undefined;
  /**
   * Custom comparison logic used to determine if a select item value matches the current selected value. Useful when item values are objects without matching referentially.
   * Defaults to `Object.is` comparison.
   */
  isItemEqualToValue?: ((itemValue: Value, value: Value) => boolean) | undefined;
  /**
   * The uncontrolled value of the select when it's initially rendered.
   *
   * To render a controlled select, use the `value` prop instead.
   */
  defaultValue?: SelectValueType<Value, Multiple> | null | undefined;
  /**
   * The value of the select. Use when controlled.
   */
  value?: SelectValueType<Value, Multiple> | null | undefined;
  /**
   * Event handler called when the value of the select changes.
   */
  onValueChange?:
    | ((
        value: SelectValueType<Value, Multiple> | (Multiple extends true ? never : null),
        eventDetails: SelectRootChangeEventDetails,
      ) => void)
    | undefined;
}

export interface SelectRootState {}

export interface SelectRootActions {
  unmount: () => void;
}

export type SelectRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.windowResize
  | typeof REASONS.itemPress
  | typeof REASONS.focusOut
  | typeof REASONS.listNavigation
  | typeof REASONS.cancelOpen
  | typeof REASONS.none;

export type SelectRootChangeEventDetails = BaseUIChangeEventDetails<SelectRootChangeEventReason>;

export namespace SelectRoot {
  export type Props<Value, Multiple extends boolean | undefined = false> = SelectRootProps<
    Value,
    Multiple
  >;
  export type State = SelectRootState;
  export type Actions = SelectRootActions;
  export type ChangeEventReason = SelectRootChangeEventReason;
  export type ChangeEventDetails = SelectRootChangeEventDetails;
}
