<script lang="ts">
  import FileText from '@lucide/svelte/icons/file-text';
  import Star from '@lucide/svelte/icons/star';
  import { workspace } from '../lib/stores/workspace.svelte';
  import { countMetrics, parseFrontmatter } from '../lib/utils/tokens';

  let item = $derived(workspace.active);
  let metrics = $derived(countMetrics(item?.content ?? ''));
  let report = $derived(parseFrontmatter(item?.content ?? ''));
  let lineNumbers = $derived(Array.from({ length: metrics.lines }, (_, index) => index + 1));

  let textarea = $state<HTMLTextAreaElement | null>(null);
  let gutter = $state<HTMLDivElement | null>(null);
  let cursor = $state({ line: 1, col: 1, selected: 0 });

  function updateCursor(): void {
    const el = textarea;
    if (!el) return;
    const before = el.value.slice(0, el.selectionStart);
    const lines = before.split('\n');
    cursor = {
      line: lines.length,
      col: (lines[lines.length - 1]?.length ?? 0) + 1,
      selected: Math.abs(el.selectionEnd - el.selectionStart)
    };
  }

  function syncGutter(): void {
    if (gutter && textarea) gutter.scrollTop = textarea.scrollTop;
  }

  let status = $derived(
    !report.present
      ? 'PLAIN MD'
      : report.valid
        ? 'FRONTMATTER OK'
        : `${report.errors.length} ISSUE${report.errors.length === 1 ? '' : 'S'}`
  );
</script>

<div class="flex h-full min-h-0 w-full flex-col">
  {#if !item}
    <div class="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div
        class="grid size-12 place-items-center rounded-[14px] border border-separator bg-fill text-label-3"
      >
        <FileText size={20} />
      </div>
      <p class="mt-3 text-[13px] font-medium text-label">No document open</p>
      <p class="mt-1 max-w-xs text-[11px] leading-relaxed text-label-3">
        Pick one from the library.
      </p>
    </div>
  {:else}
    <div class="flex h-[52px] shrink-0 items-center gap-2 border-b border-separator px-3">
      <span class="micro hidden sm:block">File</span>
      <span
        class="min-w-0 flex-1 truncate text-[14px] font-medium tracking-[-0.01em] text-label"
        title={item.title}
      >
        {item.title}
      </span>
      <span
        class="mono h-7 shrink-0 rounded-full border border-separator bg-fill px-2.5 text-[10px] uppercase tracking-wide text-label-2"
      >
        {item.kind}
      </span>
      {#if item.favorite}
        <span class="grid size-7 shrink-0 place-items-center text-warn" title="Favorite">
          <Star size={15} class="fill-warn" aria-hidden="true" />
        </span>
      {/if}
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <div
        bind:this={gutter}
        aria-hidden="true"
        class="no-scrollbar w-10 shrink-0 overflow-hidden border-r border-separator bg-fill/40 pt-4 text-right font-mono text-[12px] leading-6 text-label-3 select-none"
      >
        {#each lineNumbers as line (line)}
          <div class="tabular pr-2.5">{line}</div>
        {/each}
      </div>
      <textarea
        bind:this={textarea}
        readonly
        value={item.content}
        onkeyup={updateCursor}
        onclick={updateCursor}
        onscroll={syncGutter}
        wrap="off"
        spellcheck="false"
        aria-label="Document source"
        class="scroll-thin h-full min-w-0 flex-1 resize-none bg-transparent px-3 py-4 font-mono text-[13px] leading-6 tracking-[-0.01em] text-label outline-none"
      ></textarea>
    </div>

    {#if item.tags.length}
      <div class="scroll-thin flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-separator px-3 py-2">
        {#each item.tags as tag (tag)}
          <span
            class="mono inline-flex h-7 shrink-0 items-center rounded-full border border-separator bg-fill px-2.5 text-[10px] text-label-2"
          >
            #{tag}
          </span>
        {/each}
      </div>
    {/if}

    <div
      class="flex h-7 shrink-0 items-center gap-2 bg-fill/50 px-3 mono text-[10px] text-label-3"
    >
      <span class="tabular">Ln {cursor.line}, Col {cursor.col}</span>
      {#if cursor.selected > 0}
        <span class="tabular hidden sm:inline">({cursor.selected} sel)</span>
      {/if}
      <span class="tabular ml-auto hidden sm:inline">
        {metrics.tokens} tk · {metrics.words} wd · {metrics.lines} ln
      </span>
      <span class="tabular">{metrics.chars} ch</span>
      <span class={report.present && !report.valid ? 'text-bad' : 'text-good'}>{status}</span>
    </div>
  {/if}
</div>
