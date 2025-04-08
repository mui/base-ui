import * as React from 'react';
import {
  FloatingRootContext,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
} from '@floating-ui/react';
import { type MenuOrientation } from '../../menu/root/useMenuRoot';
import { GenericHTMLProps } from '../../utils/types';
import { useDirection } from '../../direction-provider/DirectionContext';

const EMPTY_ARRAY: never[] = [];

export function useMenubarRoot(parameters: useMenubarRoot.Parameters): useMenubarRoot.ReturnValue {
  const { orientation, disabled, loop } = parameters;

  const [contentElement, setContentElement] = React.useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(0);
  const [hasSubmenuOpen, setHasSubmenuOpen] = React.useState(false);
  const direction = useDirection();

  const floatingRootContext = useFloatingRootContext({
    elements: {
      reference: null,
      floating: contentElement,
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
    onNavigate: (index) => {
      setActiveIndex(index ?? 0);
    },
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
      contentElement,
      setContentElement,
      hasSubmenuOpen,
      setHasSubmenuOpen,
    }),
    [
      activeIndex,
      itemProps,
      popupProps,
      floatingRootContext,
      itemDomElements,
      hasSubmenuOpen,
      itemLabels,
      contentElement,
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
    itemDomElements: React.RefObject<(HTMLElement | null)[]>;
    itemLabels: React.RefObject<(string | null)[]>;
    contentElement: HTMLElement | null;
    setContentElement: (element: HTMLElement | null) => void;
    hasSubmenuOpen: boolean;
    setHasSubmenuOpen: (open: boolean) => void;
  }
}
