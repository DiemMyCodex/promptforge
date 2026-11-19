<script lang="ts">
  import CodeXml from '@lucide/svelte/icons/code-xml';
  import Hash from '@lucide/svelte/icons/hash';
  import ListChecks from '@lucide/svelte/icons/list-checks';
  import Plus from '@lucide/svelte/icons/plus';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Star from '@lucide/svelte/icons/star';
  import Trash from '@lucide/svelte/icons/trash';
  import X from '@lucide/svelte/icons/x';
  import { workspace } from '../lib/stores/workspace.svelte';
  import { countMetrics, parseFrontmatter } from '../lib/utils/tokens';

  let item = $derived(workspace.active);
  let metrics = $derived(countMetrics(item?.content ?? ''));
  let report = $derived(parseFrontmatter(item?.content ?? ''));

  let textarea = $state<HTMLTextAreaElement | null>(null);
  let tagDraft = $state('');

  const SNIPPETS: Array<{ label: string; title: string; value: string }> = [
    { label: 'Frontmatter', title: 'Insert YAML frontmatter', value: '---\nname: \ndescription: \n---\n' },
    { label: 'Section', title: 'Insert a section heading', value: '\n## \n' },
    { label: 'Checklist', title: 'Insert a task list', value: '\n- [ ] \n' },
    { label: 'Code fence', title: 'Insert a fenced code block', value: '\n~~~\n\n~~~\n' },
    {
      label: 'Hard rules',
      title: 'Insert a hard-rules block',
      value: '\n## Hard rules\n- Never invent behavior outside the spec.\n'
    }
  ];

  function handleContentInput(event: Event): void {
    if (!item) return;
    const target = event.currentTarget as HTMLTextAreaElement;
    workspace.updateItem(item.id, { content: target.value });
  }

  function handleTitleInput(event: Event): void {
    if (!item) return;
    const target = event.currentTarget as HTMLInputElement;
    workspace.updateItem(item.id, { title: target.value });
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
      });
      return;
    }

    workspace.updateItem(item.id, { content: value.slice(0, start) + '  ' + value.slice(end) });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 2, start + 2);
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
    });
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
</script>

<div class="flex h-full min-h-0 w-full flex-col bg-panel">
  {#if !item}
    <div class="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div class="grid size-12 place-items-center rounded-xl border border-line bg-surface text-accent">
        <Sparkles size={20} />
      </div>
      <h2 class="mt-4 text-sm font-semibold">No prompt selected</h2>
      <p class="mt-1 max-w-xs text-xs leading-relaxed text-faint">
        Pick one from the sidebar or create a blank document to start forging.
      </p>
      <button
        type="button"
        class="mt-4 inline-flex h-11 items-center gap-2 rounded-lg border border-accent/40 bg-accent-soft px-4 text-xs font-semibold text-accent transition-colors hover:border-accent"
        onclick={() => workspace.createBlank()}
      >
        <Plus size={15} /> New prompt
      </button>
    </div>
  {:else}
    <div class="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2 sm:px-4">
      <Hash size={14} class="shrink-0 text-faint" />
      <input
        value={item.title}
        oninput={handleTitleInput}
        aria-label="Prompt title"
        spellcheck="false"
        class="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-ink outline-none placeholder:text-faint"
        placeholder="Untitled prompt"
      />
      <button
        type="button"
        class="grid size-11 shrink-0 place-items-center rounded-md text-faint transition-colors hover:bg-raised hover:text-warn"
        aria-label={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
        onclick={() => workspace.updateItem(item.id, { favorite: !item.favorite })}
      >
        <Star size={15} class={item.favorite ? 'fill-warn text-warn' : ''} />
      </button>
      <button
        type="button"
        class="grid size-11 shrink-0 place-items-center rounded-md text-faint transition-colors hover:bg-raised hover:text-bad"
        aria-label="Delete prompt"
        onclick={() => {
          if (window.confirm(`Delete "${item.title}"? This cannot be undone.`)) {
            workspace.deleteItem(item.id);
          }
        }}
      >
        <Trash size={15} />
      </button>
    </div>

    <div class="pf-scroll flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-line px-3 py-2">
      <span class="shrink-0 pr-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
        Insert
      </span>
      {#each SNIPPETS as snippet (snippet.label)}
        <button
          type="button"
          title={snippet.title}
          class="h-8 shrink-0 rounded-md border border-line px-2.5 text-[11px] font-medium text-muted transition-colors hover:border-accent hover:text-ink"
          onclick={() => insertSnippet(snippet.value)}
        >
          {snippet.label}
        </button>
      {/each}
    </div>

    <div class="min-h-0 flex-1">
      <textarea
        bind:this={textarea}
        value={item.content}
        oninput={handleContentInput}
        onkeydown={handleKeyDown}
        spellcheck="false"
        aria-label="Prompt content editor"
        placeholder="Write your prompt here…"
        class="pf-scroll h-full w-full resize-none bg-transparent px-4 py-4 font-mono text-[13px] leading-6 text-ink outline-none placeholder:text-faint sm:px-5"
      ></textarea>
    </div>

    <div class="pf-scroll flex shrink-0 items-center gap-1.5 overflow-x-auto border-t border-line px-3 py-2">
      {#each item.tags as tag (tag)}
        <span
          class="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-line bg-surface pl-2.5 pr-1 text-[11px] text-muted"
        >
          #{tag}
          <button
            type="button"
            class="grid size-5 place-items-center rounded-full text-faint transition-colors hover:text-bad"
            aria-label={`Remove tag ${tag}`}
            onclick={() =>
              workspace.updateItem(
                item.id,
                { tags: item.tags.filter((entry) => entry !== tag) }
              )}
          >
            <X size={11} />
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
        class="h-8 w-20 shrink-0 bg-transparent text-[11px] text-ink outline-none placeholder:text-faint focus:w-28"
      />
    </div>

    <div
      class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-line bg-surface px-3 py-2 text-[11px] text-faint sm:px-4"
    >
      <span class="tabular"><span class="font-semibold text-muted">{metrics.tokens}</span> tokens</span>
      <span class="tabular">{metrics.words} words</span>
      <span class="tabular">{metrics.lines} lines</span>
      <span class="tabular">{metrics.chars} chars</span>
      <span class="tabular hidden sm:inline">{metrics.bytes} B</span>
      <span
        class={`ml-auto flex items-center gap-1 font-medium ${report.present && !report.valid ? 'text-bad' : 'text-good'}`}
      >
        <CodeXml size={12} />
        {#if !report.present}
          plain markdown
        {:else if report.valid}
          frontmatter ok
        {:else}
          {report.errors.length} issue{report.errors.length === 1 ? '' : 's'}
        {/if}
      </span>
    </div>

    <div class="hidden shrink-0 items-center gap-1.5 border-t border-line px-4 py-1.5 text-[10px] text-faint sm:flex">
      <ListChecks size={11} />
      Tab indents · Shift+Tab outdents · snippets insert at cursor
    </div>
  {/if}
</div>
