<script lang="ts">
  import Braces from '@lucide/svelte/icons/braces';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import FileText from '@lucide/svelte/icons/file-text';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
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
  let searchEl = $state<HTMLInputElement | null>(null);
  let menuRoot = $state<HTMLDivElement | null>(null);

  const KIND_CODE: Record<PromptKind, string> = {
    skill: 'SK',
    agents: 'AG',
    master: 'MP',
    provider: 'CF',
    snippet: '··'
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

  function handleShortcut(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable === true;

    if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      searchEl?.focus();
    }
  }

  function relativeTime(timestamp: number): string {
    const minutes = Math.floor((Date.now() - timestamp) / 60_000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
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

<svelte:window onkeydown={handleShortcut} />

{#snippet templateIcon(id: string)}
  {#if id === 'skill'}
    <Braces size={14} />
  {:else if id === 'agents'}
    <Terminal size={14} />
  {:else}
    <FileText size={14} />
  {/if}
{/snippet}

<div class="flex h-full min-h-0 flex-col bg-surface">
  <div class="shrink-0 border-b border-line p-2.5">
    <div class="relative">
      <Search size={14} class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
      <input
        bind:this={searchEl}
        bind:value={searchInput}
        type="search"
        placeholder="Filter documents"
        aria-label="Search saved prompts"
        class="mono h-11 w-full rounded-md border border-line bg-canvas pl-8 pr-10 text-[12px] text-ink outline-none transition-colors placeholder:text-faint hover:border-line-strong focus:border-accent"
      />
      {#if searchInput}
        <button
          type="button"
          class="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-faint transition-colors hover:text-ink"
          aria-label="Clear search"
          onclick={() => (searchInput = '')}
        >
          <X size={13} />
        </button>
      {:else}
        <span class="kbd pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">/</span>
      {/if}
    </div>

    <div class="relative mt-2" bind:this={menuRoot}>
      <button
        type="button"
        class="flex h-11 w-full items-center gap-2 rounded-md bg-accent px-3 text-left text-[12px] font-semibold text-accent-ink transition-colors hover:brightness-95"
        aria-expanded={menuOpen}
        onclick={() => (menuOpen = !menuOpen)}
      >
        <Plus size={15} />
        <span class="mono uppercase tracking-wider">New document</span>
        <ChevronDown size={14} class={`ml-auto transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
      </button>

      {#if menuOpen}
        <div
          class="pf-enter absolute inset-x-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-md border border-line-strong bg-panel p-1"
          role="menu"
          aria-label="Starter templates"
        >
          {#each TEMPLATES as template (template.id)}
            <button
              type="button"
              role="menuitem"
              class="flex w-full items-start gap-2.5 rounded px-2 py-2 text-left transition-colors hover:bg-raised"
              onclick={() => chooseTemplate(template)}
            >
              <span class="mt-0.5 grid size-7 shrink-0 place-items-center rounded border border-line text-accent">
                {@render templateIcon(template.id)}
              </span>
              <span class="min-w-0">
                <span class="mono block text-[11px] font-semibold text-ink">{template.label}</span>
                <span class="mt-0.5 block text-[11px] leading-snug text-faint">{template.summary}</span>
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <div class="flex items-center justify-between px-3 pb-1.5 pt-3">
    <span class="micro text-faint">Documents</span>
    <span class="mono tabular text-[10px] text-faint">{workspace.filtered.length}/{workspace.items.length}</span>
  </div>

  <div class="pf-scroll flex shrink-0 items-center gap-3 overflow-x-auto border-b border-line px-3 py-2">
    <button
      type="button"
      aria-pressed={workspace.activeTag === null}
      class={`mono shrink-0 text-[10px] uppercase tracking-wider ${workspace.activeTag === null ? 'text-accent' : 'text-faint hover:text-muted'}`}
      onclick={() => workspace.setTag(null)}
    >
      All
    </button>
    {#each workspace.tags as tag (tag)}
      <button
        type="button"
        aria-pressed={workspace.activeTag === tag}
        class={`mono shrink-0 text-[10px] uppercase tracking-wider ${workspace.activeTag === tag ? 'text-accent' : 'text-faint hover:text-muted'}`}
        onclick={() => workspace.setTag(workspace.activeTag === tag ? null : tag)}
      >
        #{tag}
      </button>
    {/each}
  </div>

  <div class="pf-scroll min-h-0 flex-1 overflow-y-auto">
    {#if workspace.filtered.length === 0}
      <div class="flex h-full flex-col items-center justify-center px-5 text-center">
        <FolderOpen size={20} class="text-faint" />
        <p class="mono mt-3 text-[11px] uppercase tracking-wider text-muted">No matches</p>
        <p class="mt-1.5 text-[11px] leading-relaxed text-faint">
          Clear the filter or create a document from a template.
        </p>
      </div>
    {:else}
      <ul>
        {#each workspace.filtered as item (item.id)}
          <li
            class={`group relative border-b border-line/60 transition-colors ${item.id === workspace.selectedId ? 'bg-raised' : 'hover:bg-panel'}`}
          >
            {#if item.id === workspace.selectedId}
              <span class="absolute inset-y-0 left-0 w-0.5 bg-accent"></span>
            {/if}
            <div class="flex items-center gap-1 pl-3 pr-1">
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-2.5 py-2.5 text-left"
                aria-current={item.id === workspace.selectedId ? 'true' : undefined}
                onclick={() => selectItem(item.id)}
              >
                <span
                  class={`mono w-5 shrink-0 text-[10px] ${item.id === workspace.selectedId ? 'text-accent' : 'text-faint'}`}
                >
                  {KIND_CODE[item.kind]}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[13px] font-medium text-ink">{item.title}</span>
                  <span class="mono mt-0.5 block truncate text-[10px] text-faint">
                    {relativeTime(item.updatedAt)}{item.tags.length
                      ? ` · ${item.tags.map((tag) => `#${tag}`).join(' ')}`
                      : ''}
                  </span>
                </span>
              </button>

              <div
                class="flex shrink-0 items-center opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
              >
                <button
                  type="button"
                  class="grid size-11 place-items-center rounded text-faint transition-colors hover:bg-surface hover:text-warn"
                  aria-label={item.favorite ? `Unfavorite ${item.title}` : `Favorite ${item.title}`}
                  onclick={() => workspace.updateItem(item.id, { favorite: !item.favorite })}
                >
                  <Star size={14} class={item.favorite ? 'fill-warn text-warn' : ''} />
                </button>
                <button
                  type="button"
                  class="grid size-11 place-items-center rounded text-faint transition-colors hover:bg-surface hover:text-bad"
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
    class="flex shrink-0 items-center gap-2 border-t border-line px-3 py-2 mono text-[10px] text-faint"
  >
    <span class="dot text-good"></span>
    <span>Local storage</span>
    <span class="tabular ml-auto">{workspace.items.length} doc</span>
  </div>
</div>
