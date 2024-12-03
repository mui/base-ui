'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useForkRef } from '../../utils/useForkRef';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEventCallback } from '../../utils/useEventCallback';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useCollapsibleRoot } from '../../collapsible/root/useCollapsibleRoot';
import type { CollapsibleRoot } from '../../collapsible/root/CollapsibleRoot';
import { CollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import type { AccordionRoot } from '../root/AccordionRoot';
import { useAccordionRootContext } from '../root/AccordionRootContext';
import { AccordionItemContext } from './AccordionItemContext';
import { accordionStyleHookMapping } from './styleHooks';

/**
 *
 * Demos:
 *
 * - [Accordion](https://base-ui.com/components/react-accordion/)
 *
 * API:
 *
 * - [AccordionItem API](https://base-ui.com/components/react-accordion/#api-reference-AccordionItem)
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
    state: rootState,
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

  const collapsibleState: CollapsibleRoot.State = React.useMemo(
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
      state: collapsibleState,
    }),
    [collapsible, collapsibleState],
  );

  const state: AccordionItem.State = React.useMemo(
    () => ({
      ...rootState,
      index,
      disabled,
      open: isOpen,
      transitionStatus: collapsible.transitionStatus,
    }),
    [collapsible.transitionStatus, disabled, index, isOpen, rootState],
  );

  const [triggerId, setTriggerId] = React.useState<string | undefined>(useBaseUiId());

  const accordionItemContext: AccordionItemContext = React.useMemo(
    () => ({
      open: isOpen,
      state,
      setTriggerId,
      triggerId,
    }),
    [isOpen, state, setTriggerId, triggerId],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
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

  export interface State extends AccordionRoot.State {
    index: number;
    open: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props
    extends BaseUIComponentProps<'div', State>,
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
