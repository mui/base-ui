'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import {
  useCollapsibleRoot,
  type UseCollapsibleRootParameters,
} from '../../collapsible/root/useCollapsibleRoot';
import type { CollapsibleRoot, CollapsibleRootState } from '../../collapsible/root/CollapsibleRoot';
import { CollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import type { AccordionRootState } from '../root/AccordionRoot';
import { useAccordionRootContext } from '../root/AccordionRootContext';
import { AccordionItemContext } from './AccordionItemContext';
import { accordionStateAttributesMapping } from './stateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { type BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * Groups an accordion header with the corresponding panel.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
export const AccordionItem = React.forwardRef(function AccordionItem(
  componentProps: AccordionItem.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    disabled: disabledProp = false,
    onOpenChange: onOpenChangeProp,
    render,
    value: valueProp,
    ...elementProps
  } = componentProps;

  const { ref: listItemRef, index } = useCompositeListItem();
  const mergedRef = useMergedRefs(forwardedRef, listItemRef);

  const {
    disabled: contextDisabled,
    handleValueChange,
    state: rootState,
    value: openValues,
  } = useAccordionRootContext();

  const fallbackValue = useBaseUiId();

  const value = valueProp ?? fallbackValue;

  const disabled = disabledProp || contextDisabled;

  const isOpen = React.useMemo(() => {
    if (!openValues) {
      return false;
    }

    for (let i = 0; i < openValues.length; i += 1) {
      if (openValues[i] === value) {
        return true;
      }
    }

    return false;
  }, [openValues, value]);

  const onOpenChange = useStableCallback(
    (nextOpen: boolean, eventDetails: CollapsibleRoot.ChangeEventDetails) => {
      onOpenChangeProp?.(nextOpen, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      handleValueChange(value, nextOpen);
    },
  );

  const collapsible = useCollapsibleRoot({
    open: isOpen,
    onOpenChange,
    disabled,
  });

  const collapsibleState: CollapsibleRootState = React.useMemo(
    () => ({
      open: collapsible.open,
      disabled: collapsible.disabled,
      hidden: !collapsible.mounted,
      transitionStatus: collapsible.transitionStatus,
    }),
    [collapsible.open, collapsible.disabled, collapsible.mounted, collapsible.transitionStatus],
  );

  const collapsibleContext: CollapsibleRootContext = React.useMemo(
    () => ({
      ...collapsible,
      onOpenChange,
      state: collapsibleState,
    }),
    [collapsible, collapsibleState, onOpenChange],
  );

  const state: AccordionItemState = React.useMemo(
    () => ({
      ...rootState,
      index,
      disabled,
      open: isOpen,
    }),
    [disabled, index, isOpen, rootState],
  );

  const [triggerId, setTriggerId] = React.useState<string | undefined>(useBaseUiId());

  const accordionItemContext: AccordionItemContext = React.useMemo(
    () => ({
      open: isOpen,
      state,
      setTriggerId,
      triggerId,
    }),
    [isOpen, state, setTriggerId, triggerId],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: mergedRef,
    props: elementProps,
    stateAttributesMapping: accordionStateAttributesMapping,
  });

  return (
    <CollapsibleRootContext.Provider value={collapsibleContext}>
      <AccordionItemContext.Provider value={accordionItemContext}>
        {element}
      </AccordionItemContext.Provider>
    </CollapsibleRootContext.Provider>
  );
});

export interface AccordionItemState extends AccordionRootState {
  /**
   * The item index.
   */
  index: number;
  /**
   * Whether the component is open.
   */
  open: boolean;
}

export interface AccordionItemProps
  extends
    BaseUIComponentProps<'div', AccordionItemState>,
    Partial<Pick<UseCollapsibleRootParameters, 'disabled'>> {
  /**
   * A unique value that identifies this accordion item.
   * If no value is provided, a unique ID will be generated automatically.
   * Use when controlling the accordion programmatically, or to set an initial
   * open state.
   * @example
   * ```tsx
   * <Accordion.Root value={['a']}>
   *   <Accordion.Item value="a" /> // initially open
   *   <Accordion.Item value="b" /> // initially closed
   * </Accordion.Root>
   * ```
   */
  value?: any;
  /**
   * Event handler called when the panel is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: AccordionItem.ChangeEventDetails) => void)
    | undefined;
}

export type AccordionItemChangeEventReason = typeof REASONS.triggerPress | typeof REASONS.none;

export type AccordionItemChangeEventDetails =
  BaseUIChangeEventDetails<AccordionItem.ChangeEventReason>;

export namespace AccordionItem {
  export type State = AccordionItemState;
  export type Props = AccordionItemProps;
  export type ChangeEventReason = AccordionItemChangeEventReason;
  export type ChangeEventDetails = AccordionItemChangeEventDetails;
}
