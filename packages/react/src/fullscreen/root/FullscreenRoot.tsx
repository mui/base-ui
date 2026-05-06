'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useFullscreenRoot, type FullscreenNavigationUI } from './useFullscreenRoot';
import { FullscreenRootContext } from './FullscreenRootContext';
import { useExternalFullscreenTarget, type FullscreenTarget } from './useExternalFullscreenTarget';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { FullscreenStore } from '../store/FullscreenStore';
import { FullscreenHandle } from '../store/FullscreenHandle';

/**
 * Groups all parts of the fullscreen.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Fullscreen](https://base-ui.com/react/components/fullscreen)
 */
export function FullscreenRoot(componentProps: FullscreenRoot.Props) {
  const {
    children,
    defaultOpen = false,
    disabled = false,
    handle,
    navigationUI = 'auto',
    onOpenChange: onOpenChangeProp,
    open,
    target,
  } = componentProps;

  const onOpenChange = useStableCallback(onOpenChangeProp);

  const store = FullscreenStore.useStore(handle?.store, {
    open: defaultOpen,
    openProp: open,
    disabled,
    navigationUI,
  });

  store.useControlledProp('openProp', open);
  store.useSyncedValues({ disabled, navigationUI });

  const fullscreen = useFullscreenRoot({
    store,
    onOpenChange,
    target,
  });

  useExternalFullscreenTarget(store, target, fullscreen);

  const contextValue: FullscreenRootContext = React.useMemo(
    () => ({
      ...fullscreen,
      store,
    }),
    [fullscreen, store],
  );

  return (
    <FullscreenRootContext.Provider value={contextValue}>{children}</FullscreenRootContext.Provider>
  );
}

export interface FullscreenRootState {
  /**
   * Whether the container is currently displayed in fullscreen.
   */
  open: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the browser supports the Fullscreen API for the container's owner document.
   */
  supported: boolean;
}

export interface FullscreenRootProps {
  /**
   * Whether the container is currently displayed in fullscreen.
   *
   * To render an uncontrolled fullscreen, use the `defaultOpen` prop instead.
   */
  open?: boolean | undefined;
  /**
   * Whether the container is initially displayed in fullscreen.
   *
   * The Fullscreen API requires a user gesture to enter fullscreen, so an
   * initially open value can only be honored after the user interacts with the
   * page. To render a controlled fullscreen, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the container enters or exits fullscreen.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: FullscreenRootChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Hint to the browser describing how the navigation UI should be presented
   * while the container is in fullscreen. Forwarded to `Element.requestFullscreen()`.
   * @default 'auto'
   */
  navigationUI?: FullscreenNavigationUI | undefined;
  /**
   * A handle to control the fullscreen imperatively or to associate detached
   * `<Fullscreen.Trigger>` components with this root. Create one with
   * `Fullscreen.createHandle()`.
   */
  handle?: FullscreenHandle | undefined;
  /**
   * An external element to present in fullscreen instead of
   * `<Fullscreen.Container>`. Useful for fullscreening the entire page
   * (`document.documentElement`) or a sibling DOM node.
   *
   * Accepts a callback that returns the element (lazy, SSR-safe) or a
   * `React.RefObject` pointing at the element.
   *
   * `<Fullscreen.Container>` must not be used together with `target`.
   */
  target?: FullscreenTarget | undefined;
  /**
   * The content of the fullscreen.
   */
  children?: React.ReactNode | undefined;
}

export type FullscreenRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.closePress
  | typeof REASONS.escapeKey
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type FullscreenRootChangeEventDetails =
  BaseUIChangeEventDetails<FullscreenRootChangeEventReason>;

export namespace FullscreenRoot {
  export type State = FullscreenRootState;
  export type Props = FullscreenRootProps;
  export type ChangeEventReason = FullscreenRootChangeEventReason;
  export type ChangeEventDetails = FullscreenRootChangeEventDetails;
  export type NavigationUI = FullscreenNavigationUI;
  export type Target = FullscreenTarget;
}
