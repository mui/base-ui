import * as React from "react"
import { NavigationMenu as BaseNavigationMenu } from "@base-ui/react/navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function NavigationMenu({
	className,
	children,
	...props
}: React.ComponentProps<typeof BaseNavigationMenu.Root>) {
	return (
		<BaseNavigationMenu.Root
			data-slot="navigation-menu"
			className={cn("min-w-max", className)}
			{...props}
		>
			{children}
			<NavigationMenuViewport />
		</BaseNavigationMenu.Root>
	)
}

function NavigationMenuList({
	className,
	...props
}: React.ComponentProps<typeof BaseNavigationMenu.List>) {
	return (
		<BaseNavigationMenu.List
			data-slot="navigation-menu-list"
			className={cn(
				"relative flex items-center justify-center gap-1",
				className
			)}
			{...props}
		/>
	)
}

function NavigationMenuItem({
	...props
}: React.ComponentProps<typeof BaseNavigationMenu.Item>) {
	return <BaseNavigationMenu.Item data-slot="navigation-menu-item" {...props} />
}

function NavigationMenuIcon({
	...props
}: React.ComponentProps<typeof BaseNavigationMenu.Icon>) {
	return <BaseNavigationMenu.Icon data-slot="navigation-menu-icon" {...props} />
}

const navigationMenuTriggerStyle = cva(
	"inline-flex w-max items-center justify-center gap-1.5 h-9 rounded-md bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 data-popup-open:hover:bg-accent data-popup-open:text-accent-foreground data-popup-open:focus:bg-accent data-popup-open:bg-accent/50 focus-visible:ring-ring/50 outline-none transition-[color,box-shadow] focus-visible:ring-3 focus-visible:outline-1 select-none no-underline [&_svg:not([class*='size-'])]:size-3 shrink-0 [&_svg]:shrink-0"
)

function NavigationMenuTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof BaseNavigationMenu.Trigger>) {
	return (
		<BaseNavigationMenu.Trigger
			data-slot="navigation-menu-trigger"
			className={cn(navigationMenuTriggerStyle(), className)}
			data-disabled={props.disabled}
			{...props}
		>
			{children}
			<NavigationMenuIcon className="transition-transform duration-200 data-popup-open:rotate-180">
				<ChevronDownIcon aria-hidden="true" />
			</NavigationMenuIcon>
		</BaseNavigationMenu.Trigger>
	)
}

function NavigationMenuContent({
	className,
	...props
}: React.ComponentProps<typeof BaseNavigationMenu.Content>) {
	return (
		<BaseNavigationMenu.Content
			data-slot="navigation-menu-content"
			className={cn("w-full p-2 md:w-auto", className)}
			{...props}
		/>
	)
}

function NavigationMenuLink({
	className,
	...props
}: React.ComponentProps<typeof BaseNavigationMenu.Link>) {
	return (
		<BaseNavigationMenu.Link
			data-slot="navigation-menu-link"
			className={cn(
				"hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none focus-visible:ring-3 focus-visible:outline-1 [&_svg:not([class*='size-'])]:size-4",
				className
			)}
			{...props}
		/>
	)
}

function NavigationMenuViewport({
	className,
	...props
}: React.ComponentProps<typeof BaseNavigationMenu.Popup>) {
	return (
		<BaseNavigationMenu.Portal data-slot="navigation-menu-portal">
			<BaseNavigationMenu.Positioner
				sideOffset={4}
				align="start"
				className="h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)] origin-[var(--transform-origin)] duration-200"
				data-slot="navigation-menu-positioner"
			>
				<BaseNavigationMenu.Popup
					className={cn(
						"bg-popover text-popover-foreground h-[var(--popup-height)] w-[var(--popup-width)] origin-[var(--transform-origin)] overflow-hidden rounded-md border shadow-md transition-all data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0",
						className
					)}
					data-slot="navigation-menu-popup"
					{...props}
				>
					<BaseNavigationMenu.Viewport data-slot="navigation-menu-viewport" />
				</BaseNavigationMenu.Popup>
			</BaseNavigationMenu.Positioner>
		</BaseNavigationMenu.Portal>
	)
}

export {
	NavigationMenu,
	NavigationMenuList,
	NavigationMenuItem,
	NavigationMenuTrigger,
	NavigationMenuContent,
	NavigationMenuLink,
	navigationMenuTriggerStyle,
}
