import * as React from 'react';

export function useRegisterSlot(): [boolean, React.RefCallback<Element>] {
  const slotRef = React.useRef<Element | null>(null);
  const [hasSlot, setHasSlot] = React.useState(false);

  const registerSlot = React.useCallback((element: Element | null) => {
    if (!slotRef.current) {
      slotRef.current = element;
    }
    setHasSlot(!!element);
  }, []);

  return [hasSlot, registerSlot];
}
