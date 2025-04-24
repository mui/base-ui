'use client';
import * as React from 'react';
import { FloatingPortal } from '@floating-ui/react';
import { SelectPortalContext } from './SelectPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
function SelectPortal(props: SelectPortal.Props) {
  const { children, container } = props;

  return (
    <SelectPortalContext.Provider value>
      <FloatingPortal root={container}>{children}</FloatingPortal>
    </SelectPortalContext.Provider>
  );
}

namespace SelectPortal {
  export interface Props {
    children?: React.ReactNode;
    /**
     * A parent element to render the portal element into.
     */
    container?: HTMLElement | null | React.RefObject<HTMLElement | null>;
  }
}

export { SelectPortal };
