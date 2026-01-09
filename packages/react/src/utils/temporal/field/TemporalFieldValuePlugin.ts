import { createSelector } from '@base-ui/utils/store';
import { TemporalSupportedObject, TemporalSupportedValue } from '../../../types';
import { mergeDateIntoReferenceDate } from './mergeDateIntoReferenceDate';
import { selectors } from './selectors';
import { TemporalFieldStore } from './TemporalFieldStore';
import { TemporalFieldValueChangeHandlerContext, TemporalFieldState as State } from './types';
import { buildSections } from './utils';

const valueSelectors = {
  value: createSelector((state: State) => state.value),
  referenceValue: createSelector((state: State) => state.referenceValue),
  valueManager: createSelector((state: State) => state.valueManager),
};

/**
 * Plugin to interact with the entire field value.
 */
export class TemporalFieldValuePlugin<
  TValue extends TemporalSupportedValue,
  TValidationProps extends object,
  TError,
> {
  private store: TemporalFieldStore<TValue, TValidationProps, TError>;

  public selectors = valueSelectors;

  // We can't type `store`, otherwise we get the following TS error:
  // 'value' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  /**
   * Publishes the provided field value.
   */
  public publish(value: TValue) {
    const manager = selectors.manager(this.store.state);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const context: TemporalFieldValueChangeHandlerContext<TError> = {
      getValidationError: () => manager.getValidationError(value, this.store.state.validationProps),
    };

    // TODO: Fire onValueChange
  }

  /**
   * Updates the field value from a string representation.
   */
  public updateFromString(valueStr: string) {
    const format = this.store.format.selectors.format(this.store.state);
    const adapter = selectors.adapter(this.store.state);
    const valueManager = this.store.value.selectors.valueManager(this.store.state);
    const parsedFormat = this.store.format.selectors.parsedFormat(this.store.state);

    const parseDateStr = (dateStr: string, referenceDate: TemporalSupportedObject) => {
      const date = adapter.parse(dateStr, format, selectors.timezoneToRender(this.store.state));
      if (!adapter.isValid(date)) {
        return null;
      }

      const sections = buildSections(adapter, parsedFormat, date);
      return mergeDateIntoReferenceDate(adapter, date, sections, referenceDate, false);
    };

    const newValue = valueManager.parseValueStr(
      valueStr,
      this.store.state.referenceValue,
      parseDateStr,
    );
    this.publish(newValue);
  }

  /**
   * Clears the field value.
   * If the value is already empty, it clears the sections.
   */
  public clear() {
    const adapter = selectors.adapter(this.store.state);
    const valueManager = this.store.value.selectors.valueManager(this.store.state);
    const value = this.store.value.selectors.value(this.store.state);

    if (valueManager.areValuesEqual(adapter, value, valueManager.emptyValue)) {
      const emptySections = this.store.section.selectors
        .sections(this.store.state)
        .map((section) => ({ ...section, value: '' }));

      this.store.update({
        sections: emptySections,
        characterQuery: null,
      });
    } else {
      this.store.characterEditing.resetCharacterQuery();
      this.publish(valueManager.emptyValue);
    }
  }
}
