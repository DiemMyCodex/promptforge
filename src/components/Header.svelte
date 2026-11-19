<script lang="ts">
  import Command from '@lucide/svelte/icons/command';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import GitBranch from '@lucide/svelte/icons/git-branch';
  import Moon from '@lucide/svelte/icons/moon';
  import PanelLeft from '@lucide/svelte/icons/panel-left';
  import Sun from '@lucide/svelte/icons/sun';
  import { GITHUB_URL } from '../lib/config';
  import { workspace } from '../lib/stores/workspace.svelte';

  interface Props {
    sidebarOpen?: boolean;
  }

  let { sidebarOpen = $bindable(false) }: Props = $props();

  let item = $derived(workspace.active);
</script>

<header class="glass flex h-14 shrink-0 items-center gap-2 rounded-[18px] px-2 sm:px-3">
  <button
    type="button"
    class="ios-icon tap lg:hidden"
    aria-label={sidebarOpen ? 'Close library' : 'Open library'}
    onclick={() => (sidebarOpen = !sidebarOpen)}
  >
    <PanelLeft size={17} />
  </button>

  <div class="flex min-w-0 items-center gap-2.5">
    <div
      class="grid size-8 shrink-0 place-items-center rounded-[9px] border border-accent/30 bg-accent-soft text-accent"
    >
      <Command size={16} strokeWidth={2.2} />
    </div>
    <div class="min-w-0">
      <div class="text-[13px] font-semibold leading-tight tracking-[-0.02em]">PromptForge</div>
      <div class="micro hidden leading-tight sm:block">Local studio</div>
    </div>
    {#if item}
      <span class="mx-1 hidden h-4 w-px bg-separator md:block"></span>
      <span class="mono hidden max-w-[16rem] truncate text-[11px] text-label-2 md:block">
        {item.title}
      </span>
    {/if}
  </div>

  <div class="ml-auto flex items-center gap-1.5">
    <span
      class="hidden items-center gap-1.5 rounded-full border border-separator bg-fill px-2.5 py-1.5 sm:flex"
    >
      <span class="dot text-good"></span>
      <span class="micro">Local</span>
    </span>

    <button
      type="button"
      class="ios-icon tap"
      aria-label={workspace.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={workspace.theme === 'dark' ? 'Light theme' : 'Dark theme'}
      onclick={() => workspace.toggleTheme()}
    >
      {#if workspace.theme === 'dark'}
        <Sun size={16} />
      {:else}
        <Moon size={16} />
      {/if}
    </button>

    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      class="ios-btn tap hidden sm:inline-flex"
      aria-label="Open the project repository"
      title="Open the PromptForge repository"
    >
      <GitBranch size={15} />
      <span class="hidden lg:inline">Source</span>
      <ExternalLink size={11} class="hidden lg:block" />
    </a>
  </div>
</header>
