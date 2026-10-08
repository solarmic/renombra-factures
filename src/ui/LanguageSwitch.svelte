<script lang="ts">
  import { LANGS } from './i18n';
  import { app } from './state.svelte';
</script>

<div class="lang" role="group" aria-label={app.t.language}>
  {#each LANGS as l (l.code)}
    <button
      type="button"
      class="lang-btn"
      aria-pressed={app.lang === l.code}
      lang={l.code}
      onclick={() => app.setLang(l.code)}
    >
      {l.code.toUpperCase()}
    </button>
  {/each}
</div>
