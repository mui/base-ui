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
 *
 * Demos:
 *
 * - [Collapsible](https://base-ui.com/components/react-collapsible/)
 *
 * API:
 *
 * - [CollapsiblePanel API](https://base-ui.com/components/react-collapsible/#api-reference-CollapsiblePanel)
 */
const CollapsiblePanel = React.forwardRef(function CollapsiblePanel(
  props: CollapsiblePanel.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
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

  const { mounted, open, panelId, setPanelId, setMounted, setOpen, state } =
    useCollapsibleRootContext();

  useEnhancedEffect(() => {
    if (idProp) {
      setPanelId(idProp);
    }
  }, [idProp, setPanelId]);

  const hiddenUntilFound = hiddenUntilFoundProp ?? false;

  const { getRootProps, height, width, isOpen } = useCollapsiblePanel({
    hiddenUntilFound,
    panelId,
    keepMounted: keepMountedProp ?? false,
    mounted,
    open,
    ref: forwardedRef,
    setPanelId,
    setMounted,
    setOpen,
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
        [CollapsiblePanelCssVars.collapsiblePanelWidth]: width ? `${width}px` : undefined,
      },
    },
    customStyleHookMapping: collapsibleStyleHookMapping,
  });

  if (!keepMountedProp && !isOpen && !hiddenUntilFound) {
    return null;
  }

  return renderElement();
});

export { CollapsiblePanel };

namespace CollapsiblePanel {
  export interface Props extends BaseUIComponentProps<'div', CollapsibleRoot.State> {
    /**
     * If `true`, sets the hidden state using `hidden="until-found"`. The panel
     * remains mounted in the DOM when closed and overrides `keepMounted`.
     * If `false`, sets the hidden state using `hidden`.
     * @default false
     */
    hiddenUntilFound?: boolean;
    /**
     * If `true`, the panel remains mounted when closed and is instead
     * hidden using the `hidden` attribute
     * If `false`, the panel is unmounted when closed.
     * If the `hiddenUntilFound` prop is used, the panel overrides this prop and
     * is remains mounted when closed.
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * If `true`, sets the hidden state using `hidden="until-found"`. The panel
   * remains mounted in the DOM when closed and overrides `keepMounted`.
   * If `false`, sets the hidden state using `hidden`.
   * @default false
   */
  hiddenUntilFound: PropTypes.bool,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * If `true`, the panel remains mounted when closed and is instead
   * hidden using the `hidden` attribute
   * If `false`, the panel is unmounted when closed.
   * If the `hiddenUntilFound` prop is used, the panel overrides this prop and
   * is remains mounted when closed.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  style: PropTypes.object,
} as any;
