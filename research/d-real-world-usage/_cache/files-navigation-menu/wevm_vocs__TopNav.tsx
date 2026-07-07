import { NavigationMenu } from '@base-ui/react/navigation-menu'
import { cx } from 'cva'
import * as React from 'react'
import { useRouter } from 'waku'
import LucideArrowUpRight from '~icons/lucide/arrow-up-right'
import LucideChevronDown from '~icons/lucide/chevron-down'
import * as Path from '../../internal/path.js'
import * as TopNav_core from '../../internal/topNav.js'
import { Link } from '../Link.js'
import { useConfig } from '../useConfig.js'

export function TopNav(props: TopNav.Props) {
  const { className } = props

  const { topNav } = useConfig()
  const { path } = useRouter()

  const items = React.useMemo(() => TopNav_core.parse(topNav, path), [topNav, path])

  return (
    <NavigationMenu.Root className={cx('vocs:flex', className)}>
      <NavigationMenu.List
        aria-orientation={undefined}
        className="vocs:flex vocs:items-center vocs:h-full vocs:list-none vocs:m-0 vocs:p-0 vocs:-mb-px"
      >
        {items.map((item, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: _
          <Item key={i} {...item} />
        ))}
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner side="bottom" sideOffset={-8} className="vocs:z-50">
          <NavigationMenu.Popup className="vocs:bg-surface vocs:min-w-[200px] vocs:border vocs:border-primary vocs:p-2 vocs:rounded-lg vocs:shadow-lg/5 vocs:origin-(--transform-origin) vocs:transition-all vocs:duration-75 vocs:scale-100 vocs:opacity-100 vocs:data-starting-style:opacity-0 vocs:data-starting-style:scale-90">
            <NavigationMenu.Arrow className="vocs:data-[side=bottom]:top-[-9px] vocs:data-[side=left]:right-[-13px] vocs:data-[side=left]:rotate-90 vocs:data-[side=right]:left-[-13px] vocs:data-[side=right]:-rotate-90 vocs:data-[side=top]:bottom-[-8px] vocs:data-[side=top]:rotate-180">
              <ArrowSvg />
            </NavigationMenu.Arrow>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  )
}

export function Item(props: Item.Props) {
  const { active, external, items, link, text } = props

  const isExternal = external ?? Path.isExternal(link)

  if (items)
    return (
      <NavigationMenu.Item className="vocs:h-full">
        <NavigationMenu.Trigger className={Item.className} data-v-active={active}>
          {text}
          <NavigationMenu.Icon>
            <LucideChevronDown className="vocs:text-secondary/80 vocs:ml-1 vocs:transition-transform vocs:duration-150 vocs:in-data-popup-open:rotate-180" />
          </NavigationMenu.Icon>
        </NavigationMenu.Trigger>
        <NavigationMenu.Content className="vocs:flex vocs:flex-col">
          {items.map((item, i) => {
            const itemIsExternal = item.external ?? Path.isExternal(item.link)
            return (
              <NavigationMenu.Link
                className="vocs:flex vocs:items-center vocs:gap-1 vocs:hover:text-heading vocs:px-2 vocs:py-1 vocs:text-primary/80 vocs:data-[v-active=true]:text-accent7 vocs:data-[v-active=true]:bg-accenta3 vocs:rounded-md vocs:text-[14px] vocs:font-[450]"
                data-v-active={item.active}
                // biome-ignore lint/suspicious/noArrayIndexKey: _
                key={i}
                // @ts-expect-error
                // biome-ignore lint/style/noNonNullAssertion: _
                render={<Link to={item.link!} />}
              >
                {item.text}
                {itemIsExternal && (
                  <LucideArrowUpRight className="vocs:size-3 vocs:text-secondary/60" />
                )}
              </NavigationMenu.Link>
            )
          })}
        </NavigationMenu.Content>
      </NavigationMenu.Item>
    )

  if (!link) return null

  return (
    <NavigationMenu.Item className="vocs:h-full">
      <NavigationMenu.Link
        className={Item.className}
        data-v-active={active}
        // @ts-expect-error
        render={<Link to={link} />}
      >
        {text}
        {isExternal && (
          <LucideArrowUpRight className="vocs:ml-1 vocs:size-3.5 vocs:text-secondary/60" />
        )}
      </NavigationMenu.Link>
    </NavigationMenu.Item>
  )
}

export namespace TopNav {
  export type Props = {
    className?: string | undefined
  }
}

export namespace Item {
  export type Props = TopNav_core.ParsedItem

  export const className =
    'vocs:flex vocs:items-center vocs:h-full vocs:cursor-pointer vocs:hover:text-heading vocs:px-2 vocs:border-b-2 vocs:text-primary/80 vocs:data-[v-active=true]:text-accent6 vocs:text-[14px] vocs:font-[450] vocs:border-transparent vocs:data-[v-active=true]:border-accent'
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <title>Arrow</title>
      <path
        className="vocs:fill-(--vocs-background-color-surface)"
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
      />
      <path
        className="vocs:fill-(--vocs-border-color-primary)"
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
      />
    </svg>
  )
}
