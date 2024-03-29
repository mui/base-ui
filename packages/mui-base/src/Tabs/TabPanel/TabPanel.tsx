'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTabPanel } from '../../useTabPanel/useTabPanel';
import { TabPanelOwnerState, TabPanelProps } from './TabPanel.types';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { resolveClassName } from '../../utils/resolveClassName';
import { useTabsStyleHooks } from './useTabPanelStyleHooks';

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
  const { children, className: classNameProp, value, render: renderProp, ...other } = props;
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

  const rootProps = {
    ...styleHooks,
    ...other,
    className,
    ref: rootRef,
    children: hidden ? undefined : children,
  };

  return render(getRootProps(rootProps), ownerState);
});

TabPanel.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.func,
  /**
   * The value of the TabPanel. It will be shown when the Tab with the corresponding value is selected.
   * If not provided, it will fall back to the index of the panel.
   * It is recommended to explicitly provide it, as it's required for the tab panel to be rendered on the server.
   */
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
} as any;

export { TabPanel };
