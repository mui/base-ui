import { createSelector } from '@base-ui/utils/store';
import {
  TemporalNonNullableValue,
  TemporalSupportedObject,
  TemporalSupportedValue,
} from '../../../types';
import { mergeDateIntoReferenceDate } from './mergeDateIntoReferenceDate';
import { selectors } from './selectors';
import { TemporalFieldStore } from './TemporalFieldStore';
import {
  TemporalFieldState as State,
  TemporalFieldSection,
  TemporalFieldValueChangeEventDetails,
} from './types';
import { buildSections } from './utils';
import { TemporalFieldFormatPlugin } from './TemporalFieldFormatPlugin';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';
import { createChangeEventDetails } from '../../createBaseUIEventDetails';

const valueSelectors = {
  value: createSelector((state: State) => state.value),
  referenceValue: createSelector((state: State) => state.referenceValue),
};

/**
 * Plugin to interact with the entire field value.
 */
export class TemporalFieldValuePlugin<
  TValue extends TemporalSupportedValue,
  TError,
  TValidationProps extends object,
> {
  private store: TemporalFieldStore<TValue, TError, TValidationProps>;

  public static selectors = valueSelectors;

  // We can't type `store`, otherwise we get the following TS error:
  // 'value' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  /**
   * Publishes the provided field value.
   */
  public publish(value: TValue) {
    const inputTimezone = this.store.state.manager.getTimezone(this.store.state.value);
    const newValueWithInputTimezone =
      inputTimezone == null ? value : this.store.state.manager.setTimezone(value, inputTimezone);

    // Pass event
    // event.nativeEvent, event.currentTarget
    const eventDetails: TemporalFieldValueChangeEventDetails<TError> = createChangeEventDetails(
      'none',
      undefined,
      undefined,
      {
        getValidationError: () =>
          selectors
            .manager(this.store.state)
            .getValidationError(
              newValueWithInputTimezone,
              selectors.validationProps(this.store.state),
            ),
      },
    );

    this.store.parameters.onValueChange?.(newValueWithInputTimezone, eventDetails);
    if (!eventDetails.isCanceled && this.store.parameters.value === undefined) {
      this.store.update({
        value: newValueWithInputTimezone,
        ...this.deriveStateFromNewValue(value),
      });
    }

    // Update Field context state (dirty, validation)
    const fieldContext = this.store.state.fieldContext;
    if (fieldContext) {
      // Set dirty state by comparing with initial value
      fieldContext.setDirty(
        !this.store.state.manager.areValuesEqual(
          newValueWithInputTimezone,
          fieldContext.validityData.initialValue as TValue,
        ),
      );

      // Validate if needed (call without await - async validation doesn't block)
      if (fieldContext.shouldValidateOnChange()) {
        fieldContext.validation.commit(newValueWithInputTimezone);
      }
    }
  }

  /**
   * Updates the one of the date in the value from its string representation.
   */
  public updateFromString(valueStr: string) {
    const format = TemporalFieldFormatPlugin.selectors.format(this.store.state);
    const adapter = selectors.adapter(this.store.state);
    const fieldConfig = selectors.config(this.store.state);
    const parsedFormat = TemporalFieldFormatPlugin.selectors.parsedFormat(this.store.state);

    const parseDateStr = (dateStr: string, referenceDate: TemporalSupportedObject) => {
      const date = adapter.parse(dateStr, format, selectors.timezoneToRender(this.store.state));
      if (!adapter.isValid(date)) {
        return null;
      }

      const sections = buildSections(adapter, parsedFormat, date);
      return mergeDateIntoReferenceDate(adapter, date, sections, referenceDate, false);
    };

    const newValue = fieldConfig.parseValueStr(
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
    const manager = selectors.manager(this.store.state);
    const value = TemporalFieldValuePlugin.selectors.value(this.store.state);

    if (manager.areValuesEqual(value, manager.emptyValue)) {
      const emptySections = TemporalFieldSectionPlugin.selectors
        .sections(this.store.state)
        .map((section) => ({ ...section, value: '' }));

      this.store.update({
        sections: emptySections,
        characterQuery: null,
      });
    } else {
      this.store.characterEditing.resetCharacterQuery();
      this.publish(manager.emptyValue);
    }
  }

  /**
   * Generates the sections and the reference value from a new value.
   */
  public deriveStateFromNewValue(value: TValue) {
    const adapter = selectors.adapter(this.store.state);
    const config = selectors.config(this.store.state);
    const parsedFormat = TemporalFieldFormatPlugin.selectors.parsedFormat(this.store.state);
    const sectionsBefore = TemporalFieldSectionPlugin.selectors.sections(this.store.state);
    const referenceValueBefore = TemporalFieldValuePlugin.selectors.referenceValue(
      this.store.state,
    );
    const sectionToUpdateOnNextInvalidDate = this.store.section.sectionToUpdateOnNextInvalidDate;

    const isActiveDateInvalid =
      sectionToUpdateOnNextInvalidDate != null &&
      !adapter.isValid(
        config.getDateFromSection(value, sectionsBefore[sectionToUpdateOnNextInvalidDate.index]),
      );
    let sections: TemporalFieldSection[];
    if (isActiveDateInvalid) {
      sections = TemporalFieldSectionPlugin.replaceDatePartValueInSectionList(
        sectionsBefore,
        sectionToUpdateOnNextInvalidDate.index,
        sectionToUpdateOnNextInvalidDate.value,
      );
    } else {
      sections = config.getSectionsFromValue(value, (date) =>
        buildSections(adapter, parsedFormat, date),
      );
    }

    return {
      sections,
      referenceValue: (isActiveDateInvalid
        ? referenceValueBefore
        : config.updateReferenceValue(
            adapter,
            value,
            referenceValueBefore,
          )) as TemporalNonNullableValue<TValue>,
    };
  }
}
