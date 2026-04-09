'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import { HTMLProps } from '../../internals/types';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { CollapsiblePanelDataAttributes } from './CollapsiblePanelDataAttributes';
import type { CollapsibleRoot } from '../root/CollapsibleRoot';
import type { TransitionStatus } from '../../internals/useTransitionStatus';

type AnimationType = 'css-transition' | 'css-animation' | 'none';

interface Dimensions {
  height: number | undefined;
  width: number | undefined;
}

const EMPTY_DIMENSIONS: Dimensions = {
  height: undefined,
  width: undefined,
};

export function useCollapsiblePanel(
  parameters: UseCollapsiblePanelParameters,
): UseCollapsiblePanelReturnValue {
  const {
    externalRef,
    hiddenUntilFound,
    id: idParam,
    keepMounted,
    mounted,
    onOpenChange,
    open,
    setMounted,
    setOpen,
    transitionStatus,
  } = parameters;

  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const animationTypeRef = React.useRef<AnimationType | null>(null);
  const [dimensions, setDimensionsUnwrapped] = React.useState<Dimensions>(EMPTY_DIMENSIONS);
  const lastMeasuredDimensionsRef = React.useRef<Dimensions>(EMPTY_DIMENSIONS);
  // `beforematch` should reveal the matched content immediately, so the next
  // open cycle skips author-defined motion once and then returns to normal.
  const shouldSkipNextOpenRef = React.useRef(false);
  // Keyframe mount animations on initially open panels cause a visible layout
  // shift during the server-rendered first paint, so suppress that first open
  // lifecycle until the panel has been closed once.
  const shouldPreventMountAnimationRef = React.useRef(open);
  // Some open paths intentionally bypass motion, but the shared root transition
  // status still advances asynchronously. Override the panel to idle so its data
  // attributes and dimension cleanup reflect the immediate open state.
  const [forcePanelIdle, setForcePanelIdle] = React.useState(false);

  const mergedPanelRef = useMergedRefs(externalRef, panelRef);

  const hidden = !open && !mounted;
  const panelTransitionStatus = forcePanelIdle ? 'idle' : transitionStatus;
  const renderedDimensions =
    !open &&
    mounted &&
    animationTypeRef.current === 'css-animation' &&
    dimensions.height === undefined &&
    dimensions.width === undefined
      ? lastMeasuredDimensionsRef.current
      : dimensions;

  // Most measured dimensions are reused later when CSS keyframe closes need a
  // pixel size after the rendered dimensions have been reset back to `auto`.
  // Passing `false` is only for clearing the current dimensions state.
  const setDimensions = useStableCallback(
    (nextDimensions: Dimensions, shouldCacheMeasurement: boolean = true) => {
      if (shouldCacheMeasurement) {
        lastMeasuredDimensionsRef.current = nextDimensions;
      }

      setDimensionsUnwrapped(nextDimensions);
    },
  );

  useIsoLayoutEffect(() => {
    // `forcePanelIdle` is only a temporary override for open paths that skip
    // motion. Keep it active while the shared root still reports `starting`,
    // then drop it once the root transition state catches up.
    if (!forcePanelIdle || transitionStatus === 'starting') {
      return;
    }

    setForcePanelIdle(false);
  }, [forcePanelIdle, transitionStatus]);

  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return undefined;
    }

    const animationType = getAnimationType(panel, shouldPreventMountAnimationRef.current && open);
    animationTypeRef.current = animationType;

    // Initially open keyframe panels skip their first paint animation to avoid
    // layout shift, but we still need to cache the expanded size so the first
    // close animation can start from pixels instead of `auto`.
    if (
      open &&
      transitionStatus === 'idle' &&
      shouldPreventMountAnimationRef.current &&
      animationType === 'css-animation'
    ) {
      lastMeasuredDimensionsRef.current = getDimensions(panel);
      return undefined;
    }

    // Handle the opening pass: measure the expanded size and, when necessary,
    // neutralize author-defined motion so the panel can open immediately.
    if (open && transitionStatus === 'starting') {
      if (animationType === 'none') {
        setDimensions(getDimensions(panel));
        setForcePanelIdle(true);
        return undefined;
      }

      // `beforematch` opens should reveal the panel immediately so find-in-page
      // does not wait for the author-defined transition or animation to finish.
      const skipNextOpen = shouldSkipNextOpenRef.current;
      shouldSkipNextOpenRef.current = false;

      if (animationType === 'css-transition') {
        const restoreLayoutStyles = resetLayoutStyles(panel);
        setDimensions(getDimensions(panel));

        if (!skipNextOpen) {
          return restoreLayoutStyles;
        }

        const restoreTransitionDuration = setTemporaryStyle(panel, 'transition-duration', '0s');
        setForcePanelIdle(true);
        return chainCleanups(restoreLayoutStyles, scheduleRestore(restoreTransitionDuration));
      }

      if (animationType === 'css-animation') {
        setDimensions(getDimensions(panel));

        if (!skipNextOpen) {
          const restoreAnimationName = setTemporaryStyle(panel, 'animation-name', 'none');
          restoreAnimationName();

          return undefined;
        }

        const restoreAnimationName = setTemporaryStyle(panel, 'animation-name', 'none');
        const restoreAnimationDuration = setTemporaryStyle(panel, 'animation-duration', '0s');

        restoreAnimationName();
        setForcePanelIdle(true);

        return scheduleRestore(restoreAnimationDuration);
      }
    }

    // Capture the current size as soon as close is requested, before the
    // deferred ending phase applies closed styles. This keeps close transitions
    // starting from a measured pixel value, including interrupted opens.
    if (!open && mounted && (transitionStatus === 'idle' || transitionStatus === 'starting')) {
      if (animationType === 'none') {
        setDimensions(EMPTY_DIMENSIONS, false);
        setMounted(false);
        return undefined;
      }

      if (animationType === 'css-animation') {
        shouldPreventMountAnimationRef.current = false;
      }

      setDimensions(getDimensions(panel));
      return undefined;
    }

    if (transitionStatus !== 'ending') {
      return undefined;
    }

    if (animationType === 'none') {
      setMounted(false);
      return undefined;
    }

    const nextDimensions = getDimensions(panel);
    const hasMeasuredSize = (nextDimensions.height ?? 0) > 0 || (nextDimensions.width ?? 0) > 0;

    if (!hasMeasuredSize) {
      setMounted(false);
      return undefined;
    }

    setDimensions(nextDimensions);

    if (animationType === 'css-animation') {
      const restoreAnimationName = setTemporaryStyle(panel, 'animation-name', 'none');
      restoreAnimationName();
    }

    return undefined;
  }, [mounted, open, setDimensions, setMounted, transitionStatus]);

  useOpenChangeComplete({
    enabled: open && mounted && panelTransitionStatus === 'idle',
    open: true,
    ref: panelRef,
    onComplete() {
      if (!open) {
        return;
      }

      setDimensions(EMPTY_DIMENSIONS, false);
    },
  });

  useOpenChangeComplete({
    enabled: !open && mounted && panelTransitionStatus === 'ending',
    open: false,
    ref: panelRef,
    onComplete() {
      if (open) {
        return;
      }

      setMounted(false);
      setDimensions(EMPTY_DIMENSIONS, false);
    },
  });

  useIsoLayoutEffect(() => {
    const panel = panelRef.current;

    if (!panel || !hiddenUntilFound || !hidden) {
      return;
    }

    /**
     * React only supports a boolean for the `hidden` attribute and forces
     * legit string values to booleans so we have to force it back in the DOM
     * when necessary: https://github.com/facebook/react/issues/24740
     */
    panel.setAttribute('hidden', 'until-found');

    /**
     * Persist the closed transition styles while hidden so changing the hidden
     * attribute to `'until-found'` doesn't itself trigger the transition.
     */
    if (getAnimationType(panel) === 'css-transition') {
      panel.setAttribute(CollapsiblePanelDataAttributes.startingStyle, '');
    }
  }, [hidden, hiddenUntilFound]);

  React.useEffect(
    function registerBeforeMatchListener() {
      const panel = panelRef.current;
      if (!panel) {
        return undefined;
      }

      function handleBeforeMatch(event: Event) {
        shouldSkipNextOpenRef.current = true;
        setOpen(true);
        onOpenChange(true, createChangeEventDetails(REASONS.none, event));
      }

      return addEventListener(panel, 'beforematch', handleBeforeMatch);
    },
    [onOpenChange, setOpen],
  );

  const shouldRender = keepMounted || hiddenUntilFound || mounted || open;

  return React.useMemo(
    () => ({
      height: renderedDimensions.height,
      props: {
        hidden,
        id: idParam,
        style: {
          animationName: shouldPreventMountAnimationRef.current && open ? 'none' : undefined,
        },
      },
      ref: mergedPanelRef,
      shouldRender,
      transitionStatus: panelTransitionStatus,
      width: renderedDimensions.width,
    }),
    [
      renderedDimensions.height,
      renderedDimensions.width,
      hidden,
      idParam,
      mergedPanelRef,
      open,
      panelTransitionStatus,
      shouldRender,
    ],
  );
}

