import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { mdxToMarkdown } from './mdxToMarkdown.mjs';

describe('mdxToMarkdown', () => {
  // A snapshpot test for the Accordion MDX content.
  // Serves as an integration test for the markdown generation of component docs.
  it('should transform Accordion MDX content to markdown with metadata', async () => {
    // Read the actual Accordion MDX file
    const accordionMdxPath = path.resolve(
      import.meta.dirname,
      '../../src/app/(public)/(content)/react/components/accordion/page.mdx',
    );
    const accordionMdxContent = fs.readFileSync(accordionMdxPath, 'utf-8');

    // Transform the MDX content
    const result = await mdxToMarkdown(accordionMdxContent, accordionMdxPath);

    // Verify the result structure
    expect(result).to.be.an('object');
    expect(result).to.have.property('markdown');
    expect(result).to.have.property('title');
    expect(result).to.have.property('subtitle');
    expect(result).to.have.property('description');

    // Verify extracted metadata
    expect(result.title).to.equal('Accordion');
    expect(result.subtitle).to.equal('A set of collapsible panels with headings.');
    expect(result.description).to.equal(
      'A high-quality, unstyled React accordion component that displays a set of collapsible panels with headings.',
    );

    // Snapshot test the complete result
    expect(result.markdown).toMatchSnapshot();
  });

  // A snapshpot test for the useRender MDX content.
  // Serves as an integration test for the markdown generation of utils docs.
  it('should transform Direction Provider MDX content to markdown with metadata', async () => {
    // Read the actual Direcrion Provider MDX file
    const directionProviderMdxPath = path.resolve(
      import.meta.dirname,
      '../../src/app/(public)/(content)/react/utils/direction-provider/page.mdx',
    );
    const directionProviderMdxContent = fs.readFileSync(directionProviderMdxPath, 'utf-8');

    // Transform the MDX content
    const result = await mdxToMarkdown(directionProviderMdxContent, directionProviderMdxPath);

    // Verify the result structure
    expect(result).to.be.an('object');
    expect(result).to.have.property('markdown');
    expect(result).to.have.property('title');
    expect(result).to.have.property('subtitle');
    expect(result).to.have.property('description');

    // Verify extracted metadata
    expect(result.title).to.equal('Direction Provider');
    expect(result.subtitle).to.equal('Enables RTL behavior for Base UI components.');
    expect(result.description).to.equal(
      'A direction provider component that enables RTL behavior for Base UI components.',
    );

    // Snapshot test the complete result
    expect(result.markdown).toMatchSnapshot();
  });
});
