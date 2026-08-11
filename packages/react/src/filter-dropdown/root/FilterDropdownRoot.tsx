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
  type FilterDropdownRoot as FilterDropdownRootNamespace,
} from './FilterDropdownRootContext';

/**
 * @internal
 */
export function FilterDropdownRoot(props: FilterDropdownRoot.Props): React.JSX.Element {
  const {
    children,
    open,
    empty,
    value,
    onValueChange,
    triggerId: externalTriggerId,
    triggerElement: externalTriggerElement,
  } = props;

  const parentContext = React.useContext(FilterDropdownRootContext);
  const [liveRegionElement, setLiveRegionElement] = React.useState<HTMLDivElement | null>(null);
  const [registeredTriggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [registeredTriggerId, setTriggerId] = React.useState<string | undefined>(undefined);
  const [registeredPopupId, setPopupId] = React.useState<string | undefined>(undefined);
  // React 17 resolves generated ids in an effect, so they must be read live rather than captured
  // in a state initializer.
  const defaultTriggerId = useBaseUiId();
  const defaultPopupId = useBaseUiId();
  const triggerElement = externalTriggerElement ?? registeredTriggerElement;
  const triggerId = externalTriggerId ?? registeredTriggerId ?? defaultTriggerId;
  const popupId = registeredPopupId ?? defaultPopupId;
  const handleValueChange = useStableCallback(onValueChange);

  // Nested popups can be portalled while their events still bubble through the parent React tree.
  // Share a registry so each popup can ignore events owned by a nested filterable popup.
  const popupElements = useRefWithInit(
    () => parentContext?.popupElements ?? new WeakSet<EventTarget>(),
  ).current;

  const contextValue: FilterDropdownRootContext = React.useMemo(
    () => ({
      open,
      empty,
      popupElements,
      liveRegionElement,
      popupId,
      setPopupId,
      triggerId,
      setTriggerId,
      setTriggerElement,
      setLiveRegionElement,
      onValueChange: handleValueChange,
    }),
    [open, empty, popupElements, liveRegionElement, popupId, triggerId, handleValueChange],
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
   * Whether the current query matched no items. The host's data pass decides this; the
   * filtering parts render no matching logic of their own.
   */
  empty: boolean;
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
