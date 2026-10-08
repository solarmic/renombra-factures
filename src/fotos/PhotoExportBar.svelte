<script lang="ts">
  import { photos } from './photoState.svelte';

  const message = $derived(
    photos.placesStatus === 'loading'
      ? photos.t.placesLoading
      : photos.readyCount > 0
        ? photos.t.readyCount(photos.readyCount)
        : photos.t.nothingToExport,
  );
</script>

<section class="export" aria-label={photos.t.exportButton}>
  <p class="export-msg" role="status">{message}</p>
  {#if photos.exportFailed}
    <p class="export-msg warn" role="alert">{photos.t.exportError}</p>
  {/if}
  <button type="button" class="btn btn-primary btn-lg" disabled={!photos.canExport} onclick={() => photos.exportZip()}>
    {photos.exporting ? photos.t.exporting : photos.t.exportButton}
  </button>
</section>
