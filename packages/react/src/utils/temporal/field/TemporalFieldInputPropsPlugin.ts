import { TemporalSupportedValue } from '../../../types';
import { selectors } from './selectors';
import { TemporalFieldStore } from './TemporalFieldStore';

/**
 * Plugin to build the props to pass to the input element.
 */
export class TemporalFieldInputPropsPlugin<TValue extends TemporalSupportedValue, TError> {
  private store: TemporalFieldStore<TValue, TError, any>;

  // We can't type `store`, otherwise we get the following TS error:
  // 'inputProps' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public handleClick = (event: React.MouseEvent) => {
    if (selectors.disabled(this.store.state) || !this.store.dom.inputRef.current) {
      return;
    }

    // setFocused(true);

    if (!this.store.dom.isFocused()) {
      // setFocused(true);
      this.store.section.setSelectedSections(0);
    } else {
      const hasClickedOnASection = this.store.dom.inputRef.current.contains(event.target as Node);
      if (!hasClickedOnASection) {
        this.store.section.setSelectedSections(0);
      }
    }
  };
}
