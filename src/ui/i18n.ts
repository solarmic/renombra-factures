import { AUTHOR } from '../config';

export type Lang = 'es' | 'ca' | 'en';
export const LANGS: readonly Lang[] = ['es', 'ca', 'en'];

const es = {
  eyebrow: 'Gratis · Privado · En tu navegador',
  tagline: 'Numera y renombra tus facturas por fecha, sin subirlas a ningún sitio.',
  language: 'Idioma',
  otherSiteLead: '¿Fotos?',
  otherSiteLabel: 'Ordena tus fotos',
  privacyTitle: 'Tus archivos no salen de tu dispositivo',
  privacyBody:
    'Todo se procesa en tu navegador. No se sube ni se guarda nada, y al cerrar la pestaña todo se borra.',
  dropTitle: 'Arrastra aquí tus facturas',
  dropHint: 'PDF (recomendado) o imágenes. Puedes soltar varios archivos a la vez.',
  dropButton: 'Elegir archivos',
  dropActive: 'Suelta los archivos para añadirlos',
  imageNoticeTitle: 'Has añadido imágenes',
  imageNoticeBody:
    'Es mejor usar PDF: la fecha se lee automáticamente. En las imágenes no se puede leer, así que pon la fecha de la factura en el nombre del archivo (por ejemplo "Factura 0501.jpg" o "2026-01-05 Factura.jpg") o escríbela en la tabla.',
  ignoredTitle: 'Archivos ignorados',
  ignoredBody: (n: number) =>
    n === 1
      ? 'Este archivo no es un PDF ni una imagen y no se incluirá:'
      : `Estos ${n} archivos no son PDF ni imágenes y no se incluirán:`,
  dismiss: 'Cerrar',
  settingsTitle: 'Formato del nombre',
  templateLabel: 'Plantilla',
  templateHelp: 'Escribe texto libre y añade campos con los botones:',
  startLabel: 'Número inicial',
  replacementLabel: 'Sustituir caracteres no válidos por',
  yearLabel: 'Año para fechas del tipo DDMM',
  previewLabel: 'Vista previa',
  tokenN: 'Número de orden',
  tokenNPad: 'Número con ceros (2 cifras)',
  tokenYY: 'Año (2 cifras)',
  tokenYYYY: 'Año (4 cifras)',
  tokenMM: 'Mes',
  tokenDD: 'Día',
  tokenName: 'Nombre original',
  tableTitle: 'Revisión',
  tableEmpty: 'Todavía no hay archivos.',
  colInclude: 'Incluir',
  colOriginal: 'Original',
  colKind: 'Tipo',
  colDate: 'Fecha de factura',
  colNewName: 'Nuevo nombre',
  colRemove: 'Quitar',
  kindPdf: 'PDF',
  kindImage: 'Imagen',
  sourceContent: 'contenido',
  sourceFilename: 'nombre',
  sourceManual: 'manual',
  sourceNone: 'sin fecha',
  reading: 'Leyendo…',
  scannedPdf: 'PDF sin texto: usa la fecha del nombre o escríbela.',
  readError: 'No se pudo leer este PDF.',
  remove: 'Quitar',
  clear: 'Vaciar lista',
  notNumbered: 'Sin número',
  excluded: 'Excluido',
  exportButton: 'Descargar ZIP',
  exporting: 'Generando…',
  missing: (n: number) =>
    n === 1
      ? 'Falta la fecha de 1 archivo. Complétala o excluye el archivo para poder descargar.'
      : `Faltan las fechas de ${n} archivos. Complétalas o excluye los archivos para poder descargar.`,
  readyCount: (n: number) => (n === 1 ? '1 archivo listo para descargar' : `${n} archivos listos para descargar`),
  nothingToExport: 'Añade al menos un archivo con fecha.',
  exportError:
    'No se pudo generar el ZIP. Comprueba que los archivos no se hayan movido o modificado y vuelve a intentarlo.',
  replacementInvalid: 'Este carácter no es válido en nombres de archivo. Se usará "-".',
  donate: 'Invítame a un café',
  donateHint: 'Gratis y sin anuncios. Si te ha ahorrado tiempo, puedes apoyarlo.',
  credit: (year: number) => `© ${year} ${AUTHOR}`,
  sampleName: 'Factura ejemplo.pdf',
};

