import { TemporalSupportedValue } from '../../../types';
import { TemporalFieldStore } from './TemporalFieldStore';

/**
 * Plugin to build the props to pass to the input element.
 */
export class TemporalFieldSectionContainerPropsPlugin<
  TValue extends TemporalSupportedValue,
  TError,
> {
  private store: TemporalFieldStore<TValue, TError>;

  // We can't type `store`, otherwise we get the following TS error:
  // 'sectionContainerProps' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }
}
