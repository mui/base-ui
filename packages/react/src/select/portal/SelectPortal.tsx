'use client';
import * as React from 'react';
import { FloatingPortal } from '@floating-ui/react';
import { SelectPortalContext } from './SelectPortalContext';
import { useSelectRootContext } from '../root/SelectRootContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectPortal(props: SelectPortal.Props) {
  const { children, container } = props;

  const { typeaheadReady, mounted } = useSelectRootContext();

  const shouldRender = mounted || typeaheadReady;
  if (!shouldRender) {
    return null;
  }

  return (
    <SelectPortalContext.Provider value>
      <FloatingPortal root={container}>{children}</FloatingPortal>
    </SelectPortalContext.Provider>
  );
}

export namespace SelectPortal {
  export interface Props {
    children?: React.ReactNode;
    /**
     * A parent element to render the portal element into.
     */
    container?: HTMLElement | null | React.RefObject<HTMLElement | null>;
  }
}
