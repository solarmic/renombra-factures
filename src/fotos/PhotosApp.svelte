<script lang="ts">
  import { FACTURES_URL } from '../config';
  import Dropzone from '../ui/Dropzone.svelte';
  import Footer from '../ui/Footer.svelte';
  import LanguageSwitch from '../ui/LanguageSwitch.svelte';
  import SiteLink from '../ui/SiteLink.svelte';
  import PhotoExportBar from './PhotoExportBar.svelte';
  import PhotoNotices from './PhotoNotices.svelte';
  import PhotoSettings from './PhotoSettings.svelte';
  import PhotoTable from './PhotoTable.svelte';
  import { photos } from './photoState.svelte';
  import { langState } from '../ui/lang.svelte';

  $effect(() => {
    document.documentElement.lang = langState.lang;
    document.title = photos.t.documentTitle;
  });

  // Fetch the places dataset as soon as it becomes both needed (template/folders) and useful (GPS photos).
  $effect(() => {
    if (photos.needsPlaces && photos.entries.some((e) => e.gps)) void photos.syncPlaces();
  });
</script>

<div class="page">
  <header class="hero">
    <div class="hero-top">
      <p class="eyebrow">{photos.t.eyebrow}</p>
      <div class="hero-tools">
        <SiteLink lead={photos.t.otherSiteLead} label={photos.t.otherSiteLabel} href={FACTURES_URL} />
        <LanguageSwitch label={photos.t.language} />
      </div>
    </div>
    <div class="hero-text">
      <h1 class="photo-title">
        <span class="title-line">{photos.t.heroLine1}</span>
        <span class="camera">
          <span class="cam-hump" aria-hidden="true"></span>
          <span class="cam-shutter" aria-hidden="true"></span>
          <span class="cam-flash" aria-hidden="true"></span>
          <span class="cam-lens" aria-hidden="true"></span>
          <span class="cam-text">{photos.t.heroLine2}</span>
        </span>
      </h1>
      <p class="tagline">{photos.t.tagline}</p>
    </div>
  </header>

  <main class="stack">
    <PhotoNotices />
    <Dropzone
      onFiles={(files) => photos.addFiles(files)}
      accept=".jpg,.jpeg,.png,.heic,.heif,.webp,.tif,.tiff,.gif,image/jpeg,image/png,image/heic,image/heif,image/webp,image/tiff,image/gif"
      title={photos.t.dropTitle}
      hint={photos.t.dropHint}
      button={photos.t.dropButton}
      activeTitle={photos.t.dropActive}
    />
    <PhotoSettings />
    <PhotoTable />
    <PhotoExportBar />
  </main>

  <Footer credit={photos.t.credit(new Date().getFullYear())} hint={photos.t.donateHint} donate={photos.t.donate}>
    {#snippet extra()}
      <p class="muted small">
        {photos.t.attribution}
        <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">GeoNames</a>
        {photos.t.attributionLicense}
      </p>
    {/snippet}
  </Footer>
</div>

