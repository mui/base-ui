'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { useDialogBackdrop } from '../../dialog/backdrop/useDialogBackdrop';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';

const customStyleHookMapping: CustomStyleHookMapping<AlertDialogBackdrop.State> = {
  ...baseMapping,
  transitionStatus: (value) => {
    if (value === 'entering') {
      return { 'data-starting-style': '' } as Record<string, string>;
    }
    if (value === 'exiting') {
      return { 'data-ending-style': '' };
    }
    return null;
  },
};

/**
 *
 * Demos:
 *
 * - [Alert Dialog](https://base-ui.com/components/react-alert-dialog/)
 *
 * API:
 *
 * - [AlertDialogBackdrop API](https://base-ui.com/components/react-alert-dialog/#api-reference-AlertDialogBackdrop)
 */
const AlertDialogBackdrop = React.forwardRef(function AlertDialogBackdrop(
  props: AlertDialogBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, keepMounted = false, ...other } = props;
  const { open, hasParentDialog } = useAlertDialogRootContext();

  const { getRootProps, mounted, transitionStatus } = useDialogBackdrop({
    open,
    ref: forwardedRef,
  });

  const state: AlertDialogBackdrop.State = { open, transitionStatus };

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    propGetter: getRootProps,
    extraProps: other,
    customStyleHookMapping,
  });

  if (!mounted && !keepMounted) {
    return null;
  }

  if (hasParentDialog) {
    // no need to render nested backdrops
    return null;
  }

  return renderElement();
});

namespace AlertDialogBackdrop {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * If `true`, the backdrop element is kept in the DOM when closed.
     *
     * @default false
     */
    keepMounted?: boolean;
  }

  export interface State {
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
