'use client';
import type * as React from 'react';
import type { ReactStore } from '@base-ui/utils/store';
import type { Align, Side } from '../../internals/useAnchorPositioning';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { useRenderElement } from '../../internals/useRenderElement';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { popupStateMapping, popupTransitionStateMapping } from './popupStateMapping';
import type { PopupStoreContext, PopupStoreState, popupStoreSelectors } from './store';

function getElementProps<State>(componentProps: BaseUIComponentProps<any, State>) {
  const { render, className, style, ...elementProps } = componentProps;
  return elementProps;
}

export interface PopupArrowPositionerContext {
  side: Side | 'none';
  align: Align;
  arrowRef: React.Ref<Element>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
}

export interface UsePopupArrowOptions<State extends Record<string, any>> {
  state?: Partial<State> | undefined;
  extraProps?: HTMLProps<HTMLDivElement> | undefined;
  stateAttributesMapping?: StateAttributesMapping<State> | undefined;
}

export function usePopupArrow<State extends Record<string, any>>(
  componentProps: BaseUIComponentProps<'div', State>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
  open: boolean,
  positioner: PopupArrowPositionerContext,
  options?: UsePopupArrowOptions<State>,
) {
  const { arrowRef, side, align, arrowUncentered, arrowStyles } = positioner;

  return useRenderElement('div', componentProps, {
    state: {
      open,
      side,
      align,
      uncentered: arrowUncentered,
      ...options?.state,
    } as unknown as State,
    ref: [arrowRef, forwardedRef],
    props: [
      { style: arrowStyles, 'aria-hidden': true },
      options?.extraProps,
      getElementProps(componentProps),
    ],
    stateAttributesMapping:
      options?.stateAttributesMapping ??
      (popupStateMapping as unknown as StateAttributesMapping<State>),
  });
}

export interface PopupBackdropState {
  open: boolean;
  transitionStatus: TransitionStatus;
}

export interface UsePopupBackdropOptions {
  ref?: React.Ref<HTMLDivElement> | undefined;
  style?: React.CSSProperties | undefined;
  enabled?: boolean | undefined;
}

export function usePopupBackdrop(
  componentProps: BaseUIComponentProps<'div', PopupBackdropState>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
  store: Pick<
    ReactStore<PopupStoreState<unknown>, PopupStoreContext<any>, typeof popupStoreSelectors>,
    'useState'
  >,
  options?: UsePopupBackdropOptions,
) {
  return useRenderElement('div', componentProps, {
    state: {
      open: store.useState('open'),
      transitionStatus: store.useState('transitionStatus'),
    },
    ref: [options?.ref, forwardedRef],
    stateAttributesMapping: popupTransitionStateMapping,
    props: [
      {
        role: 'presentation',
        hidden: !store.useState('mounted'),
        style: {
          userSelect: 'none',
          WebkitUserSelect: 'none',
          ...options?.style,
        },
      },
      getElementProps(componentProps),
    ],
    enabled: options?.enabled,
  });
}

export function usePopupOpenChangeComplete(
  store: {
    readonly context: {
      readonly popupRef: React.RefObject<HTMLElement | null>;
      readonly onOpenChangeComplete?: ((open: boolean) => void) | undefined;
    };
  },
  open: boolean,
) {
  useOpenChangeComplete({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete?.(true);
      }
    },
  });
}

export function usePopupLabelElement<
  ElementType extends 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p',
>(
  tag: 'h2' | 'p',
  componentProps: BaseUIComponentProps<ElementType, {}>,
  forwardedRef: React.ForwardedRef<any>,
  store: {
    useSyncedValueWithCleanup(
      key: 'titleElementId' | 'descriptionElementId',
      value: string | undefined,
    ): void;
  },
  key: 'titleElementId' | 'descriptionElementId',
) {
  const elementProps = getElementProps(componentProps);
  const id = useBaseUiId(elementProps.id);
  store.useSyncedValueWithCleanup(key, id);

  return useRenderElement(tag, componentProps, {
    ref: forwardedRef,
    props: [{ id }, elementProps],
  });
}
