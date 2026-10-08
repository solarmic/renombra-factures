<script lang="ts">
  let {
    onFiles,
    accept,
    title,
    hint,
    button,
    activeTitle,
  }: {
    onFiles: (files: File[]) => void | Promise<void>;
    accept: string;
    title: string;
    hint: string;
    button: string;
    activeTitle: string;
  } = $props();

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
  <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true" class="drop-icon">
    <path d="M19 15v4H5v-4H3v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4h-2ZM11 3v9.2L8.4 9.6 7 11l5 5 5-5-1.4-1.4-2.6 2.6V3h-2Z" fill="currentColor" />
  </svg>
  <p class="drop-title">{dragging ? activeTitle : title}</p>
  <p class="muted">{hint}</p>
  <button type="button" class="btn btn-primary" onclick={() => input.click()}>{button}</button>
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
