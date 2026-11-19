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

<div class="flex h-full min-h-0 w-full flex-col">
  {#if !item}
    <div class="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div
        class="grid size-12 place-items-center rounded-[14px] border border-separator bg-fill text-label-3"
      >
        <Download size={19} />
      </div>
      <p class="mt-3 text-[13px] font-medium text-label">Nothing to preview</p>
      <p class="mt-1 max-w-xs text-[11px] leading-relaxed text-label-3">
        Select a document to see its rendered Markdown.
      </p>
    </div>
  {:else}
    <div class="flex h-[52px] shrink-0 items-center gap-2 border-b border-separator px-3">
      <span class="micro">Output</span>
      {#if copied}
        <span class="flex items-center gap-1 text-[11px] text-good" role="status">
          <Check size={13} /> Copied
        </span>
      {:else if notice}
        <span class="text-[11px] text-warn" role="alert">{notice}</span>
      {/if}

      <div class="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          class="ios-btn tap"
          aria-label="Copy full Markdown document"
          onclick={copyDocument}
        >
          <Copy size={14} />
          <span class="hidden sm:inline">Copy</span>
        </button>
        <button
          type="button"
          class="ios-btn ios-primary tap"
          aria-label="Export Markdown file"
          aria-keyshortcuts="Control+S Meta+S"
          title="Export .md · Ctrl/⌘+S"
          onclick={() => exportMarkdown(item)}
        >
          <Download size={14} />
          <span class="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>

    <div class="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
      {#if report.present}
        <details class="pf-details group-card" bind:open={fmOpen}>
          <summary class="flex h-10 cursor-pointer items-center gap-2 px-3.5">
            <span class="dot {report.valid ? 'text-good' : 'text-bad'}"></span>
            <span class="text-[12px] font-medium text-label">Frontmatter</span>
            <span class="mono text-[10px] text-label-3">· {fieldCount} keys</span>
            <ChevronDown
              size={14}
              class={`ml-auto text-label-3 transition-[rotate] duration-[260ms] ${fmOpen ? 'rotate-180' : ''}`}
            />
          </summary>
          <div class="border-t border-separator px-3.5 py-3">
            {#if report.data}
              <dl
                class="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-3 gap-y-2 mono text-[11px]"
              >
                {#each Object.entries(report.data) as [key, value] (key)}
                  <dt class="truncate text-label-3">{key}</dt>
                  <dd class="break-words text-label-2">{formatValue(value)}</dd>
                {/each}
              </dl>
            {/if}
            {#if report.errors.length > 0}
              <ul class="mt-3 space-y-1 border-t border-separator pt-2.5">
                {#each report.errors as error (error)}
                  <li class="mono text-[10px] leading-snug text-bad">! {error}</li>
                {/each}
              </ul>
            {/if}
          </div>
        </details>
      {:else if item.kind === 'skill'}
        <div
          class="flex items-center gap-2 rounded-[12px] border border-warn/30 bg-warn/10 px-3 py-2.5 text-[11px] leading-snug text-warn"
        >
          <span class="mono font-semibold">!</span>
          <span>Skill missing YAML frontmatter — name + description required</span>
        </div>
      {/if}

      <article class="md-body mt-6 pb-10">
        {#if html.trim() === ''}
          <p class="text-label-3">Nothing to render yet.</p>
        {:else}
          {@html html}
        {/if}
      </article>
    </div>

    <div
      class="flex h-7 shrink-0 items-center gap-2 border-t border-separator bg-fill/50 px-3 mono text-[10px] text-label-3"
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
