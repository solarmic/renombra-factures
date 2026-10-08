<script lang="ts">
  import { LANGS } from './i18n';
  import { app } from './state.svelte';
</script>

<div class="lang" role="group" aria-label={app.t.language}>
  {#each LANGS as l (l)}
    <button
      type="button"
      class="lang-btn"
      aria-pressed={app.lang === l}
      lang={l}
      onclick={() => app.setLang(l)}
    >
      {l.toUpperCase()}
    </button>
  {/each}
</div>
