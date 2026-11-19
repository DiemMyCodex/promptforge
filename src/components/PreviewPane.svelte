<script lang="ts">
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import Check from '@lucide/svelte/icons/check';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Copy from '@lucide/svelte/icons/copy';
  import Download from '@lucide/svelte/icons/download';
  import { GITHUB_URL } from '../lib/config';
  import { workspace } from '../lib/stores/workspace.svelte';
  import { exportMarkdown } from '../lib/utils/download';
  import { renderMarkdown } from '../lib/utils/markdown';
  import { countMetrics, parseFrontmatter } from '../lib/utils/tokens';

  let item = $derived(workspace.active);
  let report = $derived(parseFrontmatter(item?.content ?? ''));
  let metrics = $derived(countMetrics(item?.content ?? ''));
  // renderMarkdown escapes all input before emitting markup, so this HTML is safe.
  let html = $derived(renderMarkdown(report.present ? report.body : (item?.content ?? '')));
  let fieldCount = $derived(Object.keys(report.data ?? {}).length);

  let copied = $state(false);
  let notice = $state('');
  let fmOpen = $state(true);

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
      notice = 'CLIPBOARD BLOCKED';
    }
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
      <span class="mono text-[11px] uppercase tracking-widest text-faint">No output</span>
      <p class="mt-2 max-w-xs text-xs leading-relaxed text-faint">
        Select a document to see its rendered Markdown here.
      </p>
    </div>
  {:else}
    <div class="flex h-11 shrink-0 items-center gap-2 border-b border-line px-2 sm:px-3">
      <span class="micro text-faint">Output</span>
      {#if copied}
        <span class="mono flex items-center gap-1 text-[10px] text-good" role="status">
          <Check size={12} /> Copied
        </span>
      {:else if notice}
        <span class="mono text-[10px] text-warn" role="alert">{notice}</span>
      {/if}

      <div class="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          class="flex h-11 items-center gap-1.5 rounded-md border border-line px-2.5 text-muted transition-colors hover:border-line-strong hover:text-ink"
          aria-label="Copy full Markdown document"
          onclick={copyDocument}
        >
          <Copy size={14} />
          <span class="micro hidden sm:inline">Copy</span>
        </button>
        <button
          type="button"
          class="flex h-11 items-center gap-1.5 rounded-md border border-accent/60 bg-accent-soft px-2.5 text-accent transition-colors hover:border-accent"
          aria-label="Export Markdown file"
          aria-keyshortcuts="Control+S Meta+S"
          title="Export .md · Ctrl/⌘+S"
          onclick={() => exportMarkdown(item)}
        >
          <Download size={14} />
          <span class="micro hidden sm:inline">Export</span>
        </button>
      </div>
    </div>

    <div class="pf-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
      {#if report.present}
        <details class="pf-details border border-line bg-panel" bind:open={fmOpen}>
          <summary class="flex h-9 cursor-pointer items-center gap-2 px-3 mono text-[10px] uppercase tracking-wider text-muted">
            <span class="dot {report.valid ? 'text-good' : 'text-bad'}"></span>
            Frontmatter
            <span class="text-faint">· {fieldCount} keys</span>
            <ChevronDown size={13} class={`ml-auto text-faint transition-transform ${fmOpen ? 'rotate-180' : ''}`} />
          </summary>
          <div class="border-t border-line px-3 py-2.5">
            {#if report.data}
              <dl class="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-3 gap-y-1.5 mono text-[11px]">
                {#each Object.entries(report.data) as [key, value] (key)}
                  <dt class="truncate text-faint">{key}</dt>
                  <dd class="break-words text-muted">{formatValue(value)}</dd>
                {/each}
              </dl>
            {/if}
            {#if report.errors.length > 0}
              <ul class="mt-2.5 space-y-1 border-t border-line pt-2">
                {#each report.errors as error (error)}
                  <li class="mono text-[10px] leading-snug text-bad">! {error}</li>
                {/each}
              </ul>
            {/if}
          </div>
        </details>
      {:else if item.kind === 'skill'}
        <div class="flex items-center gap-2 border-l-2 border-warn bg-warn/5 px-3 py-2 mono text-[10px] text-warn">
          <span>!</span>
          <span>Skill missing YAML frontmatter · name + description required</span>
        </div>
      {/if}

      <article class="md-body mt-6 pb-10">
        {#if html.trim() === ''}
          <p class="text-faint">Nothing to render yet.</p>
        {:else}
          {@html html}
        {/if}
      </article>
    </div>

    <div
      class="flex h-6 shrink-0 items-center gap-2 border-t border-line bg-surface px-3 mono text-[10px] text-faint"
    >
      <span class="dot text-good"></span>
      <span>Escaped render · {metrics.tokens} tk</span>
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
