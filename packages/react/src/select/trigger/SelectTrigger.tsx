'use client';
import * as React from 'react';
import { useSelectTrigger } from './useSelectTrigger';
import { useSelectRootContext } from '../root/SelectRootContext';
import { BaseUIComponentProps } from '../../utils/types';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { fieldValidityMapping } from '../../field/utils/constants';
import { useRenderElement } from '../../utils/useRenderElement';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

const customStyleHookMapping: CustomStyleHookMapping<SelectTrigger.State> = {
  ...pressableTriggerOpenStateMapping,
  ...fieldValidityMapping,
};

/**
 * A button that opens the select menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectTrigger = React.forwardRef(function SelectTrigger(
  componentProps: SelectTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, disabled: disabledProp = false, ...elementProps } = componentProps;

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();
  const { disabled: selectDisabled, open } = useSelectRootContext();

  const disabled = fieldDisabled || selectDisabled || disabledProp;

  const triggerRef = React.useRef<HTMLDivElement | null>(null);

  const { props } = useSelectTrigger({
    elementProps,
    disabled,
    rootRef: triggerRef,
  });

  const state: SelectTrigger.State = React.useMemo(
    () => ({
      ...fieldState,
      open,
      disabled,
    }),
    [fieldState, open, disabled],
  );

  const renderElement = useRenderElement('div', componentProps, {
    ref: [forwardedRef, triggerRef],
    state,
    customStyleHookMapping,
    props,
  });

  return renderElement();
});

export namespace SelectTrigger {
  export interface Props extends BaseUIComponentProps<'div', State> {
    children?: React.ReactNode;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
  }

  export interface State {
    /**
     * Whether the select menu is currently open.
     */
    open: boolean;
  }
}
