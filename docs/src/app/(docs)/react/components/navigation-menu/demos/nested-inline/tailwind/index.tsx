'use client';
import * as React from 'react';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { useMediaQuery } from '@base-ui/react/unstable-use-media-query';
import { audienceMenus, guideLinks, guidesPanel } from '../data';

export default function ExampleNavigationMenu() {
  const isDesktop = useMediaQuery('(min-width: 700px)', { defaultMatches: true });

  return (
    <NavigationMenu.Root className="min-w-max rounded-lg bg-gray-50 p-1 text-gray-900">
      <NavigationMenu.List className="relative flex">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={triggerClassName}>
            Product
            <NavigationMenu.Icon className="transition-transform duration-200 ease-in-out data-[popup-open]:rotate-180">
              <ChevronDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>

          <NavigationMenu.Content className={productContentClassName}>
            <NavigationMenu.Root
              className="overflow-hidden text-gray-900"
              orientation={isDesktop ? 'vertical' : 'horizontal'}
              defaultValue="developers"
            >
              <div className="grid grid-cols-1 overflow-clip rounded-lg min-[700px]:grid-cols-[13rem_minmax(0,1fr)]">
                <NavigationMenu.List className="m-0 flex list-none flex-row gap-1 overflow-x-auto bg-gray-100 p-4 min-[700px]:box-border min-[700px]:h-[var(--popup-height)] min-[700px]:flex-col min-[700px]:gap-0 min-[700px]:overflow-x-visible min-[700px]:overflow-y-auto min-[700px]:border-r min-[700px]:border-r-gray-200 min-[700px]:transition-[height] min-[700px]:duration-[var(--duration)] min-[700px]:ease-[var(--easing)] dark:bg-black/20 dark:border-r-gray-300">
                  {audienceMenus.map((menu) => (
                    <NavigationMenu.Item key={menu.value} value={menu.value}>
                      <NavigationMenu.Trigger className={submenuTriggerClassName}>
                        <span className="text-base leading-[1.2] font-normal text-gray-900">
                          {menu.label}
                        </span>
                        <span className="text-sm leading-[1.35] text-gray-500">{menu.hint}</span>
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content className={submenuContentClassName}>
                        <h4 className="m-0 text-[1.125rem] leading-[1.3] font-normal">
                          {menu.title}
                        </h4>
                        <p className="m-0 mt-2.5 text-base leading-[1.5] text-gray-500">
                          {menu.description}
                        </p>
                        <ul className="-mx-2 m-0 mt-4 grid list-none gap-0 p-0">
                          {menu.links.map((link) => (
                            <li key={link.href}>
                              <Link className={linkCardClassName} href={link.href}>
                                <h5 className="m-0 text-base leading-[1.25] font-normal">
                                  {link.title}
                                </h5>
                                <p className="m-0 mt-[0.35rem] text-[0.95rem] leading-[1.45] text-gray-500">
                                  {link.description}
                                </p>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenu.Content>
                    </NavigationMenu.Item>
                  ))}
                </NavigationMenu.List>
                <NavigationMenu.Viewport className="relative min-h-[16.5rem] overflow-hidden border-t border-gray-200 min-[700px]:border-t-0 dark:border-gray-300" />
              </div>
            </NavigationMenu.Root>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={triggerClassName}>
            Learn
            <NavigationMenu.Icon className="transition-transform duration-200 ease-in-out data-[popup-open]:rotate-180">
              <ChevronDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>

          <NavigationMenu.Content className={guidesContentClassName}>
            <div className="p-7 text-gray-900 min-[700px]:p-8">
              <h4 className="m-0 text-[1.125rem] leading-[1.3] font-normal">{guidesPanel.title}</h4>
              <p className="m-0 mt-2.5 text-base leading-[1.5] text-gray-500">
                {guidesPanel.description}
              </p>
              <ul className="-mx-2 m-0 mt-4 grid list-none gap-0 p-0">
                {guideLinks.map((link) => (
                  <li key={link.href}>
                    <Link className={linkCardClassName} href={link.href}>
                      <h5 className="m-0 text-base leading-[1.25] font-normal">{link.title}</h5>
                      <p className="m-0 mt-[0.35rem] text-[0.95rem] leading-[1.45] text-gray-500">
                        {link.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <Link className={triggerClassName} href="/react/overview/releases">
            Releases
          </Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <Link className={triggerClassName} href="https://github.com/mui/base-ui">
            GitHub
          </Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          sideOffset={10}
          collisionPadding={{ top: 5, bottom: 5, left: 20, right: 20 }}
          collisionAvoidance={{ side: 'none' }}
          className="box-border h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)] transition-[top,left,right,bottom] duration-[var(--duration)] ease-[var(--easing)] before:absolute before:content-[''] data-[instant]:transition-none data-[side=bottom]:before:top-[-10px] data-[side=bottom]:before:right-0 data-[side=bottom]:before:left-0 data-[side=bottom]:before:h-2.5 data-[side=left]:before:top-0 data-[side=left]:before:right-[-10px] data-[side=left]:before:bottom-0 data-[side=left]:before:w-2.5 data-[side=right]:before:top-0 data-[side=right]:before:bottom-0 data-[side=right]:before:left-[-10px] data-[side=right]:before:w-2.5 data-[side=top]:before:right-0 data-[side=top]:before:bottom-[-10px] data-[side=top]:before:left-0 data-[side=top]:before:h-2.5"
          style={{
            ['--duration' as string]: '0.35s',
            ['--easing' as string]: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <NavigationMenu.Popup className="data-[ending-style]:easing-[ease] relative h-[var(--popup-height)] w-[var(--popup-width)] origin-[var(--transform-origin)] rounded-lg bg-[canvas] text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 transition-[opacity,scale,width,height] duration-[var(--duration)] ease-[var(--easing)] data-[ending-style]:transition-[opacity,scale] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[ending-style]:duration-150 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
            <NavigationMenu.Arrow className="flex transition-[left] duration-[var(--duration)] ease-[var(--easing)] data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
              <ArrowSvg />
            </NavigationMenu.Arrow>
            <NavigationMenu.Viewport className="relative h-full w-full overflow-hidden" />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function Link(props: NavigationMenu.Link.Props) {
  return (
    <NavigationMenu.Link
      render={
        // Use the `render` prop to render your framework's Link component
        // for client-side routing.
        // e.g. `<NextLink href={props.href} />` instead of `<a />`.
        <a />
      }
      {...props}
    />
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-[canvas]"
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className="fill-gray-200 dark:fill-none"
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className="dark:fill-gray-300"
      />
    </svg>
  );
}

const triggerClassName =
  'box-border flex items-center justify-center gap-1.5 h-10 ' +
  'px-2 sm:px-3.5 m-0 rounded-md bg-gray-50 text-gray-900 font-normal' +
  'text-[0.925rem] sm:text-base leading-6 select-none no-underline ' +
  'hover:bg-gray-100 active:bg-gray-100 data-[popup-open]:bg-gray-100 ' +
  'focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 focus-visible:relative';

const sharedContentClassName =
  'h-full w-[calc(100vw_-_40px)] ' +
  'transition-[opacity,translate] duration-[calc(var(--duration)*0.5),var(--duration)] ease-[ease,cubic-bezier(0.4,0,0.2,1)] ' +
  'data-[starting-style]:data-[activation-direction=left]:opacity-0 data-[starting-style]:data-[activation-direction=right]:opacity-0 data-[ending-style]:opacity-0 ' +
  'data-[ending-style]:duration-[calc(var(--duration)*0.5)] data-[ending-style]:ease-[ease] ' +
  'data-[starting-style]:data-[activation-direction=left]:translate-x-[-2rem] ' +
  'data-[starting-style]:data-[activation-direction=right]:translate-x-[2rem] ' +
  'data-[ending-style]:data-[activation-direction=left]:translate-x-[2rem] ' +
  'data-[ending-style]:data-[activation-direction=right]:translate-x-[-2rem]';

const productContentClassName = `${sharedContentClassName} min-[700px]:max-w-[675px] p-0`;

const guidesContentClassName = `${sharedContentClassName} min-[700px]:max-w-[500px] p-0`;

const submenuTriggerClassName =
  'box-border m-0 flex w-full min-w-[10rem] flex-col items-start gap-0.5 rounded-lg ' +
  'bg-transparent px-3 py-2.5 text-left text-inherit ' +
  'hover:bg-gray-100 data-[popup-open]:bg-[canvas] dark:data-[popup-open]:bg-gray-100 data-[popup-open]:shadow-[0_1px_2px_rgb(0_0_0_/_0.08),0_1px_1px_rgb(0_0_0_/_0.04)] focus-visible:outline-2 ' +
  'focus-visible:-outline-offset-1 focus-visible:outline-blue-800';

const submenuContentClassName =
  'h-full translate-x-0 p-7 min-[700px]:p-8 min-[700px]:blur-0 transition-[opacity,translate,filter] duration-[var(--duration)] ease-[var(--easing)] min-[700px]:duration-[calc(var(--duration)*1.35)] min-[700px]:ease-[cubic-bezier(0.16,1,0.3,1)] ' +
  'data-[starting-style]:data-[activation-direction=left]:opacity-0 data-[starting-style]:data-[activation-direction=right]:opacity-0 data-[starting-style]:data-[activation-direction=left]:translate-x-[-50%] data-[starting-style]:data-[activation-direction=right]:translate-x-[50%] ' +
  'data-[ending-style]:opacity-0 data-[ending-style]:data-[activation-direction=left]:translate-x-[50%] data-[ending-style]:data-[activation-direction=right]:translate-x-[-50%] ' +
  'min-[700px]:data-[starting-style]:data-[activation-direction=up]:opacity-0 min-[700px]:data-[starting-style]:data-[activation-direction=down]:opacity-0 min-[700px]:data-[starting-style]:data-[activation-direction=up]:translate-y-[-72px] min-[700px]:data-[starting-style]:data-[activation-direction=down]:translate-y-[72px] min-[700px]:data-[starting-style]:blur-[2px] ' +
  'min-[700px]:data-[ending-style]:data-[activation-direction=up]:translate-y-[72px] min-[700px]:data-[ending-style]:data-[activation-direction=down]:translate-y-[-72px] min-[700px]:data-[ending-style]:blur-[2px]';

const linkCardClassName =
  'box-border block rounded-lg bg-transparent px-2 py-3 no-underline text-inherit ' +
  'hover:bg-gray-100 focus-visible:outline-2 ' +
  'focus-visible:-outline-offset-1 focus-visible:outline-blue-800';
