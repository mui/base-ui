'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { FloatingPortal } from '../../floating-ui-react';
import { type BaseUIComponentProps } from '../../internals/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { selectors } from '../store';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectPortal = React.forwardRef(function SelectPortal(
  props: SelectPortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { keepMounted = false, ...portalProps } = props;

  const { store } = useSelectRootContext();
  const mounted = useStore(store, selectors.mounted);
  const forceMount = useStore(store, selectors.forceMount);

  const shouldRender = mounted || keepMounted || forceMount;
  if (!shouldRender) {
    return null;
  }

  return <FloatingPortal ref={forwardedRef} {...portalProps} />;
});

export interface SelectPortalState {}

export interface SelectPortalProps extends BaseUIComponentProps<'div', SelectPortalState> {
  /**
   * Whether to keep the portal mounted in the DOM while the popup is hidden.
   * @default false
   */
  keepMounted?: boolean | undefined;
  /**
   * A parent element to render the portal element into.
   */
  container?:
    HTMLElement | ShadowRoot | React.RefObject<HTMLElement | ShadowRoot | null> | null | undefined;
}

export namespace SelectPortal {
  export type State = SelectPortalState;
  export type Props = SelectPortalProps;
}
