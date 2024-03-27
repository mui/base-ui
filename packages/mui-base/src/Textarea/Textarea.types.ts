import type { FormControlState } from '../FormControl';
import { TextareaAutosizeProps } from '../TextareaAutosize';

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'className' | 'cols'> {
  error?: boolean;
  /**
   * @default false
   */
  readOnly?: boolean;
  value?: unknown;
  /**
   * Maximum number of rows to display.
   */
  maxRows?: number;
  /**
   * Minimum number of rows to display.
   * @default 1
   */
  minRows?: number;
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className?: string | ((state: TextareaOwnerState) => string);
  /**
   * If `true`, a `textarea` element is rendered.
   */
  render?: (props: TextareaAutosizeProps, ownerState: TextareaOwnerState) => React.ReactNode; // TODO: replace with CommonProps
}

export type TextareaOwnerState = {
  disabled: boolean;
  error: boolean;
  focused: boolean;
  formControlContext: FormControlState | boolean;
  required: boolean;
  readOnly: boolean;
};
