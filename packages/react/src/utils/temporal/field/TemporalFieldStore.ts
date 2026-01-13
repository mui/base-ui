import { Store } from '@base-ui/utils/store';
import { warn } from '@base-ui/utils/warn';
import { TemporalAdapter, TemporalFieldSectionType, TemporalSupportedValue } from '../../../types';
import { TemporalManager } from '../types';
import {
  TemporalFieldModelUpdater,
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

  public instanceName: string;

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
    instanceName: string,
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
    this.instanceName = instanceName;

    if (process.env.NODE_ENV !== 'production') {
      this.initialParameters = parameters;
    }
  }

  /**
   * Updates the state of the Tree View based on the new parameters provided to the root component.
   */
  public updateStateFromParameters(
    parameters: TemporalFieldStoreParameters<TValue, TError>,
    validationProps: TValidationProps,
    adapter: TemporalAdapter,
    manager: TemporalManager<TValue, TError, any>,
    valueManager: TemporalFieldValueManager<TValue>,
    direction: TextDirection,
  ) {
    const updateModel: TemporalFieldModelUpdater<
      TemporalFieldState<TValue, TValidationProps>,
      TemporalFieldStoreParameters<TValue, TError>
    > = (mutableNewState, controlledProp, defaultProp) => {
      if (parameters[controlledProp] !== undefined) {
        mutableNewState[controlledProp] = parameters[controlledProp] as any;
      }

      if (process.env.NODE_ENV !== 'production') {
        const defaultValue = parameters[defaultProp];
        const isControlled = parameters[controlledProp] !== undefined;
        const initialDefaultValue = this.initialParameters?.[defaultProp];
        const initialIsControlled = this.initialParameters?.[controlledProp] !== undefined;

        if (initialIsControlled !== isControlled) {
          warn(
            `Base UI: A component is changing the ${
              initialIsControlled ? '' : 'un'
            }controlled ${controlledProp} state of ${this.instanceName} to be ${initialIsControlled ? 'un' : ''}controlled.`,
            'Elements should not switch from uncontrolled to controlled (or vice versa).',
            `Decide between using a controlled or uncontrolled ${controlledProp} element for the lifetime of the component.`,
            "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.",
            'More info: https://fb.me/react-controlled-components',
          );
        } else if (JSON.stringify(initialDefaultValue) !== JSON.stringify(defaultValue)) {
          warn(
            `Base UI: A component is changing the default ${controlledProp} state of an uncontrolled ${this.instanceName} after being initialized. `,
            `To suppress this warning opt to use a controlled ${this.instanceName}.`,
          );
        }
      }
    };

    const newState = deriveStateFromParameters(
      parameters,
      validationProps,
      adapter,
      manager,
      valueManager,
      direction,
    ) as Partial<TemporalFieldState<TValue, TValidationProps>>;

    // If the format changed, we need to rebuild the sections
    if (newState.format !== undefined && this.state.format !== newState.format) {
      newState.sections = valueManager.getSectionsFromValue(this.state.value, (date) =>
        buildSections(
          adapter,
          FormatParser.parse(adapter, parameters.format, direction, parameters.placeholderGetters),
          date,
        ),
      );
    }

    updateModel(newState, 'value', 'defaultValue');

    this.update(newState);
    this.parameters = parameters;
  }

  public disposeEffect = () => {
    return this.timeoutManager.clearAll;
  };
}
