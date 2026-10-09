'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import type { ReactStore } from '@base-ui/utils/store';
import { useAnchorPositioning } from '../../internals/useAnchorPositioning';
import type {
  Align,
  CollisionAvoidance,
  Side,
  UseAnchorPositioningParameters,
  UseAnchorPositioningReturnValue,
  UseAnchorPositioningSharedParameters,
} from '../../internals/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../internals/types';
import type { AdaptiveOriginMiddleware } from './positioning/adaptiveOriginConstants';
import { usePositioner } from './positioning/usePositioner';
import type { FloatingRootContext } from './floating-root/types';
import type { PopupStoreContext, PopupStoreSelectors, PopupStoreState } from './store';

/**
 * The state every popup Positioner shares.
 */
export interface PopupPositionerState {
  open: boolean;
  side: Side;
  align: Align;
  anchorHidden: boolean;
  instant: string | undefined;
}

type PopupPositionerStoreState = PopupStoreState<unknown> & {
  instantType: string | undefined;
  adaptiveOrigin: AdaptiveOriginMiddleware | undefined;
};

type PopupPositionerStore = ReactStore<
  PopupPositionerStoreState,
  PopupStoreContext<never>,
  PopupStoreSelectors & {
    instantType: (state: PopupPositionerStoreState) => string | undefined;
    adaptiveOrigin: (state: PopupPositionerStoreState) => AdaptiveOriginMiddleware | undefined;
  }
> &
  FloatingRootContext;

export interface UsePopupPositionerOptions<State extends PopupPositionerState> {
  forwardedRef: React.ForwardedRef<HTMLDivElement>;
  /**
   * Whether the popup stays mounted while closed.
   */
  keepMounted: boolean;
  /**
   * Values used when the matching prop isn't set.
   */
  defaults: {
    collisionAvoidance: CollisionAvoidance;
    side?: Side | undefined;
  };
  /**
   * Positioning parameters that replace the props, such as values derived from the popup's parent.
   */
  positioning?:
    | Partial<
        Omit<
          UseAnchorPositioningParameters,
          'floatingRootContext' | 'mounted' | 'keepMounted' | 'adaptiveOrigin'
        >
      >
    | undefined;
  /**
   * State that the part adds to or changes in the shared state.
   */
  state?: (Omit<State, keyof PopupPositionerState> & Partial<PopupPositionerState>) | undefined;
  /**
   * Whether the positioner ignores pointer events.
   * @default !open
   */
  inert?: boolean | undefined;
}

export interface UsePopupPositionerReturnValue {
  element: React.ReactElement;
  positioning: UseAnchorPositioningReturnValue;
}

/**
 * Runs what every popup Positioner does: it positions the popup against its anchor, registers the
 * positioner element, and renders it with the shared state.
 * The part adds what is specific to its popup, such as a backdrop or a scroll lock.
 */
export function usePopupPositioner<State extends PopupPositionerState>(
  store: PopupPositionerStore,
  componentProps: BaseUIComponentProps<'div', State> & UseAnchorPositioningSharedParameters,
  options: UsePopupPositionerOptions<State>,
): UsePopupPositionerReturnValue {
  const {
    render,
    className,
    style,
    anchor,
    positionMethod,
    side,
    align,
    sideOffset,
    alignOffset,
    collisionBoundary,
    collisionPadding,
    arrowPadding,
    sticky,
    disableAnchorTracking,
    collisionAvoidance,
    ...elementProps
  } = componentProps;

  const { forwardedRef, keepMounted, defaults, positioning: positioningOverrides } = options;

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const transitionStatus = store.useState('transitionStatus');
  const instantType = store.useState('instantType');
  const adaptiveOrigin = store.useState('adaptiveOrigin');

  const positioning = useAnchorPositioning({
    anchor,
    floatingRootContext: store,
    positionMethod,
    mounted,
    side: side ?? defaults.side,
    sideOffset,
    align,
    alignOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    disableAnchorTracking,
    keepMounted,
    collisionAvoidance: collisionAvoidance ?? defaults.collisionAvoidance,
    adaptiveOrigin,
    ...positioningOverrides,
  });

  const partState = options.state;
  const partStateValues = partState ? Object.values(partState) : EMPTY_ARRAY;
  const state = React.useMemo(
    () =>
      ({
        open,
        side: positioning.side,
        align: positioning.align,
        anchorHidden: positioning.anchorHidden,
        instant: instantType,
        ...partState,
      }) as State,
    // The part's state is a new object on every render, so it's compared by its values. A part
    // passes the same keys on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      open,
      positioning.side,
      positioning.align,
      positioning.anchorHidden,
      instantType,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ...partStateValues,
    ],
  );

  const element = usePositioner(componentProps, state, {
    styles: positioning.positionerStyles,
    transitionStatus,
    props: elementProps,
    refs: [forwardedRef, store.useStateSetter('positionerElement')],
    hidden: !mounted,
    inert: options.inert ?? !open,
  });

  return { element, positioning };
}
