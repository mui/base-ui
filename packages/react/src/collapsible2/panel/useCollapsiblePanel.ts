'use client';
import * as React from 'react';
import { GenericHTMLProps } from '../../utils/types';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { useForkRef } from '../../utils/useForkRef';
import { useOnMount } from '../../utils/useOnMount';
import { warn } from '../../utils/warn';
import type { AnimationType } from '../root/useCollapsibleRoot';
import { CollapsiblePanelDataAttributes } from './CollapsiblePanelDataAttributes';

export function useCollapsiblePanel(
  parameters: useCollapsiblePanel.Parameters,
): useCollapsiblePanel.ReturnValue {
  const {
    abortControllerRef,
    animationTypeRef,
    externalRef,
    hiddenUntilFound,
    keepMounted,
    id: idParam,
    mounted,
    onOpenChange,
    open,
    panelRef,
    runOnceAnimationsFinish,
    setMounted,
    setOpen,
    setPanelId,
    setVisible,
    visible,
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

  useEnhancedEffect(() => {
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
    if (animationTypeRef.current == null) {
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
    }

    if (animationTypeRef.current !== 'css-transition') {
      return undefined;
    }

    if (shouldCancelInitialOpenTransitionRef.current) {
      element.style.setProperty('transition-duration', '0s');
    }

    let frame = -1;
    let nextFrame = -1;

    frame = requestAnimationFrame(() => {
      shouldCancelInitialOpenTransitionRef.current = false;
      nextFrame = requestAnimationFrame(() => {
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
      cancelAnimationFrame(frame);
      cancelAnimationFrame(nextFrame);
    };
  });

  const mergedPanelRef = useForkRef(externalRef, panelRef, handlePanelRef);

  useEnhancedEffect(() => {
    if (animationTypeRef.current !== 'css-animation') {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    latestAnimationNameRef.current = panel.style.animationName || latestAnimationNameRef.current;

    panel.style.setProperty('animation-name', 'none');

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
    setMounted,
    setVisible,
    visible,
  ]);

  useOnMount(() => {
    const frame = requestAnimationFrame(() => {
      shouldCancelInitialOpenAnimationRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  });

  useEnhancedEffect(() => {
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
      frame = requestAnimationFrame(() => {
        isBeforeMatchRef.current = false;
        nextFrame = requestAnimationFrame(() => {
          setTimeout(() => {
            panel.style.removeProperty('transition-duration');
          });
        });
      });
    }

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(nextFrame);
    };
  }, [hiddenUntilFound, open, panelRef]);

  useEnhancedEffect(() => {
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
    setMounted: (nextMounted: boolean) => void;
    setOpen: (nextOpen: boolean) => void;
    setPanelId: (id: string | undefined) => void;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    /**
     * The visible state of the panel used to determine the `[hidden]` attribute
     * only when CSS keyframe animations are used.
     */
    visible: boolean;
  }

  export interface ReturnValue {
    props: GenericHTMLProps;
  }
}
