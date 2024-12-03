'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager, type Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { popupOpenStateMapping } from '../../utils/popupOpenStateMapping';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useSelectPopup } from './useSelectPopup';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { transitionStatusMapping } from '../../utils/styleHookMapping';

const customStyleHookMapping: CustomStyleHookMapping<SelectPopup.State> = {
  ...popupOpenStateMapping,
  ...transitionStatusMapping,
};

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.com/components/react-select/)
 *
 * API:
 *
 * - [SelectPopup API](https://base-ui.com/components/react-select/#api-reference-SelectPopup)
 */
const SelectPopup = React.forwardRef(function SelectPopup(
  props: SelectPopup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...otherProps } = props;

  const { id, open, popupRef, transitionStatus, alignOptionToTrigger, mounted } =
    useSelectRootContext();

  const positioner = useSelectPositionerContext();

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
    extraProps: otherProps,
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
      {id && alignOptionToTrigger && (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={html}
        />
      )}
      <FloatingFocusManager
        context={positioner.positionerContext}
        modal={false}
        disabled={!mounted}
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
     * The id of the popup element.
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The id of the popup element.
   */
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectPopup };
