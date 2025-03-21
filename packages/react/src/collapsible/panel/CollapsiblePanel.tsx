'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { warn } from '../../utils/warn';
import { useCollapsibleRootContext } from '../root/CollapsibleRootContext';
import type { CollapsibleRoot } from '../root/CollapsibleRoot';
import { collapsibleStyleHookMapping } from '../root/styleHooks';
import { useCollapsiblePanel } from './useCollapsiblePanel';
import { CollapsiblePanelCssVars } from './CollapsiblePanelCssVars';

/**
 * A panel with the collapsible contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 */
const CollapsiblePanel = React.forwardRef(function CollapsiblePanel(
  props: CollapsiblePanel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    hiddenUntilFound: hiddenUntilFoundProp,
    id: idProp,
    keepMounted: keepMountedProp,
    render,
    ...otherProps
  } = props;

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEnhancedEffect(() => {
      if (hiddenUntilFoundProp && keepMountedProp === false) {
        warn(
          'The `keepMounted={false}` prop on a Collapsible will be ignored when using `hiddenUntilFound` since it requires the Panel to remain mounted even when closed.',
        );
      }
    }, [hiddenUntilFoundProp, keepMountedProp]);
  }

  const {
    abortControllerRef,
    animationTypeRef,
    height,
    mounted,
    onOpenChange,
    open,
    panelId,
    panelRef,
    runOnceAnimationsFinish,
    setHeight,
    setHiddenUntilFound,
    setKeepMounted,
    setMounted,
    setOpen,
    setPanelId,
    setVisible,
    state,
    visible,
  } = useCollapsibleRootContext();

  const hiddenUntilFound = hiddenUntilFoundProp ?? false;
  const keepMounted = keepMountedProp ?? false;

  useEnhancedEffect(() => {
    setHiddenUntilFound(hiddenUntilFound);
  }, [setHiddenUntilFound, hiddenUntilFound]);

  useEnhancedEffect(() => {
    setKeepMounted(keepMounted);
  }, [setKeepMounted, keepMounted]);

  const { getRootProps } = useCollapsiblePanel({
    abortControllerRef,
    animationTypeRef,
    externalRef: forwardedRef,
    height,
    hiddenUntilFound,
    id: idProp ?? panelId,
    keepMounted,
    mounted,
    onOpenChange,
    open,
    panelRef,
    runOnceAnimationsFinish,
    setHeight,
    setMounted,
    setOpen,
    setPanelId,
    setVisible,
    visible,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    state,
    className,
    extraProps: {
      ...otherProps,
      style: {
        ...otherProps.style,
        [CollapsiblePanelCssVars.collapsiblePanelHeight]: height ? `${height}px` : undefined,
      },
    },
    customStyleHookMapping: collapsibleStyleHookMapping,
  });

  if (keepMounted || hiddenUntilFound || (!keepMounted && mounted)) {
    return renderElement();
  }

  return null;
});

export { CollapsiblePanel };

namespace CollapsiblePanel {
  export interface Props extends BaseUIComponentProps<'div', CollapsibleRoot.State> {
    /**
     * Allows the browser’s built-in page search to find and expand the panel contents.
     *
     * Overrides the `keepMounted` prop and uses `hidden="until-found"`
     * to hide the element without removing it from the DOM.
     *
     * @default false
     */
    hiddenUntilFound?: boolean;
    /**
     * Whether to keep the element in the DOM while the panel is hidden.
     * This prop is ignored when `hiddenUntilFound` is used.
     * @default false
     */
    keepMounted?: boolean;
  }
}

CollapsiblePanel.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Allows the browser’s built-in page search to find and expand the panel contents.
   *
   * Overrides the `keepMounted` prop and uses `hidden="until-found"`
   * to hide the element without removing it from the DOM.
   *
   * @default false
   */
  hiddenUntilFound: PropTypes.bool,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * Whether to keep the element in the DOM while the panel is hidden.
   * This prop is ignored when `hiddenUntilFound` is used.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  style: PropTypes.object,
} as any;
