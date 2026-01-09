import { Store } from '@base-ui/utils/store';
import { TemporalAdapter, TemporalFieldSectionType, TemporalSupportedValue } from '../../../types';
import { TemporalManager } from '../types';
import {
  TemporalFieldState,
  TemporalFieldStoreParameters,
  TemporalFieldValueManager,
} from './types';
import { FormatParser } from './formatParser';
import { buildSections, deriveStateFromParameters, getTimezoneToRender } from './utils';
import { TextDirection } from '../../../direction-provider';
import { TemporalFieldValueAdjustmentPlugin } from './TemporalFieldValueAdjustmentPlugin';
import { TemporalFieldCharacterEditingPlugin } from './TemporalFieldCharacterEditingPlugin';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';
import { TimeoutManager } from '../../TimeoutManager';
import { TemporalFieldValuePlugin } from './TemporalFieldValuePlugin';
import { TemporalFieldInputPropsPlugin } from './TemporalFieldInputPropsPlugin';
import { TemporalFieldSectionPropsPlugin } from './TemporalFieldSectionPropsPlugin';
import { TemporalFieldFormatPlugin } from './TemporalFieldFormatPlugin';
import { TemporalFieldDOMPlugin } from './TemporalFieldDOMPlugin';

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

  public timeoutManager = new TimeoutManager();

  public characterEditing = new TemporalFieldCharacterEditingPlugin<TValue>(this);

  public valueAdjustment = new TemporalFieldValueAdjustmentPlugin<TValue>(this);

  public value = new TemporalFieldValuePlugin<TValue, TValidationProps, TError>(this);

  public section = new TemporalFieldSectionPlugin<TValue>(this);

  public format = new TemporalFieldFormatPlugin<TValue>(this);

  public dom = new TemporalFieldDOMPlugin(this);

  public inputProps = new TemporalFieldInputPropsPlugin<TValue, TError>(this);

  public sectionProps = new TemporalFieldSectionPropsPlugin<TValue>(this);

  constructor(
    parameters: TemporalFieldStoreParameters<TValue, TError>,
    validationProps: TValidationProps,
    adapter: TemporalAdapter,
    manager: TemporalManager<TValue, TError, any>,
    valueManager: TemporalFieldValueManager<TValue>,
    direction: TextDirection,
  ) {
    const value = parameters.value ?? parameters.defaultValue ?? manager.emptyValue;

    const parsedFormat = FormatParser.parse(
      adapter,
      parameters.format,
      direction,
      parameters.placeholderGetters,
    );

    const referenceValue = valueManager.getInitialReferenceValue({
      externalReferenceDate: parameters.referenceDate,
      value,
      adapter,
      validationProps,
      granularity: Math.max(
        ...parsedFormat.tokens.map(
          (token) => SECTION_TYPE_GRANULARITY[token.config.sectionType] ?? 1,
        ),
      ),
      timezone: getTimezoneToRender(
        adapter,
        manager,
        value,
        parameters.referenceDate,
        parameters.timezone,
      ),
    });

    const sections = valueManager.getSectionsFromValue(value, (date) =>
      buildSections(adapter, parsedFormat, date),
    );

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
      referenceValue,
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
}
