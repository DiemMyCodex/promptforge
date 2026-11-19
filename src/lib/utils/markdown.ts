/**
 * Tiny Markdown renderer built around one security rule: escape every HTML
 * metacharacter before generating markup. Raw HTML from the document can never
 * reach {@html}, and link targets are restricted to safe schemes.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHref(raw: string): string {
  const target = raw.trim();
  return /^(https?:\/\/|mailto:|#|\/|\.\/|\.\.\/)/i.test(target) ? target : '#';
}

function inline(text: string): string {
  const escaped = escapeHtml(text);
  const codeSpans: string[] = [];

  let html = escaped.replace(/`([^`]+)`/g, (_match, code: string) => {
    const token = `\u0000${codeSpans.length}\u0000`;
    codeSpans.push(`<code>${code}</code>`);
    return token;
  });

  html = html.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_match, label: string, url: string) =>
      `<a href="${safeHref(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`
  );
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  return html.replace(/\u0000(\d+)\u0000/g, (_match, index: string) => codeSpans[Number(index)] ?? '');
}

function splitTableRow(row: string): string[] {
  return row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const html: string[] = [];
  let paragraph: string[] = [];
  let index = 0;

  const flushParagraph = (): void => {
    if (paragraph.length === 0) return;
    html.push(`<p>${inline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  while (index < lines.length) {
    const line = lines[index];

    if (line.trim() === '') {
      flushParagraph();
      index += 1;
      continue;
    }

    const fence = /^\s*(```|~~~)\s*([\w+-]*)\s*$/.exec(line);
    if (fence) {
      flushParagraph();
      const marker = fence[1];
      const language = fence[2];
      const buffer: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith(marker)) {
        buffer.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      const languageClass = language ? ` class="language-${escapeHtml(language)}"` : '';
      html.push(`<pre><code${languageClass}>${escapeHtml(buffer.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph();
      html.push('<hr />');
      index += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      flushParagraph();
      const buffer: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        buffer.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      html.push(`<blockquote>${renderMarkdown(buffer.join('\n'))}</blockquote>`);
      continue;
    }

    const unordered = /^\s*[-*+]\s+(.*)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (unordered || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      const pattern = isOrdered ? /^\s*\d+[.)]\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;
      const items: string[] = [];

      while (index < lines.length) {
        const match = pattern.exec(lines[index]);
        if (!match) break;

        let content = match[1];
        const task = /^\[([ xX])\]\s+(.*)$/.exec(content);
        if (task) {
          const checked = task[1].toLowerCase() === 'x' ? ' checked' : '';
          content = `<input type="checkbox" disabled${checked} aria-hidden="true" /> ${inline(task[2])}`;
        } else {
          content = inline(content);
        }

        items.push(`<li>${content}</li>`);
        index += 1;
      }

      html.push(isOrdered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
      continue;
    }

    const nextLine = lines[index + 1] ?? '';
    if (line.includes('|') && nextLine.includes('-') && /^\s*\|?[\s:|-]+\|?\s*$/.test(nextLine)) {
      flushParagraph();
      const headers = splitTableRow(line).map((cell) => `<th>${inline(cell)}</th>`).join('');
      index += 2;
      const rows: string[] = [];

      while (index < lines.length && lines[index].includes('|') && lines[index].trim() !== '') {
        rows.push(`<tr>${splitTableRow(lines[index]).map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`);
        index += 1;
      }

      html.push(`<table><thead><tr>${headers}</tr></thead><tbody>${rows.join('')}</tbody></table>`);
      continue;
    }

    paragraph.push(line.trim());
    index += 1;
  }

  flushParagraph();
  return html.join('\n');
}
