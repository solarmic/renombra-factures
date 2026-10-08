/**
 * Returns `stem + ext` (or `stem (2)+ext`, ...) so that it is unused under `scope`, case-insensitively, and
 * records it. `scope` is a path prefix such as `Folder/`, so equal names may repeat in different folders.
 */
export function uniqueName(used: Set<string>, stem: string, ext: string, scope = ''): string {
  let name = stem + ext;
  for (let attempt = 2; used.has((scope + name).toLowerCase()); attempt++) {
    name = `${stem} (${attempt})${ext}`;
  }
  used.add((scope + name).toLowerCase());
  return name;
}