export type Dict = typeof es;

const ca: Dict = {
  eyebrow: 'Gratuït · Privat · Al teu navegador',
  tagline: 'Numera i reanomena les teves factures per data, sense pujar-les enlloc.',
  language: 'Idioma',
  otherSiteLead: 'Fotos?',
  otherSiteLabel: 'Ordena les teves fotos',
  privacyTitle: 'Els teus arxius no surten del teu dispositiu',
  privacyBody:
    'Tot es processa al teu navegador. No es puja ni es desa res, i en tancar la pestanya tot s\'esborra.',
  dropTitle: 'Arrossega aquí les teves factures',
  dropHint: 'PDF (recomanat) o imatges. Pots deixar anar diversos arxius alhora.',
  dropButton: 'Triar arxius',
  dropActive: 'Deixa anar els arxius per afegir-los',
  imageNoticeTitle: 'Has afegit imatges',
  imageNoticeBody:
    'És millor fer servir PDF: la data es llegeix automàticament. A les imatges no es pot llegir, així que posa la data de la factura al nom de l\'arxiu (per exemple "Factura 0501.jpg" o "2026-01-05 Factura.jpg") o escriu-la a la taula.',
  ignoredTitle: 'Arxius ignorats',
  ignoredBody: (n: number) =>
    n === 1
      ? 'Aquest arxiu no és un PDF ni una imatge i no s\'inclourà:'
      : `Aquests ${n} arxius no són PDF ni imatges i no s'inclouran:`,
  dismiss: 'Tancar',
  settingsTitle: 'Format del nom',
  templateLabel: 'Plantilla',
  templateHelp: 'Escriu text lliure i afegeix camps amb els botons:',
  startLabel: 'Número inicial',
  replacementLabel: 'Substituir caràcters no vàlids per',
  yearLabel: 'Any per a dates del tipus DDMM',
  previewLabel: 'Previsualització',
  tokenN: 'Número d\'ordre',
  tokenNPad: 'Número amb zeros (2 xifres)',
  tokenYY: 'Any (2 xifres)',
  tokenYYYY: 'Any (4 xifres)',
  tokenMM: 'Mes',
  tokenDD: 'Dia',
  tokenName: 'Nom original',
  tableTitle: 'Revisió',
  tableEmpty: 'Encara no hi ha arxius.',
  colInclude: 'Incloure',
  colOriginal: 'Original',
  colKind: 'Tipus',
  colDate: 'Data de factura',
  colNewName: 'Nom nou',
  colRemove: 'Treure',
  kindPdf: 'PDF',
  kindImage: 'Imatge',
  sourceContent: 'contingut',
  sourceFilename: 'nom',
  sourceManual: 'manual',
  sourceNone: 'sense data',
  reading: 'Llegint…',
  scannedPdf: 'PDF sense text: fes servir la data del nom o escriu-la.',
  readError: 'No s\'ha pogut llegir aquest PDF.',
  remove: 'Treure',
  clear: 'Buidar llista',
  notNumbered: 'Sense número',
  excluded: 'Exclòs',
  exportButton: 'Descarregar ZIP',
  exporting: 'Generant…',
  missing: (n: number) =>
    n === 1
      ? 'Falta la data d\'1 arxiu. Completa-la o exclou l\'arxiu per poder descarregar.'
      : `Falten les dates de ${n} arxius. Completa-les o exclou els arxius per poder descarregar.`,
  readyCount: (n: number) => (n === 1 ? '1 arxiu a punt per descarregar' : `${n} arxius a punt per descarregar`),
  nothingToExport: 'Afegeix almenys un arxiu amb data.',
  exportError:
    'No s\'ha pogut generar el ZIP. Comprova que els arxius no s\'hagin mogut o modificat i torna-ho a provar.',
  replacementInvalid: 'Aquest caràcter no és vàlid en noms d\'arxiu. S\'usarà "-".',
  donate: 'Convida\'m a un cafè',
  donateHint: 'Gratuït i sense anuncis. Si t\'ha estalviat temps, pots donar-li suport.',
  credit: (year: number) => `© ${year} ${AUTHOR}`,
  sampleName: 'Factura exemple.pdf',
};

