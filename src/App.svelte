<script lang="ts">
  import CodeXml from '@lucide/svelte/icons/code-xml';
  import Eye from '@lucide/svelte/icons/eye';
  import EditorPane from './components/EditorPane.svelte';
  import Header from './components/Header.svelte';
  import PreviewPane from './components/PreviewPane.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import SkillLibrary from './components/SkillLibrary.svelte';
  import { workspace } from './lib/stores/workspace.svelte';
  import { exportMarkdown } from './lib/utils/download';

  let sidebarOpen = $state(false);
  let libraryOpen = $state(false);
  let item = $derived(workspace.active);

  // The drawer is only an overlay below lg; above lg the same aside is static
  // and must stay interactive, so `inert` is gated on the viewport.
  let isDesktop = $state(window.matchMedia('(min-width: 1024px)').matches);
  let drawerInert = $derived(!sidebarOpen && !isDesktop);

  let editorTabEl = $state<HTMLButtonElement | null>(null);
  let previewTabEl = $state<HTMLButtonElement | null>(null);

  $effect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const sync = () => (isDesktop = query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  });

  function closeSidebar(): void {
    sidebarOpen = false;
  }

  // Closing the overlay must not strand focus inside an inert subtree.
  let wasOpen = false;
  $effect(() => {
    const isOpen = sidebarOpen;
    if (!isOpen && wasOpen && !isDesktop) {
      const drawer = document.getElementById('doc-drawer');
      const active = document.activeElement;
      if (!active || active === document.body || drawer?.contains(active)) {
        document.getElementById('drawer-toggle')?.focus();
      }
    }
    wasOpen = isOpen;
  });

  function handleTabKey(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 'editor'
        : event.key === 'End'
          ? 'preview'
          : workspace.editorTab === 'editor'
            ? 'preview'
            : 'editor';
    workspace.setEditorTab(next);
    (next === 'editor' ? editorTabEl : previewTabEl)?.focus();
  }

  function handleGlobalKey(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (item) exportMarkdown(item);
    }
  }
</script>

<svelte:window onkeydown={handleGlobalKey} />

<div class="flex h-dvh min-h-0 flex-col gap-2.5 p-2.5 sm:p-3">
  <Header bind:sidebarOpen />

  <div class="flex min-h-0 flex-1 gap-2.5">
    {#if sidebarOpen}
      <button
        type="button"
        class="fixed inset-0 z-30 bg-black/45 backdrop-blur-[2px] lg:hidden"
        aria-label="Close sidebar"
        onclick={closeSidebar}
      ></button>
    {/if}

    <aside
      id="doc-drawer"
      inert={drawerInert}
      aria-hidden={drawerInert ? 'true' : undefined}
      class={`fixed bottom-3 left-3 right-3 top-[68px] z-40 transition-[translate,opacity] duration-[340ms] ease-out lg:static lg:inset-auto lg:z-auto lg:w-[19rem] lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto lg:transition-none ${sidebarOpen ? 'pointer-events-auto translate-x-0 opacity-100' : 'pointer-events-none -translate-x-[110%] opacity-0'}`}
      aria-label="Document library"
    >
      <div class="glass h-full overflow-hidden rounded-[20px]">
        <Sidebar onNavigate={closeSidebar} onOpenLibrary={() => (libraryOpen = true)} />
      </div>
    </aside>

    <main class="glass flex min-w-0 flex-1 flex-col overflow-hidden rounded-[20px]">
      <div class="shrink-0 px-3 pt-2.5 lg:hidden">
        <div class="segment" role="tablist" aria-label="Workspace view">
          <span
            class={`segment-thumb ${workspace.editorTab === 'preview' ? 'translate-x-full' : ''}`}
            aria-hidden="true"
          ></span>
          <button
            type="button"
            id="tab-editor"
            bind:this={editorTabEl}
            role="tab"
            aria-selected={workspace.editorTab === 'editor'}
            aria-controls="panel-editor"
            tabindex={workspace.editorTab === 'editor' ? 0 : -1}
            class={`relative z-10 flex h-11 items-center justify-center gap-1.5 rounded-lg text-[12px] font-medium transition-colors ${workspace.editorTab === 'editor' ? 'text-label' : 'text-label-2'}`}
            onclick={() => workspace.setEditorTab('editor')}
            onkeydown={handleTabKey}
          >
            <CodeXml size={14} /> Source
          </button>
          <button
            type="button"
            id="tab-preview"
            bind:this={previewTabEl}
            role="tab"
            aria-selected={workspace.editorTab === 'preview'}
            aria-controls="panel-preview"
            tabindex={workspace.editorTab === 'preview' ? 0 : -1}
            class={`relative z-10 flex h-11 items-center justify-center gap-1.5 rounded-lg text-[12px] font-medium transition-colors ${workspace.editorTab === 'preview' ? 'text-label' : 'text-label-2'}`}
            onclick={() => workspace.setEditorTab('preview')}
            onkeydown={handleTabKey}
          >
            <Eye size={14} /> Preview
          </button>
        </div>
      </div>

      <div class="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <div
          id="panel-editor"
          role="tabpanel"
          aria-labelledby="tab-editor"
          class={`min-h-0 min-w-0 ${workspace.editorTab === 'editor' ? 'block' : 'hidden'} lg:block lg:border-r lg:border-separator`}
        >
          <EditorPane />
        </div>
        <div
          id="panel-preview"
          role="tabpanel"
          aria-labelledby="tab-preview"
          class={`min-h-0 min-w-0 ${workspace.editorTab === 'preview' ? 'block' : 'hidden'} lg:block`}
        >
          <PreviewPane />
        </div>
      </div>
    </main>
  </div>

  <SkillLibrary open={libraryOpen} onClose={() => (libraryOpen = false)} />
</div>
