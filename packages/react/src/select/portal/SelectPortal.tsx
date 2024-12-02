'use client';
import * as React from 'react';
import { FloatingPortal } from '@floating-ui/react';
import { useSelectRootContext } from '../root/SelectRootContext';

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.com/components/react-select/)
 *
 * API:
 *
 * - [SelectPortal API](https://base-ui.com/components/react-select/#api-reference-SelectPortal)
 */
const SelectPortal: SelectPortal = function SelectPortal(props: SelectPortal.Props) {
  const { children, container, keepMounted = false } = props;

  const { mounted } = useSelectRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return <FloatingPortal root={container}>{children}</FloatingPortal>;
};

namespace SelectPortal {
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

interface SelectPortal {
  (props: SelectPortal.Props): React.JSX.Element | null;
  propTypes?: any;
}

export { SelectPortal };
