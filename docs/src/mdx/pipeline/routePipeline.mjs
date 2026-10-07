import path from 'node:path';
import { unified } from 'unified';

export function routePipeline(parent, plugins, baseDir) {
  const blogDirectory = path.join(baseDir, 'src/app/(website)/blog');
  const blog = unified().data(parent.data()).use(plugins.blog).freeze();
  const docs = unified().data(parent.data()).use(plugins.docs).freeze();

  return (tree, file, done) => {
    const relativePath = file.path && path.relative(blogDirectory, file.path);
    const isBlog =
      relativePath &&
      relativePath !== '..' &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath);

    // Non-blog MDX (including website and private pages) retains the docs pipeline.
    const processor = isBlog ? blog : docs;
    processor.run(tree, file, done);
  };
}