function getDimensions(element: HTMLElement): Dimensions {
  return {
    height: element.scrollHeight,
    width: element.scrollWidth,
  };
}

function getAnimationType(
  element: HTMLElement,
  hasSuppressedMountAnimation: boolean = false,
): AnimationType {
  const panelStyles = getComputedStyle(element);
  const hasAnimation =
    (panelStyles.animationName
      .split(',')
      .map((name) => name.trim())
      .some((name) => name !== '' && name !== 'none') ||
      hasSuppressedMountAnimation) &&
    hasNonZeroDuration(panelStyles.animationDuration);
  const hasTransition = hasNonZeroDuration(panelStyles.transitionDuration);

  if (hasAnimation && hasTransition) {
    if (process.env.NODE_ENV !== 'production') {
      warn(
        'CSS transitions and CSS animations both detected on Collapsible or Accordion panel.',
        'Only one of either animation type should be used.',
      );
    }

    return 'css-transition';
  }

  if (hasTransition) {
    return 'css-transition';
  }

  if (hasAnimation) {
    return 'css-animation';
  }

  return 'none';
}

function hasNonZeroDuration(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .some((part) => part !== '' && Number.parseFloat(part) > 0);
}

/**
 * Temporarily overrides an inline style property and returns a cleanup that
 * restores the previous inline value and priority.
 * @param element - The element whose inline style should be updated.
 * @param property - The CSS property name to override.
 * @param value - The temporary value to assign.
 * @returns A cleanup function that restores the original inline style state.
 */
