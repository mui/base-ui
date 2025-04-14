'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { tabbable as tabbableUtils } from '@floating-ui/react/utils';
import { FocusableElement, tabbable } from 'tabbable';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { FocusGuard } from '../../toast/viewport/FocusGuard';
import { ownerDocument } from '../../utils/owner';
import { useNavigationMenuPositionerContext } from '../positioner/NavigationMenuPositionerContext';

/**
 * A container for the navigation menu contents.
 * Renders a `<nav>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuPopup = React.forwardRef(function NavigationMenuPopup(
  componentProps: NavigationMenuPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { className, render, id: idProp, ...elementProps } = componentProps;

  const {
    currentTriggerElement,
    open,
    transitionStatus,
    popupElement,
    positionerElement,
    setPopupElement,
    value,
  } = useNavigationMenuRootContext();
  const positioning = useNavigationMenuPositionerContext();

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

  useEnhancedEffect(() => {
    if (!popupElement || !positionerElement || !value) {
      return undefined;
    }

    const currentWidth = popupElement.offsetWidth;
    const currentHeight = popupElement.offsetHeight;
    popupElement.style.removeProperty('--popup-width');
    popupElement.style.removeProperty('--popup-height');
    const nextWidth = popupElement.offsetWidth;
    const nextHeight = popupElement.offsetHeight;
    popupElement.style.setProperty('--popup-width', `${currentWidth}px`);
    popupElement.style.setProperty('--popup-height', `${currentHeight}px`);
    positionerElement.style.setProperty('--positioner-width', `${nextWidth}px`);
    positionerElement.style.setProperty('--positioner-height', `${nextHeight}px`);

    const frame = requestAnimationFrame(() => {
      popupElement.style.setProperty('--popup-width', `${nextWidth}px`);
      popupElement.style.setProperty('--popup-height', `${nextHeight}px`);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [positionerElement, popupElement, value]);

  useEnhancedEffect(() => {
    if (!popupElement || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(positioning.update);
    observer.observe(popupElement);
    return () => {
      observer.disconnect();
    };
  }, [popupElement, positioning.update]);

  const renderElement = useRenderElement('nav', componentProps, {
    state,
    ref: [forwardedRef, setPopupElement],
    props: [
      {
        id,
        tabIndex: -1,
        onFocus(event) {
          if (
            !event.relatedTarget ||
            event.relatedTarget === currentTriggerElement ||
            event.currentTarget !== event.target ||
            !popupElement
          ) {
            return;
          }

          const tabbableElements = tabbable(popupElement);
          const popupTabbable =
            tabbableElements[
              event.relatedTarget === currentTriggerElement ? 0 : tabbableElements.length - 1
            ] || popupElement;
          popupTabbable.focus();
        },
      },
      elementProps,
    ],
    customStyleHookMapping: transitionStatusMapping,
  });

  return (
    <React.Fragment>
      <FocusGuard
        onFocus={() => {
          currentTriggerElement?.focus({ preventScroll: true });
          if (popupElement) {
            tabbableUtils.enableFocusInside(popupElement);
          }
        }}
      />
      {renderElement()}
      <FocusGuard
        onFocus={() => {
          const tabbableElements = tabbable(ownerDocument(currentTriggerElement).body);
          const index = tabbableElements.indexOf(currentTriggerElement as FocusableElement);
          // Skip over the focus guard
          const nextElement = tabbableElements[index + 2] || currentTriggerElement;
          nextElement?.focus({ preventScroll: true });
        }}
      />
    </React.Fragment>
  );
});

namespace NavigationMenuPopup {
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

NavigationMenuPopup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { NavigationMenuPopup };
