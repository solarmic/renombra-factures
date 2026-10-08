<script lang="ts">
  import { photos } from './photoState.svelte';

  let templateInput: HTMLInputElement;

  const tokens = $derived([
    { token: '{n}', label: photos.t.tokenN },
    { token: '{n:2}', label: photos.t.tokenNPad },
    { token: '{t1}', label: photos.t.tokenT1 },
    { token: '{t2}', label: photos.t.tokenT2 },
    { token: '{yyyy}', label: photos.t.tokenYYYY },
    { token: '{mm}', label: photos.t.tokenMM },
    { token: '{dd}', label: photos.t.tokenDD },
    { token: '{hh}', label: photos.t.tokenHH },
    { token: '{min}', label: photos.t.tokenMin },
    { token: '{place}', label: photos.t.tokenPlace },
    { token: '{name}', label: photos.t.tokenName },
  ]);

  function insert(token: string) {
    const start = templateInput.selectionStart ?? photos.template.length;
    const end = templateInput.selectionEnd ?? start;
    photos.template = photos.template.slice(0, start) + token + photos.template.slice(end);
    const caret = start + token.length;
    queueMicrotask(() => {
      templateInput.focus();
      templateInput.setSelectionRange(caret, caret);
    });
  }
</script>

<section class="card" aria-labelledby="settings-title">
  <h2 id="settings-title">{photos.t.settingsTitle}</h2>

  <div class="grid-4">
    <div class="field">
      <label for="t1">{photos.t.t1Label}</label>
      <input id="t1" class="input" type="text" bind:value={photos.t1} placeholder={photos.t.t1Placeholder} autocomplete="off" />
    </div>
    <div class="field">
      <label for="t2">{photos.t.t2Label}</label>
      <input id="t2" class="input" type="text" bind:value={photos.t2} placeholder={photos.t.t2Placeholder} autocomplete="off" />
    </div>
  </div>

  <div class="field">
    <label for="template">{photos.t.templateLabel}</label>
    <input id="template" bind:this={templateInput} class="input mono" type="text" bind:value={photos.template} spellcheck="false" autocomplete="off" />
    <p class="muted small" id="template-help">{photos.t.templateHelp}</p>
    <ul class="chips" aria-describedby="template-help">
      {#each tokens as t (t.token)}
        <li>
          <button type="button" class="chip" title={t.label} onclick={() => insert(t.token)}>
            <code>{t.token}</code>
            <span>{t.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>

  <div class="grid-4">
    <div class="field">
      <label for="start">{photos.t.startLabel}</label>
      <input id="start" class="input" type="number" min="0" step="1" bind:value={photos.start} />
    </div>
    <div class="field">
      <label for="replacement">{photos.t.replacementLabel}</label>
      <input id="replacement" class="input mono" type="text" maxlength="2" bind:value={photos.replacement} autocomplete="off" aria-invalid={!photos.replacementValid} aria-describedby={photos.replacementValid ? undefined : 'replacement-help'} />
      {#if !photos.replacementValid}
        <p class="small warn" id="replacement-help" role="alert">{photos.t.replacementInvalid}</p>
      {/if}
    </div>
  </div>

  <div class="field">
    <label class="opt-row" for="group">
      <input id="group" type="checkbox" bind:checked={photos.groupByPlace} aria-describedby="group-help" />
      <span>{photos.t.groupLabel}</span>
    </label>
    <p class="muted small" id="group-help">{photos.t.groupHelp}</p>
  </div>

  <div class="preview" aria-live="polite">
    <span class="muted small">{photos.t.previewLabel}</span>
    <code class="preview-name">{photos.groupByPlace ? `${photos.t.samplePlace}/` : ''}{photos.preview}</code>
  </div>
</section>
