'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager, FloatingPortal } from '@floating-ui/react';
import { useDialogPopup } from './useDialogPopup';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { refType, HTMLElementType } from '../../utils/proptypes';
import { type BaseUIComponentProps } from '../../utils/types';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { useForkRef } from '../../utils/useForkRef';
import { InteractionType } from '../../utils/useEnhancedClickHandler';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { DialogPopupCssVars } from './DialogPopupCssVars';

const customStyleHookMapping: CustomStyleHookMapping<DialogPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
  nestedOpenDialogCount: (value) => ({ 'data-nested-dialogs': value.toString() }),
};

/**
 * A container for the dialog contents. Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogPopup = React.forwardRef(function DialogPopup(
  props: DialogPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    container,
    finalFocus,
    id,
    initialFocus,
    keepMounted = false,
    render,
    ...other
  } = props;

  const {
    descriptionElementId,
    dismissible,
    floatingRootContext,
    getPopupProps,
    modal,
    mounted,
    nestedOpenDialogCount,
    onOpenChange,
    open,
    openMethod,
    popupRef,
    setPopupElement,
    setPopupElementId,
    titleElementId,
    transitionStatus,
  } = useDialogRootContext();

  const mergedRef = useForkRef(forwardedRef, popupRef);

  const { getRootProps, floatingContext, resolvedInitialFocus } = useDialogPopup({
    descriptionElementId,
    floatingRootContext,
    getPopupProps,
    id,
    initialFocus,
    modal,
    mounted,
    onOpenChange,
    open,
    openMethod,
    ref: mergedRef,
    setPopupElement,
    setPopupElementId,
    titleElementId,
  });

  const state: DialogPopup.State = {
    open,
    nestedOpenDialogCount,
    transitionStatus,
  };

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    propGetter: getRootProps,
    extraProps: {
      ...other,
      style: { ...other.style, [DialogPopupCssVars.nestedDialogs]: nestedOpenDialogCount },
    },
    customStyleHookMapping,
  });

  if (!keepMounted && !mounted) {
    return null;
  }

  return (
    <FloatingPortal root={container}>
      <FloatingFocusManager
        context={floatingContext}
        modal={modal}
        disabled={!mounted}
        closeOnFocusOut={dismissible}
        initialFocus={resolvedInitialFocus}
        returnFocus={finalFocus}
        outsideElementsInert
      >
        {renderElement()}
      </FloatingFocusManager>
    </FloatingPortal>
  );
});

namespace DialogPopup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The container element to which the popup is appended to.
     */
    container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
    /**
     * If `true`, the dialog element is kept in the DOM when closed.
     *
     * @default false
     */
    keepMounted?: boolean;
    /**
     * Determines an element to focus when the dialog is opened.
     * It can be either a ref to the element or a function that returns such a ref.
     * If not provided, the first focusable element is focused.
     */
    initialFocus?:
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => React.RefObject<HTMLElement | null>);
    /**
     * Determines an element to focus after the dialog is closed.
     * If not provided, the focus returns to the trigger.
     */
    finalFocus?: React.RefObject<HTMLElement | null>;
  }

  export interface State {
    open: boolean;
    nestedOpenDialogCount: number;
    transitionStatus: TransitionStatus;
  }
}

DialogPopup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The container element to which the popup is appended to.
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([HTMLElementType, refType]),
  /**
   * Determines an element to focus after the dialog is closed.
   * If not provided, the focus returns to the trigger.
   */
  finalFocus: refType,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * Determines an element to focus when the dialog is opened.
   * It can be either a ref to the element or a function that returns such a ref.
   * If not provided, the first focusable element is focused.
   */
  initialFocus: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    PropTypes.func,
    refType,
  ]),
  /**
   * If `true`, the dialog element is kept in the DOM when closed.
   *
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  style: PropTypes.object,
} as any;

export { DialogPopup };
