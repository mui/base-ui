'use client';
import * as React from 'react';
import { FloatingPortal } from '@floating-ui/react';
import { useMenuRootContext } from '../root/MenuRootContext';

/**
 *
 * Demos:
 *
 * - [Menu](https://base-ui.com/components/react-menu/)
 *
 * API:
 *
 * - [MenuPortal API](https://base-ui.com/components/react-menu/#api-reference-MenuPortal)
 */
const MenuPortal: MenuPortal = function MenuPortal(props: MenuPortal.Props) {
  const { children, container, keepMounted = false } = props;

  const { mounted } = useMenuRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return <FloatingPortal root={container}>{children}</FloatingPortal>;
};

namespace MenuPortal {
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

interface MenuPortal {
  (props: MenuPortal.Props): React.JSX.Element | null;
  propTypes?: any;
}

export { MenuPortal };
