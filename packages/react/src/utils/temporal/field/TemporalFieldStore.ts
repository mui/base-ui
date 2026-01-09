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
  deriveStateFromParameters,
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
  TValidationProps extends object,
  TError,
> extends Store<TemporalFieldState<TValue, TValidationProps>> {
  private parameters: TemporalFieldStoreParameters<TValue, TError>;

  private initialParameters: TemporalFieldStoreParameters<TValue, TError> | null = null;

  public inputRef = React.createRef<HTMLElement>();

  public timeoutManager = new TimeoutManager();

  public characterEditing = new TemporalFieldCharacterEditingPlugin<TValue>(this);

  public valueAdjustment = new TemporalFieldValueAdjustmentPlugin<TValue>(this);

  public value = new TemporalFieldValuePlugin<TValue, TValidationProps, TError>(this);

  public section = new TemporalFieldSectionPlugin<TValue>(this);

  public inputProps = new TemporalFieldInputPropsPlugin<TValue, TError>(this);

  constructor(
    parameters: TemporalFieldStoreParameters<TValue, TError>,
    validationProps: TValidationProps,
    adapter: TemporalAdapter,
    manager: TemporalManager<TValue, TError, any>,
    valueManager: TemporalFieldValueManager<TValue>,
    direction: TextDirection,
  ) {
    const value = parameters.value ?? parameters.defaultValue ?? manager.emptyValue;
    const localizedDigits = getLocalizedDigits(adapter);

    const sections = valueManager.getSectionsFromValue(value, (date) =>
      buildSectionsFromFormat({
        adapter,
        localizedDigits,
        format: parameters.format,
        date,
        direction,
      }),
    );

    const granularity = Math.max(
      ...sections.map((section) => SECTION_TYPE_GRANULARITY[section.sectionType] ?? 1),
    );

    const referenceValue = valueManager.getInitialReferenceValue({
      externalReferenceDate: parameters.referenceDate,
      value,
      adapter,
      validationProps,
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
      ...deriveStateFromParameters(
        parameters,
        validationProps,
        adapter,
        manager,
        valueManager,
        direction,
      ),
      value,
      sections,
      validationProps,
      direction,
      localizedDigits,
      referenceValue,
      valueManager,
      adapter,
      manager,
      characterQuery: null,
      selectedSections: null,
    });

    this.parameters = parameters;

    if (process.env.NODE_ENV !== 'production') {
      this.initialParameters = parameters;
    }
  }

  public disposeEffect = () => {
    return this.timeoutManager.clearAll;
  };

  private getActiveElement() {
    const doc = ownerDocument(this.inputRef.current);
    return activeElement(doc);
  }
}
