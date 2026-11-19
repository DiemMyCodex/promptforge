import type { PromptItem } from '../types';

/** Downloads the raw Markdown document with a filesystem-safe filename. */
export function exportMarkdown(item: PromptItem): void {
  const slug =
    item.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'prompt';

  const blob = new Blob([item.content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${slug}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
