'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { FilterDropdownRoot as FilterDropdownRootNamespace } from '../../filter-dropdown/root/FilterDropdownRoot';
import type { BaseUIGenericEventDetails } from '../../internals/createBaseUIEventDetails';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import { MenuRootInternal, type MenuRoot } from '../../menu/root/MenuRoot';
import type { FilterMenuHandle } from '../store/FilterMenuHandle';
import type { FilterMenuRootFilterProps } from '../utils/FilterMenuRootFilterProps';
import { FilterMenuProvider } from '../utils/FilterMenuProvider';
import { isKeyboardOpen } from '../utils/isKeyboardOpen';
import { useFilterMenuWebkitItemSelected } from '../utils/useFilterMenuWebkitItemSelected';

/**
 * Groups all parts of a filter menu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export function FilterMenuRoot<Payload>(props: FilterMenuRoot.Props<Payload>): React.JSX.Element {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    inputValue: inputValueProp,
    defaultInputValue = '',
    onInputValueChange,
    filter,
    autoHighlight = false,
    locale,
    inline = false,
    grid = false,
    virtualized,
    onItemHighlighted,
    ...menuProps
  } = props;

  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'FilterMenu',
    state: 'open',
  });
  const [inputValue, setInputValue] = useControlled({
    controlled: inputValueProp,
    default: defaultInputValue,
    name: 'FilterMenu',
    state: 'inputValue',
  });
  const [inputFocusVisible, setInputFocusVisible] = React.useState(false);
  const [hasInput, setHasInput] = React.useState(false);

  const focusOwnerRef = React.useRef<HTMLElement | null>(null);
  const webkitItemSelected = useFilterMenuWebkitItemSelected();

  const handleInputValueChange = useStableCallback(
    (nextValue: string, details: FilterMenuRoot.InputValueChangeEventDetails) => {
      onInputValueChange?.(nextValue, details);
      if (!details.isCanceled) {
        setInputValue(nextValue);
      }
    },
  );

  const closeQuery = useFilterDropdownCloseQuery({
    open,
    value: inputValue,
    onValueChange: handleInputValueChange,
    onOpenChangeComplete,
  });

  const handleOpenChange = useStableCallback(
    (nextOpen: boolean, details: FilterMenuRoot.ChangeEventDetails) => {
      onOpenChange?.(nextOpen, details);
      if (details.isCanceled) {
        return;
      }

      closeQuery.handleOpenChange(nextOpen);
      setOpen(nextOpen);
      setInputFocusVisible(nextOpen && isKeyboardOpen(details));
    },
  );

  return (
    <MenuRootInternal
      {...menuProps}
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={closeQuery.handleOpenChangeComplete}
      inline={inline}
      orientation={grid ? 'horizontal' : undefined}
      virtualFocus
      webkitItemSelected={webkitItemSelected}
      virtualFocusRef={focusOwnerRef}
      virtualFocusInput={hasInput}
      // Escaping past either end of the list returns the highlight to the input; in a grid the
      // main axis is horizontal, so the inline arrows escape, matching the Combobox grid.
      allowEscape={hasInput && !autoHighlight}
      resetOnPointerLeave={autoHighlight !== 'always'}
      renderVirtualFocusChildren={(payload, inputProps) => (
        <FilterMenuProvider
          open={open}
          inputFocusVisible={inputFocusVisible}
          value={inputValue}
          query={closeQuery.query}
          filter={filter}
          autoHighlight={autoHighlight}
          locale={locale}
          inline={inline}
          grid={grid}
          virtualized={virtualized}
          inputProps={inputProps}
          onValueChange={handleInputValueChange}
          onInputElementChange={setHasInput}
          onItemHighlighted={onItemHighlighted}
        >
          {typeof children === 'function' ? children(payload) : children}
        </FilterMenuProvider>
      )}
    />
  );
}

/**
 * Determines whether an item matches the current filter query.
 *
 * @param itemText The item's `label`, falling back to its rendered text.
 * @param query The trimmed filter query.
 * @param keywords The item's `keywords`, if it declared any.
 */
export type FilterMenuFilter = (
  itemText: string,
  query: string,
  keywords: readonly string[] | undefined,
) => boolean;

