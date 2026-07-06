import { Menu as BaseMenu } from '@base-ui/react/menu'
import { PropsWithChildren } from 'react'

export function Container({ children }: PropsWithChildren) {
  return <BaseMenu.Root>{children}</BaseMenu.Root>
}
