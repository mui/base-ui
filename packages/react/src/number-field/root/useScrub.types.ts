export interface ScrubParams {
  disabled: boolean;
  readOnly: boolean;
  value: number | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  incrementValue: (amount: number, dir: 1 | -1, currentValue?: number | null) => void;
  getStepAmount: () => number | undefined;
}

export interface ScrubHandle {
  direction: 'vertical' | 'horizontal';
  pixelSensitivity: number;
  teleportDistance: number | undefined;
}
