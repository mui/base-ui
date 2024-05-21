import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import type { DialogPortalProps } from './DialogPortal.types';
import { refType, HTMLElementType } from '../../utils/proptypes';

function DialogPortal(props: DialogPortalProps) {
  return <FloatingPortal {...props} />;
}

DialogPortal.propTypes /* remove-proptypes */ = {
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
  preserveTabOrder: PropTypes.bool,
  /**
   * @ignore
   */
  root: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    PropTypes.func,
    HTMLElementType,
    refType,
  ]),
} as any;

export { DialogPortal };