function setTemporaryStyle(element: HTMLElement, property: string, value: string): () => void {
  const previousValue = element.style.getPropertyValue(property);
  const previousPriority = element.style.getPropertyPriority(property);

  element.style.setProperty(property, value);

  return () => {
    if (previousValue === '') {
      element.style.removeProperty(property);
      return;
    }

    element.style.setProperty(property, previousValue, previousPriority);
  };
}

/**
 * Temporarily resets inline alignment styles that can distort scroll-based
 * size measurements, then restores them on the next animation frame.
 * @param element - The panel element being measured.
 * @returns A cleanup function that cancels the scheduled restore and reapplies
 * the original inline layout styles immediately.
 */
function resetLayoutStyles(element: HTMLElement): () => void {
  const originalLayoutStyles = {
    'justify-content': element.style.justifyContent,
    'align-items': element.style.alignItems,
    'align-content': element.style.alignContent,
    'justify-items': element.style.justifyItems,
  };

  Object.keys(originalLayoutStyles).forEach((key) => {
    element.style.setProperty(key, 'initial', 'important');
  });

  let frame = -1;

  frame = AnimationFrame.request(() => {
    Object.entries(originalLayoutStyles).forEach(([key, value]) => {
      if (value === '') {
        element.style.removeProperty(key);
        return;
      }

      element.style.setProperty(key, value);
    });
  });

  return () => {
    AnimationFrame.cancel(frame);
    Object.entries(originalLayoutStyles).forEach(([key, value]) => {
      if (value === '') {
        element.style.removeProperty(key);
        return;
      }

      element.style.setProperty(key, value);
    });
  };
}

/**
 * Defers a cleanup by two animation frames so the browser can commit the
 * temporary motion override before the original inline style is restored.
 * @param restore - The cleanup callback to run later.
 * @returns A cleanup function that cancels the scheduled restore callbacks.
 */
function scheduleRestore(restore: () => void): () => void {
  let frame = -1;
  let nextFrame = -1;

  frame = AnimationFrame.request(() => {
    nextFrame = AnimationFrame.request(() => {
      restore();
    });
  });

  return () => {
    AnimationFrame.cancel(frame);
    AnimationFrame.cancel(nextFrame);
  };
}

/**
 * Combines multiple optional cleanup callbacks into a single cleanup function.
 * @param cleanups - The cleanup callbacks to invoke in order.
 * @returns A cleanup function that runs each defined callback once.
 */
function chainCleanups(...cleanups: Array<(() => void) | undefined>): () => void {
  return () => {
    cleanups.forEach((cleanup) => cleanup?.());
  };
}

export interface UseCollapsiblePanelParameters {
  externalRef: React.ForwardedRef<HTMLDivElement>;
  /**
   * Allows the browser's built-in page search to find and expand the panel contents.
   *
   * Overrides the `keepMounted` prop and uses `hidden="until-found"`
   * to hide the element without removing it from the DOM.
   */
  hiddenUntilFound: boolean;
  /**
   * The `id` attribute of the panel.
   */
  id: React.HTMLAttributes<Element>['id'];
  /**
   * Whether to keep the element in the DOM while the panel is closed.
   * This prop is ignored when `hiddenUntilFound` is used.
   */
  keepMounted: boolean;
  /**
   * Whether the collapsible panel is mounted for transition and hidden-state
   * purposes. This can be `false` while the element remains in the DOM when
   * `keepMounted` or `hiddenUntilFound` is enabled.
   */
  mounted: boolean;
  onOpenChange: (open: boolean, eventDetails: CollapsibleRoot.ChangeEventDetails) => void;
  /**
   * Whether the collapsible panel is currently open.
   */
  open: boolean;
  setMounted: (nextMounted: boolean) => void;
  setOpen: (nextOpen: boolean) => void;
  transitionStatus: TransitionStatus;
}

export interface UseCollapsiblePanelReturnValue {
  height: number | undefined;
  props: HTMLProps;
  ref: React.Ref<HTMLDivElement>;
  shouldRender: boolean;
  transitionStatus: TransitionStatus;
  width: number | undefined;
}

export interface UseCollapsiblePanelState {}
