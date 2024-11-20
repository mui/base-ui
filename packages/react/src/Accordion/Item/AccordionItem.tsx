'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useForkRef } from '../../utils/useForkRef';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEventCallback } from '../../utils/useEventCallback';
import { useId } from '../../utils/useId';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useCollapsibleRoot } from '../../Collapsible/Root/useCollapsibleRoot';
import type { CollapsibleRoot } from '../../Collapsible/Root/CollapsibleRoot';
import { CollapsibleRootContext } from '../../Collapsible/Root/CollapsibleRootContext';
import { useCompositeListItem } from '../../Composite/List/useCompositeListItem';
import type { AccordionRoot } from '../Root/AccordionRoot';
import { useAccordionRootContext } from '../Root/AccordionRootContext';
import { AccordionItemContext } from './AccordionItemContext';
import { accordionStyleHookMapping } from './styleHooks';

/**
 *
 * Demos:
 *
 * - [Accordion](https://base-ui.netlify.app/components/react-accordion/)
 *
 * API:
 *
 * - [AccordionItem API](https://base-ui.netlify.app/components/react-accordion/#api-reference-AccordionItem)
 */
const AccordionItem = React.forwardRef(function AccordionItem(
  props: AccordionItem.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    disabled: disabledProp,
    onOpenChange: onOpenChangeProp,
    render,
    value: valueProp,
    ...other
  } = props;

  const { ref: listItemRef, index } = useCompositeListItem();
  const mergedRef = useForkRef(forwardedRef, listItemRef);

  const {
    animated,
    disabled: contextDisabled,
    handleValueChange,
    ownerState: rootOwnerState,
    value: openValues,
  } = useAccordionRootContext();

  const value = valueProp ?? index;

  const disabled = disabledProp || contextDisabled;

  const isOpen = React.useMemo(() => {
    if (!openValues) {
      return false;
    }

    for (let i = 0; i < openValues.length; i += 1) {
      if (openValues[i] === value) {
        return true;
      }
    }

    return false;
  }, [openValues, value]);

  const onOpenChange = useEventCallback((nextOpen: boolean) => {
    handleValueChange(value, nextOpen);
    onOpenChangeProp?.(nextOpen);
  });

  const collapsible = useCollapsibleRoot({
    animated,
    open: isOpen,
    onOpenChange,
    disabled,
  });

  const collapsibleOwnerState: CollapsibleRoot.OwnerState = React.useMemo(
    () => ({
      open: collapsible.open,
      disabled: collapsible.disabled,
      transitionStatus: collapsible.transitionStatus,
    }),
    [collapsible.open, collapsible.disabled, collapsible.transitionStatus],
  );

  const collapsibleContext: CollapsibleRootContext = React.useMemo(
    () => ({
      ...collapsible,
      ownerState: collapsibleOwnerState,
    }),
    [collapsible, collapsibleOwnerState],
  );

  const ownerState: AccordionItem.OwnerState = React.useMemo(
    () => ({
      ...rootOwnerState,
      index,
      disabled,
      open: isOpen,
      transitionStatus: collapsible.transitionStatus,
    }),
    [collapsible.transitionStatus, disabled, index, isOpen, rootOwnerState],
  );

  const [triggerId, setTriggerId] = React.useState<string | undefined>(useId());

  const accordionItemContext: AccordionItemContext = React.useMemo(
    () => ({
      open: isOpen,
      ownerState,
      setTriggerId,
      triggerId,
    }),
    [isOpen, ownerState, setTriggerId, triggerId],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: other,
    customStyleHookMapping: accordionStyleHookMapping,
  });

  return (
    <CollapsibleRootContext.Provider value={collapsibleContext}>
      <AccordionItemContext.Provider value={accordionItemContext}>
        {renderElement()}
      </AccordionItemContext.Provider>
    </CollapsibleRootContext.Provider>
  );
});

export namespace AccordionItem {
  export type Value = number | string;

  export interface OwnerState extends AccordionRoot.OwnerState {
    index: number;
    open: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props
    extends BaseUIComponentProps<'div', OwnerState>,
      Pick<useCollapsibleRoot.Parameters, 'disabled' | 'onOpenChange'> {
    value?: Value;
  }
}

export { AccordionItem };

AccordionItem.propTypes /* remove-proptypes */ = {
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
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Callback fired when the Collapsible is opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
} as any;
