export interface ScrubParams {
  disabled: boolean;
  readOnly: boolean;
  value: number | null;
  rawValueRef: React.MutableRefObject<number | null>;
  inputRef: React.RefObject<HTMLInputElement>;
  increment: (amount: number) => void;
  getStepAmount: () => number | undefined;
}

export interface ScrubHandle {
  direction: 'vertical' | 'horizontal';
  pixelSensitivity: number;
  teleportDistance: number | undefined;
}
