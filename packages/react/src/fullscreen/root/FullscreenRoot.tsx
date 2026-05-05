'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  useFullscreenRoot,
  type FullscreenNavigationUI,
  type UseFullscreenRootReturnValue,
} from './useFullscreenRoot';
import { FullscreenRootContext } from './FullscreenRootContext';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

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
    navigationUI = 'auto',
    onOpenChange: onOpenChangeProp,
    open,
  } = componentProps;

  const onOpenChange = useStableCallback(onOpenChangeProp);

  const fullscreen = useFullscreenRoot({
    open,
    defaultOpen,
    onOpenChange,
    disabled,
    navigationUI,
  });

  const state: FullscreenRootState = React.useMemo(
    () => ({
      open: fullscreen.open,
      disabled: fullscreen.disabled,
      supported: fullscreen.supported,
    }),
    [fullscreen.open, fullscreen.disabled, fullscreen.supported],
  );

  const contextValue: FullscreenRootContext = React.useMemo(
    () => ({
      ...fullscreen,
      onOpenChange,
      state,
    }),
    [fullscreen, onOpenChange, state],
  );

  return (
    <FullscreenRootContext.Provider value={contextValue}>{children}</FullscreenRootContext.Provider>
  );
}

export interface FullscreenRootState extends Pick<
  UseFullscreenRootReturnValue,
  'open' | 'disabled' | 'supported'
> {}

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
   * The content of the fullscreen.
   */
  children?: React.ReactNode | undefined;
}

export type FullscreenRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.closePress
  | typeof REASONS.escapeKey
  | typeof REASONS.none;

export type FullscreenRootChangeEventDetails =
  BaseUIChangeEventDetails<FullscreenRootChangeEventReason>;

export namespace FullscreenRoot {
  export type State = FullscreenRootState;
  export type Props = FullscreenRootProps;
  export type ChangeEventReason = FullscreenRootChangeEventReason;
  export type ChangeEventDetails = FullscreenRootChangeEventDetails;
  export type NavigationUI = FullscreenNavigationUI;
}
