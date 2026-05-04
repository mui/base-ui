'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps, BaseUIEvent } from '../../internals/types';
import { tabsStateAttributesMapping } from '../root/stateAttributesMapping';
import type { TabsTab } from '../tab/TabsTab';
import { useTabsTab } from '../tab/useTabsTab';

/**
 * An individual interactive tab that navigates to a different page or section.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export const TabsLinkTab = React.forwardRef(function TabsLinkTab(
  componentProps: TabsLinkTab.Props,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const {
    className,
    disabled = false,
    render,
    value,
    id: idProp,
    style,
    ...elementProps
  } = componentProps;

  const { getTabProps, refs, state } = useTabsTab({
    disabled,
    id: idProp,
    nativeButton: false,
    value,
  });

  const linkTabState: TabsLinkTabState = state;
  const linkTabProps = {
    onClick(event: React.MouseEvent<HTMLAnchorElement>) {
      if (shouldSkipTabActivationForClick(event)) {
        (event as BaseUIEvent<typeof event>).preventBaseUIHandler();
      }
    },
  };

  return useRenderElement('a', componentProps, {
    state: linkTabState,
    ref: [forwardedRef, ...refs],
    props: [linkTabProps, elementProps, getTabProps],
    stateAttributesMapping: tabsStateAttributesMapping,
  });
});

function shouldSkipTabActivationForClick(event: React.MouseEvent<HTMLElement>) {
  const win = ownerWindow(event.currentTarget);

  // Keyboard activation also dispatches click handlers, but it should still select the tab.
  // Only mouse clicks need the link-navigation guard below.
  if (!(event.nativeEvent instanceof win.MouseEvent)) {
    return false;
  }

  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export interface TabsLinkTabState extends TabsTab.State {}

export interface TabsLinkTabProps extends BaseUIComponentProps<'a', TabsLinkTabState> {
  /**
   * The value of the LinkTab.
   */
  value: TabsTab.Value;
  /**
   * Whether the LinkTab is disabled.
   *
   * If a first LinkTab on a `<Tabs.List>` is disabled, it won't initially be selected.
   * Instead, the next enabled Tab will be selected.
   * However, it does not work like this during server-side rendering, as it is not known
   * during pre-rendering which Tabs are disabled.
   * To work around it, ensure that `defaultValue` or `value` on `<Tabs.Root>` is set to an enabled Tab's value.
   */
  disabled?: boolean | undefined;
}

export namespace TabsLinkTab {
  export type State = TabsLinkTabState;
  export type Props = TabsLinkTabProps;
}
