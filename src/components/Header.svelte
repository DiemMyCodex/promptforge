<script lang="ts">
  import Braces from '@lucide/svelte/icons/braces';
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
      error = 'File too large — 1 MB max.';
      return;
    }

    try {
      const text = await file.text();
      workspace.importDocument(file.name, text);
      flash = `Imported ${file.name}`;
    } catch {
      error = 'Could not read that file.';
    }
  }
</script>

<header
  class="relative z-50 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface/95 px-2 backdrop-blur sm:px-4"
>
  <button
    type="button"
    class="grid size-11 place-items-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink lg:hidden"
    aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
    onclick={() => (sidebarOpen = !sidebarOpen)}
  >
    <PanelLeft size={18} />
  </button>

  <div class="flex min-w-0 items-center gap-2.5">
    <div
      class="grid size-8 shrink-0 place-items-center rounded-[9px] bg-linear-to-br from-accent to-accent-2 text-canvas shadow-lg shadow-accent/10"
    >
      <Braces size={17} strokeWidth={2.4} />
    </div>
    <div class="min-w-0 leading-tight">
      <p class="truncate text-sm font-semibold tracking-tight">PromptForge</p>
      <p class="hidden truncate text-[10px] font-medium uppercase tracking-[0.14em] text-faint sm:block">
        Prompt &amp; skill studio
      </p>
    </div>
  </div>

  <div class="ml-auto flex items-center gap-1.5">
    {#if flash}
      <span class="hidden items-center gap-1 text-[11px] font-medium text-good sm:flex" role="status">
        <Check size={13} /> <span class="max-w-40 truncate">{flash}</span>
      </span>
    {/if}
    {#if error}
      <span class="hidden text-[11px] font-medium text-bad sm:block" role="alert">{error}</span>
    {/if}

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
      class="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-2.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-ink sm:px-3"
      aria-label="Import Markdown file"
      onclick={() => fileInput?.click()}
    >
      <Upload size={15} />
      <span class="hidden sm:inline">Import .md</span>
    </button>

    <button
      type="button"
      class="grid size-11 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-accent hover:text-ink"
      aria-label={workspace.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={workspace.theme === 'dark' ? 'Light theme' : 'Dark theme'}
      onclick={() => workspace.toggleTheme()}
    >
      {#if workspace.theme === 'dark'}
        <Sun size={17} />
      {:else}
        <Moon size={17} />
      {/if}
    </button>

    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-2.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-ink sm:px-3"
      aria-label="Open the project repository (placeholder URL)"
      title="Open the PromptForge repository"
    >
      <GitBranch size={15} />
      <span class="hidden md:inline">GitHub</span>
      <ExternalLink size={12} class="hidden md:block" />
    </a>
  </div>
</header>
