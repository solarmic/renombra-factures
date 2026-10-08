export const APP_NAME = 'Renombra Factures';
export const PHOTOS_APP_NAME = 'Renombra Fotos';
export const AUTHOR = 'miguelcirc';

export const DONATION_URL = 'https://ko-fi.com/miguelcirc';

/**
 * Where each site lives. By default both are served from the same deployment (invoices at the base path,
 * photos under `fotos/`), so the links follow Vite's base. Set VITE_FACTURES_URL / VITE_FOTOS_URL at build
 * time to point at separate domains (for example https://fotos.example.org/).
 */
export const FACTURES_URL: string = import.meta.env.VITE_FACTURES_URL || import.meta.env.BASE_URL;
export const FOTOS_URL: string = import.meta.env.VITE_FOTOS_URL || `${import.meta.env.BASE_URL}fotos/`;

export const DEFAULTS = {
  template: '1/{yy}V/{n:2} {name}',
  start: 1,
  replacement: '-',
} as const;

export const PHOTO_DEFAULTS = {
  template: '{n:2}_{t1}_{t2}',
  start: 1,
  replacement: '-',
} as const;

export const ZIP_FILE_NAME = 'renombra-factures.zip';
export const PHOTOS_ZIP_FILE_NAME = 'renombra-fotos.zip';
