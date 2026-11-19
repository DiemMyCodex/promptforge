<script lang="ts">
  import Check from '@lucide/svelte/icons/check';
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

<header
  class="relative z-50 flex h-[52px] shrink-0 items-center gap-2 border-b border-line bg-surface px-2 sm:px-3"
>
  <button
    type="button"
    class="grid size-11 place-items-center rounded-md text-muted transition-colors hover:bg-raised hover:text-ink lg:hidden"
    aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
    onclick={() => (sidebarOpen = !sidebarOpen)}
  >
    <PanelLeft size={17} />
  </button>

  <div class="flex min-w-0 items-center gap-2.5">
    <div class="grid size-7 shrink-0 place-items-center rounded-[4px] border border-accent/50 text-accent">
      <span class="pf-mark">PF</span>
    </div>
    <span class="mono text-[12px] font-semibold tracking-[0.08em]">PROMPTFORGE</span>
    <span class="mx-1 hidden h-3 w-px bg-line-strong md:block"></span>
    <span class="micro hidden truncate text-faint md:block">~/workspace</span>
    {#if item}
      <span class="mono hidden max-w-48 truncate text-[11px] text-muted lg:block">/ {item.title}</span>
    {/if}
  </div>

  <div class="ml-auto flex items-center gap-1">
    {#if flash}
      <span class="mono hidden items-center gap-1.5 text-[10px] text-good sm:flex" role="status">
        <Check size={12} /> {flash}
      </span>
    {/if}
    {#if error}
      <span class="mono hidden text-[10px] text-bad sm:block" role="alert">{error}</span>
    {/if}

    <span class="micro hidden items-center gap-1.5 border border-line px-2 py-1.5 text-muted sm:flex">
      <span class="dot text-good"></span> Local
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
      class="flex h-11 items-center gap-1.5 rounded-md border border-line px-2.5 text-muted transition-colors hover:border-line-strong hover:text-ink"
      aria-label="Import Markdown file"
      onclick={() => fileInput?.click()}
    >
      <Upload size={15} />
      <span class="micro hidden sm:inline">Import</span>
    </button>

    <button
      type="button"
      class="grid size-11 place-items-center rounded-md border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
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
      class="flex h-11 items-center gap-1.5 rounded-md border border-line px-2.5 text-muted transition-colors hover:border-line-strong hover:text-ink"
      aria-label="Open the project repository"
      title="Open the PromptForge repository"
    >
      <GitBranch size={15} />
      <span class="micro hidden lg:inline">Source</span>
      <ExternalLink size={11} class="hidden lg:block" />
    </a>
  </div>
</header>
