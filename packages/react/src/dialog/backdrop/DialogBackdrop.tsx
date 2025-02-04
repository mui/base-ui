'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { type BaseUIComponentProps } from '../../utils/types';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useForkRef } from '../../utils/useForkRef';

const customStyleHookMapping: CustomStyleHookMapping<DialogBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogBackdrop = React.forwardRef(function DialogBackdrop(
  props: DialogBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...other } = props;
  const { open, nested, mounted, transitionStatus, backdropRef } = useDialogRootContext();

  const state: DialogBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  const mergedRef = useForkRef(backdropRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    ref: mergedRef,
    extraProps: {
      role: 'presentation',
      hidden: !mounted,
      ...other,
    },
    customStyleHookMapping,
  });

  // no need to render nested backdrops
  const shouldRender = !nested;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace DialogBackdrop {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {
    /**
     * Whether the dialog is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}

DialogBackdrop.propTypes /* remove-proptypes */ = {
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
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { DialogBackdrop };
