'use client';
import * as React from 'react';
import { useFilterDropdownPopup } from '../../filter-dropdown/popup/useFilterDropdownPopup';
import { useFilterDropdownRootContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { SelectPopupPlain } from '../popup/SelectPopup';
import type { SelectPopupProps } from '../popup/SelectPopup';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import { resolveAriaLabelledBy } from '../../utils/resolveAriaLabelledBy';
import { mergeProps } from '../../merge-props';
import { resolvePopupLabel } from '../../internals/resolvePopupLabel';
import { useSelectFilterNavigationContext } from './SelectFilterContext';

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
  const interactionProps = useFilterDropdownPopup('vertical', 'Select');

  const id = store.useState('id');
  const labelId = store.useState('labelId');
  const triggerElement = store.useState('triggerElement');
  const openMethod = store.useState('openMethod');
  const { virtualPressRef } = useSelectFilterNavigationContext();

  // The input holds real focus; the popup is never the focus target. A tap would raise the
  // on-screen keyboard, but a screen reader press (such as an iOS VoiceOver double-tap) still
  // reports a touch and needs the input focused.
  const initialFocus = React.useCallback(() => {
    const touchOpen = (openMethod === 'touch' || openMethod === 'pen') && !virtualPressRef.current;
    return touchOpen ? false : (focusOwnerRef.current ?? false);
  }, [openMethod, virtualPressRef, focusOwnerRef]);

  const popupProps = mergeProps<typeof SelectPopupPlain>(
    interactionProps,
    {
      id: id === undefined ? undefined : `${id}-popup`,
      'aria-labelledby': resolvePopupLabel(
        props,
        null,
        resolveAriaLabelledBy(fieldLabelId, labelId) ?? triggerElement?.id ?? null,
      ),
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
      ref={forwardedRef}
    />
  );
});
