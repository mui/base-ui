'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';

/**
 *
 * Demos:
 *
 * - [Alert Dialog](https://base-ui.com/components/react-alert-dialog/)
 *
 * API:
 *
 * - [AlertDialogPortal API](https://base-ui.com/components/react-alert-dialog/#api-reference-AlertDialogPortal)
 */
const AlertDialogPortal: AlertDialogPortal = function AlertDialogPortal(
  props: AlertDialogPortal.Props,
) {
  const { children, container, keepMounted = false } = props;

  const { mounted } = useAlertDialogRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return <FloatingPortal root={container}>{children}</FloatingPortal>;
};

AlertDialogPortal.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * The container to render the portal element into.
   */
  container: PropTypes.oneOfType([
    (props, propName) => {
      if (props[propName] == null) {
        return new Error(`Prop '${propName}' is required but wasn't specified`);
      }
      if (typeof props[propName] !== 'object' || props[propName].nodeType !== 1) {
        return new Error(`Expected prop '${propName}' to be of type Element`);
      }
      return null;
    },
    PropTypes.shape({
      current: (props, propName) => {
        if (props[propName] == null) {
          return null;
        }
        if (typeof props[propName] !== 'object' || props[propName].nodeType !== 1) {
          return new Error(`Expected prop '${propName}' to be of type Element`);
        }
        return null;
      },
    }),
  ]),
  /**
   * Whether to keep the portal mounted in the DOM when the popup is closed.
   * @default false
   */
  keepMounted: PropTypes.bool,
} as any;

namespace AlertDialogPortal {
  export interface Props {
    children?: React.ReactNode;
    /**
     * The container to render the portal element into.
     */
    container?: HTMLElement | null | React.RefObject<HTMLElement | null>;
    /**
     * Whether to keep the portal mounted in the DOM when the popup is closed.
     * @default false
     */
    keepMounted?: boolean;
  }

  export interface State {}
}

interface AlertDialogPortal {
  (props: AlertDialogPortal.Props): React.JSX.Element | null;
  propTypes?: any;
}

export { AlertDialogPortal };
