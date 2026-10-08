<script lang="ts">
  import { DONATION_URL } from '../config';
  import { app } from './state.svelte';

  const year = new Date().getFullYear();
</script>

<footer class="footer">
  <div>
    <p class="muted">{app.t.credit(year)}</p>
    <p class="muted small">{app.t.donateHint}</p>
  </div>
  <a class="btn btn-coffee" href={DONATION_URL} target="_blank" rel="noopener noreferrer">
    <span aria-hidden="true">☕</span> {app.t.donate}
  </a>
</footer>
