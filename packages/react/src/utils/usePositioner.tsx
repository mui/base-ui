'use client';
import { popupStateMapping } from './popupStateMapping';
import { useRenderElement, type UseRenderElementComponentProps } from './useRenderElement';
import { getDisabledMountTransitionStyles } from './getDisabledMountTransitionStyles';
import type { TransitionStatus } from './useTransitionStatus';

export function usePositioner<State extends Record<string, any>>(
  componentProps: UseRenderElementComponentProps<State>,
  state: State,
  positionerStyles: React.CSSProperties,
  transitionStatus: TransitionStatus,
  elementProps?: React.ComponentProps<'div'> | undefined,
  refs?: React.Ref<HTMLDivElement> | (React.Ref<HTMLDivElement> | undefined)[] | undefined,
  hidden?: boolean | undefined,
  disablePointerEvents = false,
  extraStyles?: React.CSSProperties | undefined,
) {
  const style: React.CSSProperties = {
    ...positionerStyles,
    ...extraStyles,
  };

  if (disablePointerEvents) {
    style.pointerEvents = 'none';
  }

  return useRenderElement('div', componentProps, {
    state,
    ref: refs,
    props: [
      { role: 'presentation', hidden, style },
      getDisabledMountTransitionStyles(transitionStatus),
      elementProps,
    ],
    stateAttributesMapping: popupStateMapping,
  });
}
