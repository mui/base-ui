'use client';
import * as React from 'react';
import { HTMLProps } from '../../utils/types';
import { useLayoutEffect } from '../../utils/useLayoutEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { useForkRef } from '../../utils/useForkRef';
import { useOnMount } from '../../utils/useOnMount';
import { AnimationFrame } from '../../utils/useAnimationFrame';
import { warn } from '../../utils/warn';
import type { AnimationType, Dimensions } from '../root/useCollapsibleRoot';
import { CollapsiblePanelDataAttributes } from './CollapsiblePanelDataAttributes';
import { AccordionRootDataAttributes } from '../../accordion/root/AccordionRootDataAttributes';

export function useCollapsiblePanel(
  parameters: useCollapsiblePanel.Parameters,
): useCollapsiblePanel.ReturnValue {
  const {
    abortControllerRef,
    animationTypeRef,
    externalRef,
    height,
    hiddenUntilFound,
    keepMounted,
    id: idParam,
    mounted,
    onOpenChange,
    open,
    panelRef,
    runOnceAnimationsFinish,
    setDimensions,
    setMounted,
    setOpen,
    setPanelId,
    setVisible,
    transitionDimensionRef,
    visible,
    width,
  } = parameters;

  const isBeforeMatchRef = React.useRef(false);
  const latestAnimationNameRef = React.useRef<string>(null);
  const shouldCancelInitialOpenAnimationRef = React.useRef(open);
  const shouldCancelInitialOpenTransitionRef = React.useRef(open);

  /**
   * When opening, the `hidden` attribute is removed immediately.
   * When closing, the `hidden` attribute is set after any exit animations runs.
   */
  const hidden = React.useMemo(() => {
    if (animationTypeRef.current === 'css-animation') {
      return !visible;
    }

    return !open && !mounted;
  }, [open, mounted, visible, animationTypeRef]);

  useLayoutEffect(() => {
    if (!keepMounted && !open) {
      setPanelId(undefined);
    } else {
      setPanelId(idParam);
    }
    return () => {
      setPanelId(undefined);
    };
  }, [idParam, setPanelId, keepMounted, open]);

  /**
   * When `keepMounted` is `true` this runs once as soon as it exists in the DOM
   * regardless of initial open state.
   *
   * When `keepMounted` is `false` this runs on every mount, typically every
   * time it opens. If the panel is in the middle of a close transition that is
   * interrupted and re-opens, this won't run as the panel was not unmounted.
   */
  const handlePanelRef = useEventCallback((element: HTMLElement) => {
    if (!element) {
      return undefined;
    }
    if (animationTypeRef.current == null || transitionDimensionRef.current == null) {
      const panelStyles = getComputedStyle(element);
      /**
       * animationTypeRef is safe to read in render because it's only ever set
       * once here during the first render and never again.
       * https://react.dev/learn/referencing-values-with-refs#best-practices-for-refs
       */
      if (panelStyles.animationName !== 'none' && panelStyles.transitionDuration !== '0s') {
        warn('CSS transitions and CSS animations both detected');
      } else if (panelStyles.animationName === 'none' && panelStyles.transitionDuration !== '0s') {
        animationTypeRef.current = 'css-transition';
      } else if (panelStyles.animationName !== 'none' && panelStyles.transitionDuration === '0s') {
        animationTypeRef.current = 'css-animation';
      } else {
        animationTypeRef.current = 'none';
      }

      /**
       * We need to know in advance which side is being collapsed when using CSS
       * transitions in order to set the value of width/height to `0px` momentarily.
       * Setting both to `0px` will break layout.
       */
      if (
        element.getAttribute(AccordionRootDataAttributes.orientation) === 'horizontal' ||
        panelStyles.transitionProperty.indexOf('width') > -1
      ) {
        transitionDimensionRef.current = 'width';
      } else {
        transitionDimensionRef.current = 'height';
      }
    }

    if (animationTypeRef.current !== 'css-transition') {
      return undefined;
    }

    /**
     * Explicitly set `display` to ensure the panel is actually rendered before
     * measuring anything. `!important` is to needed to override a conflicting
     * Tailwind v4 default that sets `display: none !important` on `[hidden]`:
     * https://github.com/tailwindlabs/tailwindcss/blob/cd154a4f471e7a63cc27cad15dada650de89d52b/packages/tailwindcss/preflight.css#L320-L326
     */
    element.style.setProperty('display', 'block', 'important');

    if (height === undefined || width === undefined) {
      setDimensions({ height: element.scrollHeight, width: element.scrollWidth });
      element.style.removeProperty('display');

      if (shouldCancelInitialOpenTransitionRef.current) {
        element.style.setProperty('transition-duration', '0s');
      }
    }

    let frame = -1;
    let nextFrame = -1;

    frame = AnimationFrame.request(() => {
      shouldCancelInitialOpenTransitionRef.current = false;
      nextFrame = AnimationFrame.request(() => {
        /**
         * This is slightly faster than another RAF and is the earliest
         * opportunity to remove the temporary `transition-duration: 0s` that
         * was applied to cancel opening transitions of initially open panels.
         * https://nolanlawson.com/2018/09/25/accurately-measuring-layout-on-the-web/
         */
        setTimeout(() => {
          element.style.removeProperty('transition-duration');
        });
      });
    });

    return () => {
      AnimationFrame.cancel(frame);
      AnimationFrame.cancel(nextFrame);
    };
  });

  const mergedPanelRef = useForkRef(externalRef, panelRef, handlePanelRef);

  /**
   * This handles CSS transitions for 2 cases when we can't rely on the trigger handler:
   * 1. When `keepMounted={false}`, the panel may not exist in the DOM
   * 2. When controlled, the open state may change externally without involving the trigger
   */
  useLayoutEffect(() => {
    if (animationTypeRef.current !== 'css-transition' || keepMounted) {
      return undefined;
    }

    const panel = panelRef.current;

    if (!panel) {
      return undefined;
    }

    let resizeFrame = -1;

    if (abortControllerRef.current != null) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (open) {
      /* opening */
      panel.style.setProperty('display', 'block', 'important');

      /**
       * When `keepMounted={false}` and the panel is initially closed, the very
       * first time it opens (not any subsequent opens) `data-starting-style` is
       * off or missing by a frame so we need to set it manually. Otherwise any
       * CSS properties expected to transition using [data-starting-style] may
       * be mis-timed and appear to be complete skipped.
       */
      if (!shouldCancelInitialOpenTransitionRef.current && !keepMounted) {
        panel.setAttribute(CollapsiblePanelDataAttributes.startingStyle, '');
      }

      setDimensions({ height: panel.scrollHeight, width: panel.scrollWidth });

      resizeFrame = AnimationFrame.request(() => {
        panel.style.removeProperty('display');
      });
    } else {
      /* closing */
      resizeFrame = AnimationFrame.request(() => {
        setDimensions({ height: 0, width: 0 });
      });

      abortControllerRef.current = new AbortController();

      runOnceAnimationsFinish(() => {
        panel.style.removeProperty('content-visibility');
        setMounted(false);
        abortControllerRef.current = null;
      }, abortControllerRef.current.signal);
    }

    return () => {
      AnimationFrame.cancel(resizeFrame);
    };
  }, [
    abortControllerRef,
    animationTypeRef,
    hiddenUntilFound,
    keepMounted,
    mounted,
    open,
    panelRef,
    runOnceAnimationsFinish,
    setDimensions,
    setMounted,
    transitionDimensionRef,
  ]);

  useLayoutEffect(() => {
    if (animationTypeRef.current !== 'css-animation') {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    latestAnimationNameRef.current = panel.style.animationName || latestAnimationNameRef.current;

    panel.style.setProperty('animation-name', 'none');

    setDimensions({ height: panel.scrollHeight, width: panel.scrollWidth });

    if (!shouldCancelInitialOpenAnimationRef.current && !isBeforeMatchRef.current) {
      panel.style.removeProperty('animation-name');
    }

    if (open) {
      if (abortControllerRef.current != null) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setMounted(true);
      setVisible(true);
    } else {
      abortControllerRef.current = new AbortController();
      runOnceAnimationsFinish(() => {
        setMounted(false);
        setVisible(false);
        abortControllerRef.current = null;
      }, abortControllerRef.current.signal);
    }
  }, [
    abortControllerRef,
    animationTypeRef,
    open,
    panelRef,
    runOnceAnimationsFinish,
    setDimensions,
    setMounted,
    setVisible,
    visible,
  ]);

  useOnMount(() => {
    const frame = AnimationFrame.request(() => {
      shouldCancelInitialOpenAnimationRef.current = false;
    });
    return () => AnimationFrame.cancel(frame);
  });

  useLayoutEffect(() => {
    if (!hiddenUntilFound) {
      return undefined;
    }

    const panel = panelRef.current;
    if (!panel) {
      return undefined;
    }

    let frame = -1;
    let nextFrame = -1;

    if (open && isBeforeMatchRef.current) {
      panel.style.transitionDuration = '0s';
      setDimensions({ height: panel.scrollHeight, width: panel.scrollWidth });
      frame = AnimationFrame.request(() => {
        isBeforeMatchRef.current = false;
        nextFrame = AnimationFrame.request(() => {
          setTimeout(() => {
            panel.style.removeProperty('transition-duration');
          });
        });
      });
    }

    return () => {
      AnimationFrame.cancel(frame);
      AnimationFrame.cancel(nextFrame);
    };
  }, [hiddenUntilFound, open, panelRef, setDimensions]);

  useLayoutEffect(() => {
    const panel = panelRef.current;

    if (panel && hiddenUntilFound && hidden) {
      /**
       * React only supports a boolean for the `hidden` attribute and forces
       * legit string values to booleans so we have to force it back in the DOM
       * when necessary: https://github.com/facebook/react/issues/24740
       */
      panel.setAttribute('hidden', 'until-found');
      /**
       * Set data-starting-style here to persist the closed styles, this is to
       * prevent transitions from starting when the `hidden` attribute changes
       * to `'until-found'` as they could have different `display` properties:
       * https://github.com/tailwindlabs/tailwindcss/pull/14625
       */
      if (animationTypeRef.current === 'css-transition') {
        panel.setAttribute(CollapsiblePanelDataAttributes.startingStyle, '');
      }
    }
  }, [hiddenUntilFound, hidden, animationTypeRef, panelRef]);

  React.useEffect(
    function registerBeforeMatchListener() {
      const panel = panelRef.current;
      if (!panel) {
        return undefined;
      }

      function handleBeforeMatch() {
        isBeforeMatchRef.current = true;
        setOpen(true);
        onOpenChange(true);
      }

      panel.addEventListener('beforematch', handleBeforeMatch);

      return () => {
        panel.removeEventListener('beforematch', handleBeforeMatch);
      };
    },
    [onOpenChange, panelRef, setOpen],
  );

  return React.useMemo(
    () => ({
      props: {
        hidden,
        id: idParam,
        ref: mergedPanelRef,
      },
    }),
    [hidden, idParam, mergedPanelRef],
  );
}

export namespace useCollapsiblePanel {
  export interface Parameters {
    abortControllerRef: React.RefObject<AbortController | null>;
    animationTypeRef: React.RefObject<AnimationType>;
    externalRef: React.ForwardedRef<HTMLDivElement>;
    /**
     * The height of the panel.
     */
    height: number | undefined;
    /**
     * Allows the browser’s built-in page search to find and expand the panel contents.
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
     * Whether the collapsible panel is currently mounted.
     */
    mounted: boolean;
    onOpenChange: (open: boolean) => void;
    /**
     * Whether the collapsible panel is currently open.
     */
    open: boolean;
    panelRef: React.RefObject<HTMLElement | null>;
    runOnceAnimationsFinish: (fnToExecute: () => void, signal?: AbortSignal | null) => void;
    setDimensions: React.Dispatch<React.SetStateAction<Dimensions>>;
    setMounted: (nextMounted: boolean) => void;
    setOpen: (nextOpen: boolean) => void;
    setPanelId: (id: string | undefined) => void;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    transitionDimensionRef: React.RefObject<'height' | 'width' | null>;
    /**
     * The visible state of the panel used to determine the `[hidden]` attribute
     * only when CSS keyframe animations are used.
     */
    visible: boolean;
    /**
     * The width of the panel.
     */
    width: number | undefined;
  }

  export interface ReturnValue {
    props: HTMLProps;
  }
}
