'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCollapsibleContext } from '../../Collapsible/Root/CollapsibleContext';
import { useCollapsibleContent } from '../../Collapsible/Content/useCollapsibleContent';
import { useAccordionRootContext } from '../Root/AccordionRootContext';
import type { AccordionSection } from '../Section/AccordionSection';
import { useAccordionSectionContext } from '../Section/AccordionSectionContext';
import { accordionStyleHookMapping } from '../Section/styleHooks';
/**
 *
 * Demos:
 *
 * - [Accordion](https://base-ui.netlify.app/components/react-accordion/)
 *
 * API:
 *
 * - [AccordionPanel API](https://base-ui.netlify.app/components/react-accordion/#api-reference-AccordionPanel)
 */
const AccordionPanel = React.forwardRef(function AccordionPanel(
  props: AccordionPanel.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, htmlHidden: htmlHiddenProp, render, ...otherProps } = props;

  const { animated, mounted, open, contentId, setContentId, setMounted, setOpen } =
    useCollapsibleContext();

  const { htmlHidden } = useAccordionRootContext();

  const { getRootProps, height, width } = useCollapsibleContent({
    animated,
    htmlHidden: htmlHiddenProp || htmlHidden,
    id: contentId,
    mounted,
    open,
    ref: forwardedRef,
    setContentId,
    setMounted,
    setOpen,
  });

  const { ownerState, triggerId } = useAccordionSectionContext();

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    ownerState,
    className,
    extraProps: {
      ...otherProps,
      'aria-labelledby': triggerId,
      role: 'region',
      style: {
        '--accordion-content-height': height ? `${height}px` : undefined,
        '--accordion-content-width': width ? `${width}px` : undefined,
      },
    },
    customStyleHookMapping: accordionStyleHookMapping,
  });

  return renderElement();
});

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
   * The hidden state when closed
   * @default 'hidden'
   */
  htmlHidden: PropTypes.oneOf(['hidden', 'until-found']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { AccordionPanel };

export namespace AccordionPanel {
  export interface Props
    extends BaseUIComponentProps<'div', AccordionSection.OwnerState>,
      Pick<useCollapsibleContent.Parameters, 'htmlHidden'> {}
}
