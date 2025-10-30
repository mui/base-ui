'use client';
import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { useAnchorPositioning, type Side, type Align } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { EMPTY_OBJECT, POPUP_COLLISION_AVOIDANCE } from '../../utils/constants';
import { ToastPositionerContext } from './ToastPositionerContext';
import { useFloatingRootContext } from '../../floating-ui-react';
import { NOOP } from '../../utils/noop';
import type { ToastObject } from '../useToastManager';

/**
 * Positions the toast against the anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastPositioner = React.forwardRef(function ToastPositioner(
  componentProps: ToastPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { toast, ...props } = componentProps;

  const positionerProps = (toast.positionerProps ?? EMPTY_OBJECT) as NonNullable<
    typeof toast.positionerProps
  >;

  const {
    render,
    className,
    anchor: anchorProp = positionerProps.anchor,
    positionMethod = positionerProps.positionMethod ?? 'absolute',
    side = positionerProps.side ?? 'top',
    align = positionerProps.align ?? 'center',
    sideOffset = positionerProps.sideOffset ?? 0,
    alignOffset = positionerProps.alignOffset ?? 0,
    collisionBoundary = positionerProps.collisionBoundary ?? 'clipping-ancestors',
    collisionPadding = positionerProps.collisionPadding ?? 5,
    arrowPadding = positionerProps.arrowPadding ?? 5,
    sticky = positionerProps.sticky ?? false,
    trackAnchor = positionerProps.trackAnchor ?? true,
    collisionAvoidance = positionerProps.collisionAvoidance ?? POPUP_COLLISION_AVOIDANCE,
    ...elementProps
  } = props;

  const [positionerElement, setPositionerElement] = React.useState<HTMLDivElement | null>(null);

  const anchor = isElement(anchorProp) ? anchorProp : null;

  const floatingRootContext = useFloatingRootContext({
    open: true,
    onOpenChange: NOOP,
    elements: {
      floating: positionerElement,
      reference: anchor,
    },
  });

  const positioning = useAnchorPositioning({
    anchor,
    positionMethod,
    floatingRootContext,
    mounted: true,
    side,
    sideOffset,
    align,
    alignOffset,
    collisionBoundary,
    collisionPadding,
    sticky,
    arrowPadding,
    trackAnchor,
    keepMounted: true,
    collisionAvoidance,
  });

  const defaultProps: HTMLProps = React.useMemo(() => {
    const hiddenStyles: React.CSSProperties = {};

    return {
      role: 'presentation',
      style: {
        ...positioning.positionerStyles,
        ...hiddenStyles,
      },
    };
  }, [positioning.positionerStyles]);

  const state: ToastPositioner.State = React.useMemo(
    () => ({
      side: positioning.side,
      align: positioning.align,
      anchorHidden: positioning.anchorHidden,
    }),
    [positioning.side, positioning.align, positioning.anchorHidden],
  );

  const contextValue: ToastPositionerContext = React.useMemo(
    () => ({
      ...state,
      arrowRef: positioning.arrowRef,
      arrowStyles: positioning.arrowStyles,
      arrowUncentered: positioning.arrowUncentered,
    }),
    [state, positioning.arrowRef, positioning.arrowStyles, positioning.arrowUncentered],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    props: [defaultProps, elementProps],
    ref: [forwardedRef, setPositionerElement],
    stateAttributesMapping: popupStateMapping,
  });

  return (
    <ToastPositionerContext.Provider value={contextValue}>
      {element}
    </ToastPositionerContext.Provider>
  );
});

export interface ToastPositionerState {
  side: Side;
  align: Align;
  anchorHidden: boolean;
}

export interface ToastPositionerProps
  extends BaseUIComponentProps<'div', ToastPositioner.State>,
    Omit<useAnchorPositioning.SharedParameters, 'side' | 'anchor'> {
  /**
   * An element to position the toast against.
   */
  anchor?: Element | null;
  /**
   * Which side of the anchor element to align the toast against.
   * May automatically change to avoid collisions.
   * @default 'top'
   */
  side?: Side;
  /**
   * The toast object associated with the positioner.
   */
  toast: ToastObject<any>;
  /**
   * The trigger element for the toast. Falls back to the anchor element when not provided.
   */
  trigger?: Element | null;
}

export namespace ToastPositioner {
  export type State = ToastPositionerState;
  export type Props = ToastPositionerProps;
}
