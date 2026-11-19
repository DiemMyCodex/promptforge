<script lang="ts">
  import CodeXml from '@lucide/svelte/icons/code-xml';
  import Eye from '@lucide/svelte/icons/eye';
  import EditorPane from './components/EditorPane.svelte';
  import Header from './components/Header.svelte';
  import PreviewPane from './components/PreviewPane.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import { workspace } from './lib/stores/workspace.svelte';
  import { exportMarkdown } from './lib/utils/download';

  let sidebarOpen = $state(false);
  let item = $derived(workspace.active);

  function handleGlobalKey(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (item) exportMarkdown(item);
    }
  }
</script>

<svelte:window onkeydown={handleGlobalKey} />

<div class="flex h-dvh min-h-0 flex-col overflow-hidden bg-canvas text-ink">
  <Header bind:sidebarOpen />

  <div class="flex min-h-0 flex-1">
    {#if sidebarOpen}
      <button
        type="button"
        class="fixed inset-x-0 bottom-0 top-[52px] z-30 bg-black/60 lg:hidden"
        aria-label="Close sidebar"
        onclick={() => (sidebarOpen = false)}
      ></button>
    {/if}

    <aside
      class={`fixed bottom-0 left-0 top-[52px] z-40 w-[min(88vw,20rem)] border-r border-line transition-transform duration-150 ease-out lg:static lg:z-auto lg:w-[19rem] lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      aria-label="Document library"
    >
      <Sidebar onNavigate={() => (sidebarOpen = false)} />
    </aside>

    <main class="flex min-w-0 flex-1 flex-col">
      <div
        class="flex h-11 shrink-0 items-stretch border-b border-line bg-surface px-2 lg:hidden"
        role="tablist"
        aria-label="Workspace view"
      >
        <button
          type="button"
          role="tab"
          aria-selected={workspace.editorTab === 'editor'}
          class={`relative flex items-center gap-1.5 px-3 mono text-[10px] uppercase tracking-wider ${workspace.editorTab === 'editor' ? 'text-ink' : 'text-faint'}`}
          onclick={() => workspace.setEditorTab('editor')}
        >
          <CodeXml size={13} /> Editor
          {#if workspace.editorTab === 'editor'}
            <span class="absolute inset-x-2 bottom-0 h-0.5 bg-accent"></span>
          {/if}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={workspace.editorTab === 'preview'}
          class={`relative flex items-center gap-1.5 px-3 mono text-[10px] uppercase tracking-wider ${workspace.editorTab === 'preview' ? 'text-ink' : 'text-faint'}`}
          onclick={() => workspace.setEditorTab('preview')}
        >
          <Eye size={13} /> Preview
          {#if workspace.editorTab === 'preview'}
            <span class="absolute inset-x-2 bottom-0 h-0.5 bg-accent"></span>
          {/if}
        </button>
        <span class="ml-auto min-w-0 truncate self-center px-2 mono text-[10px] text-faint">
          {item?.title ?? 'none'}
        </span>
      </div>

      <div class="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <section
          class={`min-h-0 min-w-0 ${workspace.editorTab === 'editor' ? 'block' : 'hidden'} lg:block lg:border-r lg:border-line`}
          aria-label="Editor"
        >
          <EditorPane />
        </section>
        <section
          class={`min-h-0 min-w-0 ${workspace.editorTab === 'preview' ? 'block' : 'hidden'} lg:block`}
          aria-label="Preview"
        >
          <PreviewPane />
        </section>
      </div>
    </main>
  </div>

  <footer
    class="hidden h-6 shrink-0 items-center gap-2 border-t border-line bg-surface px-3 mono text-[10px] text-faint lg:flex"
  >
    <span class="dot text-good"></span>
    <span>Local session</span>
    <span class="ml-auto tabular">PF/1.0 · Svelte 5</span>
  </footer>
</div>
