/**
 * Turns bare upstream references in the research markdown into clickable links:
 *   #1234            → [#1234](https://github.com/mui/base-ui/issues/1234)
 *   mui/base-ui#1234 → [mui/base-ui#1234](https://github.com/mui/base-ui/issues/1234)
 * GitHub redirects /issues/N to /pull/N automatically, so one URL form covers both.
 *
 * Fenced code blocks and inline code spans are left untouched, as are refs that
 * are already inside a markdown link (preceded by `[` or part of a URL).
 */
export function linkifyIssues(markdown: string): string {
  // Split on fenced code blocks and inline code spans; transform only the prose parts.
  const parts = markdown.split(/(```[\s\S]*?```|`[^`\n]*`)/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) {
        return part; // code — untouched
      }
      return (
        part
          // Repo-qualified form first so the bare-form pass doesn't split it.
          .replace(
            /(?<![[\w/`])mui\/base-ui#(\d{2,5})\b/g,
            '[mui/base-ui#$1](https://github.com/mui/base-ui/issues/$1)',
          )
          // Bare #NNNN — not preceded by `[` (already a link), word chars, `/` or `&` (URLs,
          // entities), and not followed by more digits (avoids splitting longer numbers).
          .replace(
            /(?<![[\w/&`])#(\d{2,5})\b(?!\d|\]\()/g,
            '[#$1](https://github.com/mui/base-ui/issues/$1)',
          )
      );
    })
    .join('');
}
