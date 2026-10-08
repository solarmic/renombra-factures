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
  <button type="button" class="btn btn-primary btn-lg" disabled={!app.canExport} onclick={() => app.exportZip()}>
    {app.exporting ? app.t.exporting : app.t.exportButton}
  </button>
</section>
