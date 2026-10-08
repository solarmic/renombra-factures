<script lang="ts">
  import { app } from './state.svelte';

  const message = $derived(
    app.missingDates > 0
      ? app.t.missing(app.missingDates)
      : app.readyCount > 0
        ? app.t.readyCount(app.readyCount)
        : app.t.nothingToExport,
  );
</script>

<section class="export" aria-label={app.t.exportButton}>
  <p class="export-msg" class:warn={app.missingDates > 0} role="status">{message}</p>
  {#if app.exportFailed}
    <p class="export-msg warn" role="alert">{app.t.exportError}</p>
  {/if}
  <button type="button" class="btn btn-primary btn-lg" disabled={!app.canExport} onclick={() => app.exportZip()}>
    {app.exporting ? app.t.exporting : app.t.exportButton}
  </button>
</section>
