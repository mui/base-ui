import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogTrigger } from './useDialogTrigger';
import type { DialogTriggerProps } from './DialogTrigger.types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';

function DialogTrigger(props: DialogTriggerProps) {
  const { children } = props;
  const { getRootProps, open, modal, type } = useDialogTrigger();
  const styleHooks = React.useMemo(
    () =>
      getStyleHookProps(
        { open, modal, type },
        {
          open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
        },
      ),
    [open, modal, type],
  );

  return React.cloneElement(children, getRootProps(styleHooks));
}

DialogTrigger.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.element.isRequired,
} as any;

export { DialogTrigger };
