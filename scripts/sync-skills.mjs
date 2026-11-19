#!/usr/bin/env node
/**
 * Regenerates src/lib/skill-library.ts from the opencode-skills collection.
 *
 *   node scripts/sync-skills.mjs [--src <dir>]
 *
 * Source defaults to ../opencode-skills (sibling of this repo) and can be
 * overridden with SKILLS_SRC. The output is deterministic: same sources in,
 * byte-identical file out.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/lib/skill-library.ts');

const argv = process.argv.slice(2);
const flagIndex = argv.indexOf('--src');
const SRC = path.resolve(
  flagIndex >= 0 && argv[flagIndex + 1]
    ? argv[flagIndex + 1]
    : process.env.SKILLS_SRC || path.join(ROOT, '..', 'opencode-skills')
);

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

function parseFrontmatter(raw, dir) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error(`${dir}: missing frontmatter block`);

  const meta = {};
  for (const line of match[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const unquote = (v) => (v ?? '').replace(/^"(.*)"$/, '$1');
  const name = unquote(meta.name);
  const description = unquote(meta.description);
  if (!name) throw new Error(`${dir}: frontmatter is missing "name"`);
  if (!description) throw new Error(`${dir}: frontmatter is missing "description"`);
  if (name !== dir) throw new Error(`${dir}: frontmatter name "${name}" does not match folder`);
  return { name, description };
}

if (!fs.existsSync(SRC)) {
  console.error(`Source directory not found: ${SRC}`);
  process.exit(1);
}

const skills = fs
  .readdirSync(SRC, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.'))
  .map((entry) => entry.name)
  .sort()
  .map((dir) => {
    const file = path.join(SRC, dir, 'SKILL.md');
    if (!fs.existsSync(file)) throw new Error(`${dir}: SKILL.md not found`);
    const content = fs.readFileSync(file, 'utf8');
    const { name, description } = parseFrontmatter(content, dir);
    if (EMOJI.test(description) || EMOJI.test(content)) {
      throw new Error(`${dir}: emoji found — UI and skill copy must stay emoji-free`);
    }
    return { dir, name, description, content };
  });

if (skills.length === 0) {
  console.error(`No skills found in ${SRC}`);
  process.exit(1);
}

const entries = skills
  .map(
    (skill) => `  {
    id: ${JSON.stringify(`lib-${skill.name}`)},
    label: ${JSON.stringify(skill.name)},
    summary: ${JSON.stringify(skill.description)},
    kind: "skill",
    tags: ['skill', 'library'],
    content: ${JSON.stringify(skill.content)},
  }`
  )
  .join(',\n');

const output = `import type { TemplatePreset } from './types';

/**
 * Bundled skill library generated from the opencode-skills collection.
 * ${skills.length} skills, embedded as literals — no runtime fetch, works offline.
 *
 * Generated file: edit the source SKILL.md files and run \`node scripts/sync-skills.mjs\`.
 */
export const SKILL_LIBRARY: TemplatePreset[] = [
${entries},
];
`;

fs.writeFileSync(OUT, output);
console.log(`Synced ${skills.length} skills from ${SRC}`);
console.log(`Wrote ${path.relative(ROOT, OUT)} (${(output.length / 1024).toFixed(1)} kB)`);
