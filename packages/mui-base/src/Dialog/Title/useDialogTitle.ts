import * as React from 'react';
import type { UseDialogTitleParameters, UseDialogTitleReturnValue } from './DialogTitle.types';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useId } from '../../utils/useId';
/**
 *
 * Demos:
 *
 * - [Dialog](https://mui.com/base-ui/react-dialog/#hooks)
 *
 * API:
 *
 * - [useDialogTitle API](https://mui.com/base-ui/react-dialog/hooks-api/#use-dialog-title)
 */
export function useDialogTitle(parameters: UseDialogTitleParameters): UseDialogTitleReturnValue {
  const { id: idParam } = parameters;
  const { setTitleElementId, open, modal } = useDialogRootContext();
  const id = useId(idParam);

  React.useEffect(() => {
    setTitleElementId(id ?? null);
    return () => {
      setTitleElementId(null);
    };
  }, [id, setTitleElementId]);

  const getRootProps = (otherProps: React.HTMLAttributes<any>) =>
    mergeReactProps(otherProps, { id });

  return {
    getRootProps,
    open,
    modal,
  };
}
