'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';

interface UseFieldLabelParameters {
  controlId: string | undefined;
  customTag: boolean;
}

/**
 *
 * API:
 *
 * - [useFieldLabel API](https://mui.com/base-ui/api/use-field-label/)
 */
export function useFieldLabel(params: UseFieldLabelParameters) {
  const { controlId, customTag } = params;

  const getLabelProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'label'>(externalProps, {
        id: `${controlId}-label`,
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
    [controlId, customTag],
  );

  return React.useMemo(
    () => ({
      getLabelProps,
    }),
    [getLabelProps],
  );
}
