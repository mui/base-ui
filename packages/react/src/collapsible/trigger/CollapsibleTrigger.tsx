'use client';
import * as React from 'react';
import { triggerOpenStateMapping } from '../../utils/collapsibleOpenStateMapping';
import type { StateAttributesMapping } from '../../utils/mapStateAttributes';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { useCollapsibleRootContext } from '../root/CollapsibleRootContext';
import { CollapsibleRoot } from '../root/CollapsibleRoot';

const stateAttributesMapping: StateAttributesMapping<CollapsibleRoot.State> = {
  ...triggerOpenStateMapping,
  ...transitionStatusMapping,
};

/**
 * A button that opens and closes the collapsible panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 */
export const CollapsibleTrigger = React.forwardRef(function CollapsibleTrigger(
  componentProps: CollapsibleTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    panelId,
    open,
    handleTrigger,
    state,
    disabled: contextDisabled,
  } = useCollapsibleRootContext();

  const { className, disabled = contextDisabled, id, render, ...elementProps } = componentProps;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
  });

  const props = React.useMemo(
    () => ({
      'aria-controls': panelId,
      'aria-expanded': open,
      disabled,
      onClick: handleTrigger,
    }),
    [panelId, disabled, open, handleTrigger],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [props, elementProps, getButtonProps],
    stateAttributesMapping: stateAttributesMapping,
  });

  return element;
});

export namespace CollapsibleTrigger {
  export interface Props extends BaseUIComponentProps<'button', CollapsibleRoot.State> {}
}
