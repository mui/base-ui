"use client";
import { NavigationMenu } from "@base-ui/react/navigation-menu";
import clsx from "clsx";
import {
  BookIcon,
  BotIcon,
  BugPlayIcon,
  ChevronDownIcon,
  EyeIcon,
  FeatherIcon,
  LogsIcon,
  type LucideIcon,
  MailIcon,
  MessageCircleIcon,
  MessagesSquareIcon,
  RocketIcon,
  ShieldCheckIcon,
  UsersIcon,
  WavesIcon,
} from "lucide-react";
import NextLink from "next/link";
import * as React from "react";

import { ArgosLogo } from "@/components/ArgosLogo";
import { Button } from "@/components/Button";
import { Navbar } from "@/components/Navbar";
import { ThemeImage, type ThemeImageProps } from "@/components/ThemeImage";
import { type FeatureColor } from "@/components/feature-section/colors";

import { cypress, playwright, storybook, wdio } from "./assets/brands/library";
import { trackSignupClick } from "./google-ads";

export const AppNavbar: React.FC = () => {
  return (
    <Navbar
      primary={
        <NextLink href="/" className="inline-flex">
          <ArgosLogo className="h-6" />
        </NextLink>
      }
      secondary={<SecondaryNavbar />}
      actions={
        <>
          <Button variant="outline" asChild>
            <a href="https://app.argos-ci.com/login">Login</a>
          </Button>
          <Button asChild>
            <a
              href="https://app.argos-ci.com/signup"
              onClick={trackSignupClick}
            >
              Sign up
            </a>
          </Button>
        </>
      }
    />
  );
};

