// TODO: use abstractCreateSitemap once it's available in internal-docs-infra

export function createSitemap(
  sourceUrl: string,
  pages: Record<string, React.ComponentType<any> | null>,
  options?: { precompute: { schema: {}; data: {} } },
) {
  return options?.precompute;
}
