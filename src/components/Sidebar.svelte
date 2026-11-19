<script lang="ts">
  import Braces from '@lucide/svelte/icons/braces';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Search from '@lucide/svelte/icons/search';
  import Star from '@lucide/svelte/icons/star';
  import X from '@lucide/svelte/icons/x';
  import { SKILL_LIBRARY } from '../lib/skill-library';
  import { workspace } from '../lib/stores/workspace.svelte';
  import type { PromptKind } from '../lib/types';

  interface Props {
    onNavigate?: () => void;
    onOpenLibrary?: () => void;
  }

  let { onNavigate, onOpenLibrary }: Props = $props();

  let searchInput = $state(workspace.query);
  let searchEl = $state<HTMLInputElement | null>(null);

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

  function selectItem(id: string): void {
    workspace.select(id);
    onNavigate?.();
  }

</script>

<svelte:window onkeydown={handleShortcut} />

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
          class="absolute right-0.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-label-3 transition-colors hover:text-label"
          aria-label="Clear search"
          onclick={() => (searchInput = '')}
        >
          <X size={14} />
        </button>
      {:else}
        <span class="kbd pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">/</span>
      {/if}
    </div>

    <button
      type="button"
      class="ios-btn tap w-full justify-start"
      onclick={() => onOpenLibrary?.()}
    >
      <Braces size={15} class="text-accent" />
      <span>Skill library</span>
      <span class="mono ml-auto text-[10px] text-label-3">{SKILL_LIBRARY.length}</span>
    </button>
  </div>

  <div class="flex items-center justify-between px-4 pb-1.5 pt-4">
    <span class="micro">Library</span>
    <span class="mono tabular text-[10px] text-label-3">
      {workspace.filtered.length}/{workspace.items.length}
    </span>
  </div>

  <div class="scroll-thin flex shrink-0 items-center gap-1.5 overflow-x-auto px-3 pb-1">
    <button
      type="button"
      aria-pressed={workspace.activeTag === null}
      class="chip"
      onclick={() => workspace.setTag(null)}
    >
      All
    </button>
    {#each workspace.tags as tag (tag)}
      <button
        type="button"
        aria-pressed={workspace.activeTag === tag}
        class="chip"
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
          Clear the filter or open a doc from the library.
        </p>
      </div>
    {:else}
      <ul class="space-y-0.5">
        {#each workspace.filtered as item (item.id)}
          {@const selected = item.id === workspace.selectedId}
          <li class="group relative">
            <div
              class={`flex items-center gap-1 rounded-[12px] border px-2 py-0.5 transition-colors ${selected ? 'border-separator bg-fill' : 'border-transparent hover:bg-fill'}`}
            >
              {#if selected}
                <span class="absolute inset-y-2.5 left-0 w-[3px] rounded-full bg-accent"></span>
              {/if}
              <button
                type="button"
                class="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 py-1 text-left"
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

              {#if item.favorite}
                <span class="grid size-7 shrink-0 place-items-center text-warn" title="Favorite">
                  <Star size={14} class="fill-warn" aria-hidden="true" />
                </span>
              {/if}
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
