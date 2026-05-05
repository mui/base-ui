'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerDocument } from '@base-ui/utils/owner';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFullscreenRootContext } from '../root/FullscreenRootContext';
import type { FullscreenRootState } from '../root/FullscreenRoot';
import { fullscreenContainerStateMapping } from '../root/stateAttributesMapping';
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

  const {
    containerId,
    containerRef,
    handleFullscreenChange,
    handleFullscreenError,
    setContainerIdState,
    setSupported,
    state,
  } = useFullscreenRootContext();

  useIsoLayoutEffect(() => {
    if (idProp) {
      setContainerIdState(idProp);
      return () => {
        setContainerIdState(undefined);
      };
    }
    return undefined;
  }, [idProp, setContainerIdState]);

  const setContainer = useStableCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (node) {
      setSupported(isFullscreenEnabled(ownerDocument(node)));
    }
  });

  React.useEffect(() => {
    const container = containerRef.current;
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
    return mergeCleanups(...cleanups);
  }, [containerRef, handleFullscreenChange, handleFullscreenError]);

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, setContainer],
    props: [{ id: containerId }, elementProps],
    stateAttributesMapping: fullscreenContainerStateMapping,
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
