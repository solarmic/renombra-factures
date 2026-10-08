<script lang="ts">
  import { formatISO, parseISO } from '../domain/types';
  import { app } from './state.svelte';

  const sourceLabel = (s: 'content' | 'filename' | 'manual' | null) =>
    s === 'content'
      ? app.t.sourceContent
      : s === 'filename'
        ? app.t.sourceFilename
        : s === 'manual'
          ? app.t.sourceManual
          : app.t.sourceNone;
</script>

<section class="card" aria-labelledby="table-title">
  <div class="card-head">
    <h2 id="table-title">{app.t.tableTitle}</h2>
    {#if app.entries.length > 0}
      <button type="button" class="btn btn-quiet" onclick={() => app.clear()}>{app.t.clear}</button>
    {/if}
  </div>

  {#if app.entries.length === 0}
    <p class="muted">{app.t.tableEmpty}</p>
  {:else}
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">{app.t.colInclude}</th>
            <th scope="col">{app.t.colOriginal}</th>
            <th scope="col">{app.t.colKind}</th>
            <th scope="col">{app.t.colDate}</th>
            <th scope="col">{app.t.colNewName}</th>
            <th scope="col"><span class="visually-hidden">{app.t.colRemove}</span></th>
          </tr>
        </thead>
        <tbody>
          {#each app.rows as row (row.entry.id)}
            {@const e = row.entry}
            <tr class:excluded={!e.included} class:missing={e.included && !row.date && e.status !== 'reading'}>
              <td data-label={app.t.colInclude}>
                <input
                  type="checkbox"
                  class="check"
                  bind:checked={e.included}
                  aria-label={`${app.t.colInclude}: ${e.file.name}`}
                />
              </td>
              <td data-label={app.t.colOriginal} class="name">{e.file.name}</td>
              <td data-label={app.t.colKind}>
                <span class="tag">{e.kind === 'pdf' ? app.t.kindPdf : app.t.kindImage}</span>
              </td>
              <td data-label={app.t.colDate}>
                <div class="date-cell">
                  <input
                    type="date"
                    class="input"
                    value={row.date ? formatISO(row.date) : ''}
                    aria-label={`${app.t.colDate}: ${e.file.name}`}
                    onchange={(ev) => app.setManualDate(e, parseISO(ev.currentTarget.value))}
                  />
                  {#if e.status === 'reading'}
                    <span class="badge badge-muted">{app.t.reading}</span>
                  {:else}
                    <span class="badge badge-{row.source ?? 'none'}">{sourceLabel(row.source)}</span>
                  {/if}
                </div>
                {#if e.status === 'error'}
                  <p class="small hint">{app.t.readError}</p>
                {:else if e.noText && !row.date}
                  <p class="small hint">{app.t.scannedPdf}</p>
                {/if}
              </td>
              <td data-label={app.t.colNewName} class="name">
                {#if row.newName}
                  <code>{row.newName}</code>
                {:else}
                  <span class="muted">{e.included ? app.t.notNumbered : app.t.excluded}</span>
                {/if}
              </td>
              <td data-label={app.t.colRemove}>
                <button type="button" class="btn btn-quiet" onclick={() => app.remove(e)}>{app.t.remove}</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
