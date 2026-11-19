import { SKILL_LIBRARY } from '../skill-library';
import { TEMPLATES } from '../templates';
import type { EditorTab, PromptItem, PromptKind, TemplatePreset, ThemeMode } from '../types';
import { hashText } from '../utils/hash';

const STORAGE_KEY = 'promptforge.workspace.v1';
const THEME_KEY = 'promptforge.theme.v1';
const KINDS: PromptKind[] = ['skill', 'agents', 'master', 'provider', 'snippet'];
const LIBRARY_REVISION = hashText(
  SKILL_LIBRARY.map((skill) => `${skill.id}:${skill.content}`).join('\n')
);

interface PersistedWorkspace {
  version: 1;
  items: PromptItem[];
  selectedId: string | null;
  librarySeeded?: boolean;
  libraryRevision?: string;
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function readStorage<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private mode or full. The app stays usable.
  }
}

function isPromptItem(value: unknown): value is PromptItem {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PromptItem>;
  return typeof candidate.id === 'string' && typeof candidate.content === 'string';
}

function normalizeItem(value: PromptItem): PromptItem {
  const now = Date.now();
  return {
    id: value.id,
    title: typeof value.title === 'string' && value.title.trim() ? value.title : 'Untitled prompt',
    kind: KINDS.includes(value.kind) ? value.kind : 'snippet',
    content: value.content,
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    favorite: value.favorite === true,
    createdAt: Number.isFinite(value.createdAt) ? value.createdAt : now,
    updatedAt: Number.isFinite(value.updatedAt) ? value.updatedAt : now,
    ...(typeof value.sourceHash === 'string' ? { sourceHash: value.sourceHash } : {})
  };
}

function makeItem(
  partial: Pick<PromptItem, 'title' | 'kind' | 'content' | 'tags'> & {
    id?: string;
    sourceHash?: string;
  }
): PromptItem {
  const now = Date.now();
  const { id, ...rest } = partial;
  return {
    id: id ?? createId(),
    favorite: false,
    createdAt: now,
    updatedAt: now,
    ...rest
  };
}

function isBundledDoc(item: PromptItem, skill: TemplatePreset): boolean {
  if (typeof item.sourceHash === 'string') {
    return item.sourceHash === hashText(item.content);
  }
  // Legacy docs seeded before sourceHash existed: match the bundle signature.
  return (
    item.title === skill.label &&
    item.tags.includes('library') &&
    item.content.includes(`\nname: ${skill.label}\n`)
  );
}

class WorkspaceStore {
  items = $state<PromptItem[]>([]);
  query = $state('');
  activeTag = $state<string | null>(null);
  selectedId = $state<string | null>(null);
  theme = $state<ThemeMode>('dark');
  editorTab = $state<EditorTab>('editor');
  hydrated = $state(false);
  private librarySeeded = false;

  active = $derived(this.items.find((item) => item.id === this.selectedId) ?? null);

  tags = $derived.by(() => {
    const unique = new Set<string>();
    for (const item of this.items) {
      for (const tag of item.tags) unique.add(tag);
    }
    return [...unique].sort((a, b) => a.localeCompare(b));
  });

