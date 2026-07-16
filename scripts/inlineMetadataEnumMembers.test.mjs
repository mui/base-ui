import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import inlineMetadataEnumMembers, {
  clearMetadataEnumProgramCache,
} from './inlineMetadataEnumMembers.mjs';

const require = createRequire(import.meta.resolve('@mui/internal-code-infra/babel-config'));
const { transformFileAsync } = require('@babel/core');
const presetTypescript = require('@babel/preset-typescript');

async function createFixture(files) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'metadata-enum-transform-'));
  await Promise.all(
    Object.entries({
      'tsconfig.json': JSON.stringify({
        compilerOptions: { module: 'esnext', moduleResolution: 'bundler', target: 'esnext' },
        include: ['*.ts'],
      }),
      ...files,
    }).map(([name, contents]) => writeFile(path.join(directory, name), contents)),
  );
  return directory;
}

async function transform(directory, fileName) {
  clearMetadataEnumProgramCache();
  const result = await transformFileAsync(path.join(directory, fileName), {
    babelrc: false,
    configFile: false,
    plugins: [[inlineMetadataEnumMembers, { tsconfigPath: path.join(directory, 'tsconfig.json') }]],
    presets: [presetTypescript],
  });
  return result?.code ?? '';
}

test('inlines direct DataAttributes members and removes their import', async () => {
  const directory = await createFixture({
    'DirectDataAttributes.ts': `export enum DirectDataAttributes { open = 'data-open' }`,
    'consumer.ts': `
      import { DirectDataAttributes } from './DirectDataAttributes';
      export const props = { [DirectDataAttributes.open]: '' };
    `,
  });

  try {
    const output = await transform(directory, 'consumer.ts');
    assert.match(output, /"data-open"/);
    assert.doesNotMatch(output, /DirectDataAttributes|import/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('inlines members from aliased DataAttributes imports', async () => {
  const directory = await createFixture({
    'DirectDataAttributes.ts': `export enum DirectDataAttributes { open = 'data-open' }`,
    'consumer.ts': `
      import { DirectDataAttributes as Attributes } from './DirectDataAttributes';
      export const props = { [Attributes.open]: '' };
    `,
  });

  try {
    const output = await transform(directory, 'consumer.ts');
    assert.match(output, /"data-open"/);
    assert.doesNotMatch(output, /DirectDataAttributes|Attributes|import/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('resolves cross-enum DataAttributes initializers', async () => {
  const directory = await createFixture({
    'SharedDataAttributes.ts': `
      export enum SharedDataAttributes { startingStyle = 'data-starting-style' }
    `,
    'CrossDataAttributes.ts': `
      import { SharedDataAttributes } from './SharedDataAttributes';
      export enum CrossDataAttributes { startingStyle = SharedDataAttributes.startingStyle }
    `,
    'consumer.ts': `
      import { CrossDataAttributes } from './CrossDataAttributes';
      export const props = { [CrossDataAttributes.startingStyle]: '' };
    `,
  });

  try {
    const enumOutput = await transform(directory, 'CrossDataAttributes.ts');
    assert.match(enumOutput, /SharedDataAttributes\.startingStyle/);

    const consumerOutput = await transform(directory, 'consumer.ts');
    assert.match(consumerOutput, /"data-starting-style"/);
    assert.doesNotMatch(consumerOutput, /CrossDataAttributes|import/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('inlines CssVars members', async () => {
  const directory = await createFixture({
    'PopupCssVars.ts': `export enum PopupCssVars { width = '--popup-width' }`,
    'consumer.ts': `
      import { PopupCssVars } from './PopupCssVars';
      element.style.setProperty(PopupCssVars.width, '10px');
    `,
  });

  try {
    const output = await transform(directory, 'consumer.ts');
    assert.match(output, /setProperty\("--popup-width", '10px'\)/);
    assert.doesNotMatch(output, /PopupCssVars|import/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects dynamic enum-object use', async () => {
  const directory = await createFixture({
    'DirectDataAttributes.ts': `export enum DirectDataAttributes { open = 'data-open' }`,
    'consumer.ts': `
      import { DirectDataAttributes } from './DirectDataAttributes';
      export const values = Object.values(DirectDataAttributes);
    `,
  });

  try {
    await assert.rejects(() => transform(directory, 'consumer.ts'), /Unsupported dynamic use/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('preserves public enum re-exports', async () => {
  const directory = await createFixture({
    'DirectDataAttributes.ts': `export enum DirectDataAttributes { open = 'data-open' }`,
    'alias.ts': `
      export { DirectDataAttributes as AliasDataAttributes } from './DirectDataAttributes';
    `,
  });

  try {
    const output = await transform(directory, 'alias.ts');
    assert.match(output, /export \{ DirectDataAttributes as AliasDataAttributes \}/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('inlines members imported through a re-export alias', async () => {
  const directory = await createFixture({
    'DirectDataAttributes.ts': `export enum DirectDataAttributes { open = 'data-open' }`,
    'alias.ts': `
      export { DirectDataAttributes as CommonDataAttributes } from './DirectDataAttributes';
    `,
    'consumer.ts': `
      import { CommonDataAttributes } from './alias';
      export const props = { [CommonDataAttributes.open]: '' };
    `,
  });

  try {
    const output = await transform(directory, 'consumer.ts');
    assert.match(output, /"data-open"/);
    assert.doesNotMatch(output, /CommonDataAttributes|import/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
