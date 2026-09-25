'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { useIsHydrating } from '../../utils/useIsHydrating';
import type { MenuFilterRootProps } from './MenuFilterRoot';

/** Splits a filterable root's props between the menu root and the filter below it. */
export function useMenuFilterRoot<Payload>(props: MenuFilterRootProps<Payload>) {
  const {
    children,
    value,
    defaultValue,
    onValueChange,
    filter,
    autoHighlight = false,
    locale,
    ...otherProps
  } = props;

  const focusOwnerRef = React.useRef<HTMLElement | null>(null);

  const hydrating = useIsHydrating();

  return {
    children,
    rootProps: {
      ...otherProps,
      virtualFocus: true,
      // WebKit needs selection state to follow a searchbox's active descendant into a menu.
      // Wait until after hydration so server and client markup agree.
      webkitItemSelected: !hydrating && platform.engine.webkit,
      virtualFocusRef: focusOwnerRef,
      allowEscape: !autoHighlight,
      resetOnPointerLeave: autoHighlight !== 'always',
    },
    dropdownProps: {
      value,
      defaultValue,
      onValueChange,
      filter,
      autoHighlight,
      locale,
    },
  };
}
