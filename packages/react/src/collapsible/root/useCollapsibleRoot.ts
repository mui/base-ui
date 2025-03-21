'use client';
import * as React from 'react';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useTransitionStatus, TransitionStatus } from '../../utils/useTransitionStatus';

export type AnimationType = 'css-transition' | 'css-animation' | 'none' | null;

export function useCollapsibleRoot(
  parameters: useCollapsibleRoot.Parameters,
): useCollapsibleRoot.ReturnValue {
  const { open: openParam, defaultOpen, onOpenChange, disabled } = parameters;

  const [open, setOpen] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'Collapsible',
    state: 'open',
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  const [visible, setVisible] = React.useState(open);
  const [height, setHeight] = React.useState<number | undefined>(undefined);
  const [panelId, setPanelId] = React.useState<string | undefined>(useBaseUiId());

  const [hiddenUntilFound, setHiddenUntilFound] = React.useState(false);
  const [keepMounted, setKeepMounted] = React.useState(false);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const animationTypeRef = React.useRef<AnimationType>(null);
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

    /**
     * When `keepMounted={false}` and when opening, the element isn't inserted
     * in the DOM at this point so bail out here and resume in an effect.
     */
    if (!panel || animationTypeRef.current !== 'css-transition') {
      return;
    }

    panel.style.setProperty('display', 'block', 'important');

    if (nextOpen) {
      /* opening */
      if (abortControllerRef.current != null) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      panel.style.removeProperty('display');
      panel.style.removeProperty('content-visibility');
      panel.style.setProperty('height', '0px');

      requestAnimationFrame(() => {
        panel.style.removeProperty('height');
        setHeight(panel.scrollHeight);
      });
    } else {
      if (hiddenUntilFound) {
        panel.style.setProperty('content-visibility', 'visible');
      }
      /* closing */
      requestAnimationFrame(() => {
        setHeight(0);
      });

      abortControllerRef.current = new AbortController();

      runOnceAnimationsFinish(() => {
        panel.style.removeProperty('display');
        panel.style.removeProperty('content-visibility');
        abortControllerRef.current = null;
      }, abortControllerRef.current.signal);
    }
  });

  return React.useMemo(
    () => ({
      panelId,
      disabled,
      mounted,
      open,
      setPanelId,
      setMounted,
      setOpen,
      transitionStatus,

      panelRef,
      height,
      setHeight,
      visible,
      setVisible,
      animationTypeRef,
      abortControllerRef,
      runOnceAnimationsFinish,
      setKeepMounted,
      setHiddenUntilFound,
      handleTrigger,
    }),
    [
      panelId,
      disabled,
      mounted,
      open,
      setPanelId,
      setMounted,
      setOpen,
      transitionStatus,
      panelRef,
      height,
      setHeight,
      visible,
      setVisible,
      animationTypeRef,
      abortControllerRef,
      runOnceAnimationsFinish,
      setKeepMounted,
      setHiddenUntilFound,
      handleTrigger,
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
    panelId: React.HTMLAttributes<Element>['id'];
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    mounted: boolean;
    /**
     * Whether the collapsible panel is currently open.
     *
     * To render an uncontrolled collapsible, use the `defaultOpen` prop instead.
     */
    open: boolean;
    setPanelId: (id: string | undefined) => void;
    setMounted: (open: boolean) => void;
    setOpen: (open: boolean) => void;
    transitionStatus: TransitionStatus;

    panelRef: React.RefObject<HTMLElement | null>;
    height: number | undefined;
    setHeight: React.Dispatch<React.SetStateAction<number | undefined>>;
    visible: boolean;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setKeepMounted: React.Dispatch<React.SetStateAction<boolean>>;
    runOnceAnimationsFinish: (fnToExecute: () => void, signal?: AbortSignal | null) => void;
    animationTypeRef: React.RefObject<AnimationType>;
    abortControllerRef: React.RefObject<AbortController | null>;
    setHiddenUntilFound: React.Dispatch<React.SetStateAction<boolean>>;
    handleTrigger: () => void;
  }
}
