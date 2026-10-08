<script lang="ts">
  import { app, MAX_FALLBACK_YEAR, MIN_FALLBACK_YEAR } from './state.svelte';

  let templateInput: HTMLInputElement;

  const tokens = $derived([
    { token: '{n}', label: app.t.tokenN },
    { token: '{n:2}', label: app.t.tokenNPad },
    { token: '{yy}', label: app.t.tokenYY },
    { token: '{yyyy}', label: app.t.tokenYYYY },
    { token: '{mm}', label: app.t.tokenMM },
    { token: '{dd}', label: app.t.tokenDD },
    { token: '{name}', label: app.t.tokenName },
  ]);

  function insert(token: string) {
    const start = templateInput.selectionStart ?? app.template.length;
    const end = templateInput.selectionEnd ?? start;
    app.template = app.template.slice(0, start) + token + app.template.slice(end);
    const caret = start + token.length;
    queueMicrotask(() => {
      templateInput.focus();
      templateInput.setSelectionRange(caret, caret);
    });
  }
</script>

<section class="card" aria-labelledby="settings-title">
  <h2 id="settings-title">{app.t.settingsTitle}</h2>

  <div class="field">
    <label for="template">{app.t.templateLabel}</label>
    <input id="template" bind:this={templateInput} class="input mono" type="text" bind:value={app.template} spellcheck="false" autocomplete="off" />
    <p class="muted small" id="template-help">{app.t.templateHelp}</p>
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

  <div class="grid-3">
    <div class="field">
      <label for="start">{app.t.startLabel}</label>
      <input id="start" class="input" type="number" min="0" step="1" bind:value={app.start} />
    </div>
    <div class="field">
      <label for="replacement">{app.t.replacementLabel}</label>
      <input id="replacement" class="input mono" type="text" maxlength="2" bind:value={app.replacement} autocomplete="off" aria-invalid={!app.replacementValid} aria-describedby={app.replacementValid ? undefined : 'replacement-help'} />
      {#if !app.replacementValid}
        <p class="small warn" id="replacement-help" role="alert">{app.t.replacementInvalid}</p>
      {/if}
    </div>
    <div class="field">
      <label for="year">{app.t.yearLabel}</label>
      <input id="year" class="input" type="number" min={MIN_FALLBACK_YEAR} max={MAX_FALLBACK_YEAR} step="1" value={app.fallbackYear} oninput={(e) => app.setFallbackYear(e.currentTarget.valueAsNumber)} onblur={(e) => (e.currentTarget.value = String(app.fallbackYear))} />
    </div>
  </div>

  <div class="preview" aria-live="polite">
    <span class="muted small">{app.t.previewLabel}</span>
    <code class="preview-name">{app.preview}</code>
  </div>
</section>
