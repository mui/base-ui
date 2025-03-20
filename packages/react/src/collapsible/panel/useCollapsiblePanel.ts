'use client';
import * as React from 'react';
import { mergeProps } from '../../merge-props';
import { GenericHTMLProps } from '../../utils/types';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { useForkRef } from '../../utils/useForkRef';
import { useOnMount } from '../../utils/useOnMount';
import { warn } from '../../utils/warn';

import { AnimationType } from '../root/useCollapsibleRoot';

// interface Dimensions {
//   height: number;
//   width: number;
// }

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
    mounted,
    open,
    panelId,
    panelRef,
    runOnceAnimationsFinish,
    setHeight,
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

  const hidden = React.useMemo(() => {
    if (animationTypeRef.current === 'css-animation') {
      return !visible;
    }

    if (keepMounted) {
      return !open;
    }

    return !open && !mounted;
  }, [keepMounted, open, mounted, visible, animationTypeRef]);

  useEnhancedEffect(() => {
    if (!keepMounted && !open) {
      setPanelId(undefined);
    } else {
      setPanelId(panelId);
    }
    return () => {
      setPanelId(undefined);
    };
  }, [panelId, setPanelId, keepMounted, open]);

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
      return;
    }
    /**
     * This ref is safe to read in render because it's only ever set once here
     * during the first render and never again.
     * https://react.dev/learn/referencing-values-with-refs#best-practices-for-refs
     */
    if (animationTypeRef.current == null) {
      const panelStyles = getComputedStyle(element);
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
      return;
    }

    /**
     * Explicitly set `display` to ensure the panel is actually rendered before
     * measuring anything. `!important` is to needed to override a conflicting
     * Tailwind v4 default that sets `display: none !important` on `[hidden]`:
     * https://github.com/tailwindlabs/tailwindcss/blob/cd154a4f471e7a63cc27cad15dada650de89d52b/packages/tailwindcss/preflight.css#L320-L326
     */
    element.style.setProperty('display', 'block', 'important'); // TODO: maybe this can be set more conditionally

    if (height === undefined) {
      /**
       * When `keepMounted={false}` and the panel is initially closed, the very
       * first time it opens (not any subsequent opens) `data-starting-style` is
       * off or missing by a frame so we need to set it manually. Otherwise any
       * CSS properties expected to transition using [data-starting-style] may
       * be mis-timed and appear to be complete skipped.
       */
      if (!shouldCancelInitialOpenTransitionRef.current && !keepMounted) {
        element.setAttribute('data-starting-style', '');
      }

      setHeight(element.scrollHeight);
      element.style.removeProperty('display');

      if (shouldCancelInitialOpenTransitionRef.current) {
        element.style.setProperty('transition-duration', '0s');
      }
    }

    requestAnimationFrame(() => {
      shouldCancelInitialOpenTransitionRef.current = false;
      requestAnimationFrame(() => {
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
  });

  const mergedPanelRef = useForkRef(externalRef, panelRef, handlePanelRef);

  /**
   * This only handles CSS transitions when `keepMounted={false}` as we may not
   * have access to the panel element in the DOM in the trigger event handler.
   */
  useEnhancedEffect(() => {
    if (animationTypeRef.current !== 'css-transition' || keepMounted) {
      return;
    }

    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    if (open) {
      if (abortControllerRef.current != null) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      /* opening */
      panel.style.height = '0px';

      requestAnimationFrame(() => {
        /**
         * When `keepMounted={false}` this is the earliest opportunity to unset
         * the temporary `display` property that was set in `handlePanelRef`
         */
        panel.style.removeProperty('display');

        panel.style.removeProperty('height');
        setHeight(panel.scrollHeight);
      });
    } else {
      /* closing */
      requestAnimationFrame(() => {
        setHeight(0);
      });

      abortControllerRef.current = new AbortController();

      runOnceAnimationsFinish(() => {
        panel.style.removeProperty('content-visibility');
        setMounted(false);
        abortControllerRef.current = null;
      }, abortControllerRef.current.signal);
    }
  }, [
    keepMounted,
    open,
    mounted,
    setMounted,
    runOnceAnimationsFinish,
    hiddenUntilFound,
    abortControllerRef,
    animationTypeRef,
    setHeight,
    panelRef,
  ]);

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

    setHeight(panel.scrollHeight);

    if (!shouldCancelInitialOpenAnimationRef.current && !isBeforeMatchRef.current) {
      panel.style.removeProperty('animation-name');
    }

    if (open) {
      setMounted(true);
      setVisible(true);
    } else {
      runOnceAnimationsFinish(() => {
        setMounted(false);
        setVisible(false);
      });
    }
  }, [
    open,
    visible,
    runOnceAnimationsFinish,
    setMounted,
    animationTypeRef,
    panelRef,
    setHeight,
    setVisible,
  ]);

  useOnMount(() => {
    const frame = requestAnimationFrame(() => {
      shouldCancelInitialOpenAnimationRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  });

  useEnhancedEffect(() => {
    if (!hiddenUntilFound) {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    if (open && isBeforeMatchRef.current) {
      panel.style.transitionDuration = '0s';
      setHeight(panel.scrollHeight);
      requestAnimationFrame(() => {
        isBeforeMatchRef.current = false;
        requestAnimationFrame(() => {
          setTimeout(() => {
            panel.style.removeProperty('transition-duration');
          });
        });
      });
    }
  }, [hiddenUntilFound, open, panelRef, setHeight]);

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
        panel.setAttribute('data-starting-style', '');
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
      }

      panel.addEventListener('beforematch', handleBeforeMatch);

      return () => {
        panel.removeEventListener('beforematch', handleBeforeMatch);
      };
    },
    [setOpen, panelRef],
  );

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeProps(
        {
          hidden,
          ref: mergedPanelRef,
        },
        externalProps,
      );
    },
    [hidden, mergedPanelRef],
  );

  return React.useMemo(
    () => ({
      getRootProps,
    }),
    [getRootProps],
  );
}

export namespace useCollapsiblePanel {
  export interface Parameters {
    /**
     * Allows the browser’s built-in page search to find and expand the panel contents.
     *
     * Overrides the `keepMounted` prop and uses `hidden="until-found"`
     * to hide the element without removing it from the DOM.
     */
    hiddenUntilFound: boolean;
    panelId: React.HTMLAttributes<Element>['id'];
    /**
     * Whether to keep the element in the DOM while the panel is closed.
     * This prop is ignored when `hiddenUntilFound` is used.
     */
    keepMounted: boolean;
    mounted: boolean;
    /**
     * Whether the collapsible panel is currently open.
     */
    open: boolean;
    setPanelId: (id: string | undefined) => void;
    setOpen: (nextOpen: boolean) => void;
    setMounted: (nextMounted: boolean) => void;

    animationTypeRef: React.RefObject<AnimationType>;
    height: number | undefined;
    setHeight: React.Dispatch<React.SetStateAction<number | undefined>>;
    visible: boolean;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    abortControllerRef: React.RefObject<AbortController | null>;
    externalRef: React.ForwardedRef<HTMLElement>;
    runOnceAnimationsFinish: (fnToExecute: () => void, signal?: AbortSignal | null) => void;
    panelRef: React.RefObject<HTMLElement | null>;
  }

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    // width: number;
  }
}
