import remarkHeadingTags from '../remarkHeadingTags.mjs';
import { routePipeline } from './routePipeline.mjs';

export default function remarkPreprocess({ baseDir }) {
  // Strip docs badges before metadata extraction so they stay out of outlines.
  return routePipeline(this, { blog: [], docs: [remarkHeadingTags] }, baseDir);
}
