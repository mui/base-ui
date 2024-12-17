'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager } from '@floating-ui/react';
import { useDialogPopup } from '../../dialog/popup/useDialogPopup';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { refType } from '../../utils/proptypes';
import type { BaseUIComponentProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { useForkRef } from '../../utils/useForkRef';
import { InteractionType } from '../../utils/useEnhancedClickHandler';
import { transitionStatusMapping } from '../../utils/styleHookMapping';

const customStyleHookMapping: CustomStyleHookMapping<AlertDialogPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
  hasNestedDialogs(value) {
    return value ? { 'data-has-nested-dialogs': '' } : null;
  },
};

/**
 * A container for the alert dialog contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
const AlertDialogPopup = React.forwardRef(function AlertDialogPopup(
  props: AlertDialogPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, id, keepMounted = false, render, initialFocus, finalFocus, ...other } = props;

  const {
    descriptionElementId,
    floatingRootContext,
    getPopupProps,
    mounted,
    nested,
    nestedOpenDialogCount,
    setOpen,
    open,
    openMethod,
    popupRef,
    setPopupElement,
    setPopupElementId,
    titleElementId,
    transitionStatus,
  } = useAlertDialogRootContext();

  const mergedRef = useForkRef(forwardedRef, popupRef);

  const { getRootProps, floatingContext, resolvedInitialFocus } = useDialogPopup({
    descriptionElementId,
    floatingRootContext,
    getPopupProps,
    id,
    initialFocus,
    modal: true,
    mounted,
    setOpen,
    open,
    openMethod,
    ref: mergedRef,
    setPopupElement,
    setPopupElementId,
    titleElementId,
  });

  const hasNestedDialogs = nestedOpenDialogCount > 0;

  const state: AlertDialogPopup.State = React.useMemo(
    () => ({
      open,
      nested,
      transitionStatus,
      hasNestedDialogs,
    }),
    [open, nested, transitionStatus, hasNestedDialogs],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    propGetter: getRootProps,
    extraProps: {
      ...other,
      style: { ...other.style, '--nested-dialogs': nestedOpenDialogCount },
      role: 'alertdialog',
    },
    customStyleHookMapping,
  });

  if (!keepMounted && !mounted) {
    return null;
  }

  return (
    <FloatingFocusManager
      context={floatingContext}
      modal={open}
      disabled={!mounted}
      initialFocus={resolvedInitialFocus}
      returnFocus={finalFocus}
      outsideElementsInert
    >
      {renderElement()}
    </FloatingFocusManager>
  );
});

namespace AlertDialogPopup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether to keep the element in the DOM while the alert dialog is hidden.
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
     * By default, focus returns to the trigger.
     */
    finalFocus?: React.RefObject<HTMLElement | null>;
  }

  export interface State {
    /**
     * Whether the dialog is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
    /**
     * Whether the dialog is nested within a parent dialog.
     */
    nested: boolean;
    /**
     * Whether the dialog has nested dialogs open.
     */
    hasNestedDialogs: boolean;
  }
}

AlertDialogPopup.propTypes /* remove-proptypes */ = {
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
   * By default, focus returns to the trigger.
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
   * Whether to keep the element in the DOM while the alert dialog is hidden.
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

export { AlertDialogPopup };
