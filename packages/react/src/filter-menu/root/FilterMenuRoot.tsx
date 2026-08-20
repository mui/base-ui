'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { REASONS } from '../../internals/reasons';
import {
  FilterDropdownRoot,
  type FilterDropdownRoot as FilterDropdownRootNamespace,
} from '../../filter-dropdown/root/FilterDropdownRoot';
import type { FilterDropdownFilter } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import { MenuRootInternal, type MenuRoot } from '../../menu/root/MenuRoot';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import type { FilterMenuHandle } from '../store/FilterMenuHandle';
import type { HTMLProps } from '../../internals/types';

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
    disabled,
    inline = false,
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

  function handleOpenChange(nextOpen: boolean, details: FilterMenuRoot.ChangeEventDetails) {
    onOpenChange?.(nextOpen, details);
    if (details.isCanceled) {
      return;
    }

    closeQuery.handleOpenChange(nextOpen);
    setOpen(nextOpen);
    setInputFocusVisible(nextOpen && isKeyboardOpen(details));
  }

  return (
    <MenuRootInternal
      {...menuProps}
      disabled={disabled}
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={closeQuery.handleOpenChangeComplete}
      inline={inline}
      virtualFocus
      virtualFocusRef={focusOwnerRef}
      virtualFocusInput={hasInput}
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
          inputProps={inputProps}
          onValueChange={handleInputValueChange}
          onInputElementChange={setHasInput}
        >
          {typeof children === 'function' ? children(payload) : children}
        </FilterMenuProvider>
      )}
    />
  );
}

/**
 * A keyboard open is the one that lands focus in the popup, so the input shows its focus ring.
 * Arrow keys report `list-navigation`; Enter and Space dispatch a click carrying no pointer detail.
 */
export function isKeyboardOpen(details: {
  reason: string | null;
  event: Event | undefined;
}): boolean {
  if (details.reason === REASONS.listNavigation) {
    return true;
  }
  return (
    (details.reason === REASONS.triggerPress || details.reason === REASONS.itemPress) &&
    (details.event as MouseEvent | undefined)?.detail === 0
  );
}

interface FilterMenuProviderProps {
  open: boolean;
  inputFocusVisible: boolean;
  value: string;
  query?: string | undefined;
  filter: FilterDropdownFilter | null | undefined;
  autoHighlight: boolean | 'always';
  locale: Intl.LocalesArgument | undefined;
  inline?: boolean | undefined;
  inputProps: HTMLProps;
  onValueChange: (value: string, details: FilterMenuRoot.InputValueChangeEventDetails) => void;
  onInputElementChange: (hasInput: boolean) => void;
  children?: React.ReactNode;
}

/**
 * Reads the menu store, which is only available below `Menu.Root`, and hands the filter root the
 * list the menu navigates plus the props for the input that holds real focus.
 */
export function FilterMenuProvider(props: FilterMenuProviderProps) {
  const { store, virtualFocusRef } = useMenuRootContext();
  const triggerId = store.useState('activeTriggerId');
  const triggerElement = store.useState('activeTriggerElement');
  const activeIndex = store.useState('activeIndex');
  const disabled = store.useState('disabled');

  const setActiveIndex = useStableCallback((index: number | null) => {
    store.set('activeIndex', index);
  });

  return (
    <FilterDropdownRoot
      open={props.open}
      inline={props.inline}
      disabled={disabled}
      inputFocusVisible={props.inputFocusVisible}
      value={props.value}
      query={props.query ?? props.value}
      filter={props.filter}
      autoHighlight={props.autoHighlight}
      locale={props.locale}
      // Trust the rendered element's id once it exists: an explicitly empty id must not
      // fall back to a registered id that no element carries.
      triggerId={triggerElement ? triggerElement.id || undefined : triggerId}
      listRef={store.context.itemDomElements}
      activeIndex={activeIndex}
      setActiveIndex={setActiveIndex}
      inputProps={props.inputProps}
      inputRef={virtualFocusRef}
      onValueChange={props.onValueChange}
      onInputElementChange={props.onInputElementChange}
    >
      {props.children}
    </FilterDropdownRoot>
  );
}

interface FilterMenuRootFilterProps {
  /**
   * Replaces the default case-insensitive substring matching for item text.
   * Receives an item's filter text, the trimmed query, and the item's `keywords`, which it must
   * match itself if they should participate.
   * Pass `null` to turn filtering off and decide which items to render yourself.
   */
  filter?: FilterMenuFilter | null | undefined;
  /**
   * Whether the first matching item is highlighted automatically.
   * - `true`: highlight after the user types and keep the highlight while the query changes.
   * - `'always'`: always highlight the first item.
   * @default false
   */
  autoHighlight?: boolean | 'always' | undefined;
  /**
   * Locale used when comparing an item against the query.
   * Defaults to the runtime's default locale.
   */
  locale?: Intl.LocalesArgument | undefined;
  /**
   * The uncontrolled filter query when the menu is initially rendered.
   * To render a controlled query, use the `inputValue` prop instead.
   */
  defaultInputValue?: string | undefined;
  /**
   * The filter query. Use when controlled.
   * When the popup closes, `onInputValueChange` is called with an empty query. The controlled
   * value changes only when the consumer updates this prop.
   */
  inputValue?: string | undefined;
  /**
   * Event handler called when the filter query changes.
   */
  onInputValueChange?:
    | ((value: string, eventDetails: FilterMenuRoot.InputValueChangeEventDetails) => void)
    | undefined;
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
  'actionsRef' | 'handle' | 'onOpenChange' | 'orientation'
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
  };

export interface FilterMenuRootState extends MenuRoot.State {}
export type FilterMenuRootActions = MenuRoot.Actions;
export type FilterMenuRootChangeEventReason = MenuRoot.ChangeEventReason;
export type FilterMenuRootChangeEventDetails = MenuRoot.ChangeEventDetails;
export type FilterMenuRootInputValueChangeEventReason =
  FilterDropdownRootNamespace.ChangeEventReason;
export type FilterMenuRootInputValueChangeEventDetails =
  FilterDropdownRootNamespace.ChangeEventDetails;

export namespace FilterMenuRoot {
  export type Props<Payload = unknown> = FilterMenuRootProps<Payload>;
  export type State = FilterMenuRootState;
  export type Actions = FilterMenuRootActions;
  export type ChangeEventReason = FilterMenuRootChangeEventReason;
  export type ChangeEventDetails = FilterMenuRootChangeEventDetails;
  export type InputValueChangeEventReason = FilterMenuRootInputValueChangeEventReason;
  export type InputValueChangeEventDetails = FilterMenuRootInputValueChangeEventDetails;
}
