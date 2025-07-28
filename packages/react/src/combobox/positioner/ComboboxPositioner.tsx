'use client';
import * as React from 'react';
import type { VirtualElement } from '@floating-ui/react-dom';
import { useSelector } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useComboboxFloatingContext, useComboboxRootContext } from '../root/ComboboxRootContext';
import { ComboboxPositionerContext } from './ComboboxPositionerContext';
import { type Side, type Align, useAnchorPositioning } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useComboboxPortalContext } from '../portal/ComboboxPortalContext';
import { DROPDOWN_COLLISION_AVOIDANCE } from '../../utils/constants';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';

/**
 * Positions the popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const ComboboxPositioner = React.forwardRef(function ComboboxPositioner(
  componentProps: ComboboxPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    anchor,
    positionMethod = 'absolute',
    side = 'bottom',
    align = 'center',
    sideOffset = 0,
    alignOffset = 0,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding = 5,
    arrowPadding = 5,
    sticky = false,
    trackAnchor = true,
    collisionAvoidance = DROPDOWN_COLLISION_AVOIDANCE,
    ...elementProps
  } = componentProps;

  const { store } = useComboboxRootContext();
  const floatingRootContext = useComboboxFloatingContext();
  const keepMounted = useComboboxPortalContext();

  const open = useSelector(store, selectors.open);
  const mounted = useSelector(store, selectors.mounted);

  const positioning = useAnchorPositioning({
    anchor,
    floatingRootContext,
    positionMethod,
    mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    trackAnchor,
    keepMounted,
    collisionAvoidance,
  });

  const defaultProps: HTMLProps = React.useMemo(() => {
    const hiddenStyles: React.CSSProperties = {};

    if (!open) {
      hiddenStyles.pointerEvents = 'none';
    }

    return {
      role: 'presentation',
      hidden: !mounted,
      style: {
        ...positioning.positionerStyles,
        ...hiddenStyles,
      },
    };
  }, [open, mounted, positioning.positionerStyles]);

  const state: ComboboxPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioning.side,
      align: positioning.align,
      anchorHidden: positioning.anchorHidden,
    }),
    [open, positioning.side, positioning.align, positioning.anchorHidden],
  );

  const contextValue: ComboboxPositionerContext = React.useMemo(
    () => ({
      side: positioning.side,
      align: positioning.align,
      arrowRef: positioning.arrowRef,
      arrowUncentered: positioning.arrowUncentered,
      arrowStyles: positioning.arrowStyles,
      anchorHidden: positioning.anchorHidden,
    }),
    [
      positioning.side,
      positioning.align,
      positioning.arrowRef,
      positioning.arrowUncentered,
      positioning.arrowStyles,
      positioning.anchorHidden,
    ],
  );

  const setPositionerElement = useEventCallback((element) => {
    store.set('positionerElement', element);
  });

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, setPositionerElement],
    props: [defaultProps, elementProps],
    customStyleHookMapping: popupStateMapping,
  });

  return (
    <ComboboxPositionerContext.Provider value={contextValue}>
      {element}
    </ComboboxPositionerContext.Provider>
  );
});

export namespace ComboboxPositioner {
  export interface State {
    /**
     * Whether the preview card is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    anchorHidden: boolean;
  }

  export interface Props
    extends Omit<useAnchorPositioning.SharedParameters, 'anchor'>,
      BaseUIComponentProps<'div', State> {
    /**
     * An element to position the popup against.
     * By default, the popup will be positioned against the input.
     */
    anchor?:
      | Element
      | null
      | VirtualElement
      | React.RefObject<Element | null>
      | (() => Element | VirtualElement | null);
  }
}
