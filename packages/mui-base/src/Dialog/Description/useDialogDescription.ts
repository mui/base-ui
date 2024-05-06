import * as React from 'react';
import type {
  UseDialogDescriptionParameters,
  UseDialogDescriptionReturnValue,
} from './DialogDescription.types';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useId } from '../../utils/useId';

export function useDialogDescription(
  parameters: UseDialogDescriptionParameters,
): UseDialogDescriptionReturnValue {
  const { id: idParam } = parameters;
  const { setDescriptionElementId, open, modal, type } = useDialogRootContext();
  const id = useId(idParam);

  React.useEffect(() => {
    setDescriptionElementId(id ?? null);
    return () => {
      setDescriptionElementId(null);
    };
  }, [id, setDescriptionElementId]);

  const getRootProps = (otherProps: React.HTMLAttributes<any>) =>
    mergeReactProps(otherProps, { id });

  return {
    getRootProps,
    open,
    type,
    modal,
  };
}
