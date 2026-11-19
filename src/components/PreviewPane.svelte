<script lang="ts">
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import Check from '@lucide/svelte/icons/check';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import CircleX from '@lucide/svelte/icons/circle-x';
  import Copy from '@lucide/svelte/icons/copy';
  import Download from '@lucide/svelte/icons/download';
  import FileText from '@lucide/svelte/icons/file-text';
  import ShieldCheck from '@lucide/svelte/icons/shield-check';
  import { GITHUB_URL } from '../lib/config';
  import { workspace } from '../lib/stores/workspace.svelte';
  import { renderMarkdown } from '../lib/utils/markdown';
  import { countMetrics, parseFrontmatter } from '../lib/utils/tokens';

  let item = $derived(workspace.active);
  let report = $derived(parseFrontmatter(item?.content ?? ''));
  let metrics = $derived(countMetrics(item?.content ?? ''));
  // renderMarkdown escapes all input before emitting markup, so this HTML is safe.
  let html = $derived(renderMarkdown(report.present ? report.body : (item?.content ?? '')));

  let copied = $state(false);
  let notice = $state('');

  $effect(() => {
    if (!copied && notice === '') return;
    const timer = setTimeout(() => {
      copied = false;
      notice = '';
    }, 2000);
    return () => clearTimeout(timer);
  });

  async function copyDocument(): Promise<void> {
    if (!item) return;
    try {
      await navigator.clipboard.writeText(item.content);
      copied = true;
      notice = '';
    } catch {
      notice = 'Clipboard unavailable in this context.';
    }
  }

  function downloadMarkdown(): void {
    if (!item) return;

    const blob = new Blob([item.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = item.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'prompt';

    link.href = url;
    link.download = `${slug}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function formatValue(value: unknown): string {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value ?? '');
  }
</script>

<div class="flex h-full min-h-0 w-full flex-col bg-surface">
  {#if !item}
    <div class="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div class="grid size-12 place-items-center rounded-xl border border-line bg-panel text-faint">
        <FileText size={20} />
      </div>
      <h2 class="mt-4 text-sm font-semibold">Nothing to preview</h2>
      <p class="mt-1 max-w-xs text-xs leading-relaxed text-faint">
        Select a prompt to see its rendered Markdown and frontmatter checks here.
      </p>
    </div>
  {:else}
    <div class="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2 sm:px-4">
      <span class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
        <FileText size={13} /> Preview
      </span>

      {#if copied}
        <span class="flex items-center gap-1 text-[11px] font-medium text-good" role="status">
          <Check size={13} /> Copied
        </span>
      {:else if notice}
        <span class="text-[11px] font-medium text-warn" role="alert">{notice}</span>
      {/if}

      <div class="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          class="inline-flex h-11 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[11px] font-medium text-muted transition-colors hover:border-accent hover:text-ink"
          aria-label="Copy full Markdown document"
          onclick={copyDocument}
        >
          <Copy size={14} />
          <span class="hidden sm:inline">Copy</span>
        </button>
        <button
          type="button"
          class="inline-flex h-11 items-center gap-1.5 rounded-lg border border-accent/40 bg-accent-soft px-2.5 text-[11px] font-semibold text-accent transition-colors hover:border-accent"
          aria-label="Export Markdown file"
          onclick={downloadMarkdown}
        >
          <Download size={14} />
          <span class="hidden sm:inline">Export .md</span>
        </button>
      </div>
    </div>

    <div class="pf-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
      {#if report.present}
        <section
          class={`rounded-xl border p-3 ${report.valid ? 'border-good/30 bg-good/5' : 'border-bad/35 bg-bad/5'}`}
          aria-label="Frontmatter validation"
        >
          <div class="flex items-center gap-2">
            {#if report.valid}
              <CircleCheck size={15} class="text-good" />
              <span class="text-[11px] font-semibold text-good">Frontmatter valid</span>
            {:else}
              <CircleX size={15} class="text-bad" />
              <span class="text-[11px] font-semibold text-bad">Frontmatter issues</span>
            {/if}
            <span class="tabular ml-auto text-[10px] text-faint">YAML · {metrics.tokens} tokens</span>
          </div>

          {#if report.data}
            <dl class="mt-3 grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[11px]">
              {#each Object.entries(report.data) as [key, value] (key)}
                <dt class="truncate font-mono text-faint">{key}</dt>
                <dd class="break-words font-mono text-muted">{formatValue(value)}</dd>
              {/each}
            </dl>
          {/if}

          {#if report.errors.length > 0}
            <ul class="mt-3 space-y-1 border-t border-bad/20 pt-2">
              {#each report.errors as error (error)}
                <li class="text-[11px] leading-snug text-bad">· {error}</li>
              {/each}
            </ul>
          {/if}
        </section>
      {:else if item.kind === 'skill'}
        <section
          class="flex items-start gap-2 rounded-xl border border-warn/30 bg-warn/5 p-3 text-[11px] text-warn"
        >
          <CircleX size={15} class="mt-0.5 shrink-0" />
          <span>
            This skill has no YAML frontmatter. Add a <code class="font-mono">name</code> and
            <code class="font-mono">description</code> block at the top.
          </span>
        </section>
      {/if}

      <article class="md-body mt-5 pb-8">
        {#if html.trim() === ''}
          <p class="text-faint">Nothing to render yet. Write something in the editor.</p>
        {:else}
          {@html html}
        {/if}
      </article>
    </div>

    <div
      class="flex shrink-0 items-center gap-2 border-t border-line px-3 py-2 text-[10px] text-faint sm:px-4"
    >
      <ShieldCheck size={12} class="text-good" />
      Escaped HTML · safe link targets
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        class="ml-auto inline-flex items-center gap-1 transition-colors hover:text-accent"
        title="Open the PromptForge repository"
      >
        Source <ArrowUpRight size={11} />
      </a>
    </div>
  {/if}
</div>
