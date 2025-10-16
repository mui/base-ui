import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useUntrackedCallback } from '@base-ui-components/utils/useUntrackedCallback';

export function useValueChanged<T>(
  valueRef: React.RefObject<T>,
  value: T,
  onChangeParam: (previousValue: T) => void,
) {
  const onChange = useUntrackedCallback(onChangeParam);

  useIsoLayoutEffect(() => {
    if (valueRef.current === value) {
      return;
    }

    onChange(valueRef.current);
  }, [valueRef, value, onChange]);

  useIsoLayoutEffect(() => {
    valueRef.current = value;
  }, [valueRef, value]);
}
