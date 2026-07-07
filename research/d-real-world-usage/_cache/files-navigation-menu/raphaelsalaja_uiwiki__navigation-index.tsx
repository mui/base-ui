"use client";

import { NavigationMenu } from "@base-ui/react/navigation-menu";
import Link from "next/link";
import { Banner } from "@/components/banner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { sounds } from "@/lib/sounds";
import styles from "./styles.module.css";

const LINKS = [
  {
    id: "demos",
    href: "/demo",
    title: "Demos",
    external: false,
  },
  {
    id: "skill",
    href: "/skill",
    title: "Skill",
    external: false,
  },
  {
    id: "twitter",
    href: "https://twitter.com/intent/follow?screen_name=raphaelsalaja",
    title: "Twitter",
    external: true,
  },
  {
    id: "github",
    href: "https://github.com/raphaelsalaja/userinterface-wiki",
    title: "Github",
    external: true,
  },
];

export default function Navigation() {
  return (
    <NavigationMenu.Root className={styles.root}>
      <Banner />
      <div className={styles.container}>
        <Link
          href="/"
          className={styles.logo}
          aria-label="Home"
          onClick={sounds.click}
        >
          U
        </Link>
        <NavigationMenu.List className={styles.list}>
          {LINKS.map((link) => (
            <NavigationMenu.Item key={link.id}>
              <NavigationMenu.Link
                href={link.href}
                className={styles.link}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                onClick={sounds.click}
              >
                {link.title}
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          ))}
          <li>
            <ThemeSwitcher />
          </li>
        </NavigationMenu.List>
      </div>
    </NavigationMenu.Root>
  );
}
