export type PromptKind = 'skill' | 'agents' | 'master' | 'provider' | 'snippet';

export interface PromptItem {
  id: string;
  title: string;
  kind: PromptKind;
  content: string;
  tags: string[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  /** Hash of the bundled content when this doc was seeded from SKILL_LIBRARY. */
  sourceHash?: string;
}

export interface FrontmatterMap {
  [key: string]: FrontmatterValue | undefined;
}

export type FrontmatterValue = string | number | boolean | string[] | FrontmatterMap;

export interface SkillFrontmatter {
  name: string;
  description: string;
  allowedTools?: string;
  argumentHint?: string;
  model?: string;
  disable?: boolean;
  [key: string]: FrontmatterValue | undefined;
}

export interface TemplatePreset {
  id: string;
  label: string;
  summary: string;
  kind: PromptKind;
  tags: string[];
  content: string;
}

/** One static section of the bundled REA documentation page. */
export interface ReaDocSection {
  id: string;
  label: string;
  path: string;
  content: string;
}

export interface FrontmatterReport {
  present: boolean;
  valid: boolean;
  errors: string[];
  data: Partial<SkillFrontmatter> | null;
  body: string;
}

export interface TextMetrics {
  chars: number;
  words: number;
  lines: number;
  tokens: number;
  bytes: number;
}

export type ThemeMode = 'dark' | 'light';
export type EditorTab = 'editor' | 'preview';