const en: Dict = {
  eyebrow: 'Free · Private · In your browser',
  tagline: 'Number and rename your invoices by date, without uploading them anywhere.',
  language: 'Language',
  otherSiteLead: 'Photos?',
  otherSiteLabel: 'Sort your photos',
  privacyTitle: 'Your files never leave your device',
  privacyBody:
    'Everything is processed in your browser. Nothing is uploaded or stored, and closing the tab erases everything.',
  dropTitle: 'Drop your invoices here',
  dropHint: 'PDF (recommended) or images. You can drop several files at once.',
  dropButton: 'Choose files',
  dropActive: 'Drop the files to add them',
  imageNoticeTitle: 'You added images',
  imageNoticeBody:
    'PDF works better: the date is read automatically. Dates cannot be read from images, so put the invoice date in the file name (for example "Factura 0501.jpg" or "2026-01-05 Factura.jpg") or type it in the table.',
  ignoredTitle: 'Ignored files',
  ignoredBody: (n: number) =>
    n === 1
      ? 'This file is not a PDF or an image and will not be included:'
      : `These ${n} files are not PDFs or images and will not be included:`,
  dismiss: 'Dismiss',
  settingsTitle: 'Name format',
  templateLabel: 'Template',
  templateHelp: 'Write free text and add fields with the buttons:',
  startLabel: 'Starting number',
  replacementLabel: 'Replace invalid characters with',
  yearLabel: 'Year for DDMM-style dates',
  previewLabel: 'Preview',
  tokenN: 'Sequence number',
  tokenNPad: 'Zero-padded number (2 digits)',
  tokenYY: 'Year (2 digits)',
  tokenYYYY: 'Year (4 digits)',
  tokenMM: 'Month',
  tokenDD: 'Day',
  tokenName: 'Original name',
  tableTitle: 'Review',
  tableEmpty: 'No files yet.',
  colInclude: 'Include',
  colOriginal: 'Original',
  colKind: 'Type',
  colDate: 'Invoice date',
  colNewName: 'New name',
  colRemove: 'Remove',
  kindPdf: 'PDF',
  kindImage: 'Image',
  sourceContent: 'content',
  sourceFilename: 'filename',
  sourceManual: 'manual',
  sourceNone: 'no date',
  reading: 'Reading…',
  scannedPdf: 'PDF without text: use the date in the name or type it.',
  readError: 'This PDF could not be read.',
  remove: 'Remove',
  clear: 'Clear list',
  notNumbered: 'Not numbered',
  excluded: 'Excluded',
  exportButton: 'Download ZIP',
  exporting: 'Building…',
  missing: (n: number) =>
    n === 1
      ? '1 file is missing its date. Fill it in or exclude the file to enable the download.'
      : `${n} files are missing their dates. Fill them in or exclude the files to enable the download.`,
  readyCount: (n: number) => (n === 1 ? '1 file ready to download' : `${n} files ready to download`),
  nothingToExport: 'Add at least one file with a date.',
  exportError:
    'The ZIP could not be built. Check that the files have not been moved or modified, then try again.',
  replacementInvalid: 'This character is not valid in file names. "-" will be used instead.',
  donate: 'Buy me a coffee',
  donateHint: 'Free and ad-free. If it saved you time, you can support it.',
  credit: (year: number) => `© ${year} ${AUTHOR}`,
  sampleName: 'Sample invoice.pdf',
};

export const dictionaries: Record<Lang, Dict> = { es, ca, en };

/** Picks the first supported language from a BCP 47 list; defaults to Spanish. */
export function detectLanguage(preferred: readonly string[] | string | undefined): Lang {
  const list = typeof preferred === 'string' ? [preferred] : [...(preferred ?? [])];
  for (const tag of list) {
    const primary = tag.toLowerCase().split('-')[0];
    if (primary === 'es' || primary === 'ca' || primary === 'en') return primary;
  }
  return 'es';
}
