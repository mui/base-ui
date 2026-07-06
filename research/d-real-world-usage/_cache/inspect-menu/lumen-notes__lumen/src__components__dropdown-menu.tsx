import { Menu } from "@base-ui/react/menu"
import React from "react"
import { cx } from "../utils/cx"
import { CheckIcon16 } from "./icons"
import { Keys } from "./keys"

type ContentProps = {
  side?: "top" | "bottom" | "left" | "right"
  sideOffset?: number
  align?: "start" | "center" | "end"
  alignOffset?: number
  width?: number | string
  children?: React.ReactNode
  className?: string
}

function Content({
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset,
  width = 256,
  children,
  className,
}: ContentProps) {
  return (
    <Menu.Portal>
      <Menu.Positioner side={side} sideOffset={sideOffset} align={align} alignOffset={alignOffset}>
        <Menu.Popup
          className={cx(
            "card-2 z-20 grid place-items-stretch overflow-hidden rounded-lg print:hidden outline-hidden",
            "origin-(--transform-origin) transition-[transform,scale,opacity] epaper:transition-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
            className,
          )}
          style={{ width }}
        >
          <div className="grid max-h-[45svh] scroll-py-1 overflow-auto p-1">{children}</div>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  )
}

function Trigger({ render, children, ...props }: Menu.Trigger.Props) {
  return (
    <Menu.Trigger render={render} {...props}>
      {children}
    </Menu.Trigger>
  )
}

type ItemProps = Omit<Menu.Item.Props, "render"> & {
  icon?: React.ReactNode
  shortcut?: string[]
  trailingVisual?: React.ReactNode
  variant?: "default" | "danger"
  selected?: boolean
  href?: string
  target?: string
  rel?: string
}

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  (
    {
      className,
      icon,
      shortcut,
      trailingVisual,
      variant,
      selected,
      href,
      target,
      rel,
      children,
      ...props
    },
    ref,
  ) => {
    const content = (
      <>
        <div
          className={cx(
            "flex w-0 grow items-center gap-3",
            variant === "danger" && "text-text-danger epaper:group-focus:text-bg",
          )}
        >
          {icon ? (
            <div
              className={cx(
                "flex text-text-secondary epaper:group-focus:text-bg",
                variant === "danger" && "text-text-danger",
              )}
            >
              {icon}
            </div>
          ) : null}
          <span className="grow truncate">{children}</span>
        </div>
        {trailingVisual}
        {shortcut ? (
          <div className="flex coarse:hidden">
            <Keys keys={shortcut} />
          </div>
        ) : null}
        {selected !== undefined ? selected ? <CheckIcon16 /> : <div className="h-4 w-4" /> : null}
      </>
    )

    return (
      <Menu.Item
        ref={ref}
        className={cx(
          "group flex h-8 cursor-pointer select-none items-center gap-3 rounded px-3 outline-hidden focus:bg-bg-hover focus:outline-hidden active:bg-bg-active coarse:h-10",
          "epaper:focus:bg-text epaper:focus:text-bg",
          "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[disabled]:focus:bg-transparent data-[disabled]:active:bg-transparent",
          className,
        )}
        // eslint-disable-next-line jsx-a11y/anchor-has-content -- content is provided via children
        render={href ? <a href={href} target={target} rel={rel} /> : undefined}
        {...props}
      >
        {content}
      </Menu.Item>
    )
  },
)

function Separator() {
  return <Menu.Separator className="mx-3 my-1 h-px bg-border-secondary" />
}

const Group = Menu.Group

const GroupLabel = React.forwardRef<HTMLDivElement, Menu.GroupLabel.Props>(
  ({ className, ...props }, ref) => (
    <Menu.GroupLabel
      ref={ref}
      className={cx(
        "flex h-8 select-none items-center px-3 text-sm text-text-secondary coarse:h-9",
        className,
      )}
      {...props}
    />
  ),
)

export const DropdownMenu = Object.assign(Menu.Root, {
  Trigger,
  Content,
  Item,
  Separator,
  Group,
  GroupLabel,
})
