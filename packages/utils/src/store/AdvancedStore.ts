import { warn } from '../warn';
import { Store } from './Store';

export class AdvancedStore<Parameters extends object, State extends object> extends Store<State> {
  public parameters: Parameters;

  public initialParameters: Parameters | null = null;

  public instanceName: string;

  constructor(parameters: Parameters, state: State, instanceName: string) {
    super(state);

    this.parameters = parameters;
    this.instanceName = instanceName;

    if (process.env.NODE_ENV !== 'production') {
      this.initialParameters = parameters;
    }
  }

  /**
   * Mutates the newState to apply controlled prop updates.
   * Also issues warnings in dev mode if controlledness changes or default value changes.
   */
  public applyModelUpdateOnState(
    parameters: Parameters,
    newState: Partial<State>,
    controlledProp: keyof Parameters & keyof State & string,
    defaultProp?: keyof Parameters,
  ) {
    if (parameters[controlledProp] !== undefined) {
      newState[controlledProp] = parameters[controlledProp] as any;
    }

    if (process.env.NODE_ENV !== 'production') {
      const defaultValue = defaultProp === undefined ? undefined : parameters[defaultProp];
      const isControlled = parameters[controlledProp] !== undefined;
      const initialDefaultValue =
        defaultProp === undefined ? undefined : this.initialParameters?.[defaultProp];
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
  }
}

export type AdvancedStoredModelUpdater<State extends object, Parameters extends object> = (
  newState: Partial<State>,
  controlledProp: keyof Parameters & keyof State & string,
  defaultProp: keyof Parameters,
) => void;
