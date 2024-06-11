import * as React from 'react';
import PropTypes from 'prop-types';
import { AlertDialogRootProps } from './AlertDialogRoot.types';
import { DialogRoot } from '../../Dialog/Root/DialogRoot';

function AlertDialogRoot(props: AlertDialogRootProps) {
  return <DialogRoot {...props} modal softClose={false} />;
}

AlertDialogRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
} as any;

export { AlertDialogRoot };
