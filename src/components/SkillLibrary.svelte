<script lang="ts">
  import Braces from '@lucide/svelte/icons/braces';
  import FileText from '@lucide/svelte/icons/file-text';
  import Search from '@lucide/svelte/icons/search';
  import Terminal from '@lucide/svelte/icons/terminal';
  import X from '@lucide/svelte/icons/x';
  import { SKILL_LIBRARY } from '../lib/skill-library';
  import { workspace } from '../lib/stores/workspace.svelte';
  import type { TemplatePreset } from '../lib/types';

  interface Props {
    open?: boolean;
    onClose?: () => void;
  }

  let { open = false, onClose }: Props = $props();

  let query = $state('');

  let filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (q === '') return SKILL_LIBRARY;
    return SKILL_LIBRARY.filter(
      (skill) =>
        skill.label.toLowerCase().includes(q) ||
        skill.summary.toLowerCase().includes(q) ||
        skill.content.toLowerCase().includes(q)
    );
  });

  function handleKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && open) onClose?.();
  }

  function choose(skill: TemplatePreset): void {
    workspace.openLibrarySkill(skill);
    query = '';
    onClose?.();
  }
</script>

<svelte:window onkeydown={handleKey} />

{#if open}
  <button
    type="button"
    class="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
    aria-label="Close skill library"
    onclick={() => onClose?.()}
  ></button>

  <div class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-3">
    <div
      class="glass pointer-events-auto flex max-h-[min(85dvh,44rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[22px]"
      role="dialog"
      aria-modal="true"
      aria-label="Skill library"
    >
      <div class="flex h-14 shrink-0 items-center gap-2 border-b border-separator px-4">
        <div
          class="grid size-8 shrink-0 place-items-center rounded-[9px] border border-accent/30 bg-accent-soft text-accent"
        >
          <Braces size={16} />
        </div>
        <div class="min-w-0">
          <h2 class="text-[13px] font-semibold tracking-[-0.02em]">Skill library</h2>
          <p class="micro">{SKILL_LIBRARY.length} bundled · offline</p>
        </div>
        <button
          type="button"
          class="ios-icon tap ml-auto"
          aria-label="Close skill library"
          onclick={() => onClose?.()}
        >
          <X size={16} />
        </button>
      </div>

      <div class="shrink-0 px-4 pb-3 pt-3">
        <div class="relative">
          <Search
            size={15}
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-label-3"
          />
          <input
            bind:value={query}
            type="search"
            placeholder="Search skills by name, description or content"
            aria-label="Search the skill library"
            class="ios-input w-full pl-9 pr-3 text-[12px]"
          />
        </div>
      </div>

      <div class="scroll-thin grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto px-4 pb-4 sm:grid-cols-2">
        {#each filtered as skill (skill.id)}
          <button
            type="button"
            class="group rounded-[14px] border border-separator bg-fill p-3 text-left transition-colors hover:border-accent/40 hover:bg-fill-hover"
            onclick={() => choose(skill)}
          >
            <div class="flex items-center gap-2">
              <span
                class="grid size-7 shrink-0 place-items-center rounded-[8px] border border-separator bg-fill text-accent"
              >
                {#if skill.id.includes('android') || skill.id.includes('apk') || skill.id.includes('termux')}
                  <Terminal size={14} />
                {:else if skill.id.includes('ui') || skill.id.includes('prototype') || skill.id.includes('rea')}
                  <FileText size={14} />
                {:else}
                  <Braces size={14} />
                {/if}
              </span>
              <span class="mono min-w-0 flex-1 truncate text-[12px] font-medium text-label">
                {skill.label}
              </span>
              <span
                class="text-label-3 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              >
                ↗
              </span>
            </div>
            <p class="mt-2 line-clamp-2 text-[11px] leading-relaxed text-label-3">
              {skill.summary}
            </p>
          </button>
        {:else}
          <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <p class="text-[12px] font-medium text-label-2">No skill matches</p>
            <p class="mt-1 text-[11px] text-label-3">Try a different keyword.</p>
          </div>
        {/each}
      </div>

      <div
        class="flex h-8 shrink-0 items-center gap-2 border-t border-separator bg-fill/50 px-4 mono text-[10px] text-label-3"
      >
        <span class="dot text-good"></span>
        <span>{filtered.length} shown</span>
        <span class="ml-auto">Click to open in editor</span>
      </div>
    </div>
  </div>
{/if}
