<script lang="ts">
  import type { DropMode } from './dropMode';

  let {
    onFiles,
    accept,
    title,
    hint,
    button,
    activeTitle,
    mode,
    batch,
    loadedTitle,
    loadedHint,
    addMore,
    readingText,
    seeResults,
    status,
    resultsId,
  }: {
    onFiles: (files: File[]) => void | Promise<void>;
    accept: string;
    title: string;
    hint: string;
    button: string;
    activeTitle: string;
    mode: DropMode;
    /** Changes every time a batch finishes loading; each change flashes the dropzone. */
    batch: number;
    loadedTitle: string;
    loadedHint: string;
    addMore: string;
    readingText: string;
    seeResults: string;
    /** Announced politely to screen readers once a batch is loaded. */
    status: string;
    /** Id of the (focusable) heading of the results section. */
    resultsId: string;
  } = $props();

  let flash = $state(false);
  let lastBatch = 0;
  $effect(() => {
    if (batch === lastBatch) return;
    lastBatch = batch;
    flash = false;
    // Restart the CSS animation on every batch.
    const start = setTimeout(() => (flash = true), 20);
    const stop = setTimeout(() => (flash = false), 1600);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
    };
  });

  function showResults() {
    const target = document.getElementById(resultsId);
    if (!target) return;
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  }

  let dragging = $state(false);
  let depth = 0;
  let input: HTMLInputElement;

  function onDrop(event: DragEvent) {
    event.preventDefault();
    depth = 0;
    dragging = false;
    if (event.dataTransfer?.files.length) void onFiles(Array.from(event.dataTransfer.files));
  }

  async function onPick() {
    if (!input.files?.length) return;
    // Reset only after reading: clearing the input can invalidate its File handles.
    await onFiles(Array.from(input.files));
    input.value = '';
  }
</script>

<section
  class="dropzone"
  class:dragging
  class:loaded={mode === 'loaded'}
  class:reading={mode === 'reading'}
  class:flash
  aria-label={title}
  ondragenter={(e) => {
    e.preventDefault();
    depth++;
    dragging = true;
  }}
  ondragover={(e) => e.preventDefault()}
  ondragleave={() => {
    depth = Math.max(0, depth - 1);
    if (depth === 0) dragging = false;
  }}
  ondrop={onDrop}
>
  {#if mode === 'loaded' && !dragging}
    <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true" class="drop-icon drop-icon-ok">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.6 14.4L6 12l1.4-1.4 3 3 6.2-6.2L18 9l-7.600 7.400Z" fill="currentColor" />
    </svg>
  {:else}
    <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true" class="drop-icon">
      <path d="M19 15v4H5v-4H3v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4h-2ZM11 3v9.2L8.4 9.6 7 11l5 5 5-5-1.4-1.4-2.6 2.6V3h-2Z" fill="currentColor" />
    </svg>
  {/if}
  <p class="drop-title">
    {#if dragging}{activeTitle}{:else if mode === 'loaded'}{loadedTitle}{:else if mode === 'reading'}{readingText}{:else}{title}{/if}
  </p>
  <p class="muted">{mode === 'empty' || dragging ? hint : loadedHint}</p>
  <div class="drop-actions">
    <button type="button" class="btn btn-primary" onclick={() => input.click()}>{mode === 'empty' ? button : addMore}</button>
    {#if mode === 'loaded'}
      <button type="button" class="btn btn-quiet" onclick={showResults}>{seeResults} <span aria-hidden="true">↓</span></button>
    {/if}
  </div>
  <span class="visually-hidden" role="status" aria-live="polite">{status}</span>
  <input
    bind:this={input}
    type="file"
    multiple
    class="visually-hidden"
    {accept}
    tabindex="-1"
    onchange={onPick}
  />
</section>
