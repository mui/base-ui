import * as React from 'react';
import { Store } from '@base-ui/utils/store';
import { ownerDocument } from '@base-ui/utils/owner';
import { TemporalAdapter, TemporalFieldSectionType, TemporalSupportedValue } from '../../../types';
import { TemporalManager } from '../types';
import {
  TemporalFieldState,
  TemporalFieldStoreParameters,
  TemporalFieldValueManager,
} from './types';
import { buildSectionsFromFormat } from './buildSectionsFromFormat';
import {
  DEFAULT_PLACEHOLDER_GETTERS,
  getLocalizedDigits,
  getTimezoneToRender,
  validateSections,
} from './utils';
import { TextDirection } from '../../../direction-provider';
import { activeElement } from '../../../floating-ui-react/utils';
import { TemporalFieldValueAdjustmentPlugin } from './TemporalFieldValueAdjustmentPlugin';
import { TemporalFieldCharacterEditingPlugin } from './TemporalFieldCharacterEditingPlugin';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';
import { TimeoutManager } from '../../TimeoutManager';
import { TemporalFieldValuePlugin } from './TemporalFieldValuePlugin';
import { TemporalFieldInputPropsPlugin } from './TemporalFieldInputPropsPlugin';

const SECTION_TYPE_GRANULARITY: { [key in TemporalFieldSectionType]?: number } = {
  year: 1,
  month: 2,
  day: 3,
  hours: 4,
  minutes: 5,
  seconds: 6,
};

export class TemporalFieldStore<
  TValue extends TemporalSupportedValue,
  TError,
> extends Store<TemporalFieldState> {
  private parameters: TemporalFieldStoreParameters<TValue, TError>;

  private initialParameters: TemporalFieldStoreParameters<TValue, TError> | null = null;

  public inputRef = React.createRef<HTMLElement>();

  public timeoutManager = new TimeoutManager();

  public characterEditing = new TemporalFieldCharacterEditingPlugin<TValue>(this);

  public valueAdjustment = new TemporalFieldValueAdjustmentPlugin<TValue>(this);

  public value = new TemporalFieldValuePlugin<TValue, TError>(this);

  public section = new TemporalFieldSectionPlugin<TValue>(this);

  public inputProps = new TemporalFieldInputPropsPlugin<TValue, TError>(this);

  constructor(
    parameters: TemporalFieldStoreParameters<TValue, TError>,
    adapter: TemporalAdapter,
    manager: TemporalManager<TValue, TError, any>,
    valueManager: TemporalFieldValueManager<TValue>,
    direction: TextDirection,
  ) {
    const value = parameters.value ?? parameters.defaultValue ?? manager.emptyValue;
    const shouldRespectLeadingZeros = parameters.shouldRespectLeadingZeros ?? false;
    const localizedDigits = getLocalizedDigits(adapter);

    const sections = valueManager.getSectionsFromValue(value, (date) =>
      buildSectionsFromFormat({
        adapter,
        localizedDigits,
        format: parameters.format,
        date,
        shouldRespectLeadingZeros,
        direction,
      }),
    );

    const granularity = Math.max(
      ...sections.map((section) => SECTION_TYPE_GRANULARITY[section.sectionType] ?? 1),
    );

    const referenceValue = valueManager.getInitialReferenceValue({
      referenceDate: parameters.referenceDate,
      value,
      adapter,
      // props: internalPropsWithDefaults as GetDefaultReferenceDateProps,
      granularity,
      timezone: getTimezoneToRender(
        adapter,
        manager,
        value,
        parameters.referenceDate,
        parameters.timezone,
      ),
    });

    validateSections(sections, manager.dateType);

    super({
      value,
      sections,
      timezoneProp: parameters.timezone,
      shouldRespectLeadingZeros,
      referenceDateProp: parameters.referenceDate ?? null,
      format: parameters.format,
      disabled: parameters.disabled ?? false,
      readOnly: parameters.readOnly ?? false,
      direction,
      localizedDigits,
      referenceValue,
      valueManager,
      adapter,
      manager,
      characterQuery: null,
      selectedSections: null,
      tempValueStrAndroid: null,
      placeholderGetters: { ...parameters.placeholderGetters, ...DEFAULT_PLACEHOLDER_GETTERS },
    });

    this.parameters = parameters;

    if (process.env.NODE_ENV !== 'production') {
      this.initialParameters = parameters;
    }
  }

  public disposeEffect = () => {
    return this.timeoutManager.clearAll;
  };

  private getSectionsFromValue(valueToAnalyze: TValue) {
    const { adapter, shouldRespectLeadingZeros, valueManager } = this.state;

    return valueManager.getSectionsFromValue(valueToAnalyze, (date) =>
      buildSectionsFromFormat({
        date,
        adapter,
        localizedDigits: this.state.localizedDigits,
        format: this.state.format,
        shouldRespectLeadingZeros,
        direction: this.state.direction,
      }),
    );
  }

  private getActiveElement() {
    const doc = ownerDocument(this.inputRef.current);
    return activeElement(doc);
  }
}
