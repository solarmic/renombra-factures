<script lang="ts">
  let { lead, label, href }: { lead: string; label: string; href: string } = $props();
</script>

<a class="site-link" {href}>
  <span class="muted">{lead}</span>
  <span class="site-link-go">{label} <span aria-hidden="true">→</span></span>
</a>
