'use client';
import * as React from 'react';
import { useForkRef } from '../../utils/useForkRef';
import { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useEventCallback } from '../../utils/useEventCallback';
import { useRenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useCollapsibleRoot } from '../../collapsible/root/useCollapsibleRoot';
import type { CollapsibleRoot } from '../../collapsible/root/CollapsibleRoot';
import { CollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import type { AccordionRoot } from '../root/AccordionRoot';
import { useAccordionRootContext } from '../root/AccordionRootContext';
import { AccordionItemContext } from './AccordionItemContext';
import { accordionStyleHookMapping } from './styleHooks';

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
  const mergedRef = useForkRef(forwardedRef, listItemRef);

  const {
    disabled: contextDisabled,
    handleValueChange,
    state: rootState,
    value: openValues,
  } = useAccordionRootContext();

  const value = valueProp ?? index;

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

  const onOpenChange = useEventCallback((nextOpen: boolean) => {
    handleValueChange(value, nextOpen);
    onOpenChangeProp?.(nextOpen);
  });

  const collapsible = useCollapsibleRoot({
    open: isOpen,
    onOpenChange,
    disabled,
  });

  const collapsibleState: CollapsibleRoot.State = React.useMemo(
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

  const state: AccordionItem.State = React.useMemo(
    () => ({
      ...rootState,
      index,
      disabled,
      open: isOpen,
      transitionStatus: collapsible.transitionStatus,
    }),
    [collapsible.transitionStatus, disabled, index, isOpen, rootState],
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

  const renderElement = useRenderElement('div', componentProps, {
    state,
    ref: mergedRef,
    props: elementProps,
    customStyleHookMapping: accordionStyleHookMapping,
  });

  return (
    <CollapsibleRootContext.Provider value={collapsibleContext}>
      <AccordionItemContext.Provider value={accordionItemContext}>
        {renderElement()}
      </AccordionItemContext.Provider>
    </CollapsibleRootContext.Provider>
  );
});

export type AccordionItemValue = any | null;

export namespace AccordionItem {
  export interface State extends AccordionRoot.State {
    index: number;
    open: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props
    extends BaseUIComponentProps<'div', State>,
      Partial<Pick<useCollapsibleRoot.Parameters, 'disabled' | 'onOpenChange'>> {
    value?: AccordionItemValue;
  }
}
