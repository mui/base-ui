import type { FormControlState } from '../FormControl';
import { TextareaAutosizeProps } from '../TextareaAutosize';

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'cols'> {
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
  minRows?: number /**
   * If `true`, a `textarea` element is rendered.
   */;
  render?: (props: TextareaAutosizeProps, ownerState: TextareaOwnerState) => React.ReactNode;
}

export type TextareaOwnerState = {
  disabled: boolean;
  error: boolean;
  focused: boolean;
  formControlContext: FormControlState | boolean;
  required: boolean;
  readOnly: boolean;
};