export type FilterMenuRootProps<Payload = unknown> = Omit<
  MenuRoot.Props<Payload>,
  'actionsRef' | 'closeParentOnEsc' | 'handle' | 'onOpenChange' | 'orientation'
> &
  FilterMenuRootFilterProps & {
    /**
     * A ref to imperative actions.
     */
    actionsRef?: React.RefObject<FilterMenuRootActions | null> | undefined;
    /**
     * A handle that associates the menu with detached triggers.
     */
    handle?: FilterMenuHandle<Payload> | undefined;
    /**
     * Event handler called when the menu is opened or closed.
     */
    onOpenChange?:
      ((open: boolean, eventDetails: FilterMenuRootChangeEventDetails) => void) | undefined;
    /**
     * Whether the list is rendered inline without using the component's own popup.
     *
     * Specify `open` unconditionally in conjunction with this prop so the list is considered
     * visible: `<FilterMenu.Root inline open>`
     *
     * In a `Dialog.Root` > `FilterMenu.Root` composition, bind the FilterMenu's `open` and
     * `onOpenChange` props to the `Dialog`'s `open` and `onOpenChange` state instead so the
     * component resets its transient state (filter query and highlighted item) when the dialog
     * closes. Without that, a `Dialog.Portal` with `keepMounted` reopens with the previous query.
     * @default false
     */
    inline?: boolean | undefined;
    /**
     * Whether the items are arranged in a two-dimensional grid.
     * Wrap regular `<FilterMenu.Item>` actions in `<FilterMenu.Row>` when enabled. Other item
     * variants do not support grid semantics.
     * @default false
     */
    grid?: boolean | undefined;
    /**
     * The total number of items when they are windowed by an external virtualizer, counted after
     * your own filtering, so keyboard navigation can target the list's real ends.
     * Give each rendered `<FilterMenu.Item>` its `index`, use `filter={null}` with your own data
     * filtering, and keep at least one screenful of overscan mounted so navigation always has an
     * adjacent item to move to.
     */
    virtualized?: number | undefined;
    /**
     * Event handler called when an item is highlighted or unhighlighted.
     * Receives the highlighted item's index (or `null` when the highlight clears) and event
     * details with a `reason` property describing why the highlight changed.
     * The `reason` can be:
     * - `'keyboard'`: the highlight changed due to keyboard navigation.
     * - `'pointer'`: the highlight changed due to pointer hovering.
     * - `'none'`: the highlight changed programmatically.
     */
    onItemHighlighted?:
      | ((index: number | null, eventDetails: FilterMenuRootHighlightEventDetails) => void)
      | undefined;
  };

export interface FilterMenuRootState extends MenuRoot.State {}
export type FilterMenuRootActions = MenuRoot.Actions;
export type FilterMenuRootChangeEventReason = MenuRoot.ChangeEventReason;
export type FilterMenuRootChangeEventDetails = MenuRoot.ChangeEventDetails;
export type FilterMenuRootInputValueChangeEventReason =
  FilterDropdownRootNamespace.ChangeEventReason;
export type FilterMenuRootInputValueChangeEventDetails =
  FilterDropdownRootNamespace.ChangeEventDetails;
export type FilterMenuRootHighlightEventReason = 'keyboard' | 'pointer' | 'none';
export type FilterMenuRootHighlightEventDetails =
  BaseUIGenericEventDetails<FilterMenuRootHighlightEventReason>;

export namespace FilterMenuRoot {
  export type Props<Payload = unknown> = FilterMenuRootProps<Payload>;
  export type State = FilterMenuRootState;
  export type Actions = FilterMenuRootActions;
  export type ChangeEventReason = FilterMenuRootChangeEventReason;
  export type ChangeEventDetails = FilterMenuRootChangeEventDetails;
  export type InputValueChangeEventReason = FilterMenuRootInputValueChangeEventReason;
  export type InputValueChangeEventDetails = FilterMenuRootInputValueChangeEventDetails;
  export type HighlightEventReason = FilterMenuRootHighlightEventReason;
  export type HighlightEventDetails = FilterMenuRootHighlightEventDetails;
}
