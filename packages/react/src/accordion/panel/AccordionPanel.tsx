'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { useCollapsiblePanel } from '../../collapsible/panel/useCollapsiblePanel';
import { useAccordionRootContext } from '../root/AccordionRootContext';
import type { AccordionRoot } from '../root/AccordionRoot';
import type { AccordionItem } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import { accordionStyleHookMapping } from '../item/styleHooks';

/**
 *
 * Demos:
 *
 * - [Accordion](https://base-ui.com/components/react-accordion/)
 *
 * API:
 *
 * - [AccordionPanel API](https://base-ui.com/components/react-accordion/#api-reference-AccordionPanel)
 */
const AccordionPanel = React.forwardRef(function AccordionPanel(
  props: AccordionPanel.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    className,
    hiddenUntilFound: hiddenUntilFoundProp,
    keepMounted: keepMountedProp,
    id: idProp,
    render,
    style: styleProp,
    ...otherProps
  } = props;

  const { animated, mounted, open, panelId, setPanelId, setMounted, setOpen } =
    useCollapsibleRootContext();

  const { hiddenUntilFound, keepMounted } = useAccordionRootContext();

  const { getRootProps, height, width, isOpen } = useCollapsiblePanel({
    animated,
    hiddenUntilFound: hiddenUntilFoundProp || hiddenUntilFound,
    id: idProp ?? panelId,
    mounted,
    open,
    ref: forwardedRef,
    setPanelId,
    setMounted,
    setOpen,
  });

  const { state, triggerId } = useAccordionItemContext();

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    state,
    className,
    extraProps: {
      ...otherProps,
      'aria-labelledby': triggerId,
      role: 'region',
      style: {
        '--accordion-panel-height': height ? `${height}px` : undefined,
        '--accordion-panel-width': width ? `${width}px` : undefined,
        ...styleProp,
      },
    },
    customStyleHookMapping: accordionStyleHookMapping,
  });

  if (!(keepMountedProp || keepMounted) && !isOpen) {
    return null;
  }

  return renderElement();
});

export namespace AccordionPanel {
  export interface Props
    extends BaseUIComponentProps<'div', AccordionItem.State>,
      Pick<AccordionRoot.Props, 'hiddenUntilFound' | 'keepMounted'> {}
}

export { AccordionPanel };

AccordionPanel.propTypes /* remove-proptypes */ = {
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
   * If `true`, sets `hidden="until-found"` when closed.
   * Requires setting `keepMounted` to `true`.
   * If `false`, sets `hidden` when closed.
   * @default false
   */
  hiddenUntilFound: PropTypes.bool,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * If `true`, accordion panels remains mounted when closed and is instead
   * hidden using the `hidden` attribute.
   * If `false`, accordion panels are unmounted when closed.
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