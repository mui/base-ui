import { describe, expect, it } from 'vitest';
import rehypeSlug, { stringToUrl } from './rehypeSlug.mjs';

/**
 * @param {number} depth
 * @param {string} text
 */
function heading(depth, text) {
  return {
    type: 'element',
    tagName: `h${depth}`,
    properties: {},
    children: [{ type: 'text', value: text }],
  };
}

/**
 * Runs the transform and returns the `id` assigned to each element node, in order.
 */
function slugIds(children, options) {
  const tree = { type: 'root', children };
  rehypeSlug(options)(tree);
  return tree.children.map((node) => node.properties.id);
}

describe('rehypeSlug', () => {
  it('adds a slug id to a heading', () => {
    expect(slugIds([heading(2, 'Getting started')])).toEqual(['getting-started']);
  });

  it('suffixes repeated heading text so ids stay unique', () => {
    expect(slugIds([heading(2, 'Props'), heading(3, 'Props'), heading(3, 'Props')])).toEqual([
      'props',
      'props-1',
      'props-2',
    ]);
  });

  it('does not collide when later heading text matches an already-suffixed slug', () => {
    expect(slugIds([heading(2, 'Props'), heading(2, 'Props'), heading(2, 'Props 1')])).toEqual([
      'props',
      'props-1',
      'props-1-1',
    ]);
  });

  it('applies the prefix before deduplicating', () => {
    expect(slugIds([heading(2, 'Props'), heading(2, 'Props')], { prefix: 'api-' })).toEqual([
      'api-props',
      'api-props-1',
    ]);
  });

  it('leaves a heading that already has an id untouched', () => {
    const custom = heading(2, 'Props');
    custom.properties.id = 'custom-id';
    expect(slugIds([custom])).toEqual(['custom-id']);
  });

  it('suffixes a later heading that collides with a pre-existing id', () => {
    const explicit = heading(2, 'Something');
    explicit.properties.id = 'props';
    expect(slugIds([explicit, heading(2, 'Props')])).toEqual(['props', 'props-1']);
  });

  it('ignores non-heading elements', () => {
    const paragraph = { type: 'element', tagName: 'p', properties: {}, children: [] };
    const tree = { type: 'root', children: [paragraph] };
    rehypeSlug()(tree);
    expect(paragraph.properties.id).toBeUndefined();
  });
});

describe('stringToUrl', () => {
  it('kebab-cases and strips punctuation', () => {
    expect(stringToUrl('1. Here’s a wicked example & more.')).toBe(
      '1-here-is-a-wicked-example-and-more',
    );
  });

  it('expands common contractions', () => {
    expect(stringToUrl("you'll won't stop")).toBe('you-will-will-not-stop');
  });
});
