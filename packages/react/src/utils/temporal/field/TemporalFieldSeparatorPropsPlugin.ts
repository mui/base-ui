import { createSelectorMemoized } from '@base-ui/utils/store/createSelector';
import { selectors } from './selectors';
import { TemporalFieldStore } from './TemporalFieldStore';
import { TemporalFieldSection } from './types';

const separatorPropsSelectors = {
  separatorProps: createSelectorMemoized(
    selectors.editable,
    (editable, section: TemporalFieldSection): React.HTMLAttributes<HTMLDivElement> => ({
      // Aria attributes
      'aria-hidden': true,

      // Other
      children: section.token.separator,
    }),
  ),
};

/**
 * Plugin to build the props to pass to the separator part.
 */
export class TemporalFieldSeparatorPropsPlugin {
  private store: TemporalFieldStore<any, any, any>;

  public static selectors = separatorPropsSelectors;

  // We can't type `store`, otherwise we get the following TS error:
  // 'separatorProps' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public handleClick = (event: React.MouseEvent<HTMLElement>) => {
    // The click event on the clear button would propagate to the input, trigger this handler and result in a wrong section selection.
    // We avoid this by checking if the call to this function is actually intended, or a side effect.
    if (selectors.disabled(this.store.state) || event.isDefaultPrevented()) {
      return;
    }

    const sectionIndex = this.store.dom.getSectionIndexFromDOMElement(event.target as HTMLElement)!;
    this.store.dom.focusSection(sectionIndex);
    this.store.section.setSelectedSection(sectionIndex);
  };

  public handleMouseUp = (event: React.MouseEvent) => {
    // Without this, the browser will remove the selected when clicking inside an already-selected section.
    event.preventDefault();
  };
}
