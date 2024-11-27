'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useFieldRootContext } from '../root/FieldRootContext';

export function useFieldLabel(params: useFieldLabel.Parameters) {
  const { customTag } = params;

  const { controlId, labelId } = useFieldRootContext();

  const getLabelProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'label'>(externalProps, {
        id: labelId,
        ...(!customTag && { htmlFor: controlId }),
        onMouseDown(event) {
          const selection = window.getSelection();

          // If text is selected elsewhere on the document when clicking the label, it will not
          // activate. Ensure the selection is not the label text so that selection remains.
          if (selection && !selection.anchorNode?.contains(event.currentTarget)) {
            selection.empty();
          }

          event.preventDefault();
        },
      }),
    [controlId, customTag, labelId],
  );

  return React.useMemo(
    () => ({
      getLabelProps,
    }),
    [getLabelProps],
  );
}

export namespace useFieldLabel {
  export interface Parameters {
    customTag: boolean;
  }
}
