<script lang="ts">
  import { APP_NAME } from '../config';
  import Dropzone from './Dropzone.svelte';
  import ExportBar from './ExportBar.svelte';
  import Footer from './Footer.svelte';
  import LanguageSwitch from './LanguageSwitch.svelte';
  import Notices from './Notices.svelte';
  import ReviewTable from './ReviewTable.svelte';
  import Settings from './Settings.svelte';
  import { app } from './state.svelte';

  $effect(() => {
    document.documentElement.lang = app.lang;
  });
</script>

<div class="page">
  <header class="header">
    <div>
      <h1>{APP_NAME}</h1>
      <p class="tagline">{app.t.tagline}</p>
    </div>
    <LanguageSwitch />
  </header>

  <main class="stack">
    <Notices />
    <Dropzone />
    <Settings />
    <ReviewTable />
    <ExportBar />
  </main>

  <Footer />
</div>
