<script lang="ts">
  import { LANGS } from './i18n';
  import { langState } from './lang.svelte';

  let { label }: { label: string } = $props();
</script>

<div class="lang" role="group" aria-label={label}>
  {#each LANGS as l (l)}
    <button
      type="button"
      class="lang-btn"
      aria-pressed={langState.lang === l}
      lang={l}
      onclick={() => langState.setLang(l)}
    >
      {l.toUpperCase()}
    </button>
  {/each}
</div>
