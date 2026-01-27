import { createSelectorMemoized } from '@base-ui/utils/store';
import { TemporalSupportedValue } from '../../../../types';
import { selectors } from '../selectors';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';
import { TemporalFieldStore } from '../TemporalFieldStore';
import { TemporalFieldValuePlugin } from './TemporalFieldValuePlugin';

const inputPropsSelectors = {
  /**
   * Returns the params to pass to `useField` hook for form integration.
   */
  useFieldParams: createSelectorMemoized(
    selectors.id,
    selectors.name,
    selectors.adapter,
    selectors.config,
    selectors.fieldContext,
    selectors.inputRef,
    TemporalFieldValuePlugin.selectors.value,
    TemporalFieldSectionPlugin.selectors.sections,
    (id, name, adapter, config, fieldContext, inputRef, value, sections) => {
      const formValue = config.stringifyValueForHiddenInput(adapter, value, sections);
      return {
        id,
        name,
        value: formValue,
        getValue: () => formValue,
        commit: fieldContext?.validation.commit ?? (async () => {}),
        controlRef: inputRef,
      };
    },
  ),
};

/**
 * Plugin to build the props to pass to the input part.
 */
export class TemporalFieldInputPropsPlugin<TValue extends TemporalSupportedValue> {
  public static selectors = inputPropsSelectors;
  private store: TemporalFieldStore<TValue, any>;

  // We can't type `store`, otherwise we get the following TS error:
  // 'inputProps' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public handleClick = () => {
    if (selectors.disabled(this.store.state) || !this.store.dom.inputRef.current) {
      return;
    }

    if (
      !this.store.dom.isFocused() &&
      TemporalFieldSectionPlugin.selectors.selectedSection(this.store.state) == null
    ) {
      this.store.section.selectClosestDatePart(0);
    }
  };
}
