'use client';
import * as React from 'react';
import { getNextTabbable, getPreviousTabbable, isOutsideEvent } from '@floating-ui/react/utils';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { FocusGuard } from '../../toast/viewport/FocusGuard';
import { useNavigationMenuPositionerContext } from '../positioner/NavigationMenuPositionerContext';
import { useDirection } from '../../direction-provider/DirectionContext';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';

const customStyleHookMapping: CustomStyleHookMapping<NavigationMenuPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the navigation menu contents.
 * Renders a `<nav>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuPopup = React.forwardRef(function NavigationMenuPopup(
  componentProps: NavigationMenuPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { className, render, id: idProp, ...elementProps } = componentProps;

  const {
    open,
    transitionStatus,
    popupElement,
    positionerElement,
    setPopupElement,
    value,
    beforeInsideRef,
    beforeOutsideRef,
    afterInsideRef,
    afterOutsideRef,
  } = useNavigationMenuRootContext();
  const positioning = useNavigationMenuPositionerContext();
  const direction = useDirection();

  const id = useBaseUiId(idProp);

  const state: NavigationMenuPopup.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
      side: positioning.side,
      align: positioning.align,
      anchorHidden: positioning.anchorHidden,
    }),
    [open, transitionStatus, positioning.side, positioning.align, positioning.anchorHidden],
  );

  const prevSize = React.useRef({ width: 0, height: 0 });

  useModernLayoutEffect(() => {
    if (popupElement && prevSize.current.height === 0) {
      prevSize.current = { width: popupElement.offsetWidth, height: popupElement.offsetHeight };
    }
  }, [popupElement]);

  useModernLayoutEffect(() => {
    if (!popupElement || !positionerElement || !value) {
      return undefined;
    }

    let currentWidth = prevSize.current.width;
    let currentHeight = prevSize.current.height;
    popupElement.style.removeProperty('--popup-width');
    popupElement.style.removeProperty('--popup-height');
    const nextWidth = popupElement.offsetWidth;
    const nextHeight = popupElement.offsetHeight;

    if (currentHeight === 0 || currentWidth === 0) {
      currentWidth = nextWidth;
      currentHeight = nextHeight;
    }

    popupElement.style.setProperty('--popup-width', `${currentWidth}px`);
    popupElement.style.setProperty('--popup-height', `${currentHeight}px`);
    positionerElement.style.setProperty('--positioner-width', `${nextWidth}px`);
    positionerElement.style.setProperty('--positioner-height', `${nextHeight}px`);

    prevSize.current = { width: nextWidth, height: nextHeight };

    const frame = requestAnimationFrame(() => {
      popupElement.style.setProperty('--popup-width', `${nextWidth}px`);
      popupElement.style.setProperty('--popup-height', `${nextHeight}px`);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [positionerElement, value, popupElement]);

  // Allow the arrow to transition while the popup's size transitions.
  useModernLayoutEffect(() => {
    if (!popupElement || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(positioning.update);
    observer.observe(popupElement);
    return () => {
      observer.disconnect();
    };
  }, [popupElement, positioning.update]);

  // Ensure popup size transitions correctly when anchored to `bottom` (side=top) or `right` (side=left).
  let isOriginSide = positioning.side === 'top';
  let isPhysicalLeft = positioning.side === 'left';
  if (direction === 'rtl') {
    isOriginSide = isOriginSide || positioning.side === 'inline-end';
    isPhysicalLeft = isPhysicalLeft || positioning.side === 'inline-end';
  } else {
    isOriginSide = isOriginSide || positioning.side === 'inline-start';
    isPhysicalLeft = isPhysicalLeft || positioning.side === 'inline-start';
  }

  const element = useRenderElement('nav', componentProps, {
    state,
    ref: [forwardedRef, setPopupElement],
    props: [
      {
        id,
        tabIndex: -1,
        style: isOriginSide
          ? {
              position: 'absolute',
              [positioning.side === 'top' ? 'bottom' : 'top']: '0',
              [isPhysicalLeft ? 'right' : 'left']: '0',
            }
          : {},
      },
      elementProps,
    ],
    customStyleHookMapping,
  });

  return (
    <React.Fragment>
      <FocusGuard
        ref={beforeInsideRef}
        onFocus={(event) => {
          if (positionerElement && isOutsideEvent(event, positionerElement)) {
            getNextTabbable(positionerElement)?.focus();
          } else {
            beforeOutsideRef.current?.focus();
          }
        }}
      />
      {element}
      <FocusGuard
        ref={afterInsideRef}
        onFocus={(event) => {
          if (positionerElement && isOutsideEvent(event, positionerElement)) {
            getPreviousTabbable(positionerElement)?.focus();
          } else {
            afterOutsideRef.current?.focus();
          }
        }}
      />
    </React.Fragment>
  );
});

export namespace NavigationMenuPopup {
  export interface State {
    /**
     * If `true`, the popup is open.
     */
    open: boolean;
    /**
     * The transition status of the popup.
     */
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'nav', State> {}
}
