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
    shouldSkipActivationOnPointerDown: shouldSkipTabActivationForPointerDown,
    value,
  });

  const linkTabState: TabsLinkTabState = state;
  const linkTabProps = {
    onClick(event: BaseUIEvent<React.MouseEvent<HTMLAnchorElement>>) {
      if (shouldSkipTabActivationForClick(event)) {
        event.preventBaseUIHandler();
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

function shouldSkipTabActivationForClick(event: React.MouseEvent<HTMLAnchorElement>) {
  if (!isMouseEvent(event)) {
    return false;
  }

  return shouldSkipTabActivationForMouseEvent(event);
}

function shouldSkipTabActivationForPointerDown(event: React.PointerEvent<HTMLElement>) {
  return shouldSkipTabActivationForMouseEvent(event);
}

function shouldSkipTabActivationForMouseEvent(
  event: React.MouseEvent<HTMLElement> | React.PointerEvent<HTMLElement>,
) {
  const element = event.currentTarget as HTMLAnchorElement;

  // Let normal link behavior win when the click does not navigate in the current page:
  // new-window/download links and modified or non-primary clicks should not update
  // the selected tab in this browsing context.
  return (
    (element.target !== '' && element.target !== '_self') ||
    element.hasAttribute('download') ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function isMouseEvent(event: React.MouseEvent<HTMLElement>) {
  const win = ownerWindow(event.currentTarget);
  return event.nativeEvent instanceof win.MouseEvent;
}

export interface TabsLinkTabState extends TabsTab.State {}

export interface TabsLinkTabProps extends Omit<
  BaseUIComponentProps<'a', TabsLinkTabState>,
  'download' | 'target'
> {
  /**
   * The value of the LinkTab.
   */
  value: TabsTab.Value;
  /**
   * Whether the LinkTab is disabled.
   *
   * If the first LinkTab in a `<Tabs.List>` is disabled, it won't initially be selected.
   * Instead, the next enabled LinkTab will be selected.
   * However, it does not work like this during server-side rendering, as it is not known
   * during pre-rendering which LinkTabs are disabled.
   * To work around it, ensure that `defaultValue` or `value` on `<Tabs.Root>` is set to an enabled LinkTab's value.
   */
  disabled?: boolean | undefined;
}

export namespace TabsLinkTab {
  export type State = TabsLinkTabState;
  export type Props = TabsLinkTabProps;
}
