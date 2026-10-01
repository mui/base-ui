import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHeadingTags from './remarkHeadingTags.mjs';

/**
 * @param {string} markdown
 */
function headings(markdown) {
  const tree = unified().use(remarkParse).parse(markdown);
  remarkHeadingTags()(tree);
  return tree.children.filter((node) => node.type === 'heading');
}

describe('remarkHeadingTags', () => {
  it('moves a trailing Preview tag onto a data attribute', () => {
    const [heading] = headings('### FilterProvider [Preview]\n');

    expect(heading.children).toEqual([
      expect.objectContaining({ type: 'text', value: 'FilterProvider' }),
    ]);
    expect(heading.data.hProperties['data-heading-badge']).toBe('Preview');
  });

  it('lifts only the last trailing tag', () => {
    const [heading] = headings('### Chip [New] [Preview]\n');

    expect(heading.children[0].value).toBe('Chip [New]');
    expect(heading.data.hProperties['data-heading-badge']).toBe('Preview');
  });

  it('leaves brackets that are not a trailing tag in the heading text', () => {
    const [valueHeading, middleHeading] = headings(
      '### Use [value]\n\n### Already [Preview] inside\n',
    );

    expect(valueHeading.children[0].value).toBe('Use [value]');
    expect(valueHeading.data).toBeUndefined();
    expect(middleHeading.children[0].value).toBe('Already [Preview] inside');
    expect(middleHeading.data).toBeUndefined();
  });

  it('strips a tag that follows other inline content', () => {
    const [heading] = headings('### **FilterProvider** [Preview]\n');

    expect(heading.children.map((child) => child.type)).toEqual(['strong']);
    expect(heading.data.hProperties['data-heading-badge']).toBe('Preview');
  });

  it('does not strip a heading that is only a tag', () => {
    const [heading] = headings('### [Preview]\n');

    expect(heading.children[0].value).toBe('[Preview]');
    expect(heading.data).toBeUndefined();
  });
});
