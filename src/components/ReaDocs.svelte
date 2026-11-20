<script lang="ts">
  import FileText from '@lucide/svelte/icons/file-text';
  import Moon from '@lucide/svelte/icons/moon';
  import Sun from '@lucide/svelte/icons/sun';
  import { GITHUB_URL } from '../lib/config';
  import { REA_DOCS, REA_VERSION } from '../lib/rea-docs';
  import { workspace } from '../lib/stores/workspace.svelte';
  import { renderMarkdown } from '../lib/utils/markdown';
  import { countMetrics, parseFrontmatter } from '../lib/utils/tokens';

  let activeId = $state<string>(REA_DOCS[0]?.id ?? 'skill');

  let section = $derived(REA_DOCS.find((doc) => doc.id === activeId) ?? REA_DOCS[0]);
  let report = $derived(parseFrontmatter(section?.content ?? ''));
  let metrics = $derived(countMetrics(section?.content ?? ''));
  // renderMarkdown escapes all input before emitting markup, so this HTML is safe.
  let html = $derived(renderMarkdown(report.body));
  let fields = $derived(Object.entries(report.data ?? {}));

  function formatValue(value: unknown): string {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value ?? '');
  }
</script>

<div class="flex h-dvh min-h-0 flex-col gap-2.5 p-2.5 sm:p-3">
  <header class="glass flex h-14 shrink-0 items-center gap-2 rounded-[18px] px-2 sm:px-3">
    <a href="#/" class="ios-icon tap" aria-label="Back to studio" title="Back to studio">
      <FileText size={16} />
    </a>

    <div class="min-w-0">
      <div class="text-[13px] font-semibold leading-tight tracking-[-0.02em]">
        REA {REA_VERSION} docs
      </div>
      <div class="micro hidden leading-tight sm:block">Reverse Engineer Anything · opencode-skills/rea</div>
    </div>

    <div class="ml-auto flex items-center gap-1.5">
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
        <FileText size={15} />
        <span class="hidden lg:inline">Source</span>
      </a>
    </div>
  </header>

  <main class="glass flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px]">
    <nav
      class="scroll-thin flex shrink-0 gap-1 overflow-x-auto border-b border-separator px-2 py-2"
      aria-label="REA document sections"
    >
      {#each REA_DOCS as doc (doc.id)}
        <button
          type="button"
          class="chip tap"
          aria-pressed={doc.id === activeId}
          onclick={() => (activeId = doc.id)}
        >
          {doc.label}
        </button>
      {/each}
    </nav>

    <div class="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
      <div class="mx-auto w-full max-w-3xl pb-10">
        {#if report.present}
          <details class="pf-details group-card mb-6" open>
            <summary class="flex h-11 cursor-pointer items-center gap-2 px-3.5">
              <span class="dot {report.valid ? 'text-good' : 'text-bad'}"></span>
              <span class="text-[12px] font-medium text-label">Frontmatter</span>
              <span class="mono text-[10px] text-label-3">· {fields.length} keys</span>
            </summary>
            <div class="border-t border-separator px-3.5 py-3">
              <dl class="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-3 gap-y-2 mono text-[11px]">
                {#each fields as [key, value] (key)}
                  <dt class="truncate text-label-3">{key}</dt>
                  <dd class="break-words text-label-2">{formatValue(value)}</dd>
                {/each}
              </dl>
              {#if report.errors.length > 0}
                <ul class="mt-3 space-y-1 border-t border-separator pt-2.5">
                  {#each report.errors as error (error)}
                    <li class="mono text-[10px] leading-snug text-bad">! {error}</li>
                  {/each}
                </ul>
              {/if}
            </div>
          </details>
        {/if}

        <article class="md-body">
          {@html html}
        </article>
      </div>
    </div>

    <footer
      class="flex h-8 shrink-0 items-center gap-2 border-t border-separator bg-fill/50 px-3 mono text-[10px] text-label-3"
    >
      <span class="truncate">{section?.path ?? '—'} · {metrics.lines} lines · {metrics.bytes} B</span>
      <span class="ml-auto hidden shrink-0 sm:inline">Static · generated from opencode-skills/rea</span>
    </footer>
  </main>
</div>
