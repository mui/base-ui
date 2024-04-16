'use client';
import * as React from 'react';
import { TabsListOwnerState, TabsListProps } from './TabsList.types';
import { useTabsList } from '../../useTabsList';
import { TabsListProvider } from '../../useTabsList/TabsListProvider';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { resolveClassName } from '../../utils/resolveClassName';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';
import { useTabsListStyleHooks } from './useTabsListStyleHooks';

/**
 *
 * Demos:
 *
 * - [Tabs](https://mui.com/base-ui/react-tabs/)
 *
 * API:
 *
 * - [TabsList API](https://mui.com/base-ui/react-tabs/components-api/#tabs-list)
 */
const TabsList = React.forwardRef(function TabsList(
  props: TabsListProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    activateOnFocus = true,
    className: classNameProp,
    loop = true,
    render: renderProp,
    ...other
  } = props;

  const render = renderProp ?? defaultRenderFunctions.div;
  const { direction, orientation, getRootProps, contextValue, rootRef } = useTabsList({
    rootRef: forwardedRef,
    loop,
    activateOnFocus,
  });

  const ownerState: TabsListOwnerState = React.useMemo(
    () => ({
      direction,
      orientation,
    }),
    [direction, orientation],
  );

  const className = resolveClassName(classNameProp, ownerState);
  const styleHooks = useTabsListStyleHooks(ownerState);
  const mergedRef = useRenderPropForkRef(render, rootRef);

  const rootProps = getRootProps({
    ...styleHooks,
    ...other,
    className,
    ref: mergedRef,
  });

  return (
    <TabsListProvider value={contextValue}>
      {evaluateRenderProp(render, rootProps, ownerState)}
    </TabsListProvider>
  );
});

export { TabsList };
