export function toUpperTR(str: string): string {
  return str.replace(/i/g, "İ").replace(/ı/g, "I").toUpperCase();
}
