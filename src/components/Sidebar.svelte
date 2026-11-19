<script lang="ts">
  import BookOpen from '@lucide/svelte/icons/book-open';
  import Braces from '@lucide/svelte/icons/braces';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import FileText from '@lucide/svelte/icons/file-text';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Star from '@lucide/svelte/icons/star';
  import Terminal from '@lucide/svelte/icons/terminal';
  import Trash from '@lucide/svelte/icons/trash';
  import X from '@lucide/svelte/icons/x';
  import { workspace } from '../lib/stores/workspace.svelte';
  import { TEMPLATES } from '../lib/templates';
  import type { PromptKind, TemplatePreset } from '../lib/types';

  interface Props {
    onNavigate?: () => void;
  }

  let { onNavigate }: Props = $props();

  let searchInput = $state(workspace.query);
  let menuOpen = $state(false);
  let menuRoot = $state<HTMLDivElement | null>(null);

  const KIND_LABEL: Record<PromptKind, string> = {
    skill: 'skill',
    agents: 'agents',
    master: 'master',
    provider: 'config',
    snippet: 'note'
  };

  const KIND_CLASS: Record<PromptKind, string> = {
    skill: 'bg-accent-soft text-accent-2',
    agents: 'bg-good/12 text-good',
    master: 'bg-warn/12 text-warn',
    provider: 'bg-accent/12 text-accent',
    snippet: 'bg-raised text-muted'
  };

  $effect(() => {
    const timer = setTimeout(() => workspace.setQuery(searchInput), 120);
    return () => clearTimeout(timer);
  });

  $effect(() => {
    if (workspace.query === '' && searchInput !== '') searchInput = '';
  });

  $effect(() => {
    if (!menuOpen) return;

    const closeOnOutside = (event: PointerEvent): void => {
      if (menuRoot && !menuRoot.contains(event.target as Node)) menuOpen = false;
    };
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') menuOpen = false;
    };

    window.addEventListener('pointerdown', closeOnOutside);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('pointerdown', closeOnOutside);
      window.removeEventListener('keydown', closeOnEscape);
    };
  });

  function relativeTime(timestamp: number): string {
    const minutes = Math.floor((Date.now() - timestamp) / 60_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  function chooseTemplate(template: TemplatePreset): void {
    workspace.createFromTemplate(template);
    menuOpen = false;
    onNavigate?.();
  }

  function selectItem(id: string): void {
    workspace.select(id);
    onNavigate?.();
  }

  function removeItem(id: string, title: string): void {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) workspace.deleteItem(id);
  }
</script>

{#snippet kindBadge(kind: PromptKind)}
  <span
    class={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${KIND_CLASS[kind]}`}
  >
    {KIND_LABEL[kind]}
  </span>
{/snippet}

{#snippet templateIcon(id: string)}
  {#if id === 'skill'}
    <Braces size={15} />
  {:else if id === 'agents'}
    <Terminal size={15} />
  {:else if id === 'master'}
    <Sparkles size={15} />
  {:else}
    <FileText size={15} />
  {/if}
{/snippet}

<div class="flex h-full min-h-0 flex-col bg-surface">
  <div class="shrink-0 border-b border-line p-3">
    <div class="relative">
      <Search size={15} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
      <input
        bind:value={searchInput}
        type="search"
        placeholder="Search prompts, tags, text…"
        aria-label="Search saved prompts"
        class="h-11 w-full rounded-lg border border-line bg-canvas pl-9 pr-10 text-[13px] text-ink outline-none transition-colors placeholder:text-faint hover:border-muted/50 focus:border-accent"
      />
      {#if searchInput}
        <button
          type="button"
          class="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-faint transition-colors hover:text-ink"
          aria-label="Clear search"
          onclick={() => (searchInput = '')}
        >
          <X size={14} />
        </button>
      {/if}
    </div>

    <div class="relative mt-2.5" bind:this={menuRoot}>
      <button
        type="button"
        class="flex h-11 w-full items-center gap-2 rounded-lg border border-accent/35 bg-accent-soft/60 px-3 text-[13px] font-semibold text-accent transition-colors hover:border-accent"
        aria-expanded={menuOpen}
        onclick={() => (menuOpen = !menuOpen)}
      >
        <Plus size={16} />
        New from template
        <ChevronDown size={14} class={`ml-auto transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
      </button>

      {#if menuOpen}
        <div
          class="pf-enter absolute inset-x-0 top-[calc(100%+0.4rem)] z-30 overflow-hidden rounded-xl border border-line bg-panel p-1.5 shadow-2xl shadow-black/30"
          role="menu"
          aria-label="Starter templates"
        >
          {#each TEMPLATES as template (template.id)}
            <button
              type="button"
              role="menuitem"
              class="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-raised"
              onclick={() => chooseTemplate(template)}
            >
              <span class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-raised text-accent">
                {@render templateIcon(template.id)}
              </span>
              <span class="min-w-0">
                <span class="block text-[12px] font-semibold text-ink">{template.label}</span>
                <span class="block text-[11px] leading-snug text-faint">{template.summary}</span>
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <div class="pf-scroll flex shrink-0 gap-1.5 overflow-x-auto border-b border-line px-3 py-2.5">
    <button
      type="button"
      aria-pressed={workspace.activeTag === null}
      class={`flex h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium transition-colors ${workspace.activeTag === null ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:text-ink'}`}
      onclick={() => workspace.setTag(null)}
    >
      All <span class="tabular opacity-70">{workspace.items.length}</span>
    </button>
    {#each workspace.tags as tag (tag)}
      <button
        type="button"
        aria-pressed={workspace.activeTag === tag}
        class={`h-8 shrink-0 rounded-full border px-2.5 text-[11px] font-medium transition-colors ${workspace.activeTag === tag ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:text-ink'}`}
        onclick={() => workspace.setTag(workspace.activeTag === tag ? null : tag)}
      >
        #{tag}
      </button>
    {/each}
  </div>

  <div class="pf-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
    {#if workspace.filtered.length === 0}
      <div class="flex h-full flex-col items-center justify-center px-4 text-center">
        <div class="grid size-11 place-items-center rounded-xl border border-line bg-panel text-faint">
          <FolderOpen size={19} />
        </div>
        <p class="mt-3 text-[13px] font-semibold">Nothing here yet</p>
        <p class="mt-1 text-[11px] leading-relaxed text-faint">
          Try another search, or start a new prompt from a template.
        </p>
        <button
          type="button"
          class="mt-3 rounded-lg border border-line px-3 py-2 text-[11px] font-medium text-accent hover:border-accent"
          onclick={() => {
            workspace.createFromTemplate(TEMPLATES[0]);
            onNavigate?.();
          }}
        >
          Create one
        </button>
      </div>
    {:else}
      <ul class="space-y-1">
        {#each workspace.filtered as item (item.id)}
          <li
            class={`group rounded-lg border px-1.5 py-2 transition-colors ${item.id === workspace.selectedId ? 'border-accent/40 bg-accent-soft/60' : 'border-transparent hover:border-line hover:bg-panel'}`}
          >
            <div class="flex items-start gap-1">
              <button
                type="button"
                class="min-w-0 flex-1 py-0.5 text-left"
                aria-current={item.id === workspace.selectedId ? 'true' : undefined}
                onclick={() => selectItem(item.id)}
              >
                <span class="flex items-center gap-1.5">
                  {@render kindBadge(item.kind)}
                  {#if item.favorite}
                    <Star size={11} class="fill-warn text-warn" />
                  {/if}
                </span>
                <span class="mt-1 block truncate text-[13px] font-medium text-ink">{item.title}</span>
                <span class="mt-0.5 block truncate text-[11px] text-faint">
                  {relativeTime(item.updatedAt)} · {item.tags.length
                    ? item.tags.map((tag) => `#${tag}`).join(' ')
                    : 'no tags'}
                </span>
              </button>

              <div
                class="flex shrink-0 items-center opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
              >
                <button
                  type="button"
                  class="grid size-11 place-items-center rounded-md text-faint transition-colors hover:bg-raised hover:text-warn"
                  aria-label={item.favorite ? `Unfavorite ${item.title}` : `Favorite ${item.title}`}
                  onclick={() => workspace.updateItem(item.id, { favorite: !item.favorite })}
                >
                  <Star size={14} class={item.favorite ? 'fill-warn text-warn' : ''} />
                </button>
                <button
                  type="button"
                  class="grid size-11 place-items-center rounded-md text-faint transition-colors hover:bg-raised hover:text-bad"
                  aria-label={`Delete ${item.title}`}
                  onclick={() => removeItem(item.id, item.title)}
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <div
    class="flex shrink-0 items-center gap-2 border-t border-line px-3 py-2 text-[10px] text-faint"
  >
    <BookOpen size={12} />
    <span>Local-first · saved in this browser</span>
    <span class="tabular ml-auto">{workspace.items.length} items</span>
  </div>
</div>
