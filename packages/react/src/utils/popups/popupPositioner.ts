'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import type { ReactStore } from '@base-ui/utils/store';
import { useTriggerSwitchTransition } from '../../internals/useTriggerSwitchTransition';
import type { TriggerChangeStore } from '../../internals/useTriggerSwitchTransition';
import { useAnchorPositioning } from '../../internals/useAnchorPositioning';
import { POPUP_COLLISION_AVOIDANCE } from '../../internals/constants';
import type {
  Align,
  Side,
  UseAnchorPositioningParameters,
  UseAnchorPositioningReturnValue,
  UseAnchorPositioningSharedParameters,
} from '../../internals/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../internals/types';
import type { AdaptiveOriginMiddleware } from './positioning/adaptiveOriginConstants';
import { usePositioner } from './positioning/usePositioner';
import type { PositioningInteractionStore } from './types';
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
  PositioningInteractionStore;

export interface UsePopupPositionerOptions<State extends PopupPositionerState> {
  forwardedRef: React.ForwardedRef<HTMLDivElement>;
  /** Menu and Popover also suppress Popup transitions after switching triggers. */
  instantTypeStore?: TriggerChangeStore | undefined;
  /** Overrides the instant reason, for example when Tooltip tracks the cursor. */
  instant?: string | undefined;
  /**
   * Whether the popup stays mounted while closed.
   */
  keepMounted: boolean;
  /**
   * Positioning parameters that replace the props, such as values derived from the popup's parent.
   */
  positioning?:
    | Partial<
        Omit<
          UseAnchorPositioningParameters,
          'interactionStore' | 'mounted' | 'keepMounted' | 'adaptiveOrigin' | 'onAnchorTracking'
        >
      >
    | undefined;
  /**
   * State that the part adds to the shared state.
   */
  state?: Omit<State, keyof PopupPositionerState> | undefined;
  /**
   * Whether the positioner ignores pointer events.
   * @default !open
   */
  inert?: boolean | undefined;
}

/**
 * The positioning that a Positioner provides to its parts, such as the Arrow.
 */
export interface PopupPositioning extends UseAnchorPositioningReturnValue {
  /**
   * The reason to skip position transitions, or `undefined` when they can run.
   */
  instant: string | undefined;
}

export interface UsePopupPositionerReturnValue {
  element: React.ReactElement;
  positioning: PopupPositioning;
  open: boolean;
  mounted: boolean;
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

  const { forwardedRef, keepMounted, positioning: positioningOverrides } = options;

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const transitionStatus = store.useState('transitionStatus');
  const instantType = store.useState('instantType');
  const adaptiveOrigin = store.useState('adaptiveOrigin');
  const positionerElement = store.useState('positionerElement');
  const popupElement = store.useState('popupElement');
  const viewportElement = store.useState('viewportElement');
  const domReference = store.useState('anchorElement');
  const onAnchorTracking = React.useRef<(() => void) | null>(null);

  const positioning = useAnchorPositioning({
    anchor,
    interactionStore: store,
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
    disableAnchorTracking,
    keepMounted,
    collisionAvoidance: collisionAvoidance ?? POPUP_COLLISION_AVOIDANCE,
    adaptiveOrigin,
    onAnchorTracking,
    ...positioningOverrides,
  });

  const instantPosition = useTriggerSwitchTransition({
    store,
    instantTypeStore: options.instantTypeStore,
    domReference,
    positionerElement,
    popupElement,
    arrowElementRef: positioning.arrowElementRef,
    viewportElement,
    onAnchorTracking,
    open,
  });
  // Keep this fallback local: sharing it with Popup would suppress enter and exit transitions.
  const instant =
    options.instant ?? instantType ?? (mounted && instantPosition ? 'trigger-change' : undefined);

  const partState = options.state;
  const partStateValues = partState ? Object.values(partState) : EMPTY_ARRAY;
  const state = React.useMemo(
    () =>
      ({
        open,
        side: positioning.side,
        align: positioning.align,
        anchorHidden: positioning.anchorHidden,
        instant,
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
      instant,
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

  const popupPositioning = React.useMemo(
    () => ({ ...positioning, instant }),
    [positioning, instant],
  );

  return { element, positioning: popupPositioning, open, mounted };
}
