'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogTrigger } from './useDialogTrigger';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupOpenStateMapping';

/**
 *
 * Demos:
 *
 * - [Dialog](https://base-ui.netlify.app/components/react-dialog/)
 *
 * API:
 *
 * - [DialogTrigger API](https://base-ui.netlify.app/components/react-dialog/#api-reference-DialogTrigger)
 */
const DialogTrigger = React.forwardRef(function DialogTrigger(
  props: DialogTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...other } = props;
  const {
    open,
    onOpenChange,
    onTriggerClick: fireTriggerClick,
    modal,
    popupElementId,
  } = useDialogRootContext();

  const { getRootProps } = useDialogTrigger({
    open,
    onOpenChange,
    fireTriggerClick,
    popupElementId,
  });

  const ownerState: DialogTrigger.OwnerState = React.useMemo(
    () => ({ open, modal }),
    [open, modal],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'button',
    className,
    ownerState,
    propGetter: getRootProps,
    extraProps: other,
    customStyleHookMapping: triggerOpenStateMapping,
    ref: forwardedRef,
  });

  return renderElement();
});

namespace DialogTrigger {
  export interface Props extends BaseUIComponentProps<'button', OwnerState> {}

  export interface OwnerState {
    open: boolean;
    modal: boolean;
  }
}

DialogTrigger.propTypes /* remove-proptypes */ = {
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { DialogTrigger };
