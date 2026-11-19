<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import Star from '@lucide/svelte/icons/star';
  import Trash from '@lucide/svelte/icons/trash';
  import X from '@lucide/svelte/icons/x';
  import { workspace } from '../lib/stores/workspace.svelte';
  import type { PromptKind } from '../lib/types';
  import { countMetrics, parseFrontmatter } from '../lib/utils/tokens';

  let item = $derived(workspace.active);
  let metrics = $derived(countMetrics(item?.content ?? ''));
  let report = $derived(parseFrontmatter(item?.content ?? ''));
  let lineNumbers = $derived(Array.from({ length: metrics.lines }, (_, index) => index + 1));

  let textarea = $state<HTMLTextAreaElement | null>(null);
  let gutter = $state<HTMLDivElement | null>(null);
  let tagDraft = $state('');
  let cursor = $state({ line: 1, col: 1, selected: 0 });

  const KINDS: PromptKind[] = ['skill', 'agents', 'master', 'provider', 'snippet'];

  const SNIPPETS: Array<{ label: string; title: string; value: string }> = [
    { label: 'YAML', title: 'Insert YAML frontmatter', value: '---\nname: \ndescription: \n---\n' },
    { label: 'Heading', title: 'Insert a section heading', value: '\n## \n' },
    { label: 'Task', title: 'Insert a task list', value: '\n- [ ] \n' },
    { label: 'Fence', title: 'Insert a fenced code block', value: '\n~~~\n\n~~~\n' },
    {
      label: 'Rules',
      title: 'Insert a hard-rules block',
      value: '\n## Hard rules\n- Never invent behavior outside the spec.\n'
    }
  ];

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

  function handleContentInput(event: Event): void {
    if (!item) return;
    const target = event.currentTarget as HTMLTextAreaElement;
    workspace.updateItem(item.id, { content: target.value });
    updateCursor();
  }

  function handleTitleInput(event: Event): void {
    if (!item) return;
    const target = event.currentTarget as HTMLInputElement;
    workspace.updateItem(item.id, { title: target.value });
  }

  function handleKindChange(event: Event): void {
    if (!item) return;
    const target = event.currentTarget as HTMLSelectElement;
    workspace.updateItem(item.id, { kind: target.value as PromptKind });
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !textarea || !item) return;
    event.preventDefault();

    const el = textarea;
    const value = el.value;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const nextBreak = value.indexOf('\n', end);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;

    if (event.shiftKey) {
      const block = value.slice(lineStart, lineEnd);
      const outdented = block.replace(/^ {1,2}/gm, '');
      const removed = block.length - outdented.length;
      workspace.updateItem(item.id, {
        content: value.slice(0, lineStart) + outdented + value.slice(lineEnd)
      });
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(
          Math.max(lineStart, start - Math.min(2, removed)),
          Math.max(lineStart, end - removed)
        );
        updateCursor();
      });
      return;
    }

    if (start !== end) {
      const block = value.slice(lineStart, lineEnd);
      const indented = block.replace(/^/gm, '  ');
      const added = indented.length - block.length;
      workspace.updateItem(item.id, {
        content: value.slice(0, lineStart) + indented + value.slice(lineEnd)
      });
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + 2, end + added);
        updateCursor();
      });
      return;
    }

    workspace.updateItem(item.id, { content: value.slice(0, start) + '  ' + value.slice(end) });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 2, start + 2);
      updateCursor();
    });
  }

  function insertSnippet(value: string): void {
    if (!item || !textarea) return;

    const el = textarea;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    workspace.updateItem(item.id, {
      content: item.content.slice(0, start) + value + item.content.slice(end)
    });

    requestAnimationFrame(() => {
      el.focus();
      const caret = start + value.length;
      el.setSelectionRange(caret, caret);
      updateCursor();
    });
  }

  function syncGutter(): void {
    if (gutter && textarea) gutter.scrollTop = textarea.scrollTop;
  }

  function addTag(): void {
    if (!item) return;
    const tag = tagDraft.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-');
    tagDraft = '';
    if (tag === '' || item.tags.includes(tag)) return;
    workspace.updateItem(item.id, { tags: [...item.tags, tag] });
  }

  function handleTagKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addTag();
  }

  let status = $derived(!report.present ? 'PLAIN MD' : report.valid ? 'FRONTMATTER OK' : `${report.errors.length} ISSUE${report.errors.length === 1 ? '' : 'S'}`);
</script>

