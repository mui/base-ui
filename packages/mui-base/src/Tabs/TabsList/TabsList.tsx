'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { TabsListOwnerState, TabsListProps } from './TabsList.types';
import { useTabsList } from '../../useTabsList';
import { TabsListProvider } from '../../useTabsList/TabsListProvider';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { resolveClassName } from '../../utils/resolveClassName';
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
  const { isRtl, orientation, getRootProps, contextValue } = useTabsList({
    rootRef: forwardedRef,
    loop,
    activateOnFocus,
  });

  const ownerState: TabsListOwnerState = React.useMemo(
    () => ({
      isRtl,
      orientation,
    }),
    [isRtl, orientation],
  );

  const className = resolveClassName(classNameProp, ownerState);
  const styleHooks = useTabsListStyleHooks(ownerState);

  const rootProps = {
    ...styleHooks,
    ...other,
    className,
    ref: forwardedRef,
  };

  return (
    <TabsListProvider value={contextValue}>
      {render(getRootProps(rootProps), ownerState)}
    </TabsListProvider>
  );
});

TabsList.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, the tab will be activated whenever it is focused.
   * Otherwise, it has to be activated by clicking or pressing the Enter or Space key.
   *
   * @default true
   */
  activateOnFocus: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
   *
   * @default true
   */
  loop: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.func,
} as any;

export { TabsList };
