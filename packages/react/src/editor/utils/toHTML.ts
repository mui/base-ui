import type { EditorState } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import type { SerializerRegistry, SerializerRuleSets } from './SerializerRegistry';

export interface ToHTMLOptions {
  registry?: SerializerRegistry;
  overrides?: Partial<SerializerRuleSets>;
}

// MVP: delegate to Lexical's HTML generator for core nodes.
// Future: integrate registry rules for custom nodes/marks by mapping them into Lexical's export pipeline or post-processing.
export function toHTML(editorState: EditorState, options?: ToHTMLOptions): string {
  // @ts-ignore
  const html = editorState.read(() => {
    // @ts-ignore
    return $generateHtmlFromNodes(null);
  });

  // If user provided overrides/registry, allow a simple post-process hook for now.
  // This is a placeholder for a richer integration where custom node serializers are respected.
  if (options?.overrides || options?.registry) {
    // No-op in MVP; reserved for future mapping.
    return html;
  }

  return html;
}
