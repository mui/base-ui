'use client'
import type { Assign, PolymorphicProps } from '@ark-ui/react'
import { Drawer } from '@ark-ui/react/drawer'
import { ark } from '@ark-ui/react/factory'
import { type DrawerVariantProps, drawer } from 'styled-system/recipes'
import type { ComponentProps, HTMLStyledProps } from 'styled-system/types'
import { createStyleContext } from '~/lib/create-style-context'

const { withRootProvider, withContext } = createStyleContext(drawer)

export type RootProviderProps = ComponentProps<typeof RootProvider>
export const RootProvider = withRootProvider<Assign<Drawer.RootProviderBaseProps, DrawerVariantProps>>(
  Drawer.RootProvider,
)

export type RootProps = ComponentProps<typeof Root>
export const Root = withRootProvider<Assign<Drawer.RootProps, DrawerVariantProps>>(Drawer.Root)

export const Backdrop = withContext<HTMLDivElement, Assign<HTMLStyledProps<'div'>, Drawer.BackdropBaseProps>>(
  Drawer.Backdrop,
  'backdrop',
)

export const CloseTrigger = withContext<
  HTMLButtonElement,
  Assign<HTMLStyledProps<'button'>, Drawer.CloseTriggerBaseProps>
>(Drawer.CloseTrigger, 'closeTrigger')

export const Content = withContext<HTMLDivElement, Assign<HTMLStyledProps<'div'>, Drawer.ContentBaseProps>>(
  Drawer.Content,
  'content',
)

export const Description = withContext<HTMLDivElement, Assign<HTMLStyledProps<'div'>, Drawer.DescriptionBaseProps>>(
  Drawer.Description,
  'description',
)

export const Positioner = withContext<HTMLDivElement, Assign<HTMLStyledProps<'div'>, Drawer.PositionerBaseProps>>(
  Drawer.Positioner,
  'positioner',
)

export const Title = withContext<HTMLHeadingElement, Assign<HTMLStyledProps<'h2'>, Drawer.TitleBaseProps>>(
  Drawer.Title,
  'title',
)

export const Trigger = withContext<HTMLButtonElement, Assign<HTMLStyledProps<'button'>, Drawer.TriggerBaseProps>>(
  Drawer.Trigger,
  'trigger',
)

export const Header = withContext<HTMLDivElement, Assign<HTMLStyledProps<'div'>, PolymorphicProps>>(ark.div, 'header')

export const Body = withContext<HTMLDivElement, Assign<HTMLStyledProps<'div'>, PolymorphicProps>>(ark.div, 'body')

export const Footer = withContext<HTMLDivElement, Assign<HTMLStyledProps<'div'>, PolymorphicProps>>(ark.div, 'footer')

export const Grabber = withContext<HTMLDivElement, Assign<HTMLStyledProps<'div'>, Drawer.GrabberBaseProps>>(
  Drawer.Grabber,
  'grabber',
)

export const GrabberIndicator = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Drawer.GrabberIndicatorBaseProps>
>(Drawer.GrabberIndicator, 'grabberIndicator')

export const Indent = withContext<HTMLDivElement, Assign<HTMLStyledProps<'div'>, Drawer.IndentBaseProps>>(
  Drawer.Indent,
  'indent',
)

export const IndentBackground = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Drawer.IndentBackgroundBaseProps>
>(Drawer.IndentBackground, 'indentBackground')

export const SwipeArea = withContext<HTMLDivElement, Assign<HTMLStyledProps<'div'>, Drawer.SwipeAreaBaseProps>>(
  Drawer.SwipeArea,
  'swipeArea',
)

export const Stack = Drawer.Stack

export const Context = Drawer.Context
