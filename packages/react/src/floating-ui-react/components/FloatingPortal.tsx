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
import { createBaseUIEventData } from '../../utils/createBaseUIEvent';
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
  id?: string;
  root?: HTMLElement | ShadowRoot | null | React.RefObject<HTMLElement | ShadowRoot | null>;
}

/**
 * @see https://floating-ui.com/docs/FloatingPortal#usefloatingportalnode
 */
export function useFloatingPortalNode(props: UseFloatingPortalNodeProps = {}) {
  const { id, root } = props;

  const uniqueId = useId();
  const portalContext = usePortalContext();

  const [portalNode, setPortalNode] = React.useState<HTMLElement | null>(null);

  const portalNodeRef = React.useRef<HTMLDivElement | null>(null);

  useIsoLayoutEffect(() => {
    return () => {
      portalNode?.remove();
      // Allow the subsequent layout effects to create a new node on updates.
      // The portal node will still be cleaned up on unmount.
      // https://github.com/floating-ui/floating-ui/issues/2454
      queueMicrotask(() => {
        portalNodeRef.current = null;
      });
    };
  }, [portalNode]);

  useIsoLayoutEffect(() => {
    // Wait for the uniqueId to be generated before creating the portal node in
    // React <18 (using `useFloatingId` instead of the native `useId`).
    // https://github.com/floating-ui/floating-ui/issues/2778
    if (!uniqueId) {
      return;
    }
    if (portalNodeRef.current) {
      return;
    }
    const existingIdRoot = id ? document.getElementById(id) : null;
    if (!existingIdRoot) {
      return;
    }

    const subRoot = document.createElement('div');
    subRoot.id = uniqueId;
    subRoot.setAttribute(attr, '');
    existingIdRoot.appendChild(subRoot);
    portalNodeRef.current = subRoot;
    setPortalNode(subRoot);
  }, [id, uniqueId]);

  useIsoLayoutEffect(() => {
    // Wait for the root to exist before creating the portal node. The root must
    // be stored in state, not a ref, for this to work reactively.
    if (root === null) {
      return;
    }
    if (!uniqueId) {
      return;
    }
    if (portalNodeRef.current) {
      return;
    }

    let container = root || portalContext?.portalNode;
    if (container && !isNode(container)) {
      container = container.current;
    }
    container = container || document.body;

    let idWrapper: HTMLDivElement | null = null;
    if (id) {
      idWrapper = document.createElement('div');
      idWrapper.id = id;
      container.appendChild(idWrapper);
    }

    const subRoot = document.createElement('div');

    subRoot.id = uniqueId;
    subRoot.setAttribute(attr, '');

    container = idWrapper || container;
    container.appendChild(subRoot);

    portalNodeRef.current = subRoot;
    setPortalNode(subRoot);
  }, [id, root, uniqueId, portalContext]);

  return portalNode;
}

export interface FloatingPortalProps {
  children?: React.ReactNode;
  /**
   * Optionally selects the node with the id if it exists, or create it and
   * append it to the specified `root` (by default `document.body`).
   */
  id?: string;
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
  const { children, id, root, preserveTabOrder = true } = props;

  const portalNode = useFloatingPortalNode({ id, root });
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
    if (!portalNode) {
      return;
    }
    if (open) {
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
                  createBaseUIEventData('focus-out', event.nativeEvent),
                );
              }
            }
          }}
        />
      )}
    </PortalContext.Provider>
  );
}
