export const APP_NAME = 'Renombra Factures';
export const AUTHOR = 'miguelcirc';

// TODO(author): confirm the final donation URL before publishing.
export const DONATION_URL = 'https://ko-fi.com/miguelcirc';

export const DEFAULTS = {
  template: '1/{yy}V/{n:2} {name}',
  start: 1,
  replacement: '-',
} as const;

export const ZIP_FILE_NAME = 'renombra-factures.zip';
