<script lang="ts">
  import { photos, type PhotoRow } from './photoState.svelte';

  const two = (n: number) => String(n).padStart(2, '0');

  function when(row: PhotoRow): string {
    if (row.key.tier === 1) return photos.t.counterOnly(row.key.value);
    const m = row.key.moment;
    const date = `${m.y}-${two(m.m)}-${two(m.d)}`;
    // File dates keep the time too; only name-day-only photos (WhatsApp) show just the day.
    return row.key.source === 'name' && m.hh === 0 && m.mi === 0 && m.ss === 0 ? date : `${date} ${two(m.hh)}:${two(m.mi)}`;
  }

  const sourceLabel = (row: PhotoRow) =>
    row.key.source === 'exif' ? photos.t.sourceExif : row.key.source === 'name' ? photos.t.sourceName : photos.t.sourceFile;

  let failedThumbs = $state(new Set<number>());
</script>

<section class="card" aria-labelledby="table-title">
  <div class="card-head">
    <h2 id="table-title">{photos.t.tableTitle}</h2>
    {#if photos.entries.length > 0}
      <button type="button" class="btn btn-quiet" onclick={() => photos.clear()}>{photos.t.clear}</button>
    {/if}
  </div>

  {#if photos.entries.length === 0}
    <p class="muted">{photos.t.tableEmpty}</p>
  {:else}
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">{photos.t.colInclude}</th>
            <th scope="col">{photos.t.colPhoto}</th>
            <th scope="col">{photos.t.colOriginal}</th>
            <th scope="col">{photos.t.colWhen}</th>
            <th scope="col">{photos.t.colPlace}</th>
            <th scope="col">{photos.t.colNewName}</th>
            <th scope="col"><span class="visually-hidden">{photos.t.colRemove}</span></th>
          </tr>
        </thead>
        <tbody>
          {#each photos.rows as row (row.entry.id)}
            {@const e = row.entry}
            <tr class:excluded={!e.included}>
              <td data-label={photos.t.colInclude}>
                <input type="checkbox" class="check" bind:checked={e.included} aria-label={`${photos.t.colInclude}: ${e.file.name}`} />
              </td>
              <td data-label={photos.t.colPhoto}>
                {#if e.thumb && !failedThumbs.has(e.id)}
                  <img class="thumb" src={e.thumb} alt="" loading="lazy" decoding="async" onerror={() => (failedThumbs = new Set(failedThumbs).add(e.id))} />
                {:else}
                  <span class="thumb-blank" aria-hidden="true">{e.file.name.split('.').pop()?.slice(0, 4).toUpperCase()}</span>
                {/if}
              </td>
              <td data-label={photos.t.colOriginal} class="name">{e.file.name}</td>
              <td data-label={photos.t.colWhen}>
                {#if e.status === 'reading'}
                  <span class="badge badge-muted">{photos.t.reading}</span>
                {:else}
                  <div class="cell-stack">
                    <span class="when">{when(row)}</span>
                    <span class="badge badge-{row.key.source}">{sourceLabel(row)}</span>
                  </div>
                {/if}
              </td>
              <td data-label={photos.t.colPlace}>
                {#if row.place}{row.place}{:else}<span class="muted">{photos.t.noPlace}</span>{/if}
              </td>
              <td data-label={photos.t.colNewName} class="name">
                {#if row.newName}
                  <code>{#if row.folder}<span class="path-folder">{row.folder}/</span>{/if}{row.newName}</code>
                {:else}
                  <span class="muted">{photos.t.excluded}</span>
                {/if}
              </td>
              <td data-label={photos.t.colRemove}>
                <button type="button" class="btn btn-quiet" onclick={() => photos.remove(e)}>{photos.t.remove}</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
