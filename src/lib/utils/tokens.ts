import type { FrontmatterReport, FrontmatterValue, SkillFrontmatter, TextMetrics } from '../types';

const FRONTMATTER_DELIMITER = /^---\s*$/;
const KEY_PATTERN = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/;
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Counts characters, words, lines, UTF-8 bytes and an ~4 chars/token estimate. */
export function countMetrics(text: string): TextMetrics {
  const normalized = text.replace(/\r\n?/g, '\n');
  const chars = [...normalized].length;
  const trimmed = normalized.trim();
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  const lines = normalized.length === 0 ? 0 : normalized.split('\n').length;
  const bytes = new TextEncoder().encode(normalized).length;

  return {
    chars,
    words,
    lines,
    bytes,
    tokens: chars === 0 ? 0 : Math.ceil(chars / 4)
  };
}

export function estimateTokens(text: string): number {
  return countMetrics(text).tokens;
}

/** Converts one flat YAML scalar into a strict, predictable value. */
function parseScalar(raw: string): FrontmatterValue {
  const value = raw.trim();

  if (value === '') return '';
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).replace(/\\(["'\\])/g, '$1');
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);

  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  return value.replace(/\s+#.*$/, '');
}

/**
 * Splits leading YAML frontmatter from the Markdown body and validates the
 * small subset of frontmatter fields used by agent skill files.
 */
export function parseFrontmatter(source: string): FrontmatterReport {
  const normalized = source.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');

  if (!FRONTMATTER_DELIMITER.test(lines[0] ?? '')) {
    return { present: false, valid: true, errors: [], data: null, body: normalized };
  }

  const closeIndex = lines.findIndex((line, index) => index > 0 && FRONTMATTER_DELIMITER.test(line));

  if (closeIndex === -1) {
    return {
      present: true,
      valid: false,
      errors: ['Frontmatter block is missing its closing --- delimiter.'],
      data: null,
      body: normalized
    };
  }

  const errors: string[] = [];
  const data: Record<string, FrontmatterValue> = {};
  const seen = new Set<string>();

  lines.slice(1, closeIndex).forEach((line, index) => {
    const lineNumber = index + 2;

    if (line.trim() === '') return;
    if (/^\s/.test(line)) {
      errors.push(`Line ${lineNumber}: nested YAML is not supported in this flat previewer.`);
      return;
    }

    const match = KEY_PATTERN.exec(line);
    if (!match) {
      errors.push(`Line ${lineNumber}: expected "key: value".`);
      return;
    }

    const key = match[1];
    if (seen.has(key)) errors.push(`Line ${lineNumber}: duplicate key "${key}".`);
    seen.add(key);
    data[key] = parseScalar(match[2]);
  });

  const name = data.name;
  if (typeof name !== 'string' || name.trim() === '') {
    errors.push('Missing required field: name.');
  } else if (!KEBAB_CASE.test(name)) {
    errors.push('Field "name" must be lowercase kebab-case.');
  } else if (name.length > 64) {
    errors.push('Field "name" must be 64 characters or fewer.');
  }

  const description = data.description;
  if (typeof description !== 'string' || description.trim() === '') {
    errors.push('Missing required field: description.');
  } else if (description.length > 1024) {
    errors.push('Field "description" must be 1024 characters or fewer.');
  }

  const optionalStrings: Array<keyof SkillFrontmatter> = ['allowedTools', 'argumentHint', 'model'];
  for (const key of optionalStrings) {
    const value = data[key];
    if (value !== undefined && typeof value !== 'string') {
      errors.push(`Field "${key}" must be a string.`);
    }
  }

  if (data.disable !== undefined && typeof data.disable !== 'boolean') {
    errors.push('Field "disable" must be true or false.');
  }

  const body = lines.slice(closeIndex + 1).join('\n').replace(/^\n/, '');

  return {
    present: true,
    valid: errors.length === 0,
    errors,
    data: data as Partial<SkillFrontmatter>,
    body
  };
}
