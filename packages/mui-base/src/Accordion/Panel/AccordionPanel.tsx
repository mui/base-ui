'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCollapsibleRootContext } from '../../Collapsible/Root/CollapsibleRootContext';
import { useCollapsiblePanel } from '../../Collapsible/Panel/useCollapsiblePanel';
import { useAccordionRootContext } from '../Root/AccordionRootContext';
import type { AccordionItem } from '../Item/AccordionItem';
import { useAccordionItemContext } from '../Item/AccordionItemContext';
import { accordionStyleHookMapping } from '../Item/styleHooks';

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
  const {
    className,
    hiddenUntilFound: hiddenUntilFoundProp,
    id: idProp,
    render,
    style: styleProp,
    ...otherProps
  } = props;

  const { animated, mounted, open, panelId, setPanelId, setMounted, setOpen } =
    useCollapsibleRootContext();

  const { hiddenUntilFound } = useAccordionRootContext();

  const { getRootProps, height, width } = useCollapsiblePanel({
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

  const { ownerState, triggerId } = useAccordionItemContext();

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
        '--accordion-panel-height': height ? `${height}px` : undefined,
        '--accordion-panel-width': width ? `${width}px` : undefined,
        ...styleProp,
      },
    },
    customStyleHookMapping: accordionStyleHookMapping,
  });

  return renderElement();
});

export namespace AccordionPanel {
  export type Props = BaseUIComponentProps<'div', AccordionItem.OwnerState> &
    Pick<useCollapsiblePanel.Parameters, 'hiddenUntilFound'> & {};
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
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * If `true`, sets `hidden="until-found"` when closed.
   * If `false`, sets `hidden` when closed.
   * @default false
   */
  hiddenUntilFound: PropTypes.bool,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  style: PropTypes.object,
} as any;
