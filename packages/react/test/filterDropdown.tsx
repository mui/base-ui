import * as React from 'react';
import { useBaseUiId } from '../src/internals/useBaseUiId';
import { resolvePopupLabel } from '../src/internals/resolvePopupLabel';
import { mergeProps } from '../src/merge-props';
import { useMenuFilterPopup } from '../src/menu/filter-root/useMenuFilterPopup';
import { useFilterDropdownRootContext } from '../src/filter-dropdown/root/FilterDropdownRootContext';
import { FilterDropdownList } from '../src/filter-dropdown/list/FilterDropdownList';

export { FilterDropdownRoot as Root } from '../src/filter-dropdown/root/FilterDropdownRoot';
export { FilterDropdownInput as Input } from '../src/filter-dropdown/input/FilterDropdownInput';
export { FilterDropdownClear as Clear } from '../src/filter-dropdown/clear/FilterDropdownClear';
export { FilterDropdownEmpty as Empty } from '../src/filter-dropdown/empty/FilterDropdownEmpty';

// Menu-shaped hosts for testing the filter engine without a floating popup or navigation.
export function Popup(props: React.ComponentProps<'div'>) {
  const { id: idProp, ...otherProps } = props;
  const id = useBaseUiId(idProp);
  const { triggerId } = useFilterDropdownRootContext();
  const interactionProps = useMenuFilterPopup('vertical');
  return (
    <div
      {...mergeProps(
        { id, role: 'dialog', 'aria-labelledby': triggerId },
        interactionProps,
        otherProps,
      )}
    />
  );
}

export function List(props: React.ComponentProps<typeof FilterDropdownList>) {
  const { triggerId } = useFilterDropdownRootContext();
  const { ariaLabelledBy } = resolvePopupLabel(props, null, triggerId ?? null);
  return (
    <FilterDropdownList
      {...mergeProps<typeof FilterDropdownList>(
        { role: 'menu', 'aria-labelledby': ariaLabelledBy },
        props,
      )}
    />
  );
}
