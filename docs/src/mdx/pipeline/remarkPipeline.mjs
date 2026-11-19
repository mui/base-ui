import { remarkPlugins as blog } from './blog.mjs';
import { remarkPlugins as docs } from './docs.mjs';
import { routePipeline } from './routePipeline.mjs';

export default function remarkPipeline({ baseDir }) {
  return routePipeline(this, { blog, docs }, baseDir);
}
