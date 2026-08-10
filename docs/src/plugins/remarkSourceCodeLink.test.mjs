import { describe, expect, it } from 'vitest';
import remarkSourceCodeLink from './remarkSourceCodeLink.mjs';

function transform(filePath, attributes = [], componentName = 'Subtitle') {
  const component = {
    type: 'mdxJsxFlowElement',
    name: componentName,
    attributes,
    children: [],
  };
  const tree = { type: 'root', children: [component] };

  remarkSourceCodeLink({ componentName })(tree, { path: filePath });

  return component.attributes;
}

describe('remarkSourceCodeLink', () => {
  it('adds component source paths', () => {
    expect(
      transform('/repo/docs/src/app/(docs)/react/(components)/accordion/page.mdx'),
    ).toContainEqual({
      type: 'mdxJsxAttribute',
      name: 'sourcePath',
      value: 'packages/react/src/accordion',
    });
  });

  it('adds utility source paths', () => {
    expect(
      transform('/repo/docs/src/app/(docs)/react/(utils)/merge-props/page.mdx'),
    ).toContainEqual({
      type: 'mdxJsxAttribute',
      name: 'sourcePath',
      value: 'packages/react/src/merge-props',
    });
  });

  it('supports Windows paths', () => {
    expect(
      transform('C:\\repo\\docs\\src\\app\\(docs)\\react\\(components)\\button\\page.mdx'),
    ).toContainEqual({
      type: 'mdxJsxAttribute',
      name: 'sourcePath',
      value: 'packages/react/src/button',
    });
  });

  it('adds source paths to the configured component', () => {
    expect(
      transform('/repo/docs/src/app/(docs)/react/(components)/button/page.mdx', [], 'PageHeader'),
    ).toContainEqual({
      type: 'mdxJsxAttribute',
      name: 'sourcePath',
      value: 'packages/react/src/button',
    });
  });

  it('does not add source paths to other React documentation', () => {
    expect(transform('/repo/docs/src/app/(docs)/react/(overview)/quick-start/page.mdx')).toEqual(
      [],
    );
    expect(transform('/repo/docs/src/app/(docs)/react/(handbook)/styling/page.mdx')).toEqual([]);
    expect(
      transform('/repo/docs/src/app/(docs)/react/(overview)/releases/v1-0-0/page.mdx'),
    ).toEqual([]);
  });

  it('preserves explicit source paths', () => {
    const sourcePathAttribute = {
      type: 'mdxJsxAttribute',
      name: 'sourcePath',
      value: 'packages/react/src/custom-source',
    };

    expect(
      transform('/repo/docs/src/app/(docs)/react/(components)/custom/page.mdx', [
        sourcePathAttribute,
      ]),
    ).toEqual([sourcePathAttribute]);
  });
});
