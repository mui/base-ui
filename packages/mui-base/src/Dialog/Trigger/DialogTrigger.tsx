import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogTrigger } from './useDialogTrigger';
import type { DialogTriggerOwnerState, DialogTriggerProps } from './DialogTrigger.types';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const DialogTrigger = React.forwardRef(function DialogTrigger(
  props: DialogTriggerProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...other } = props;
  const { open, onOpenChange, modal, popupElementId } = useDialogRootContext();

  const { getRootProps } = useDialogTrigger({
    open,
    onOpenChange,
    popupElementId,
  });

  const ownerState: DialogTriggerOwnerState = React.useMemo(() => ({ open, modal }), [open, modal]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'button',
    className,
    ownerState,
    propGetter: getRootProps,
    extraProps: other,
    customStyleHookMapping: {
      open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
    },
    ref: forwardedRef,
  });

  return renderElement();
});

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
