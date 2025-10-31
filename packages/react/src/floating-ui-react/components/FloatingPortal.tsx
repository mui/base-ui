import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isNode } from '@floating-ui/utils/dom';
import { useId } from '@base-ui-components/utils/useId';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { FocusGuard } from '../../utils/FocusGuard';
import {
  enableFocusInside,
  disableFocusInside,
  getPreviousTabbable,
  getNextTabbable,
  isOutsideEvent,
} from '../utils';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { createAttribute } from '../utils/createAttribute';
import { useRenderElement } from '../../utils/useRenderElement';
import { EMPTY_OBJECT } from '../../utils/constants';
import type { BaseUIComponentProps } from '../../utils/types';

type FocusManagerState = null | {
  modal: boolean;
  open: boolean;
  onOpenChange(open: boolean, data?: { reason?: string; event?: Event }): void;
  domReference: Element | null;
  closeOnFocusOut: boolean;
};

const PortalContext = React.createContext<null | {
  portalNode: HTMLElement | null;
  setFocusManagerState: React.Dispatch<React.SetStateAction<FocusManagerState>>;
  beforeInsideRef: React.RefObject<HTMLSpanElement | null>;
  afterInsideRef: React.RefObject<HTMLSpanElement | null>;
  beforeOutsideRef: React.RefObject<HTMLSpanElement | null>;
  afterOutsideRef: React.RefObject<HTMLSpanElement | null>;
}>(null);

export const usePortalContext = () => React.useContext(PortalContext);

const attr = createAttribute('portal');

export interface UseFloatingPortalNodeProps {
  ref?: React.Ref<HTMLDivElement>;
  container?: HTMLElement | ShadowRoot | null | React.RefObject<HTMLElement | ShadowRoot | null>;
  componentProps?: useRenderElement.ComponentProps<any>;
  elementProps?: React.HTMLAttributes<HTMLDivElement>;
  elementState?: Record<string, unknown>;
}

export interface UseFloatingPortalNodeResult {
  portalNode: HTMLElement | null;
  portalSubtree: React.ReactPortal | null;
}

export function useFloatingPortalNode(
  props: UseFloatingPortalNodeProps = {},
): UseFloatingPortalNodeResult {
  const {
    ref,
    container: containerProp,
    componentProps = EMPTY_OBJECT,
    elementProps,
    elementState,
  } = props;

  const uniqueId = useId();
  const portalContext = usePortalContext();
  const parentPortalNode = portalContext?.portalNode;

  const [containerElement, setContainerElement] = React.useState<HTMLElement | ShadowRoot | null>(
    null,
  );
  const [portalNode, setPortalNode] = React.useState<HTMLElement | null>(null);

  const containerRef = React.useRef<HTMLElement | ShadowRoot | null>(null);

  const setPortalNodeRef = React.useCallback((node: HTMLDivElement | null) => {
    setPortalNode(node);
  }, []);

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

    // React 17 does not use React.useId().
    if (uniqueId == null) {
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
  }, [containerProp, parentPortalNode, uniqueId]);

  const portalElement = useRenderElement('div', componentProps, {
    ref: [ref, setPortalNodeRef],
    state: elementState,
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
    portalNode,
    portalSubtree,
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
  componentProps: FloatingPortal.Props<any> & { renderGuards?: boolean },
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, container, className, render, renderGuards, ...elementProps } = componentProps;

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

  const [focusManagerState, setFocusManagerState] = React.useState<FocusManagerState>(null);

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
      if (portalNode && isOutsideEvent(event)) {
        const focusing = event.type === 'focusin';
        const manageFocus = focusing ? enableFocusInside : disableFocusInside;
        manageFocus(portalNode);
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
    if (!portalNode || open) {
      return;
    }
    enableFocusInside(portalNode);
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
          <span aria-owns={portalNode.id} style={visuallyHidden} />
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
                    createChangeEventDetails('focus-out', event.nativeEvent),
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

export namespace FloatingPortal {
  export interface Props<State> extends BaseUIComponentProps<'div', State> {
    /**
     * A parent element to render the portal element into.
     */
    container?: UseFloatingPortalNodeProps['container'];
  }
}
