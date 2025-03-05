import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useBaseUiId } from '../../utils/useBaseUiId';

export function usePopoverDescription(
  params: usePopoverDescription.Parameters,
): usePopoverDescription.ReturnValue {
  const { descriptionId, setDescriptionId } = params;

  const id = useBaseUiId(descriptionId);

  const getDescriptionProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'p'>(
        {
          id,
        },
        externalProps,
      );
    },
    [id],
  );

  useEnhancedEffect(() => {
    setDescriptionId(id);
    return () => {
      setDescriptionId(undefined);
    };
  }, [setDescriptionId, id]);

  return React.useMemo(
    () => ({
      getDescriptionProps,
    }),
    [getDescriptionProps],
  );
}

namespace usePopoverDescription {
  export interface Parameters {
    descriptionId: string | undefined;
    setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
  }
  export interface ReturnValue {
    getDescriptionProps: (
      externalProps?: React.ComponentPropsWithoutRef<'p'>,
    ) => React.ComponentPropsWithoutRef<'p'>;
  }
}
