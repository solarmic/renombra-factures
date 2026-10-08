<script lang="ts">
  import { APP_NAME, FOTOS_URL } from '../config';
  import Dropzone from './Dropzone.svelte';
  import ExportBar from './ExportBar.svelte';
  import Footer from './Footer.svelte';
  import SiteLink from './SiteLink.svelte';
  import HeroEmblem from './HeroEmblem.svelte';
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
  <header class="hero">
    <div class="hero-top">
      <p class="eyebrow">{app.t.eyebrow}</p>
      <div class="hero-tools">
        <SiteLink lead={app.t.otherSiteLead} label={app.t.otherSiteLabel} href={FOTOS_URL} />
        <LanguageSwitch label={app.t.language} />
      </div>
    </div>
    <div class="hero-body">
      <HeroEmblem />
      <div class="hero-text">
        <h1>{APP_NAME}</h1>
        <p class="tagline">{app.t.tagline}</p>
      </div>
    </div>
  </header>

  <main class="stack">
    <Notices />
    <Dropzone
      onFiles={(files) => app.addFiles(files)}
      accept=".pdf,application/pdf,image/*,.heic,.heif"
      title={app.t.dropTitle}
      hint={app.t.dropHint}
      button={app.t.dropButton}
      activeTitle={app.t.dropActive}
      mode={app.dropMode}
      batch={app.batchDone}
      loadedTitle={app.t.loadedTitle(app.entries.length)}
      loadedHint={app.t.loadedHint}
      addMore={app.t.addMore}
      readingText={app.t.readingProgress(app.entries.length - app.pendingCount, app.entries.length)}
      seeResults={app.t.seeResults}
      status={app.dropMode === 'loaded' ? app.t.loadedStatus(app.entries.length, app.ignored.length) : ''}
      resultsId="table-title"
    />
    <Settings />
    <ReviewTable />
    <ExportBar />
  </main>

  <Footer credit={app.t.credit(new Date().getFullYear())} hint={app.t.donateHint} donate={app.t.donate} />
</div>
