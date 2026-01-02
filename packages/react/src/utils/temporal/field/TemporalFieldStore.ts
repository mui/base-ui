import { Store } from '@base-ui/utils/store';
import { TemporalAdapter, TemporalSupportedValue } from '../../../types';
import { TemporalManager } from '../types';
import {
  TemporalFieldState,
  TemporalFieldStoreParameters,
  TemporalFieldValueChangeHandlerContext,
  TemporalFieldValueManager,
} from './types';
import { buildSectionsFromFormat } from './buildSectionsFromFormat';
import { validateSections } from './utils';

export class TemporalFieldStore<
  TValue extends TemporalSupportedValue,
  TError,
> extends Store<TemporalFieldState> {
  private valueManager: TemporalFieldValueManager<TValue>;

  private parameters: TemporalFieldStoreParameters<TValue, TError>;

  private initialParameters: TemporalFieldStoreParameters<TValue, TError> | null = null;

  constructor(
    parameters: TemporalFieldStoreParameters<TValue, TError>,
    adapter: TemporalAdapter,
    manager: TemporalManager<TValue, TError, any>,
    valueManager: TemporalFieldValueManager<TValue>,
  ) {
    const value = parameters.value ?? parameters.defaultValue ?? manager.emptyValue;
    const shouldRespectLeadingZeros = parameters.shouldRespectLeadingZeros ?? false;

    const sections = valueManager.getSectionsFromValue(value, (date) =>
      buildSectionsFromFormat({
        adapter,
        localeText: translations,
        localizedDigits,
        format,
        date,
        shouldRespectLeadingZeros,
        isRtl,
      }),
    );
    validateSections(sections, manager.dateType);

    super({
      value,
      sections,
      timezoneProp: parameters.timezone,
      shouldRespectLeadingZeros,
      referenceDateProp: null, // TODO: Fix
      characterQuery: null,
      tempValueStrAndroid: null,
      adapter,
      manager,
    });

    this.valueManager = valueManager;
    this.parameters = parameters;

    if (process.env.NODE_ENV !== 'production') {
      this.initialParameters = parameters;
    }
  }

  public clearValue() {
    const { adapter, value } = this.state;
    if (this.valueManager.areValuesEqual(adapter, value, this.valueManager.emptyValue)) {
      this.update({
        sections: this.state.sections.map((section) => ({ ...section, value: '' })),
        tempValueStrAndroid: null,
        characterQuery: null,
      });
    } else {
      this.set('characterQuery', null);
      publishValue(this.valueManager.emptyValue);
    }
  }

  private getSectionsFromValue(valueToAnalyze: TValue) {
    const { adapter, shouldRespectLeadingZeros } = this.state;

    return this.valueManager.getSectionsFromValue(valueToAnalyze, (date) =>
      buildSectionsFromFormat({
        adapter,
        localeText: translations,
        localizedDigits,
        format,
        date,
        shouldRespectLeadingZeros,
        isRtl,
      }),
    );
  }

  private publishValue(value: TValue) {
    const { manager } = this.state;

    const context: TemporalFieldValueChangeHandlerContext<TError> = {
      getValidationError: () => manager.getValidationError(value, this.validationProps),
    };

    // TODO: Fire onValueChange
  }
}
