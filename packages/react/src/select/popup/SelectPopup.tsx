'use client';
import * as React from 'react';
import { FloatingFocusManager } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { Side } from '../../utils/useAnchorPositioning';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useSelectPopup } from './useSelectPopup';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';

const customStyleHookMapping: CustomStyleHookMapping<SelectPopup.State> = {
  ...popupStateMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the select items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectPopup = React.forwardRef(function SelectPopup(
  componentProps: SelectPopup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...elementProps } = componentProps;

  const {
    id,
    open,
    popupRef,
    transitionStatus,
    mounted,
    onOpenChangeComplete,
    popupProps,
    multiple,
  } = useSelectRootContext();
  const positioner = useSelectPositionerContext();

  useOpenChangeComplete({
    open,
    ref: popupRef,
    onComplete() {
      if (open) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const state: SelectPopup.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
      side: positioner.side,
      align: positioner.align,
    }),
    [open, transitionStatus, positioner],
  );

  const { props } = useSelectPopup();

  const renderElement = useRenderElement('div', componentProps, {
    ref: [forwardedRef, popupRef],
    state,
    customStyleHookMapping,
    props: [
      popupProps,
      multiple ? { 'aria-multiselectable': true } : {},
      props,
      transitionStatus === 'starting' ? { style: { transition: 'none' } } : {},
      elementProps,
    ],
  });

  const popupSelector = `[data-id="${id}-popup"]`;

  const html = React.useMemo(
    () => ({
      __html: `${popupSelector}{scrollbar-width:none}${popupSelector}::-webkit-scrollbar{display:none}`,
    }),
    [popupSelector],
  );

  return (
    <React.Fragment>
      {id && positioner.alignItemWithTriggerActive && (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={html}
        />
      )}
      <FloatingFocusManager context={positioner.context} modal={false} disabled={!mounted}>
        {renderElement()}
      </FloatingFocusManager>
    </React.Fragment>
  );
});

export namespace SelectPopup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    children?: React.ReactNode;
    /**
     * @ignore
     */
    id?: string;
  }

  export interface State {
    side: Side | 'none';
    align: 'start' | 'end' | 'center';
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}
