'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { Side } from '../../utils/useAnchorPositioning';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useSelectPopup } from './useSelectPopup';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { mergeProps } from '../../merge-props';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';

const customStyleHookMapping: CustomStyleHookMapping<SelectPopup.State> = {
  ...popupStateMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the select items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectPopup = React.forwardRef(function SelectPopup(
  props: SelectPopup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...otherProps } = props;

  const {
    id,
    open,
    popupRef,
    transitionStatus,
    alignItemToTrigger,
    mounted,
    modal,
    onOpenChangeComplete,
    floatingRootContext,
  } = useSelectRootContext();
  const positioner = useSelectPositionerContext();

  useOpenChangeComplete({
    open,
    ref: popupRef,
    onComplete() {
      if (open) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const { getPopupProps } = useSelectPopup();

  const mergedRef = useForkRef(forwardedRef, popupRef);

  const state: SelectPopup.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
      side: positioner.side,
      align: positioner.align,
    }),
    [open, transitionStatus, positioner],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getPopupProps,
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    customStyleHookMapping,
    extraProps:
      transitionStatus === 'starting'
        ? mergeProps(
            {
              style: { transition: 'none' },
            },
            otherProps,
          )
        : otherProps,
  });

  const popupSelector = `[data-id="${id}-popup"]`;

  const html = React.useMemo(
    () => ({
      __html: `${popupSelector}{scrollbar-width:none}${popupSelector}::-webkit-scrollbar{display:none}`,
    }),
    [popupSelector],
  );

  return (
    <React.Fragment>
      {id && alignItemToTrigger && (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={html}
        />
      )}
      <FloatingFocusManager
        context={floatingRootContext}
        modal={false}
        disabled={!mounted}
        visuallyHiddenDismiss={modal ? 'Dismiss popup' : undefined}
      >
        {renderElement()}
      </FloatingFocusManager>
    </React.Fragment>
  );
});

namespace SelectPopup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    children?: React.ReactNode;
    /**
     * @ignore
     */
    id?: string;
  }

  export interface State {
    side: Side | 'none';
    align: 'start' | 'end' | 'center';
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}

SelectPopup.propTypes /* remove-proptypes */ = {
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
   * @ignore
   */
  id: PropTypes.string,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectPopup };
