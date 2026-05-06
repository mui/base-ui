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
import { FullscreenPortalContext } from '../portal/FullscreenPortalContext';
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

  // When the container is mounted inside `<Fullscreen.Portal>` (typically with
  // `keepMounted`), it should be hidden from the page while not in fullscreen
  // — matching how `<Dialog.Popup>` behaves inside `<Dialog.Portal>`. Outside
  // a portal, this context is `undefined` and the container stays visible.
  const inPortal = React.useContext(FullscreenPortalContext) !== undefined;

  const open = store.useState('open');
  const disabled = store.useState('disabled');
  const supported = store.useState('supported');
  const hasExternalTarget = store.useState('hasExternalTarget');

  if (hasExternalTarget) {
    throw new Error(
      'Base UI: <Fullscreen.Container> cannot be used inside a <Fullscreen.Root> that has a `target` prop. ' +
        'Choose one or the other: render <Fullscreen.Container> for an inline fullscreen element, ' +
        'or pass `target` to fullscreen an external element. ' +
        'See https://base-ui.com/react/components/fullscreen',
    );
  }

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
      // Only fire the unmount handler if this is a real unmount (the DOM node
      // is no longer connected). React's strict-mode dev-only effect double-
      // invocation tears down and re-runs effects without unmounting the DOM
      // node; we don't want that to be observed as a "container removed"
      // signal that resets `open` back to false.
      if (!container.isConnected) {
        handleContainerUnmount();
      }
    };
  }, [store, handleContainerUnmount, handleFullscreenChange, handleFullscreenError]);

  const state: FullscreenContainerState = React.useMemo(
    () => ({ open, disabled, supported }),
    [open, disabled, supported],
  );

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, setContainer],
    props: [
      {
        id: containerId,
        // Hide the container while it sits in a portal but not in fullscreen
        // so consumer styles (e.g. `width: 100vw`) do not leak into the page.
        // The attribute is dropped on the same React commit that flips `open`
        // to true, so it is gone before the layout effect calls
        // `requestFullscreen()` on this element.
        hidden: inPortal && !open ? true : undefined,
      },
      elementProps,
    ],
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