  filtered = $derived.by(() => {
    const query = this.query.trim().toLowerCase();

    return this.items
      .filter((item) => {
        if (this.activeTag !== null && !item.tags.includes(this.activeTag)) return false;
        if (query === '') return true;
        return (
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query) ||
          item.kind.includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      })
      .slice()
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt);
  });

  constructor() {
    const persisted = readStorage<PersistedWorkspace>(STORAGE_KEY);

    if (persisted && Array.isArray(persisted.items)) {
      this.items = persisted.items.filter(isPromptItem).map(normalizeItem);
      this.selectedId =
        persisted.selectedId && this.items.some((item) => item.id === persisted.selectedId)
          ? persisted.selectedId
          : (this.items[0]?.id ?? null);

      this.dedupeSkillDocs();
      this.librarySeeded = persisted.librarySeeded === true;
      // Idempotent: re-adds any bundled skill doc removed from local storage.
      this.ensureLibrary();
      if (persisted.libraryRevision !== LIBRARY_REVISION) {
        this.refreshLibrary();
        this.persist();
      }
    } else {
      this.seed();
      this.ensureLibrary();
    }

    const storedTheme = readStorage<ThemeMode>(THEME_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      this.theme = storedTheme;
    } else if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches) {
      this.theme = 'light';
    }

    this.applyTheme();
    this.hydrated = true;
  }

  private seed(): void {
    const seeds = TEMPLATES.slice(0, 2).map((template) =>
      makeItem({
        title: template.label,
        kind: template.kind,
        content: template.content,
        tags: template.tags
      })
    );
    this.items = seeds;
    this.selectedId = seeds[0]?.id ?? null;
    this.persist();
  }

  private persist(): void {
    const snapshot: PersistedWorkspace = {
      version: 1,
      items: this.items,
      selectedId: this.selectedId,
      librarySeeded: this.librarySeeded,
      libraryRevision: LIBRARY_REVISION
    };
    writeStorage(STORAGE_KEY, snapshot);
  }

  /**
   * Merges every bundled skill that is missing from the workspace. Skill ids are
   * stable (`lib-<name>`), so this is idempotent and never duplicates a skill.
   */
  ensureLibrary(): number {
    const existing = new Set(this.items.map((item) => item.id));
    const missing = SKILL_LIBRARY.filter((skill) => !existing.has(skill.id));

    if (missing.length === 0) {
      this.librarySeeded = true;
      this.persist();
      return 0;
    }

    const added = missing.map((skill) =>
      makeItem({
        id: skill.id,
        title: skill.label,
        kind: skill.kind,
        content: skill.content,
        tags: [...skill.tags],
        sourceHash: hashText(skill.content)
      })
    );

    this.items = [...added, ...this.items];
    if (this.selectedId === null) this.selectedId = this.items[0]?.id ?? null;
    this.librarySeeded = true;
    this.persist();
    return added.length;
  }

  /** Collapses duplicate SKILL.md docs, keeping the newest edit and merging tags/favorite. */
  private dedupeSkillDocs(): number {
    const matches = this.items.filter((item) => item.title === 'SKILL.md');
    if (matches.length < 2) return 0;

    const sorted = [...matches].sort(
      (a, b) => b.updatedAt - a.updatedAt || b.content.length - a.content.length
    );
    const keeper = sorted[0];
    const dropIds = new Set(sorted.slice(1).map((item) => item.id));
    const merged: PromptItem = {
      ...keeper,
      favorite: matches.some((item) => item.favorite),
      tags: [...new Set(matches.flatMap((item) => item.tags))]
    };

    this.items = this.items
      .filter((item) => !dropIds.has(item.id))
      .map((item) => (item.id === keeper.id ? merged : item));
    if (this.selectedId !== null && dropIds.has(this.selectedId)) this.selectedId = keeper.id;
    return dropIds.size;
  }

  /** Updates bundled docs when the bundle changes, but never overwrites user edits. */
  private refreshLibrary(): number {
    const skillById = new Map(SKILL_LIBRARY.map((skill) => [skill.id, skill]));
    let refreshed = 0;

    this.items = this.items.map((item) => {
      const skill = skillById.get(item.id);
      if (!skill || !isBundledDoc(item, skill) || item.content === skill.content) return item;
      refreshed += 1;
      return {
        ...item,
        title: skill.label,
        kind: skill.kind,
        content: skill.content,
        tags: [...skill.tags],
        sourceHash: hashText(skill.content),
        updatedAt: Date.now()
      };
    });

    return refreshed;
  }

  /** Opens a library skill as a document, reusing the existing one when present. */
  openLibrarySkill(template: TemplatePreset): void {
    const existing = this.items.find((item) => item.id === template.id);
    if (existing) {
      this.select(existing.id);
      return;
    }

    const item = makeItem({
      id: template.id,
      title: template.label,
      kind: template.kind,
      content: template.content,
      tags: [...template.tags],
      sourceHash: hashText(template.content)
    });

    this.items = [item, ...this.items];
    this.selectedId = item.id;
    this.activeTag = null;
    this.query = '';
    this.editorTab = 'editor';
    this.persist();
  }

  applyTheme(): void {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = this.theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', this.theme === 'dark' ? '#08090d' : '#eceef3');
  }

  setTheme(theme: ThemeMode): void {
    if (this.theme === theme) return;
    this.theme = theme;
    writeStorage(THEME_KEY, theme);
    this.applyTheme();
  }

  toggleTheme(): void {
    this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  setEditorTab(tab: EditorTab): void {
    this.editorTab = tab;
  }

  setQuery(query: string): void {
    this.query = query;
  }

  setTag(tag: string | null): void {
    this.activeTag = tag;
  }

  select(id: string): void {
    if (!this.items.some((item) => item.id === id)) return;
    this.selectedId = id;
    this.persist();
  }

  createBlank(): string {
    const item = makeItem({
      title: 'Untitled prompt',
      kind: 'snippet',
      content: '',
      tags: []
    });
    this.items = [item, ...this.items];
    this.selectedId = item.id;
    this.activeTag = null;
    this.query = '';
    this.editorTab = 'editor';
    this.persist();
    return item.id;
  }

  createFromTemplate(template: TemplatePreset): string {
    const item = makeItem({
      title: template.label,
      kind: template.kind,
      content: template.content,
      tags: [...template.tags]
    });
    this.items = [item, ...this.items];
    this.dedupeSkillDocs();
    this.selectedId = item.id;
    this.activeTag = null;
    this.query = '';
    this.editorTab = 'editor';
    this.persist();
    return item.id;
  }

  updateItem(
    id: string,
    patch: Partial<Pick<PromptItem, 'title' | 'content' | 'tags' | 'favorite' | 'kind'>>
  ): void {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return;

    this.items[index] = {
      ...this.items[index],
      ...patch,
      updatedAt: Date.now()
    };
    this.persist();
  }

  duplicateItem(id: string): void {
    const source = this.items.find((item) => item.id === id);
    if (!source) return;

    const copy = makeItem({
      title: `${source.title} copy`,
      kind: source.kind,
      content: source.content,
      tags: [...source.tags]
    });
    this.items = [copy, ...this.items];
    this.selectedId = copy.id;
    this.persist();
  }

}

export const workspace = new WorkspaceStore();
