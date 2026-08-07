'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useBaseUiId } from '../../internals/useBaseUiId';
import {
  FilterDropdownRootContext,
  FilterDropdownValueContext,
  type FilterDropdownFilter,
  type FilterDropdownRoot as FilterDropdownRootNamespace,
} from './FilterDropdownRootContext';

/**
 * @internal
 */
export function FilterDropdownRoot(props: FilterDropdownRoot.Props): React.JSX.Element {
  const {
    children,
    open,
    locale,
    value,
    onValueChange,
    filter,
    triggerId: externalTriggerId,
    triggerElement: externalTriggerElement,
  } = props;

  const parentContext = React.useContext(FilterDropdownRootContext);
  const [liveRegionElement, setLiveRegionElement] = React.useState<HTMLDivElement | null>(null);
  const [registeredTriggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [registeredTriggerId, setTriggerId] = React.useState<string | undefined>(useBaseUiId());
  const [popupId, setPopupId] = React.useState<string | undefined>(useBaseUiId());
  const triggerElement = externalTriggerElement ?? registeredTriggerElement;
  const triggerId = externalTriggerId ?? registeredTriggerId;
  const handleValueChange = useStableCallback(onValueChange);

  // Nested popups can be portalled while their events still bubble through the parent React tree.
  // Share a registry so each popup can ignore events owned by a nested filterable popup.
  const popupElements = useRefWithInit(
    () => parentContext?.popupElements ?? new WeakSet<EventTarget>(),
  ).current;

  const contextValue: FilterDropdownRootContext = React.useMemo(
    () => ({
      open,
      popupElements,
      liveRegionElement,
      popupId,
      setPopupId,
      triggerId,
      setTriggerId,
      setTriggerElement,
      setLiveRegionElement,
      onValueChange: handleValueChange,
      locale,
      filter,
    }),
    [open, popupElements, liveRegionElement, popupId, triggerId, locale, filter, handleValueChange],
  );

  return (
    <FilterDropdownRootContext.Provider value={contextValue}>
      <FilterDropdownValueContext.Provider value={value}>
        {children}
      </FilterDropdownValueContext.Provider>
      {triggerElement &&
        ReactDOM.createPortal(
          <div
            ref={setLiveRegionElement}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={visuallyHidden}
          />,
          ownerDocument(triggerElement).body,
        )}
    </FilterDropdownRootContext.Provider>
  );
}

export interface FilterDropdownRootProps {
  children?: React.ReactNode;
  /**
   * Whether the popup is currently open.
   */
  open: boolean;
  /**
   * Locale used for filtering comparisons.
   */
  locale?: Intl.LocalesArgument | undefined;
  /**
   * The filter input value. Use when controlled.
   */
  value: string;
  /**
   * Event handler called when the filter input value changes.
   */
  onValueChange?:
    | ((value: string, eventDetails: FilterDropdownRootNamespace.ChangeEventDetails) => void)
    | undefined;
  /**
   * Custom filter logic used when filtering items.
   */
  filter?: FilterDropdownFilter | undefined;
  /**
   * ID of a trigger rendered outside this root. This is only needed by detached Menu triggers,
   * which cannot register themselves through the FilterDropdown context.
   */
  triggerId?: string | null | undefined;
  /**
   * Trigger rendered outside this root. This is only needed by detached Menu triggers so the
   * live region can be mounted in the trigger's document.
   */
  triggerElement?: Element | null | undefined;
}

export namespace FilterDropdownRoot {
  export type Props = FilterDropdownRootProps;
  export type ChangeEventReason = FilterDropdownRootNamespace.ChangeEventReason;
  export type ChangeEventDetails = FilterDropdownRootNamespace.ChangeEventDetails;
}
