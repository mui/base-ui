'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerDocument } from '@base-ui/utils/owner';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useFullscreenRootContext } from '../root/FullscreenRootContext';
import type { FullscreenRootState } from '../root/FullscreenRoot';
import { fullscreenStateMapping } from '../root/stateAttributesMapping';
import {
  FULLSCREEN_CHANGE_EVENTS,
  FULLSCREEN_ERROR_EVENTS,
  isFullscreenEnabled,
} from '../root/fullscreenApi';

/**
 * The element that is presented in fullscreen.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Fullscreen](https://base-ui.com/react/components/fullscreen)
 */
export const FullscreenContainer = React.forwardRef(function FullscreenContainer(
  componentProps: FullscreenContainer.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, id: idProp, render, style, ...elementProps } = componentProps;

  const { store, handleContainerUnmount, handleFullscreenChange, handleFullscreenError } =
    useFullscreenRootContext();

  const open = store.useState('open');
  const disabled = store.useState('disabled');
  const supported = store.useState('supported');

  const defaultContainerId = useBaseUiId();
  const containerId = idProp ?? defaultContainerId;

  useIsoLayoutEffect(() => {
    store.set('containerId', containerId);
    return () => {
      store.set('containerId', undefined);
    };
  }, [containerId, store]);

  const setContainer = useStableCallback((node: HTMLDivElement | null) => {
    store.context.containerRef.current = node;
    if (node) {
      store.set('supported', isFullscreenEnabled(ownerDocument(node)));
    }
  });

  React.useEffect(() => {
    const container = store.context.containerRef.current;
    if (!container) {
      return undefined;
    }
    const doc = ownerDocument(container);
    const cleanups: Array<() => void> = [];
    for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
      cleanups.push(addEventListener(doc, eventName, handleFullscreenChange));
    }
    for (const eventName of FULLSCREEN_ERROR_EVENTS) {
      cleanups.push(addEventListener(doc, eventName, handleFullscreenError));
    }
    const cleanup = mergeCleanups(...cleanups);
    return () => {
      cleanup();
      handleContainerUnmount();
    };
  }, [store, handleContainerUnmount, handleFullscreenChange, handleFullscreenError]);

  const state: FullscreenContainerState = React.useMemo(
    () => ({ open, disabled, supported }),
    [open, disabled, supported],
  );

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, setContainer],
    props: [{ id: containerId }, elementProps],
    stateAttributesMapping: fullscreenStateMapping,
  });
});

export interface FullscreenContainerState extends FullscreenRootState {}

export interface FullscreenContainerProps extends BaseUIComponentProps<
  'div',
  FullscreenContainerState
> {}

export namespace FullscreenContainer {
  export type State = FullscreenContainerState;
  export type Props = FullscreenContainerProps;
}
