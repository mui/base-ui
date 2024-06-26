import * as React from 'react';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useId } from '../../utils/useId';
import type { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';

interface UseFormLabelParameters {
  id: string | undefined;
  setId: React.Dispatch<React.SetStateAction<string | undefined>>;
  preventTextSelection?: boolean;
}

interface UseFormLabelReturnValue {
  getLabelProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}

/**
 * @ignore - internal hook.
 */
export function useFormLabel(params: UseFormLabelParameters): UseFormLabelReturnValue {
  const { id: idProp, setId, preventTextSelection = true } = params;

  const id = useId(idProp);

  useEnhancedEffect(() => {
    setId(id);
    return () => {
      setId(undefined);
    };
  }, [id, setId]);

  const getLabelProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'label'>(externalProps, {
        id,
        onMouseDown(event) {
          if (preventTextSelection) {
            event.preventDefault();
          }
        },
      }),
    [id, preventTextSelection],
  );

  return React.useMemo(
    () => ({
      getLabelProps,
    }),
    [getLabelProps],
  );
}
