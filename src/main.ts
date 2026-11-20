import { mount, unmount } from 'svelte';
import App from './App.svelte';
import ReaDocs from './components/ReaDocs.svelte';
import './app.css';

const target = document.getElementById('app');

if (!target) {
  throw new Error('PromptForge: missing #app mount target.');
}

const isDocsRoute = (): boolean => window.location.hash.startsWith('#/docs/rea');

type Route = 'app' | 'docs';
let route: Route = isDocsRoute() ? 'docs' : 'app';
let instance = route === 'docs' ? mount(ReaDocs, { target }) : mount(App, { target });

window.addEventListener('hashchange', async () => {
  const next: Route = isDocsRoute() ? 'docs' : 'app';
  if (next === route) return;
  await unmount(instance);
  route = next;
  instance = next === 'docs' ? mount(ReaDocs, { target }) : mount(App, { target });
});
