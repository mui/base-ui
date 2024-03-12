export function defineProps<T extends React.ElementType<any, keyof React.JSX.IntrinsicElements>>(
  props: React.ComponentPropsWithRef<T>,
) {
  return props;
}
