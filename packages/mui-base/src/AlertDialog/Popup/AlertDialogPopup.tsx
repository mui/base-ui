import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager, FloatingPortal } from '@floating-ui/react';
import { AlertDialogPopupOwnerState, AlertDialogPopupProps } from './AlertDialogPopup.types';
import { useDialogPopup } from '../../Dialog/Popup/useDialogPopup';
import { useAlertDialogRootContext } from '../Root/AlertDialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { refType, HTMLElementType } from '../../utils/proptypes';

const AlertDialogPopup = React.forwardRef(function AlertDialogPopup(
  props: AlertDialogPopupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    animated = true,
    className,
    container,
    id,
    keepMounted = false,
    render,
    ...other
  } = props;

  const rootContext = useAlertDialogRootContext();
  const { open, nestedOpenDialogCount } = rootContext;

  const { getRootProps, floatingContext, mounted, transitionStatus } = useDialogPopup({
    id,
    animated,
    ref: forwardedRef,
    dismissible: false,
    isTopmost: nestedOpenDialogCount === 0,
    ...rootContext,
  });

  const ownerState: AlertDialogPopupOwnerState = {
    open,
    nestedOpenDialogCount,
    transitionStatus,
  };

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState,
    propGetter: getRootProps,
    extraProps: {
      ...other,
      style: { '--nested-dialogs': nestedOpenDialogCount },
      role: 'alertdialog',
    },
    customStyleHookMapping: {
      open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
      nestedOpenDialogCount: (value) => ({ 'data-nested-dialogs': value.toString() }),
      transitionStatus: (value) => {
        if (value === 'entering') {
          return { 'data-entering': '' } as Record<string, string>;
        }
        if (value === 'exiting') {
          return { 'data-exiting': '' };
        }
        return null;
      },
    },
  });

  if (!keepMounted && !mounted) {
    return null;
  }

  return (
    <FloatingPortal root={container}>
      <FloatingFocusManager context={floatingContext} modal disabled={!mounted}>
        {renderElement()}
      </FloatingFocusManager>
    </FloatingPortal>
  );
});

AlertDialogPopup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, the dialog supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   *
   * @default true
   */
  animated: PropTypes.bool,
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
   * @ignore
   */
  id: PropTypes.string,
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
} as any;

export { AlertDialogPopup };
