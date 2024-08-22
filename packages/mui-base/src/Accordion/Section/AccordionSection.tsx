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
import { CollapsibleContext } from '../../Collapsible/Root/CollapsibleContext';
import { useCompositeListItem } from '../../Composite/List/useCompositeListItem';
import type { AccordionRoot } from '../Root/AccordionRoot';
import { useAccordionRootContext } from '../Root/AccordionRootContext';
import { AccordionSectionContext } from './AccordionSectionContext';
import { accordionStyleHookMapping } from './styleHooks';
/**
 *
 * Demos:
 *
 * - [Accordion](https://base-ui.netlify.app/components/react-accordion/)
 *
 * API:
 *
 * - [AccordionSection API](https://base-ui.netlify.app/components/react-accordion/#api-reference-AccordionSection)
 */
const AccordionSection = React.forwardRef(function AccordionSection(
  props: AccordionSection.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    disabled: disabledProp,
    onOpenChange: onOpenChangeProp,
    render,
    value: valueProp,
    ...otherProps
  } = props;

  const sectionRef = React.useRef<HTMLElement>(null);
  const { ref: listItemRef, index } = useCompositeListItem();
  const mergedRef = useForkRef(forwardedRef, listItemRef, sectionRef);

  const {
    animated,
    disabled: contextDisabled,
    handleOpenChange,
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
    handleOpenChange(value, nextOpen);
    if (onOpenChangeProp) {
      onOpenChangeProp(nextOpen);
    }
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

  const collapsibleContext: CollapsibleRoot.Context = React.useMemo(
    () => ({
      ...collapsible,
      ownerState: collapsibleOwnerState,
    }),
    [collapsible, collapsibleOwnerState],
  );

  const ownerState: AccordionSection.OwnerState = React.useMemo(
    () => ({
      ...rootOwnerState,
      index,
      disabled,
      open: isOpen,
      transitionStatus: collapsible.transitionStatus,
    }),
    [collapsible.transitionStatus, disabled, index, isOpen, rootOwnerState],
  );

  const triggerId = useId();

  const accordionSectionContext: AccordionSection.Context = React.useMemo(
    () => ({
      open: isOpen,
      triggerId,
      ownerState,
    }),
    [isOpen, ownerState, triggerId],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: accordionStyleHookMapping,
  });

  return (
    <CollapsibleContext.Provider value={collapsibleContext}>
      <AccordionSectionContext.Provider value={accordionSectionContext}>
        {renderElement()}
      </AccordionSectionContext.Provider>
    </CollapsibleContext.Provider>
  );
});

AccordionSection.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
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

export { AccordionSection };

export namespace AccordionSection {
  export type Value = number | string;

  export interface Context {
    open: boolean;
    triggerId?: string;
    ownerState: OwnerState;
  }

  export interface OwnerState extends AccordionRoot.OwnerState {
    index: number;
    open: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props
    extends BaseUIComponentProps<any, OwnerState>,
      Pick<useCollapsibleRoot.Parameters, 'disabled' | 'onOpenChange'> {
    value?: Value;
  }
}
