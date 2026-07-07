import {
  Home01Icon,
  Settings01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./navigation-menu";

const meta: Meta<typeof NavigationMenu> = {
  title: "Navigation/NavigationMenu",
  component: NavigationMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A horizontal navigation bar with animated dropdown panels.",
          "",
          "Built on **Base UI** `@base-ui/react/navigation-menu`. The `NavigationMenu`",
          "wrapper already includes `NavigationMenuPositioner` (portal + positioner +",
          "viewport) — do not add it manually.",
          "",
          "Key parts:",
          "- `NavigationMenuList` — the flex row of menu items.",
          "- `NavigationMenuItem` — a single item; wraps a trigger or a plain link.",
          "- `NavigationMenuTrigger` — button that opens a `NavigationMenuContent` panel.",
          "- `NavigationMenuContent` — the dropdown panel content.",
          "- `NavigationMenuLink` — a styled anchor inside a panel or as a direct item.",
          "- `navigationMenuTriggerStyle()` — a `cva` call you can reuse on custom elements.",
          "",
          "The `align` prop on `NavigationMenu` controls popup alignment (`start` | `center` | `end`).",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Alignment of the dropdown positioner.",
      table: { defaultValue: { summary: "start" } },
    },
  },
  args: {
    align: "start",
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/** Interactive playground — hover over a trigger to see its panel. */
export const Playground: Story = {
  render: (args) => (
    <NavigationMenu {...args}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-1 p-2 md:w-[400px]">
              <li>
                <NavigationMenuLink href="#">
                  <HugeiconsIcon className="size-4" icon={Home01Icon} />
                  <span>
                    <strong className="block font-medium text-sm">
                      Introduction
                    </strong>
                    <span className="text-muted-foreground text-xs">
                      Re-usable components built with Base UI.
                    </span>
                  </span>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">
                  <HugeiconsIcon className="size-4" icon={Settings01Icon} />
                  <span>
                    <strong className="block font-medium text-sm">
                      Installation
                    </strong>
                    <span className="text-muted-foreground text-xs">
                      How to install and configure the library.
                    </span>
                  </span>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid grid-cols-2 gap-1 p-2 md:w-[500px]">
              {["Button", "Input", "Select", "Dialog", "Tabs", "Badge"].map(
                (name) => (
                  <li key={name}>
                    <NavigationMenuLink href="#">
                      <span className="font-medium text-sm">{name}</span>
                    </NavigationMenuLink>
                  </li>
                )
              )}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
            Docs
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

/** Plain links without dropdown panels — use `navigationMenuTriggerStyle()` for consistent sizing. */
export const PlainLinks: Story = {
  render: (args) => (
    <NavigationMenu {...args}>
      <NavigationMenuList>
        {["Home", "About", "Blog", "Contact"].map((label) => (
          <NavigationMenuItem key={label}>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              href="#"
            >
              {label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

/** Navigation with active-state links. */
export const WithActiveLink: Story = {
  render: (args) => (
    <NavigationMenu {...args}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink
            active
            className={navigationMenuTriggerStyle()}
            href="#"
          >
            Home
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
            Components
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
            Blog
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

/** Rich panel with icons and descriptions — a common "mega-menu" pattern. */
export const RichPanel: Story = {
  render: (args) => (
    <NavigationMenu {...args}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid grid-cols-1 gap-1 p-2 md:w-[360px]">
              {[
                {
                  icon: Home01Icon,
                  title: "Dashboard",
                  desc: "Overview of your workspace.",
                },
                {
                  icon: UserIcon,
                  title: "Team",
                  desc: "Manage members and permissions.",
                },
                {
                  icon: Settings01Icon,
                  title: "Settings",
                  desc: "Configure your account.",
                },
              ].map(({ icon, title, desc }) => (
                <li key={title}>
                  <NavigationMenuLink href="#">
                    <HugeiconsIcon className="size-4 shrink-0" icon={icon} />
                    <span>
                      <strong className="block font-medium text-sm">
                        {title}
                      </strong>
                      <span className="text-muted-foreground text-xs">
                        {desc}
                      </span>
                    </span>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};
