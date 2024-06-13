import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type {
  UseCheckboxGroupLabelParameters,
  UseCheckboxGroupLabelReturnValue,
} from './useCheckboxGroupLabel.types';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useId } from '../../utils/useId';

/**
 *
 * API:
 *
 * - [useCheckboxGroupLabel API](https://mui.com/base-ui/api/use-checkbox-group-label/)
 */
export function useCheckboxGroupLabel(
  params: UseCheckboxGroupLabelParameters,
): UseCheckboxGroupLabelReturnValue {
  const { id: idProp, setId } = params;

  const fallbackId = useId();
  const id = idProp ?? fallbackId;

  const getLabelProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps(externalProps, {
        id,
      });
    },
    [id],
  );

  useEnhancedEffect(() => {
    setId(id);
    return () => {
      setId(undefined);
    };
  }, [setId, id]);

  return React.useMemo(
    () => ({
      getLabelProps,
    }),
    [getLabelProps],
  );
}
