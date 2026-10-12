// @ts-check
import { visit } from 'unist-util-visit';

/** The one badge a heading can show. Anything else in brackets stays in the heading text. */
const HEADING_TAGS = new Set(['New', 'Preview']);

const TRAILING_TAG = new RegExp(`\\s+\\[(${[...HEADING_TAGS].join('|')})\\]\\s*$`);

/**
 * Pulls one trailing `[New]` or `[Preview]` off a heading.
 * The word is removed from the heading text, which is what the slug and the
 * quick nav are built from, and stored on `data-heading-badge` for the heading
 * component to render as a badge.
 *
 * @param {string} value
 * @returns {{ text: string, tag: string } | null}
 */
function splitTrailingHeadingTag(value) {
  const match = TRAILING_TAG.exec(value);
  if (!match || match.index === undefined) {
    return null;
  }

  return {
    text: value.slice(0, match.index),
    tag: match[1],
  };
}

/**
 * @param {Array<{ type: string, value?: string, children?: unknown[] }>} children
 * @returns {boolean}
 */
function hasVisibleContent(children) {
  return children.some((child) => {
    if (child.type === 'text') {
      return Boolean(child.value?.trim());
    }
    return true;
  });
}

/**
 * @returns {(tree: any) => void}
 */
export default function remarkHeadingTags() {
  return (tree) => {
    visit(tree, 'heading', (node) => {
      const children = node.children;
      const last = children?.[children.length - 1];
      if (!last || last.type !== 'text' || typeof last.value !== 'string') {
        return;
      }

      const split = splitTrailingHeadingTag(last.value);
      if (!split) {
        return;
      }

      const nextChildren = split.text
        ? [...children.slice(0, -1), { ...last, value: split.text }]
        : children.slice(0, -1);

      if (!hasVisibleContent(nextChildren)) {
        return;
      }

      node.children = nextChildren;
      if (!node.data) {
        node.data = {};
      }
      node.data.hProperties = {
        ...node.data.hProperties,
        'data-heading-badge': split.tag,
      };
    });
  };
}
