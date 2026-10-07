import { rehypePlugins as blog } from './blog.mjs';
import { rehypePlugins as docs } from './docs.mjs';
import { routePipeline } from './routePipeline.mjs';

export default function rehypePipeline({ baseDir }) {
  return routePipeline(this, { blog, docs }, baseDir);
}
