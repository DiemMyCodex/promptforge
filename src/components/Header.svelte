<script lang="ts">
  import Check from '@lucide/svelte/icons/check';
  import Command from '@lucide/svelte/icons/command';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import GitBranch from '@lucide/svelte/icons/git-branch';
  import Moon from '@lucide/svelte/icons/moon';
  import PanelLeft from '@lucide/svelte/icons/panel-left';
  import Sun from '@lucide/svelte/icons/sun';
  import Upload from '@lucide/svelte/icons/upload';
  import { GITHUB_URL } from '../lib/config';
  import { workspace } from '../lib/stores/workspace.svelte';

  interface Props {
    sidebarOpen?: boolean;
  }

  let { sidebarOpen = $bindable(false) }: Props = $props();

  let fileInput = $state<HTMLInputElement | null>(null);
  let flash = $state('');
  let error = $state('');
  let item = $derived(workspace.active);

  $effect(() => {
    if (flash === '' && error === '') return;
    const timer = setTimeout(() => {
      flash = '';
      error = '';
    }, 2200);
    return () => clearTimeout(timer);
  });

  async function handleImport(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (file.size > 1024 * 1024) {
      error = 'FILE TOO LARGE · 1 MB MAX';
      return;
    }

    try {
      workspace.importDocument(file.name, await file.text());
      flash = `IMPORTED ${file.name}`;
    } catch {
      error = 'READ FAILED';
    }
  }
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
    {#if flash}
      <span class="hidden items-center gap-1.5 text-[11px] text-good sm:flex" role="status">
        <Check size={13} /> {flash}
      </span>
    {/if}
    {#if error}
      <span class="hidden text-[11px] text-bad sm:block" role="alert">{error}</span>
    {/if}

    <span
      class="hidden items-center gap-1.5 rounded-full border border-separator bg-fill px-2.5 py-1.5 sm:flex"
    >
      <span class="dot text-good"></span>
      <span class="micro">Local</span>
    </span>

    <input
      bind:this={fileInput}
      type="file"
      accept=".md,.markdown,.txt,text/markdown,text/plain"
      class="hidden"
      onchange={handleImport}
      aria-label="Choose a Markdown file to import"
    />

    <button
      type="button"
      class="ios-btn tap"
      aria-label="Import Markdown file"
      onclick={() => fileInput?.click()}
    >
      <Upload size={15} />
      <span class="hidden sm:inline">Import</span>
    </button>

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
