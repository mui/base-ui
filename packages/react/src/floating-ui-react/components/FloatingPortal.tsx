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
import { createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';
import { createAttribute } from '../utils/createAttribute';

type FocusManagerState = {
  modal: boolean;
  open: boolean;
  onOpenChange(open: boolean, data?: { reason?: string; event?: Event }): void;
  domReference: Element | null;
  closeOnFocusOut: boolean;
} | null;

const PortalContext = React.createContext<null | {
  preserveTabOrder: boolean;
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
  root?: HTMLElement | ShadowRoot | null | React.RefObject<HTMLElement | ShadowRoot | null>;
}

/**
 * @see https://floating-ui.com/docs/FloatingPortal#usefloatingportalnode
 */
export function useFloatingPortalNode(props: UseFloatingPortalNodeProps = {}) {
  const { root } = props;

  const uniqueId = useId();
  const portalContext = usePortalContext();

  const [portalNode, setPortalNode] = React.useState<HTMLElement | null>(null);

  const portalNodeRef = React.useRef<HTMLDivElement | null>(null);
  const prevContainerRef = React.useRef<HTMLElement | ShadowRoot | null>(null);

  // Cleanup when the portal node instance changes or unmounts.
  useIsoLayoutEffect(() => {
    return () => {
      portalNode?.remove();
      // Allow the subsequent layout effects to create a new node on updates.
      // The portal node will still be cleaned up on unmount.
      // https://github.com/floating-ui/floating-ui/issues/2454
      queueMicrotask(() => {
        portalNodeRef.current = null;
        prevContainerRef.current = null;
      });
    };
  }, [portalNode]);

  // Handle reactive `root` changes (including undefined <-> container changes)
  useIsoLayoutEffect(() => {
    // "Wait" mode: remove any existing node and pause until root changes.
    if (root === null) {
      if (portalNodeRef.current) {
        portalNodeRef.current.remove();
        portalNodeRef.current = null;
        setPortalNode(null);
      }
      prevContainerRef.current = null;
      return;
    }

    // For React 17, as the id is generated in an effect instead of React.useId().
    if (!uniqueId) {
      return;
    }

    const resolvedContainer =
      (root && (isNode(root) ? root : root.current)) || portalContext?.portalNode || document.body;

    const containerChanged = resolvedContainer !== prevContainerRef.current;

    if (portalNodeRef.current && containerChanged) {
      portalNodeRef.current.remove();
      portalNodeRef.current = null;
      setPortalNode(null);
    }

    if (portalNodeRef.current) {
      return;
    }

    const portalElement = document.createElement('div');
    portalElement.id = uniqueId;
    portalElement.setAttribute(attr, '');
    resolvedContainer.appendChild(portalElement);

    portalNodeRef.current = portalElement;
    prevContainerRef.current = resolvedContainer;

    setPortalNode(portalElement);
  }, [root, uniqueId, portalContext]);

  return portalNode;
}

export interface FloatingPortalProps {
  children?: React.ReactNode;
  /**
   * Specifies the root node the portal container will be appended to.
   */
  root?: UseFloatingPortalNodeProps['root'];
  /**
   * When using non-modal focus management using `FloatingFocusManager`, this
   * will preserve the tab order context based on the React tree instead of the
   * DOM tree.
   */
  preserveTabOrder?: boolean;
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
export function FloatingPortal(props: FloatingPortalProps): React.JSX.Element {
  const { children, root, preserveTabOrder = true } = props;

  const portalNode = useFloatingPortalNode({ root });
  const [focusManagerState, setFocusManagerState] = React.useState<FocusManagerState>(null);

  const beforeOutsideRef = React.useRef<HTMLSpanElement>(null);
  const afterOutsideRef = React.useRef<HTMLSpanElement>(null);
  const beforeInsideRef = React.useRef<HTMLSpanElement>(null);
  const afterInsideRef = React.useRef<HTMLSpanElement>(null);

  const modal = focusManagerState?.modal;
  const open = focusManagerState?.open;

  const shouldRenderGuards =
    // The FocusManager and therefore floating element are currently open/
    // rendered.
    !!focusManagerState &&
    // Guards are only for non-modal focus management.
    !focusManagerState.modal &&
    // Don't render if unmount is transitioning.
    focusManagerState.open &&
    preserveTabOrder &&
    !!(root || portalNode);

  // https://codesandbox.io/s/tabbable-portal-f4tng?file=/src/TabbablePortal.tsx
  React.useEffect(() => {
    if (!portalNode || !preserveTabOrder || modal) {
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
  }, [portalNode, preserveTabOrder, modal]);

  React.useEffect(() => {
    if (!portalNode || open) {
      return;
    }
    enableFocusInside(portalNode);
  }, [open, portalNode]);

  return (
    <PortalContext.Provider
      value={React.useMemo(
        () => ({
          preserveTabOrder,
          beforeOutsideRef,
          afterOutsideRef,
          beforeInsideRef,
          afterInsideRef,
          portalNode,
          setFocusManagerState,
        }),
        [preserveTabOrder, portalNode],
      )}
    >
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
                  createBaseUIEventDetails('focus-out', event.nativeEvent),
                );
              }
            }
          }}
        />
      )}
    </PortalContext.Provider>
  );
}
