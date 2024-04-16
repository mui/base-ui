'use client';
import * as React from 'react';
import { useTabPanel } from '../../useTabPanel/useTabPanel';
import { TabPanelOwnerState, TabPanelProps } from './TabPanel.types';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { resolveClassName } from '../../utils/resolveClassName';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useTabsStyleHooks } from './useTabPanelStyleHooks';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';

/**
 *
 * Demos:
 *
 * - [Tabs](https://mui.com/base-ui/react-tabs/)
 *
 * API:
 *
 * - [TabPanel API](https://mui.com/base-ui/react-tabs/components-api/#tab-panel)
 */
const TabPanel = React.forwardRef(function TabPanel(
  props: TabPanelProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    children,
    className: classNameProp,
    value,
    render: renderProp,
    keepMounted = false,
    ...other
  } = props;
  const render = renderProp ?? defaultRenderFunctions.div;

  const { hidden, getRootProps, rootRef, orientation, direction } = useTabPanel({
    ...props,
    rootRef: forwardedRef,
  });

  const ownerState: TabPanelOwnerState = {
    hidden,
    orientation,
    direction,
  };

  const className = resolveClassName(classNameProp, ownerState);
  const styleHooks = useTabsStyleHooks(ownerState);
  const mergedRef = useRenderPropForkRef(render, rootRef);

  const rootProps = getRootProps({
    ...styleHooks,
    ...other,
    className,
    ref: mergedRef,
    children: hidden && !keepMounted ? undefined : children,
  });

  return evaluateRenderProp(render, rootProps, ownerState);
});

export { TabPanel };
