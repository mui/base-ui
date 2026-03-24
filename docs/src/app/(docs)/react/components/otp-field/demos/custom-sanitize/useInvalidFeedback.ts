'use client';
import * as React from 'react';

interface InvalidState {
  index: number;
  pulse: number;
}

export function useInvalidFeedback() {
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const [invalidState, setInvalidState] = React.useState<InvalidState | null>(null);
  const [statusMessage, setStatusMessage] = React.useState('');
  const invalidTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipClearOnNextValueChangeRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      if (invalidTimeoutRef.current != null) {
        clearTimeout(invalidTimeoutRef.current);
      }
    };
  }, []);

  function clearInvalidFeedback() {
    if (invalidTimeoutRef.current != null) {
      clearTimeout(invalidTimeoutRef.current);
      invalidTimeoutRef.current = null;
    }

    setInvalidState(null);
    setStatusMessage('');
  }

  function handleValueChange() {
    if (skipClearOnNextValueChangeRef.current) {
      skipClearOnNextValueChangeRef.current = false;
      return;
    }

    clearInvalidFeedback();
  }

  function handleValueInvalid(value: string) {
    skipClearOnNextValueChangeRef.current = true;
    setInvalidState((current) => ({
      index: focusedIndex,
      pulse: (current?.pulse ?? 0) + 1,
    }));
    setStatusMessage(`Unsupported characters were ignored from ${value}.`);

    if (invalidTimeoutRef.current != null) {
      clearTimeout(invalidTimeoutRef.current);
    }

    invalidTimeoutRef.current = setTimeout(() => {
      invalidTimeoutRef.current = null;
      setInvalidState(null);
      setStatusMessage('');
    }, 400);
  }

  return {
    activeInvalidIndex: invalidState?.index ?? -1,
    invalidPulse: invalidState?.pulse ?? 0,
    statusMessage,
    setFocusedIndex,
    handleValueChange,
    handleValueInvalid,
  };
}
