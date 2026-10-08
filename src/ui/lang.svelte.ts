import { detectLanguage, type Lang } from './i18n';

/** Language choice shared by both sites' shells; each site keeps its own dictionaries. */
export class LangState {
  lang = $state<Lang>(
    detectLanguage(typeof navigator === 'undefined' ? undefined : (navigator.languages ?? navigator.language)),
  );

  setLang(lang: Lang): void {
    this.lang = lang;
  }
}

export const langState = new LangState();
