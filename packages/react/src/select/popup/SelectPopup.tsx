'use client';
import * as React from 'react';
import { FloatingFocusManager } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useSelector } from '../../utils/store';
import type { Side } from '../../utils/useAnchorPositioning';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useSelectPopup } from './useSelectPopup';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { styleDisableScrollbar } from '../../utils/styles';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';
import { DISABLED_TRANSITIONS_STYLE } from '../../utils/constants';

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

  // const { open, popupRef, transitionStatus, mounted, onOpenChangeComplete, popupProps } =
  //   useSelectRootContext();
  const { store, popupRef, onOpenChangeComplete } = useSelectRootContext();
  const positioner = useSelectPositionerContext();

  const open = useSelector(store, selectors.open);
  const mounted = useSelector(store, selectors.mounted);
  const popupProps = useSelector(store, selectors.popupProps);
  const transitionStatus = useSelector(store, selectors.transitionStatus);
  const alignItemWithTriggerActive = useSelector(store, selectors.alignItemWithTriggerActive);

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

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, popupRef],
    state,
    customStyleHookMapping,
    props: [
      popupProps,
      props,
      {
        style: transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE.style : undefined,
        className: alignItemWithTriggerActive ? styleDisableScrollbar.className : undefined,
      },
      elementProps,
    ],
  });

  return (
    <React.Fragment>
      {styleDisableScrollbar.element}
      <FloatingFocusManager
        context={positioner.context}
        modal={false}
        disabled={!mounted}
        restoreFocus
      >
        {element}
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
