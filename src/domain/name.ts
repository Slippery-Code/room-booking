/** The only Name comparison key: case-insensitive, ignores surrounding spaces. */
export function nameKey(name: string): string {
  return name.normalize('NFC').trim().toLowerCase();
}
