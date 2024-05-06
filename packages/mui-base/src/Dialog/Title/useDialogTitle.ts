import * as React from 'react';
import type { UseDialogTitleParameters, UseDialogTitleReturnValue } from './DialogTitle.types';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useId } from '../../utils/useId';

export function useDialogTitle(parameters: UseDialogTitleParameters): UseDialogTitleReturnValue {
  const { id: idParam } = parameters;
  const { setTitleElementId, open, modal, type } = useDialogRootContext();
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
    type,
    modal,
  };
}
