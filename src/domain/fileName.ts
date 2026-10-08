/**
 * The single definition of "file extension" shared by date extraction, renaming and the UI preview.
 *
 * An extension is a dot followed by 1-5 letters/digits with at least one letter, at the very end of a
 * name that still has a non-empty base. Requiring a letter keeps date-like tails such as
 * "Factura 05.01.2026" or "scan 12.3" from being mistaken for an extension.
 */
const EXTENSION = /^(.+?)(\.(?=[A-Za-z0-9]{1,5}$)[A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*)$/;

export function splitExtension(fileName: string): { base: string; ext: string } {
  const match = EXTENSION.exec(fileName);
  return match ? { base: match[1]!, ext: match[2]! } : { base: fileName, ext: '' };
}
