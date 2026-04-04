'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isNode } from '@floating-ui/utils/dom';
import { useId } from '@base-ui/utils/useId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { createAttribute } from '../utils/createAttribute';
import {
  useRenderElement,
  type UseRenderElementComponentProps,
} from '../../utils/useRenderElement';
import { EMPTY_OBJECT } from '../../utils/constants';

export type PortalFocusManagerState = null | {
  modal: boolean;
  open: boolean;
  onOpenChange(
    open: boolean,
    data?: { reason?: string | undefined; event?: Event | undefined },
  ): void;
  domReference: Element | null;
  closeOnFocusOut: boolean;
};

export type PortalContextValue = {
  portalNode: HTMLElement | null;
  setFocusManagerState: React.Dispatch<React.SetStateAction<PortalFocusManagerState>>;
  beforeInsideRef: React.RefObject<HTMLSpanElement | null>;
  afterInsideRef: React.RefObject<HTMLSpanElement | null>;
  beforeOutsideRef: React.RefObject<HTMLSpanElement | null>;
  afterOutsideRef: React.RefObject<HTMLSpanElement | null>;
};

export const PortalContext = React.createContext<PortalContextValue | null>(null);

export const usePortalContext = () => React.useContext(PortalContext);

const attr = createAttribute('portal');

export interface UseFloatingPortalNodeProps {
  ref?: React.Ref<HTMLDivElement> | undefined;
  container?:
    | HTMLElement
    | ShadowRoot
    | null
    | React.RefObject<HTMLElement | ShadowRoot | null>
    | undefined;
  componentProps?: UseRenderElementComponentProps<any> | undefined;
  elementProps?: React.HTMLAttributes<HTMLDivElement> | undefined;
}

export interface UseFloatingPortalNodeResult {
  portalNode: HTMLElement | null;
  portalSubtree: React.ReactPortal | null;
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
