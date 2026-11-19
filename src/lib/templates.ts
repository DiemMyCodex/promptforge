import type { TemplatePreset } from './types';

export const TEMPLATES: TemplatePreset[] = [
  {
    id: 'skill',
    label: 'SKILL.md',
    summary: 'Agent skill with validated YAML frontmatter',
    kind: 'skill',
    tags: ['agent', 'frontmatter'],
    content: `---
name: release-guardian
description: Audits a diff for regressions, unsafe concurrency and spec drift before a release. Use when asked to review, ship or merge.
allowed-tools: Read, Grep, Glob, Bash(git diff:*)
argument-hint: [scope]
model: inherit
---

# Release Guardian

## Mission
Find the smallest set of changes that make the diff safe to ship.

## Protocol
1. Scope the change with \`git status --short\` and \`git diff --stat\`.
2. Read every changed hunk. Cite evidence as \`file:line\` — never guess.
3. Check correctness against acceptance criteria, concurrency hazards, UI regressions at 375px and 1440px, and unsafe input handling.
4. Report a table: Severity | File:line | Finding | Fix.

## Hard invariants
- P0 findings block the release. Say so explicitly.
- Never invent behavior that is not in the spec.
- End with one verdict: ship / ship after fixes / do not ship.
`
  },
  {
    id: 'agents',
    label: 'AGENTS.md',
    summary: 'Repository rules for coding agents',
    kind: 'agents',
    tags: ['repo', 'rules'],
    content: `# Repository Rules

## Stack
- Svelte 5 with runes for every reactive value and every event handler.
- Tailwind CSS v4, CSS-first: one \`@import "tailwindcss"\` and \`@theme\` tokens in \`src/app.css\`. No legacy config file.
- TypeScript in strict mode. Types at boundaries, no broad \`any\`.

## Hard invariants
- Legacy component syntax is banned: no exported component variables, no dollar-label reactive statements, no colon-prefixed event attributes, no dispatcher-built events, no legacy slot elements.
- No backend, no database, no embedded credentials. User data lives in browser storage.
- Every generated file stays inside the workspace folder for this project.

## Workflow
1. Read before writing. Treat unfamiliar files as user work.
2. Keep changes small and consistent with surrounding code.
3. Verify: type check, production build, and a grep for banned syntax.
4. Report what changed, what was verified, and any remaining risk.
`
  },
  {
    id: 'master',
    label: 'Master Prompt',
    summary: 'Dense, zero-ambiguity build brief',
    kind: 'master',
    tags: ['planning', 'spec'],
    content: `# Master Prompt · Build Brief

## Role
You are a principal engineer shipping a small, complete slice of software.

## Inputs
- Goal: <one measurable sentence>
- Constraints: <stack, budget, deadlines>
- Non-goals: <what stays out of scope>

## Execution loop
1. Restate acceptance criteria in your own words.
2. List assumptions. If one is load-bearing, ask before coding.
3. Decompose into ordered steps with disjoint file ownership.
4. Implement the smallest vertical slice that satisfies every criterion.
5. Verify with a type check, a production build and a behavior probe.

## Output contract
- Changed files with one-line rationale each.
- Verification results, including exact commands.
- Known limitations — honest, never hidden.

## Hard invariants
- No scope drift. No silent feature additions.
- No fabricated test results or API keys.
- If blocked, state the blocker and the smallest unblocking question.
`
  },
  {
    id: 'provider',
    label: 'Custom Provider',
    summary: 'OpenCode compatible endpoint snippet',
    kind: 'provider',
    tags: ['opencode', 'config'],
    content: `# OpenCode Custom Provider

Add this block to \`opencode.jsonc\` to point OpenCode at a local OpenAI-compatible gateway.

~~~jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "local-router": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Local Router",
      "options": {
        "baseURL": "http://127.0.0.1:8317/v1",
        "apiKey": "{env:LOCAL_ROUTER_KEY}"
      },
      "models": {
        "coder-latest": { "name": "Coder Latest" }
      }
    }
  }
}
~~~

## Security
- Keep the key in an environment variable. Never commit a literal value.
- Bind local gateways to \`127.0.0.1\`, not \`0.0.0.0\`.
- Verify the model id with the gateway's \`/v1/models\` endpoint.
`
  }
];

export function getTemplate(id: string): TemplatePreset | undefined {
  return TEMPLATES.find((template) => template.id === id);
}
