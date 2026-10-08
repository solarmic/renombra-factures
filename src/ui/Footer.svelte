<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DONATION_URL } from '../config';

  let {
    credit,
    hint,
    donate,
    extra,
  }: { credit: string; hint: string; donate: string; extra?: Snippet } = $props();
</script>

<footer class="footer">
  <div>
    <p class="muted">{credit}</p>
    <p class="muted small">{hint}</p>
    {#if extra}{@render extra()}{/if}
  </div>
  <a class="btn btn-coffee" href={DONATION_URL} target="_blank" rel="noopener noreferrer">
    <span aria-hidden="true">☕</span> {donate}
  </a>
</footer>
