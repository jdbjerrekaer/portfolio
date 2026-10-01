export function toLocalYmd(input) {
  if (input == null) return null;
  if (typeof input === "string") {
    const part = input.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
    const d = new Date(input);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${day}`;
  }
  if (input instanceof Date) {
    const y = input.getFullYear();
    const mo = String(input.getMonth() + 1).padStart(2, "0");
    const day = String(input.getDate()).padStart(2, "0");
    return `${y}-${mo}-${day}`;
  }
  return null;
}
