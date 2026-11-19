<script lang="ts">
  import CodeXml from '@lucide/svelte/icons/code-xml';
  import Eye from '@lucide/svelte/icons/eye';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import EditorPane from './components/EditorPane.svelte';
  import Header from './components/Header.svelte';
  import PreviewPane from './components/PreviewPane.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import { workspace } from './lib/stores/workspace.svelte';

  let sidebarOpen = $state(false);
  let item = $derived(workspace.active);
</script>

<div class="flex h-dvh min-h-0 flex-col overflow-hidden bg-canvas text-ink">
  <Header bind:sidebarOpen />

  <div class="flex min-h-0 flex-1">
    {#if sidebarOpen}
      <button
        type="button"
        class="fixed inset-x-0 bottom-0 top-14 z-30 bg-black/55 backdrop-blur-[2px] lg:hidden"
        aria-label="Close sidebar"
        onclick={() => (sidebarOpen = false)}
      ></button>
    {/if}

    <aside
      class={`fixed bottom-0 left-0 top-14 z-40 w-[min(88vw,20rem)] border-r border-line transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-[19rem] lg:translate-x-0 ${sidebarOpen ? 'translate-x-0 shadow-2xl shadow-black/40' : '-translate-x-full'}`}
      aria-label="Saved prompts"
    >
      <Sidebar onNavigate={() => (sidebarOpen = false)} />
    </aside>

    <main class="flex min-w-0 flex-1 flex-col">
      <div
        class="flex h-11 shrink-0 items-center gap-1 border-b border-line bg-surface px-2 lg:hidden"
        role="tablist"
        aria-label="Workspace view"
      >
        <button
          type="button"
          role="tab"
          aria-selected={workspace.editorTab === 'editor'}
          class={`flex h-10 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-colors ${workspace.editorTab === 'editor' ? 'bg-accent-soft text-accent' : 'text-muted'}`}
          onclick={() => workspace.setEditorTab('editor')}
        >
          <CodeXml size={14} /> Editor
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={workspace.editorTab === 'preview'}
          class={`flex h-10 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-colors ${workspace.editorTab === 'preview' ? 'bg-accent-soft text-accent' : 'text-muted'}`}
          onclick={() => workspace.setEditorTab('preview')}
        >
          <Eye size={14} /> Preview
        </button>
        <span class="ml-auto min-w-0 truncate px-2 text-[11px] text-faint">
          {item?.title ?? 'No prompt'}
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
    class="hidden h-7 shrink-0 items-center gap-2 border-t border-line px-4 text-[10px] text-faint lg:flex"
  >
    <Sparkles size={11} />
    <span>Local-first · no telemetry · no API keys</span>
    <span class="ml-auto tabular">Svelte 5 · Tailwind v4</span>
  </footer>
</div>
