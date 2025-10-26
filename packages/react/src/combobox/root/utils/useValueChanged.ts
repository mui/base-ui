import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';

export function useValueChanged<T>(
  valueRef: React.RefObject<T>,
  value: T,
  onChangeParam: (previousValue: T) => void,
) {
  const onChange = useStableCallback(onChangeParam);

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
