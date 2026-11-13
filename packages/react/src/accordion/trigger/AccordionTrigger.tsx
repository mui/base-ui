'use client';
import * as React from 'react';
import { triggerOpenStateMapping } from '../../utils/collapsibleOpenStateMapping';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useRegisterFallbackId } from '../../collapsible/root/useFallbackId';
import { useCollapsibleTrigger } from '../../collapsible/trigger/useCollapsibleTrigger';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { AccordionItemState } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import { accordionStateAttributesMapping } from '../item/stateAttributesMapping';

const stateAttributesMapping: StateAttributesMapping<AccordionItemState> = {
  ...accordionStateAttributesMapping,
  ...triggerOpenStateMapping,
};

/**
 * A button that opens and closes the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */

export const AccordionTrigger = React.forwardRef(function AccordionTrigger(
  componentProps: AccordionTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { defaultTriggerId, state, setTriggerId } = useAccordionItemContext();
  const id = useRegisterFallbackId(componentProps.id, defaultTriggerId, setTriggerId);

  return useCollapsibleTrigger(
    { ...componentProps, id },
    forwardedRef,
    stateAttributesMapping,
    state,
  );
});

export interface AccordionTriggerState extends AccordionItemState {}

export interface AccordionTriggerProps
  extends NativeButtonProps, BaseUIComponentProps<'button', AccordionTriggerState> {}

export namespace AccordionTrigger {
  export type State = AccordionTriggerState;
  export type Props = AccordionTriggerProps;
}
