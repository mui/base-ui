'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import { useAlertDialogRootContext } from '../Root/AlertDialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupOpenStateMapping as baseMapping } from '../../utils/popupOpenStateMapping';

const customStyleHookMapping: CustomStyleHookMapping<AlertDialogBackdrop.OwnerState> = {
  ...baseMapping,
  transitionStatus: (value) => {
    if (value === 'entering') {
      return { 'data-entering': '' } as Record<string, string>;
    }
    if (value === 'exiting') {
      return { 'data-exiting': '' };
    }
    return null;
  },
};

/**
 *
 * Demos:
 *
 * - [Alert Dialog](https://base-ui.netlify.app/components/react-alert-dialog/)
 *
 * API:
 *
 * - [AlertDialogBackdrop API](https://base-ui.netlify.app/components/react-alert-dialog/#api-reference-AlertDialogBackdrop)
 */
const AlertDialogBackdrop = React.forwardRef(function AlertDialogBackdrop(
  props: AlertDialogBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, keepMounted = false, container, ...other } = props;
  const { open, hasParentDialog, mounted, transitionStatus } = useAlertDialogRootContext();

  const ownerState: AlertDialogBackdrop.OwnerState = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState,
    ref: forwardedRef,
    extraProps: { role: 'presentation', ...other },
    customStyleHookMapping,
  });

  // no need to render nested backdrops
  const shouldRender = (keepMounted || mounted) && !hasParentDialog;
  if (!shouldRender) {
    return null;
  }

  return <FloatingPortal>{renderElement()}</FloatingPortal>;
});

namespace AlertDialogBackdrop {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * If `true`, the backdrop element is kept in the DOM when closed.
     *
     * @default false
     */
    keepMounted?: boolean;
    /**
     * The container element to which the backdrop is appended to.
     * @default false
     */
    container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
  }

  export interface OwnerState {
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}

AlertDialogBackdrop.propTypes /* remove-proptypes */ = {
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
   * If `true`, the backdrop element is kept in the DOM when closed.
   *
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { AlertDialogBackdrop };
