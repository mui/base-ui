'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isNode } from '@floating-ui/utils/dom';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useId } from '@base-ui/utils/useId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { FocusGuard } from '../../utils/FocusGuard';
import { enableFocusInside, disableFocusInside, isOutsideEvent } from '../utils/tabbable';
import { AFTER_PORTAL, BEFORE_PORTAL } from '../utils/focusRoute';
import type { FocusRoute } from '../utils/focusRoute';
import { createAttribute } from '../utils/createAttribute';
import { useRenderElement } from '../../internals/useRenderElement';
import type { UseRenderElementComponentProps } from '../../internals/useRenderElement';
import { ownerVisuallyHidden } from '../../internals/constants';
import type { BaseUIComponentProps } from '../../internals/types';

// Reported by the focus manager inside, which owns the popup's focus route. The portal renders the
// route's guards around its placeholder.
type FocusManagerState = null | {
  modal: boolean;
  open: boolean;
  route: FocusRoute;
  onGuardFocus: React.FocusEventHandler<HTMLElement>;
};

const PortalContext = React.createContext<null | {
  portalNode: HTMLElement | null;
  setFocusManagerState: React.Dispatch<React.SetStateAction<FocusManagerState>>;
}>(null);

export const usePortalContext = () => React.useContext(PortalContext);

const attr = createAttribute('portal');

export interface UseFloatingPortalNodeProps {
  ref?: React.Ref<HTMLDivElement> | undefined;
  container?:
    HTMLElement | ShadowRoot | null | React.RefObject<HTMLElement | ShadowRoot | null> | undefined;
  componentProps?: UseRenderElementComponentProps<any> | undefined;
  elementProps?: React.HTMLAttributes<HTMLDivElement> | undefined;
}

export interface UseFloatingPortalNodeResult {
  node: HTMLElement | null;
  /**
   * The `id` attribute of the portal node. On React 17 it is `undefined` until the `useId`
   * polyfill assigns it in an effect after the node has been created.
   */
  nodeId: string | undefined;
  subtree: React.ReactPortal | null;
}

export function useFloatingPortalNode(
  props: UseFloatingPortalNodeProps = {},
): UseFloatingPortalNodeResult {
  const { ref, container: containerProp, componentProps = EMPTY_OBJECT, elementProps } = props;

  const uniqueId = useId();
  const portalContext = usePortalContext();
  const parentPortalNode = portalContext?.portalNode;

  const [containerElement, setContainerElement] = React.useState<HTMLElement | ShadowRoot | null>(
    null,
  );
  const [portalNode, setPortalNode] = React.useState<HTMLElement | null>(null);
  const setPortalNodeRef = useStableCallback((node: HTMLElement | null) => {
    if (node !== null) {
      // the useIsoLayoutEffect below watching containerProp / parentPortalNode
      // sets setPortalNode(null) when the container becomes null or changes.
      // So even though the ref callback now ignores null, the portal node still gets cleared.
      setPortalNode(node);
    }
  });

  const containerRef = React.useRef<HTMLElement | ShadowRoot | null>(null);

  useIsoLayoutEffect(() => {
    // Wait for the container to be resolved if explicitly `null`.
    if (containerProp === null) {
      if (containerRef.current) {
        containerRef.current = null;
        setPortalNode(null);
        setContainerElement(null);
      }
      return;
    }

    const resolvedContainer =
      (containerProp && (isNode(containerProp) ? containerProp : containerProp.current)) ??
      parentPortalNode ??
      document.body;

    if (resolvedContainer == null) {
      if (containerRef.current) {
        containerRef.current = null;
        setPortalNode(null);
        setContainerElement(null);
      }
      return;
    }

    if (containerRef.current !== resolvedContainer) {
      containerRef.current = resolvedContainer;
      setPortalNode(null);
      setContainerElement(resolvedContainer);
    }
  }, [containerProp, parentPortalNode]);

  const portalElement = useRenderElement('div', componentProps, {
    ref: [ref, setPortalNodeRef],
    props: [
      {
        id: uniqueId,
        [attr]: '',
      },
      elementProps,
    ],
  });

  // This `createPortal` call injects `portalElement` into the `container`.
  // Another call inside `FloatingPortal`/`FloatingPortalLite` then injects the children into `portalElement`.
  const portalSubtree =
    containerElement && portalElement
      ? ReactDOM.createPortal(portalElement, containerElement)
      : null;

  return {
    node: portalNode,
    // `id` and `render` props can override or remove the generated ID. Use the exact
    // rendered value so `aria-owns` never points at an ID absent from the DOM.
    nodeId: React.isValidElement<{ id?: string | undefined }>(portalElement)
      ? portalElement.props.id
      : undefined,
    subtree: portalSubtree,
  };
}

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
  componentProps: FloatingPortal.Props<any>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children, container, portalOwnerRole, ...elementProps } =
    componentProps;

  const {
    node: portalNode,
    nodeId: portalNodeId,
    subtree: portalSubtree,
  } = useFloatingPortalNode({
    container,
    ref: forwardedRef,
    componentProps,
    elementProps,
  });

  const [focusManagerState, setFocusManagerState] = React.useState<FocusManagerState>(null);
  const focusInsideDisabledRef = React.useRef(false);

  const modal = focusManagerState?.modal;
  const open = focusManagerState?.open;

  const routeState = !modal && open && portalNode ? focusManagerState : null;

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
    return mergeCleanups(
      addEventListener(portalNode, 'focusin', onFocus, true),
      addEventListener(portalNode, 'focusout', onFocus, true),
    );
  }, [portalNode, modal]);

  useIsoLayoutEffect(() => {
    if (!portalNode || open !== true || !focusInsideDisabledRef.current) {
      return;
    }

    // Restore tabbability before the focus manager's queued focus-on-open step runs.
    enableFocusInside(portalNode);
    focusInsideDisabledRef.current = false;
  }, [open, portalNode]);

  const portalContextValue = React.useMemo(
    () => ({ portalNode, setFocusManagerState }),
    [portalNode],
  );

  return (
    <React.Fragment>
      <PortalContext.Provider value={portalContextValue}>
        {routeState && (
          <FocusGuard
            data-type="outside"
            ref={routeState.route[BEFORE_PORTAL]}
            onFocus={routeState.onGuardFocus}
          />
        )}
        {routeState && (
          <span role={portalOwnerRole} aria-owns={portalNodeId} style={ownerVisuallyHidden} />
        )}
        {portalNode && ReactDOM.createPortal(children, portalNode)}
        {routeState && (
          <FocusGuard
            data-type="outside"
            ref={routeState.route[AFTER_PORTAL]}
            onFocus={routeState.onGuardFocus}
          />
        )}
      </PortalContext.Provider>
      {/* After the children: on unmount, React runs the children's layout cleanups before it
          detaches the portal node, so they can still read focus inside it. */}
      {portalSubtree}
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
    /**
     * @ignore
     * The role for the hidden `aria-owns` owner element.
     */
    portalOwnerRole?: React.AriaRole | undefined;
  }
}
