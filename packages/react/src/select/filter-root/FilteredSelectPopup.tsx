'use client';
import * as React from 'react';
import { useMenuFilterPopup } from '../../menu/filter-root/useMenuFilterPopup';
import { useFilterDropdownRootContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { SelectPopupPlain, type SelectPopupProps } from '../popup/SelectPopup';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import { resolveAriaLabelledBy } from '../../utils/resolveAriaLabelledBy';
import { mergeProps } from '../../merge-props';
import { useSelectFilterTrapsFocus } from './useSelectFilterTrapsFocus';

/**
 * A container for the filter input and the option list.
 * Renders a `<div>` element with a `dialog` role.
 */
export const FilteredSelectPopup = React.forwardRef(function FilteredSelectPopup(
  props: SelectPopupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const store = useSelectRootContext();
  const { focusOwnerRef } = useFilterDropdownRootContext();
  const { labelId: fieldLabelId } = useLabelableContext();
  // A select's list is always vertical.
  const interactionProps = useMenuFilterPopup('vertical');
  const trapsFocus = useSelectFilterTrapsFocus();

  const id = store.useState('id');
  const labelId = store.useState('labelId');
  const triggerElement = store.useState('triggerElement');

  // The input holds real focus; the popup is never the focus target.
  const initialFocus = React.useCallback(() => focusOwnerRef.current ?? false, [focusOwnerRef]);

  const popupProps = mergeProps<typeof SelectPopupPlain>(
    interactionProps,
    {
      id: id === undefined ? undefined : `${id}-popup`,
      'aria-labelledby': resolveAriaLabelledBy(fieldLabelId, labelId) ?? triggerElement?.id,
      // `Select.List` carries the listbox semantics.
      'aria-multiselectable': undefined,
      'aria-readonly': undefined,
    },
    props,
  );

  return (
    <SelectPopupPlain
      {...popupProps}
      role="dialog"
      initialFocus={initialFocus}
      modal={trapsFocus}
      ref={forwardedRef}
    />
  );
});
