<script lang="ts">
  import { app } from './state.svelte';
</script>

<section class="notice notice-privacy" aria-labelledby="privacy-title">
  <svg class="notice-icon" viewBox="0 0 24 24" aria-hidden="true" width="24" height="24">
    <path
      d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1 14-3.5-3.5 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6Z"
      fill="currentColor"
    />
  </svg>
  <div>
    <h2 id="privacy-title">{app.t.privacyTitle}</h2>
    <p>{app.t.privacyBody}</p>
  </div>
</section>

{#if app.hasImages}
  <section class="notice notice-info" role="status" aria-labelledby="image-title">
    <div>
      <h2 id="image-title">{app.t.imageNoticeTitle}</h2>
      <p>{app.t.imageNoticeBody}</p>
    </div>
  </section>
{/if}

{#if app.ignored.length > 0}
  <section class="notice notice-warn" role="status" aria-labelledby="ignored-title">
    <div>
      <h2 id="ignored-title">{app.t.ignoredTitle}</h2>
      <p>{app.t.ignoredBody(app.ignored.length)}</p>
      <ul class="ignored-list">
        {#each app.ignored as name, i (i)}
          <li>{name}</li>
        {/each}
      </ul>
    </div>
    <button type="button" class="btn btn-quiet" onclick={() => app.dismissIgnored()}>{app.t.dismiss}</button>
  </section>
{/if}
