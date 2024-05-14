import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogTrigger } from './useDialogTrigger';
import type { DialogTriggerProps } from './DialogTrigger.types';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { getStyleHookProps } from '../../utils/getStyleHookProps';

function DialogTrigger(props: DialogTriggerProps) {
  const { children } = props;
  const { open, onOpenChange, modal, popupElementId } = useDialogRootContext();

  const { getRootProps } = useDialogTrigger({
    open,
    onOpenChange,
    popupElementId,
  });

  const styleHooks = React.useMemo(
    () =>
      getStyleHookProps(
        { open, modal },
        {
          open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
        },
      ),
    [open, modal],
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
