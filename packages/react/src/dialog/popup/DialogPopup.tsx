'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager } from '@floating-ui/react';
import { useDialogPopup } from './useDialogPopup';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { refType } from '../../utils/proptypes';
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
 * A container for the dialog contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogPopup = React.forwardRef(function DialogPopup(
  props: DialogPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, finalFocus, id, initialFocus, keepMounted = false, render, ...other } = props;

  const {
    descriptionElementId,
    dismissible,
    floatingRootContext,
    getPopupProps,
    modal,
    mounted,
    nestedOpenDialogCount,
    setOpen,
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
    setOpen,
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
    <FloatingFocusManager
      context={floatingContext}
      modal
      disabled={!mounted}
      closeOnFocusOut={dismissible}
      initialFocus={resolvedInitialFocus}
      returnFocus={finalFocus}
      outsideElementsInert={modal}
    >
      {renderElement()}
    </FloatingFocusManager>
  );
});

namespace DialogPopup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether to keep the HTML element in the DOM while the dialog is hidden.
     * @default false
     */
    keepMounted?: boolean;
    /**
     * Determines the element to focus when the dialog is opened.
     * By default, the first focusable element is focused.
     */
    initialFocus?:
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => React.RefObject<HTMLElement | null>);
    /**
     * Determines the element to focus when the dialog is closed.
     * By default, focus returns to trigger.
     */
    finalFocus?: React.RefObject<HTMLElement | null>;
  }

  export interface State {
    /**
     * Whether the dialog is currently open.
     */
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Determines the element to focus when the dialog is closed.
   * By default, focus returns to trigger.
   */
  finalFocus: refType,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * Determines the element to focus when the dialog is opened.
   * By default, the first focusable element is focused.
   */
  initialFocus: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    PropTypes.func,
    refType,
  ]),
  /**
   * Whether to keep the HTML element in the DOM while the dialog is hidden.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  style: PropTypes.object,
} as any;

export { DialogPopup };
