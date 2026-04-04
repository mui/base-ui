'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { FocusGuard } from '../../utils/FocusGuard';
import {
  enableFocusInside,
  disableFocusInside,
  getPreviousTabbable,
  getNextTabbable,
  isOutsideEvent,
} from '../utils/tabbable';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { ownerVisuallyHidden } from '../../utils/constants';
import type { BaseUIComponentProps } from '../../utils/types';
import {
  PortalContext,
  type PortalFocusManagerState,
  type UseFloatingPortalNodeProps,
  useFloatingPortalNode,
} from './useFloatingPortalNode';

/**
 * Portals the floating element into a given container element — by default,
 * outside of the app root and into the body.
 * This is necessary to ensure the floating element can appear outside any
 * potential parent containers that cause clipping (such as `overflow: hidden`),
 * while retaining its location in the React tree.
 * @see https://floating-ui.com/docs/FloatingPortal
 * @internal
 */
export const FloatingPortal = React.forwardRef(function FloatingPortal(
  componentProps: FloatingPortal.Props<any> & { renderGuards?: boolean | undefined },
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, container, className, render, renderGuards, style, ...elementProps } =
    componentProps;

  const { portalNode, portalSubtree } = useFloatingPortalNode({
    container,
    ref: forwardedRef,
    componentProps,
    elementProps,
  });

  const beforeOutsideRef = React.useRef<HTMLSpanElement>(null);
  const afterOutsideRef = React.useRef<HTMLSpanElement>(null);
  const beforeInsideRef = React.useRef<HTMLSpanElement>(null);
  const afterInsideRef = React.useRef<HTMLSpanElement>(null);

  const [focusManagerState, setFocusManagerState] = React.useState<PortalFocusManagerState>(null);
  const focusInsideDisabledRef = React.useRef(false);

  const modal = focusManagerState?.modal;
  const open = focusManagerState?.open;

  const shouldRenderGuards =
    typeof renderGuards === 'boolean'
      ? renderGuards
      : !!focusManagerState && !focusManagerState.modal && focusManagerState.open && !!portalNode;

  // https://codesandbox.io/s/tabbable-portal-f4tng?file=/src/TabbablePortal.tsx
  React.useEffect(() => {
    if (!portalNode || modal) {
      return undefined;
    }

    // Make sure elements inside the portal element are tabbable only when the
    // portal has already been focused, either by tabbing into a focus trap
    // element outside or using the mouse.
    function onFocus(event: FocusEvent) {
      if (portalNode && event.relatedTarget && isOutsideEvent(event)) {
        if (event.type === 'focusin') {
          if (focusInsideDisabledRef.current) {
            enableFocusInside(portalNode);
            focusInsideDisabledRef.current = false;
          }
        } else {
          disableFocusInside(portalNode);
          focusInsideDisabledRef.current = true;
        }
      }
    }

    // Listen to the event on the capture phase so they run before the focus
    // trap elements onFocus prop is called.
    portalNode.addEventListener('focusin', onFocus, true);
    portalNode.addEventListener('focusout', onFocus, true);
    return () => {
      portalNode.removeEventListener('focusin', onFocus, true);
      portalNode.removeEventListener('focusout', onFocus, true);
    };
  }, [portalNode, modal]);

  React.useEffect(() => {
    if (!portalNode || open !== false) {
      return;
    }
    enableFocusInside(portalNode);
    focusInsideDisabledRef.current = false;
  }, [open, portalNode]);

  const portalContextValue = React.useMemo(
    () => ({
      beforeOutsideRef,
      afterOutsideRef,
      beforeInsideRef,
      afterInsideRef,
      portalNode,
      setFocusManagerState,
    }),
    [portalNode],
  );

  return (
    <React.Fragment>
      {portalSubtree}
      <PortalContext.Provider value={portalContextValue}>
        {shouldRenderGuards && portalNode && (
          <FocusGuard
            data-type="outside"
            ref={beforeOutsideRef}
            onFocus={(event) => {
              if (isOutsideEvent(event, portalNode)) {
                beforeInsideRef.current?.focus();
              } else {
                const domReference = focusManagerState ? focusManagerState.domReference : null;
                const prevTabbable = getPreviousTabbable(domReference);
                prevTabbable?.focus();
              }
            }}
          />
        )}
        {shouldRenderGuards && portalNode && (
          <span aria-owns={portalNode.id} style={ownerVisuallyHidden} />
        )}
        {portalNode && ReactDOM.createPortal(children, portalNode)}
        {shouldRenderGuards && portalNode && (
          <FocusGuard
            data-type="outside"
            ref={afterOutsideRef}
            onFocus={(event) => {
              if (isOutsideEvent(event, portalNode)) {
                afterInsideRef.current?.focus();
              } else {
                const domReference = focusManagerState ? focusManagerState.domReference : null;
                const nextTabbable = getNextTabbable(domReference);
                nextTabbable?.focus();

                if (focusManagerState?.closeOnFocusOut) {
                  focusManagerState?.onOpenChange(
                    false,
                    createChangeEventDetails(REASONS.focusOut, event.nativeEvent),
                  );
                }
              }
            }}
          />
        )}
      </PortalContext.Provider>
    </React.Fragment>
  );
});

export interface FloatingPortalState {}

export namespace FloatingPortal {
  export type State = FloatingPortalState;
  export interface Props<TState> extends BaseUIComponentProps<'div', TState> {
    /**
     * A parent element to render the portal element into.
     */
    container?: UseFloatingPortalNodeProps['container'] | undefined;
  }
}