function SecondaryNavbar() {
  return (
    <NavigationMenu.Root className="min-w-max">
      <NavigationMenu.List className="relative flex max-md:flex-col">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={triggerClassName}>
            Product
            <NavigationMenu.Icon className={navIconClassName}>
              <ChevronDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>

          <NavigationMenu.Content className={contentClassName}>
            <div className="flex max-md:flex-col md:divide-x">
              <Section>
                <SectionTitle>Features</SectionTitle>
                <SectionList>
                  <li>
                    <LinkCard
                      href="/visual-testing"
                      icon={EyeIcon}
                      color="blue"
                      title="Change Detection"
                      description="See every change: pixels or any file"
                    />
                  </li>
                  <li>
                    <LinkCard
                      href="/deployments"
                      icon={RocketIcon}
                      color="teal"
                      title="Deployments"
                      description="Preview Storybook on every PR"
                    />
                  </li>
                  <li>
                    <LinkCard
                      href="/flaky-management"
                      icon={WavesIcon}
                      color="amber"
                      title="Flaky Management"
                      description="Keep your CI signal clean"
                    />
                  </li>
                  <li>
                    <LinkCard
                      href="/test-debugging"
                      icon={BugPlayIcon}
                      color="teal"
                      title="Test Debugging"
                      description="See why E2E tests fail"
                    />
                  </li>
                </SectionList>
              </Section>
              <Section>
                <SectionTitle>Use cases</SectionTitle>
                <SectionList>
                  <li>
                    <LinkCard
                      href="/ai-agents"
                      icon={BotIcon}
                      color="violet"
                      title="For AI Agents"
                      description="100% agent-ready CLI & API"
                    />
                  </li>
                  <li>
                    <LinkCard
                      href="/collaborative-reviews"
                      icon={MessagesSquareIcon}
                      color="blue"
                      title="Collaborative Reviews"
                      description="Review together, in real time"
                    />
                  </li>
                </SectionList>
              </Section>
              <Section>
                <SectionTitle>SDKs</SectionTitle>
                <SectionList>
                  <li>
                    <LinkCard
                      href="/docs/quickstart/playwright-quickstart"
                      icon={{ src: playwright.logo }}
                      title="Playwright"
                    />
                  </li>
                  <li>
                    <LinkCard
                      href="/docs/quickstart/storybook-quickstart"
                      icon={{ src: storybook.logo }}
                      title="Storybook"
                    />
                  </li>
                  <li>
                    <LinkCard
                      href="/docs/quickstart/cypress-quickstart"
                      icon={{ src: cypress.logo }}
                      title="Cypress"
                    />
                  </li>
                  <li>
                    <LinkCard
                      href="/docs/quickstart/webdriverio-quickstart"
                      icon={{ src: wdio.logo }}
                      title="WebdriverIO"
                    />
                  </li>
                </SectionList>
              </Section>
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={triggerClassName}>
            Resources
            <NavigationMenu.Icon className={navIconClassName}>
              <ChevronDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>

          <NavigationMenu.Content className={contentClassName}>
            <div className="flex max-md:flex-col md:divide-x">
              <Section>
                <SectionTitle>Company</SectionTitle>
                <SectionList>
                  <li>
                    <LinkCard
                      href="/about"
                      icon={UsersIcon}
                      title="About"
                      description="Company, values and team"
                    />
                  </li>
                  <li>
                    <LinkCard
                      href="/security"
                      icon={ShieldCheckIcon}
                      title="Security"
                      description="SOC 2 & RGPD"
                    />
                  </li>
                  <li>
                    <LinkCard
                      href="/contact"
                      icon={MailIcon}
                      title="Contact"
                      description="Reach out to support and sales"
                    />
                  </li>
                  <li>
                    <LinkCard
                      href="/community"
                      icon={MessageCircleIcon}
                      title="Community"
                      description="Open source & Discord"
                    />
                  </li>
                </SectionList>
              </Section>
              <Section>
                <SectionTitle>Explore</SectionTitle>
                <SectionList>
                  <li>
                    <LinkCard
                      href="/docs"
                      icon={BookIcon}
                      title="Docs"
                      description="Argos documentation"
                    />
                  </li>
                  <li>
                    <LinkCard
                      href="/changelog"
                      icon={LogsIcon}
                      title="Changelog"
                      description="Releases and updates"
                    />
                  </li>
                  <li>
                    <LinkCard
                      href="/blog"
                      icon={FeatherIcon}
                      title="Blog"
                      description="Insights and stories"
                    />
                  </li>
                </SectionList>
              </Section>
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <Link className={triggerClassName} href="/customers">
            Customers
          </Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <Link className={triggerClassName} href="/pricing">
            Pricing
          </Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          sideOffset={10}
          collisionPadding={{ top: 5, bottom: 5, left: 20, right: 20 }}
          collisionAvoidance={{ side: "none" }}
          className="box-border h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom] duration-(--duration) ease-(--easing) before:absolute before:content-[''] data-instant:transition-none data-[side=bottom]:before:-top-2.5 data-[side=bottom]:before:right-0 data-[side=bottom]:before:left-0 data-[side=bottom]:before:h-2.5 data-[side=left]:before:top-0 data-[side=left]:before:-right-2.5 data-[side=left]:before:bottom-0 data-[side=left]:before:w-2.5 data-[side=right]:before:top-0 data-[side=right]:before:bottom-0 data-[side=right]:before:-left-2.5 data-[side=right]:before:w-2.5 data-[side=top]:before:right-0 data-[side=top]:before:-bottom-2.5 data-[side=top]:before:left-0 data-[side=top]:before:h-2.5"
          style={{
            ["--duration" as string]: "0.35s",
            ["--easing" as string]: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <NavigationMenu.Popup className="data-[ending-style]:easing-[ease] xs:w-[var(--popup-width)] relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) overflow-hidden rounded-lg bg-[canvas] shadow-lg/8 outline outline-(--neutral-6) transition-[opacity,transform,width,height,scale,translate] duration-(--duration) ease-(--easing) data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:scale-90 data-starting-style:opacity-0">
            <NavigationMenu.Viewport className="relative h-full w-full overflow-hidden" />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function Section(props: { children: React.ReactNode }) {
  const { children } = props;
  return <div className="w-[calc(100vw-4rem)] p-3 md:max-w-80">{children}</div>;
}

function SectionTitle(props: {
  children: React.ReactNode;
  className?: string;
}) {
  const { children, className } = props;
  return (
    <div
      className={clsx("text-low mb-1 pl-2 text-xs uppercase", className)}
    >
      {children}
    </div>
  );
}

function SectionList(props: { children: React.ReactNode }) {
  const { children } = props;
  return <ul className="flex flex-col gap-1">{children}</ul>;
}

function Link(props: NavigationMenu.Link.Props & { href: string }) {
  return (
    <NavigationMenu.Link
      className={triggerClassName}
      render={<NextLink href={props.href} />}
      {...props}
    />
  );
}

const triggerClassName = clsx(
  "hover:bg-ui aria-expanded:bg-ui rounded-md px-4 py-1.5 font-medium no-underline transition inline-flex gap-1 items-center",
);

const navIconClassName = clsx(
  "transition-transform duration-200 ease-in-out data-popup-open:rotate-180 [&_svg]:size-4",
);

const contentClassName = clsx(
  "h-full bg-app z-40",
  "transition-[opacity,transform,translate] duration-(--duration) ease-(--easing)",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
  "data-starting-style:data-[activation-direction=left]:translate-x-[-50%]",
  "data-starting-style:data-[activation-direction=right]:translate-x-[50%]",
  "data-ending-style:data-[activation-direction=left]:translate-x-[50%]",
  "data-ending-style:data-[activation-direction=right]:translate-x-[-50%]",
);

function LinkCard(props: {
  href: string;
  icon: LucideIcon | { src: ThemeImageProps["src"] };
  color?: FeatureColor;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  const { href, title, description, color, icon: Icon } = props;
  return (
    <Link
      href={href}
      closeOnClick
      className="hover:bg-ui group xs:p-3 flex items-center gap-3 rounded-md p-2 text-sm text-inherit no-underline"
    >
      <div
        className={clsx(
          "grid size-8 place-content-center rounded border transition",
          color
            ? {
                blue: "group-hover:border-(--blue-10) group-hover:bg-(--blue-10)",
                amber:
                  "group-hover:border-(--amber-10) group-hover:bg-(--amber-10)",
                teal: "group-hover:border-(--teal-10) group-hover:bg-(--teal-10)",
                violet:
                  "group-hover:border-(--violet-10) group-hover:bg-(--violet-10)",
                plum: "group-hover:border-(--plum-10) group-hover:bg-(--plum-10)",
                green:
                  "group-hover:border-(--green-10) group-hover:bg-(--green-10)",
              }[color]
            : "src" in Icon
              ? "group-hover:bg-(--neutral-2)"
              : "group-hover:border-(--primary-11) group-hover:bg-(--primary-11)",
        )}
      >
        {"src" in Icon ? (
          <ThemeImage className="size-5" src={Icon.src} alt="" />
        ) : (
          <Icon
            className={clsx(
              "text-low size-5 transition",
              color
                ? "group-hover:text-white"
                : "group-hover:text-(--neutral-1)",
            )}
            strokeWidth={1.5}
          />
        )}
      </div>
      <div className="flex min-h-9.5 flex-col justify-center gap-0.5">
        <h3 className="leading-5 font-medium">{title}</h3>
        {description && (
          <p className="text-low text-xs leading-4">{description}</p>
        )}
      </div>
    </Link>
  );
}
