'use client';
import * as React from 'react';
import {
  safePolygon,
  useClick,
  useDismiss,
  useFloatingRootContext,
  useHover,
  useInteractions,
  useListNavigation,
  useTypeahead,
} from '@floating-ui/react';
import { UseMenuRootParameters, UseMenuRootReturnValue } from './useMenuRoot.types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';

const EMPTY_ARRAY: never[] = [];

/**
 *
 * API:
 *
 * - [useMenuRoot API](https://mui.com/base-ui/api/use-menu-root/)
 */
export function useMenuRoot(parameters: UseMenuRootParameters): UseMenuRootReturnValue {
  const { setOpen, open, orientation, direction, disabled, nested } = parameters;

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [hoverEnabled, setHoverEnabled] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const floatingRootContext = useFloatingRootContext({
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
    open,
    onOpenChange: (isOpen: boolean, event: Event | undefined) => {
      setOpen(isOpen, event);
    },
  });

  const hover = useHover(floatingRootContext, {
    enabled: hoverEnabled && nested && !disabled,
    handleClose: safePolygon({ blockPointerEvents: true }),
    delay: {
      open: 75,
    },
  });

  const click = useClick(floatingRootContext, {
    enabled: nested && !disabled,
    event: 'mousedown',
    toggle: false,
    ignoreMouse: true,
  });

  const dismiss = useDismiss(floatingRootContext, { bubbles: true });

  const itemDomElements = React.useRef<(HTMLElement | null)[]>([]);
  const itemLabels = React.useRef<(string | null)[]>([]);

  const listNavigation = useListNavigation(floatingRootContext, {
    enabled: !disabled,
    listRef: itemDomElements,
    activeIndex,
    nested,
    loop: true,
    orientation,
    rtl: direction === 'rtl',
    disabledIndices: EMPTY_ARRAY,
    onNavigate: setActiveIndex,
  });

  const typeahead = useTypeahead(floatingRootContext, {
    listRef: itemLabels,
    activeIndex,
    resetMs: 350,
    onMatch: (index) => {
      if (open && index !== activeIndex) {
        setActiveIndex(index);
      }
    },
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    hover,
    click,
    dismiss,
    listNavigation,
    typeahead,
  ]);

  const getTriggerProps = React.useCallback(
    (externalProps?: GenericHTMLProps) =>
      getReferenceProps(
        mergeReactProps(externalProps, {
          onMouseEnter: () => {
            setHoverEnabled(true);
          },
        }),
      ),
    [getReferenceProps],
  );

  const getPositionerProps = React.useCallback(
    (externalProps?: GenericHTMLProps) =>
      getFloatingProps(
        mergeReactProps(externalProps, {
          onMouseEnter: () => {
            setHoverEnabled(false);
          },
        }),
      ),
    [getFloatingProps],
  );

  return React.useMemo(
    () => ({
      activeIndex,
      floatingRootContext,
      triggerElement,
      setTriggerElement,
      getTriggerProps,
      setPositionerElement,
      getPositionerProps,
      getItemProps,
      itemDomElements,
      itemLabels,
    }),
    [
      activeIndex,
      floatingRootContext,
      triggerElement,
      getTriggerProps,
      getPositionerProps,
      getItemProps,
      itemDomElements,
      itemLabels,
    ],
  );
}
