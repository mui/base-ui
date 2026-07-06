"use client";

import { Menu as BaseMenu } from "@base-ui-components/react/menu";
import {
  AnimatePresence,
  type MotionNodeAnimationOptions,
  motion,
} from "motion/react";
import { useState } from "react";
import { Check, Dots } from "../icons";
import styles from "./styles.module.css";

const QUERY = `Read https://cambio.raphaelsalaja.com/llms.txt. I want to ask questions about it.`;

const COPY_TIMEOUT = 2000;

const ANIMATION: MotionNodeAnimationOptions = {
  initial: { opacity: 0, filter: "blur(4px)", scale: 0.5 },
  animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
  exit: { opacity: 0, filter: "blur(4px)", scale: 0.5 },
  transition: { ease: [0.19, 1, 0.22, 1], duration: 0.4 },
};

const EXTERNAL_LINKS = [
  {
    label: "Github",
    href: "https://github.com/raphaelsalaja/cambio",
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/raphaelsalaja",
  },
  {
    label: "NPM",
    href: "https://www.npmjs.com/package/cambio",
  },
] as const;

const AI_SERVICES = [
  {
    label: "Open in Scira AI",
    href: `https://scira.ai/?${new URLSearchParams({ q: QUERY })}`,
  },
  {
    label: "Open in ChatGPT",
    href: `https://chatgpt.com/?${new URLSearchParams({ hints: "search", q: QUERY })}`,
  },
  {
    label: "Open in Claude",
    href: `https://claude.ai/new?${new URLSearchParams({ q: QUERY })}`,
  },
  {
    label: "Open in T3 Chat",
    href: `https://t3.chat/new?${new URLSearchParams({ q: QUERY })}`,
  },
] as const;

interface MenuProps {
  content: string;
}

export function Menu({ content }: MenuProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_TIMEOUT);
    } catch (err) {
      console.error("Failed to copy content:", err);
    }
  };

  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger className={styles.trigger} disabled={copied}>
        <AnimatePresence initial={false} mode="popLayout">
          {copied ? (
            <motion.div key="check" {...ANIMATION}>
              <Check size={24} />
            </motion.div>
          ) : (
            <motion.div key="dots" {...ANIMATION}>
              <Dots size={16} />
            </motion.div>
          )}
        </AnimatePresence>
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          className={styles.positioner}
          align="end"
          sideOffset={8}
        >
          <BaseMenu.Popup className={styles.popup}>
            {EXTERNAL_LINKS.map(({ label, href }) => (
              <BaseMenu.Item
                key={label}
                className={styles.item}
                render={
                  <a target="_blank" rel="noopener noreferrer" href={href}>
                    {label}
                  </a>
                }
              />
            ))}

            <BaseMenu.Separator className={styles.separator} />

            <BaseMenu.Item className={styles.item} onClick={handleCopyContent}>
              Copy Markdown
            </BaseMenu.Item>
            <BaseMenu.Item
              className={styles.item}
              render={
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://cambio.raphaelsalaja.com/llms.txt"
                >
                  View as Markdown
                </a>
              }
            />

            <BaseMenu.Separator className={styles.separator} />

            {AI_SERVICES.map(({ label, href }) => (
              <BaseMenu.Item
                key={label}
                className={styles.item}
                render={
                  <a target="_blank" rel="noopener noreferrer" href={href}>
                    {label}
                  </a>
                }
              />
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