<div class="flex h-full min-h-0 w-full flex-col bg-panel">
  {#if !item}
    <div class="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <span class="mono text-[11px] uppercase tracking-widest text-faint">No document open</span>
      <p class="mt-2 max-w-xs text-xs leading-relaxed text-faint">
        Pick one from the library or create a blank file.
      </p>
      <button
        type="button"
        class="mt-4 flex h-11 items-center gap-2 rounded-md bg-accent px-4 text-[12px] font-semibold text-accent-ink transition-colors hover:brightness-95"
        onclick={() => workspace.createBlank()}
      >
        <Plus size={15} /> New document
      </button>
    </div>
  {:else}
    <div class="flex h-11 shrink-0 items-center gap-2 border-b border-line px-2 sm:px-3">
      <span class="micro hidden shrink-0 text-faint sm:block">File</span>
      <input
        value={item.title}
        oninput={handleTitleInput}
        aria-label="Document title"
        spellcheck="false"
        class="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-ink outline-none placeholder:text-faint"
        placeholder="Untitled"
      />
      <select
        value={item.kind}
        onchange={handleKindChange}
        aria-label="Document kind"
        class="mono h-7 shrink-0 rounded border border-line bg-surface px-1.5 text-[10px] uppercase tracking-wider text-muted outline-none hover:border-line-strong"
      >
        {#each KINDS as kind (kind)}
          <option value={kind}>{kind}</option>
        {/each}
      </select>
      <button
        type="button"
        class="grid size-11 shrink-0 place-items-center rounded text-faint transition-colors hover:bg-raised hover:text-warn"
        aria-label={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
        onclick={() => workspace.updateItem(item.id, { favorite: !item.favorite })}
      >
        <Star size={15} class={item.favorite ? 'fill-warn text-warn' : ''} />
      </button>
      <button
        type="button"
        class="grid size-11 shrink-0 place-items-center rounded text-faint transition-colors hover:bg-raised hover:text-bad"
        aria-label="Delete document"
        onclick={() => {
          if (window.confirm(`Delete "${item.title}"? This cannot be undone.`)) {
            workspace.deleteItem(item.id);
          }
        }}
      >
        <Trash size={15} />
      </button>
    </div>

    <div class="pf-scroll flex h-9 shrink-0 items-center overflow-x-auto border-b border-line px-2">
      <span class="micro mr-2 shrink-0 text-faint">Insert</span>
      {#each SNIPPETS as snippet (snippet.label)}
        <button
          type="button"
          title={snippet.title}
          class="mono h-8 shrink-0 border-r border-line px-2.5 text-[10px] uppercase tracking-wider text-muted transition-colors hover:bg-raised hover:text-ink"
          onclick={() => insertSnippet(snippet.value)}
        >
          {snippet.label}
        </button>
      {/each}
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <div
        bind:this={gutter}
        aria-hidden="true"
        class="no-scrollbar w-11 shrink-0 overflow-hidden border-r border-line bg-surface pt-4 text-right font-mono text-[12px] leading-6 text-faint select-none"
      >
        {#each lineNumbers as line (line)}
          <div class="tabular pr-2">{line}</div>
        {/each}
      </div>
      <textarea
        bind:this={textarea}
        value={item.content}
        oninput={handleContentInput}
        onkeydown={handleKeyDown}
        onkeyup={updateCursor}
        onclick={updateCursor}
        onscroll={syncGutter}
        wrap="off"
        spellcheck="false"
        aria-label="Document editor"
        placeholder="Write Markdown here…"
        class="pf-scroll h-full min-w-0 flex-1 resize-none bg-transparent px-3 py-4 font-mono text-[13px] leading-6 text-ink outline-none placeholder:text-faint"
      ></textarea>
    </div>

    <div class="pf-scroll flex shrink-0 items-center gap-2 overflow-x-auto border-t border-line px-3 py-1.5">
      {#each item.tags as tag (tag)}
        <span
          class="mono inline-flex h-6 shrink-0 items-center gap-1 rounded-sm border border-line bg-surface pl-2 pr-1 text-[10px] text-muted"
        >
          #{tag}
          <button
            type="button"
            class="grid size-5 place-items-center rounded-sm text-faint transition-colors hover:text-bad"
            aria-label={`Remove tag ${tag}`}
            onclick={() =>
              workspace.updateItem(item.id, {
                tags: item.tags.filter((entry) => entry !== tag)
              })}
          >
            <X size={10} />
          </button>
        </span>
      {/each}
      <input
        bind:value={tagDraft}
        onkeydown={handleTagKeyDown}
        type="text"
        maxlength="32"
        aria-label="Add a tag"
        placeholder="+ tag"
        class="mono h-7 w-20 shrink-0 bg-transparent text-[10px] text-ink outline-none placeholder:text-faint focus:w-28"
      />
    </div>

    <div
      class="flex h-7 shrink-0 items-center gap-3 border-t border-line bg-surface px-3 mono text-[10px] text-faint"
    >
      <span class="tabular">Ln {cursor.line}, Col {cursor.col}</span>
      {#if cursor.selected > 0}
        <span class="tabular hidden sm:inline">({cursor.selected} sel)</span>
      {/if}
      <span class="tabular ml-auto hidden sm:inline">{metrics.tokens} tk · {metrics.words} wd · {metrics.lines} ln</span>
      <span class="tabular">{metrics.chars} ch</span>
      <span class={report.present && !report.valid ? 'text-bad' : 'text-good'}>{status}</span>
    </div>
  {/if}
</div>
