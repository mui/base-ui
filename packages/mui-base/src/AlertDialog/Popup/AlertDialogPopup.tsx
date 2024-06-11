import { DialogPopup, DialogPopupProps } from '@base_ui/react/Dialog/index.barrel';
import PropTypes from 'prop-types';
import * as React from 'react';

const AlertDialogPopup = React.forwardRef(function AlertDialogPopup(
  props: DialogPopupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return <DialogPopup {...props} ref={forwardedRef} role="alertdialog" />;
});

AlertDialogPopup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
} as any;

export { AlertDialogPopup };
