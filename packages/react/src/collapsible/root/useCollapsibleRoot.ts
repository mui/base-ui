'use client';
import * as React from 'react';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { useTransitionStatus, TransitionStatus } from '../../utils/useTransitionStatus';

export type AnimationType = 'css-transition' | 'css-animation' | 'none' | null;

export interface Dimensions {
  height: number | undefined;
  width: number | undefined;
}

export function useCollapsibleRoot(
  parameters: useCollapsibleRoot.Parameters,
): useCollapsibleRoot.ReturnValue {
  const { open: openParam, defaultOpen, onOpenChange, disabled } = parameters;

  const isControlledRef = React.useRef(openParam !== undefined);

  const [open, setOpen] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'Collapsible',
    state: 'open',
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  const [visible, setVisible] = React.useState(open);
  const [{ height, width }, setDimensions] = React.useState<Dimensions>({
    height: undefined,
    width: undefined,
  });
  const [panelId, setPanelId] = React.useState<string | undefined>(useBaseUiId());

  const [hiddenUntilFound, setHiddenUntilFound] = React.useState(false);
  const [keepMounted, setKeepMounted] = React.useState(false);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const animationTypeRef = React.useRef<AnimationType>(null);
  const transitionDimensionRef = React.useRef<'width' | 'height' | null>(null);
  const panelRef: React.RefObject<HTMLElement | null> = React.useRef(null);

  const runOnceAnimationsFinish = useAnimationsFinished(panelRef, false);

  const handleTrigger = useEventCallback(() => {
    const nextOpen = !open;

    const panel = panelRef.current;

    if (animationTypeRef.current === 'css-animation' && panel != null) {
      panel.style.removeProperty('animation-name');
    }

    if (!hiddenUntilFound && !keepMounted) {
      if (animationTypeRef.current != null && animationTypeRef.current !== 'css-animation') {
        if (!mounted && nextOpen) {
          setMounted(true);
        }
      }

      if (animationTypeRef.current === 'css-animation') {
        if (!visible && nextOpen) {
          setVisible(true);
        }
        if (!mounted && nextOpen) {
          setMounted(true);
        }
      }
    }

    setOpen(nextOpen);
    onOpenChange(nextOpen);

    if (animationTypeRef.current === 'none') {
      if (mounted && !nextOpen) {
        setMounted(false);
      }
      return;
    }

    if (
      !panel ||
      animationTypeRef.current !== 'css-transition' ||
      /**
       * Defer to an effect when controlled, as the open state can be changed
       * externally without interacting with the trigger.
       */
      isControlledRef.current ||
      /**
       * Defer to an effect When `keepMounted={false}` and when opening, the
       * element may not exist in the DOM at this point.
       */
      (!keepMounted && nextOpen)
    ) {
      return;
    }

    if (abortControllerRef.current != null) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    panel.style.setProperty('display', 'block', 'important');

    if (nextOpen) {
      /* opening */

      panel.style.removeProperty('content-visibility');
      panel.style.setProperty(transitionDimensionRef.current ?? 'height', '0px');

      requestAnimationFrame(() => {
        panel.style.removeProperty(transitionDimensionRef.current ?? 'height');
        setDimensions({ height: panel.scrollHeight, width: panel.scrollWidth });
        panel.style.removeProperty('display');
      });
    } else {
      if (hiddenUntilFound) {
        panel.style.setProperty('content-visibility', 'visible');
      }
      /* closing */
      requestAnimationFrame(() => {
        setDimensions({ height: 0, width: 0 });
      });

      abortControllerRef.current = new AbortController();

      runOnceAnimationsFinish(() => {
        setMounted(false);
        panel.style.removeProperty('display');
        panel.style.removeProperty('content-visibility');
        abortControllerRef.current = null;
      }, abortControllerRef.current.signal);
    }
  });

  useModernLayoutEffect(() => {
    /**
     * Unmount immediately when closing in controlled mode and keepMounted={false}
     * and no CSS animations or transitions are applied
     */
    if (isControlledRef.current && animationTypeRef.current === 'none' && !keepMounted && !open) {
      setMounted(false);
    }
  }, [keepMounted, open, openParam, setMounted]);

  return React.useMemo(
    () => ({
      abortControllerRef,
      animationTypeRef,
      disabled,
      handleTrigger,
      height,
      mounted,
      open,
      panelId,
      panelRef,
      runOnceAnimationsFinish,
      setDimensions,
      setHiddenUntilFound,
      setKeepMounted,
      setMounted,
      setOpen,
      setPanelId,
      setVisible,
      transitionDimensionRef,
      transitionStatus,
      visible,
      width,
    }),
    [
      abortControllerRef,
      animationTypeRef,
      disabled,
      handleTrigger,
      height,
      mounted,
      open,
      panelId,
      panelRef,
      runOnceAnimationsFinish,
      setDimensions,
      setHiddenUntilFound,
      setKeepMounted,
      setMounted,
      setOpen,
      setPanelId,
      setVisible,
      transitionDimensionRef,
      transitionStatus,
      visible,
      width,
    ],
  );
}

export namespace useCollapsibleRoot {
  export interface Parameters {
    /**
     * Whether the collapsible panel is currently open.
     *
     * To render an uncontrolled collapsible, use the `defaultOpen` prop instead.
     */
    open?: boolean;
    /**
     * Whether the collapsible panel is initially open.
     *
     * To render a controlled collapsible, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Event handler called when the panel is opened or closed.
     */
    onOpenChange: (open: boolean) => void;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled: boolean;
  }

  export interface ReturnValue {
    abortControllerRef: React.RefObject<AbortController | null>;
    animationTypeRef: React.RefObject<AnimationType>;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    handleTrigger: () => void;
    /**
     * The height of the panel.
     */
    height: number | undefined;
    /**
     * Whether the collapsible panel is currently mounted.
     */
    mounted: boolean;
    /**
     * Whether the collapsible panel is currently open.
     */
    open: boolean;
    panelId: React.HTMLAttributes<Element>['id'];
    panelRef: React.RefObject<HTMLElement | null>;
    runOnceAnimationsFinish: (fnToExecute: () => void, signal?: AbortSignal | null) => void;
    setDimensions: React.Dispatch<React.SetStateAction<Dimensions>>;
    setHiddenUntilFound: React.Dispatch<React.SetStateAction<boolean>>;
    setKeepMounted: React.Dispatch<React.SetStateAction<boolean>>;
    setMounted: (open: boolean) => void;
    setOpen: (open: boolean) => void;
    setPanelId: (id: string | undefined) => void;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    transitionDimensionRef: React.RefObject<'height' | 'width' | null>;
    transitionStatus: TransitionStatus;
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
}
