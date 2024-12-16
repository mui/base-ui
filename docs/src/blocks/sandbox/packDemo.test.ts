import { describe, it } from 'vitest';
import { expect } from 'chai';
import { DemoFile } from 'docs/src/blocks/Demo';
import { packDemo } from './packDemo';

describe('packDemo', () => {
  it('transforms the files into an object an extracts dependencies', () => {
    const files: DemoFile[] = [
      {
        name: 'file.js',
        content: "import * as React from 'react';",
        path: 'data/Test/file.js',
        type: 'js',
      },
    ];

    const result = packDemo(files);
    expect(result.processedFiles['App.js']).to.equal(files[0].content);

    expect(result.externalImports.length).to.equal(1);
    expect(result.externalImports[0]).to.equal('react');
  });

  it('flattens relative imports', () => {
    const files: DemoFile[] = [
      {
        name: 'file1.js',
        content: "import file2 from './deps/file2';",
        path: 'data/Test/file1.js',
        type: 'js',
      },
      {
        name: 'file2.js',
        content: "export default 'file2';",
        path: 'data/Test/deps/file2.js',
        type: 'js',
      },
    ];

    const result = packDemo(files);
    expect(result.processedFiles['App.js']).to.equal("import file2 from './file2';");
    expect(result.processedFiles['file2.js']).to.equal(files[1].content);
    expect(result.externalImports.length).to.equal(0);
  });

  it('flattens relative imports from parent directories', () => {
    const files: DemoFile[] = [
      {
        name: 'file1.js',
        content: "import file2 from '../file2';",
        path: 'data/Test/file1.js',
        type: 'js',
      },
      {
        name: 'file2.js',
        content: "export default 'file2';",
        path: 'data/file2.js',
        type: 'js',
      },
    ];

    const result = packDemo(files);
    expect(result.processedFiles['App.js']).to.equal("import file2 from './file2';");
    expect(result.processedFiles['file2.js']).to.equal(files[1].content);
    expect(result.externalImports.length).to.equal(0);
  });
});
