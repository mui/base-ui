'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { triggerOpenStateMapping } from '../../utils/collapsibleOpenStateMapping';
import type { NativeButtonComponentProps } from '../../internals/types';
import { useButton } from '../../internals/use-button';
import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import type { AccordionItemState } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import { useRenderElement } from '../../internals/useRenderElement';

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
  const {
    disabled: disabledProp,
    className,
    id: idProp,
    render,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;

  const { panelId, open, handleTrigger, disabled: contextDisabled } = useCollapsibleRootContext();

  const disabled = disabledProp || contextDisabled;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton,
  });

  const { state, setTriggerId, triggerId: id } = useAccordionItemContext();

  useIsoLayoutEffect(() => {
    if (idProp) {
      setTriggerId(idProp);
    }
    return () => {
      setTriggerId(undefined);
    };
  }, [idProp, setTriggerId]);

  const props = {
    'aria-controls': open ? panelId : undefined,
    'aria-expanded': open,
    id,
    onClick: handleTrigger,
  };

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [props, elementProps, getButtonProps],
    stateAttributesMapping: triggerOpenStateMapping,
  });

  return element;
}) as unknown as AccordionTriggerComponent;

export interface AccordionTriggerState extends AccordionItemState {}

export type AccordionTriggerProps<
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
> = NativeButtonComponentProps<TNativeButton, TElement, AccordionTrigger.State>;

export namespace AccordionTrigger {
  export type State = AccordionTriggerState;
  export type Props<
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = AccordionTriggerProps<TNativeButton, TElement>;
}

type AccordionTriggerComponent = {
  <TElement extends React.ElementType = 'button'>(
    props: AccordionTrigger.Props<true, TElement> & {
      ref?: React.Ref<HTMLButtonElement> | undefined;
    },
  ): React.ReactElement | null;
  <TElement extends React.ElementType = 'button'>(
    props: AccordionTrigger.Props<false, TElement> & { nativeButton: false } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
  <TElement extends React.ElementType = 'button'>(
    props: AccordionTrigger.Props<boolean, TElement> & { nativeButton: boolean } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
};
