import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager } from '@floating-ui/react';
import { DialogPopupProps } from './DialogPopup.types';
import { useDialogPopup } from './useDialogPopup';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useBaseUIComponentRenderer } from '../../utils/useBaseUIComponentRenderer';

const DialogPopup = React.forwardRef(function DialogPopup(
  props: DialogPopupProps & React.ComponentPropsWithoutRef<'div'>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, keepMounted, id: idProp, ...other } = props;

  const { getRootProps, open, floatingContext, modal, type } = useDialogPopup({
    id: idProp,
    keepMounted,
    ref: forwardedRef,
  });

  const ownerState = {
    open,
    modal,
    type,
  };

  const { renderElement } = useBaseUIComponentRenderer({
    render: render ?? defaultRenderFunctions.div,
    className,
    ownerState,
    propGetter: getRootProps,
    extraProps: other,
    customStyleHookMapping: { open: (value) => ({ 'data-state': value ? 'open' : 'closed' }) },
  });

  if (!keepMounted && !open) {
    return null;
  }

  return open ? (
    <FloatingFocusManager context={floatingContext} modal={modal} guards={false}>
      {renderElement()}
    </FloatingFocusManager>
  ) : (
    renderElement()
  );
});

DialogPopup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * @ignore
   */
  keepMounted: PropTypes.bool,
} as any;

export { DialogPopup };
