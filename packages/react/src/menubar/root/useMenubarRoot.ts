import * as React from 'react';
import {
  FloatingRootContext,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
} from '@floating-ui/react';
import { MenuOrientation } from '../../menu/root/useMenuRoot';
import { GenericHTMLProps } from '../../utils/types';
import { useDirection } from '../../direction-provider/DirectionContext';

const EMPTY_ARRAY: never[] = [];

export function useMenubarRoot(parameters: useMenubarRoot.Parameters): useMenubarRoot.ReturnValue {
  const { orientation, disabled, loop } = parameters;

  const [positionerElement, setPositionerElementUnwrapped] = React.useState<HTMLElement | null>(
    null,
  );

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const popupRef = React.useRef<HTMLElement>(null);
  const positionerRef = React.useRef<HTMLElement | null>(null);

  const direction = useDirection();
  const setPositionerElement = React.useCallback((value: HTMLElement | null) => {
    positionerRef.current = value;
    setPositionerElementUnwrapped(value);
  }, []);

  const floatingRootContext = useFloatingRootContext({
    elements: {
      reference: null,
      floating: positionerElement,
    },
    open: true,
  });

  const itemDomElements = React.useRef<(HTMLElement | null)[]>([]);
  const itemLabels = React.useRef<(string | null)[]>([]);

  const listNavigation = useListNavigation(floatingRootContext, {
    enabled: !disabled,
    listRef: itemDomElements,
    activeIndex,
    nested: false,
    loop,
    orientation,
    rtl: direction === 'rtl',
    disabledIndices: EMPTY_ARRAY,
    onNavigate: setActiveIndex,
  });

  const { getFloatingProps, getItemProps } = useInteractions([listNavigation]);

  const popupProps = React.useMemo(() => getFloatingProps(), [getFloatingProps]);

  const itemProps = React.useMemo(() => getItemProps(), [getItemProps]);

  return React.useMemo(
    () => ({
      activeIndex,
      itemProps,
      popupProps,
      floatingRootContext,
      itemDomElements,
      itemLabels,
      popupRef,
      positionerRef,
      setPositionerElement,
    }),
    [
      activeIndex,
      itemProps,
      popupProps,
      floatingRootContext,
      itemDomElements,
      itemLabels,
      popupRef,
      positionerRef,
      setPositionerElement,
    ],
  );
}

export namespace useMenubarRoot {
  export interface Parameters {
    /**
     * Whether to loop keyboard focus back to the first item
     * when the end of the list is reached while using the arrow keys.
     */
    loop: boolean;

    /**
     * The visual orientation of the menu.
     * Controls whether roving focus uses up/down or left/right arrow keys.
     */
    orientation: MenuOrientation;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface ReturnValue {
    activeIndex: number | null;
    floatingRootContext: FloatingRootContext;
    itemProps: GenericHTMLProps;
    popupProps: GenericHTMLProps;
    itemDomElements: React.MutableRefObject<(HTMLElement | null)[]>;
    itemLabels: React.MutableRefObject<(string | null)[]>;
    popupRef: React.RefObject<HTMLElement | null>;
    positionerRef: React.RefObject<HTMLElement | null>;
    setPositionerElement: (element: HTMLElement | null) => void;
  }
}
