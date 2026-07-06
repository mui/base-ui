import { Menu as BaseMenu } from '@base-ui/react/menu'

export interface RadioGroupProps<T extends string> {
  children: React.ReactNode
  onValueChange?: (value: T) => void
  value?: T
}

export function RadioGroup<T extends string>({
  children,
  onValueChange,
  value,
}: RadioGroupProps<T>) {
  return (
    <BaseMenu.RadioGroup onValueChange={onValueChange as (value: string) => void} value={value}>
      {children}
    </BaseMenu.RadioGroup>
  )
}
