<script lang="ts">
  import { photos } from './photoState.svelte';
</script>

<section class="notice notice-privacy" aria-labelledby="privacy-title">
  <svg class="notice-icon" viewBox="0 0 24 24" aria-hidden="true" width="24" height="24">
    <path
      d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1 14-3.5-3.5 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6Z"
      fill="currentColor"
    />
  </svg>
  <div>
    <h2 id="privacy-title">{photos.t.privacyTitle}</h2>
    <p>{photos.t.privacyBody}</p>
  </div>
</section>

{#if photos.undatedCount > 0}
  <section class="notice notice-info" role="status" aria-labelledby="nodate-title">
    <div>
      <h2 id="nodate-title">{photos.t.noDateTitle}</h2>
      <p>{photos.t.noDateBody(photos.undatedCount)}</p>
    </div>
  </section>
{/if}

{#if photos.needsPlaces && photos.noGpsCount > 0}
  <section class="notice notice-info" role="status" aria-labelledby="nogps-title">
    <div>
      <h2 id="nogps-title">{photos.t.noGpsTitle}</h2>
      <p>{photos.t.noGpsBody(photos.noGpsCount)}</p>
    </div>
  </section>
{/if}

{#if photos.placesStatus === 'error'}
  <section class="notice notice-warn" role="alert" aria-labelledby="places-title">
    <div>
      <h2 id="places-title">{photos.t.placesErrorTitle}</h2>
      <p>{photos.t.placesErrorBody}</p>
    </div>
    <button type="button" class="btn btn-quiet" onclick={() => photos.retryPlaces()}>{photos.t.retry}</button>
  </section>
{/if}

{#if photos.ignored.length > 0}
  <section class="notice notice-warn" role="status" aria-labelledby="ignored-title">
    <div>
      <h2 id="ignored-title">{photos.t.ignoredTitle}</h2>
      <p>{photos.t.ignoredBody(photos.ignored.length)}</p>
      <ul class="ignored-list">
        {#each photos.ignored as name, i (i)}
          <li>{name}</li>
        {/each}
      </ul>
    </div>
    <button type="button" class="btn btn-quiet" onclick={() => photos.dismissIgnored()}>{photos.t.dismiss}</button>
  </section>
{/if}
