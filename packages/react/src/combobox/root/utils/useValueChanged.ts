import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useUntracked } from '@base-ui-components/utils/useUntracked';

export function useValueChanged<T>(
  valueRef: React.RefObject<T>,
  value: T,
  onChangeParam: (previousValue: T) => void,
) {
  const onChange = useUntracked(onChangeParam);

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
