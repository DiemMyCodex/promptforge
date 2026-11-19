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
      target instanceof HTMLSelectElement ||
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

<div class="flex h-full min-h-0 flex-col">
  <div class="shrink-0 space-y-2.5 px-3 pt-3">
    <div class="relative">
      <Search
        size={15}
        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-label-3"
      />
      <input
        bind:this={searchEl}
        bind:value={searchInput}
        type="search"
        placeholder="Search documents"
        aria-label="Search saved prompts"
        class="ios-input w-full pl-9 pr-11 text-[12px]"
      />
      {#if searchInput}
        <button
          type="button"
          class="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-label-3 transition-colors hover:text-label"
          aria-label="Clear search"
          onclick={() => (searchInput = '')}
        >
          <X size={14} />
        </button>
      {:else}
        <span class="kbd pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">/</span>
      {/if}
    </div>

    <div class="relative" bind:this={menuRoot}>
      <button
        type="button"
        class="ios-btn ios-primary tap w-full justify-start"
        aria-expanded={menuOpen}
        onclick={() => (menuOpen = !menuOpen)}
      >
        <Plus size={16} />
        <span>New document</span>
        <ChevronDown
          size={14}
          class={`ml-auto opacity-80 transition-[rotate] duration-[260ms] ${menuOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {#if menuOpen}
        <div
          class="pf-enter glass absolute inset-x-0 top-[calc(100%+0.4rem)] z-30 overflow-hidden rounded-[14px] p-1.5"
          role="menu"
          aria-label="Starter templates"
        >
          {#each TEMPLATES as template (template.id)}
            <button
              type="button"
              role="menuitem"
              class="flex w-full items-start gap-2.5 rounded-[10px] px-2 py-2 text-left transition-colors hover:bg-fill-hover"
              onclick={() => chooseTemplate(template)}
            >
              <span
                class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[8px] border border-separator bg-fill text-accent"
              >
                {@render templateIcon(template.id)}
              </span>
              <span class="min-w-0">
                <span class="block text-[12px] font-medium text-label">{template.label}</span>
                <span class="mt-0.5 block text-[11px] leading-snug text-label-3">
                  {template.summary}
                </span>
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <div class="flex items-center justify-between px-4 pb-1.5 pt-4">
    <span class="micro">Library</span>
    <span class="mono tabular text-[10px] text-label-3">
      {workspace.filtered.length}/{workspace.items.length}
    </span>
  </div>

  <div class="scroll-thin flex shrink-0 items-center gap-1.5 overflow-x-auto px-3 pb-2.5">
    <button
      type="button"
      aria-pressed={workspace.activeTag === null}
      class={`mono h-7 shrink-0 rounded-full border px-2.5 text-[10px] transition-colors ${workspace.activeTag === null ? 'border-accent/40 bg-accent-soft text-accent' : 'border-separator text-label-3 hover:text-label-2'}`}
      onclick={() => workspace.setTag(null)}
    >
      All
    </button>
    {#each workspace.tags as tag (tag)}
      <button
        type="button"
        aria-pressed={workspace.activeTag === tag}
        class={`mono h-7 shrink-0 rounded-full border px-2.5 text-[10px] transition-colors ${workspace.activeTag === tag ? 'border-accent/40 bg-accent-soft text-accent' : 'border-separator text-label-3 hover:text-label-2'}`}
        onclick={() => workspace.setTag(workspace.activeTag === tag ? null : tag)}
      >
        #{tag}
      </button>
    {/each}
  </div>

  <div class="scroll-thin min-h-0 flex-1 overflow-y-auto px-2 pb-2">
    {#if workspace.filtered.length === 0}
      <div class="flex h-full flex-col items-center justify-center px-5 text-center">
        <div
          class="grid size-11 place-items-center rounded-[13px] border border-separator bg-fill text-label-3"
        >
          <FolderOpen size={19} />
        </div>
        <p class="mt-3 text-[12px] font-medium text-label-2">No matches</p>
        <p class="mt-1 text-[11px] leading-relaxed text-label-3">
          Clear the filter or start from a template.
        </p>
      </div>
    {:else}
      <ul class="space-y-0.5">
        {#each workspace.filtered as item (item.id)}
          {@const selected = item.id === workspace.selectedId}
          <li class="group relative">
            <div
              class={`flex items-center gap-1 rounded-[12px] border px-2 py-1.5 transition-colors ${selected ? 'border-separator bg-fill' : 'border-transparent hover:bg-fill'}`}
            >
              {#if selected}
                <span class="absolute inset-y-2.5 left-0 w-[3px] rounded-full bg-accent"></span>
              {/if}
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-2.5 py-1 text-left"
                aria-current={selected ? 'true' : undefined}
                onclick={() => selectItem(item.id)}
              >
                <span
                  class={`mono grid size-8 shrink-0 place-items-center rounded-[9px] border text-[10px] font-semibold ${selected ? 'border-accent/40 bg-accent-soft text-accent' : 'border-separator bg-fill text-label-3'}`}
                >
                  {KIND_CODE[item.kind]}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[12.5px] font-medium text-label">
                    {item.title}
                  </span>
                  <span class="mono mt-0.5 block truncate text-[10px] text-label-3">
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
                  class="row-icon"
                  aria-label={item.favorite ? `Unfavorite ${item.title}` : `Favorite ${item.title}`}
                  onclick={() => workspace.updateItem(item.id, { favorite: !item.favorite })}
                >
                  <Star size={14} class={item.favorite ? 'fill-warn text-warn' : ''} />
                </button>
                <button
                  type="button"
                  class="row-icon"
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
    class="flex shrink-0 items-center gap-2 border-t border-separator px-4 py-2.5"
  >
    <span class="dot text-good"></span>
    <span class="mono text-[10px] text-label-3">Stored locally</span>
    <span class="mono tabular ml-auto text-[10px] text-label-3">
      {workspace.items.length} docs
    </span>
  </div>
</div>
