export function slugifyBusinessName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яіїєґ]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 36) || "business";
}

export function getBusinessPublicCode(id: string) {
  const normalized = id.replace(/[^a-z0-9]/gi, "");
  return normalized.slice(-6).toLowerCase() || "timviz";
}

export function getPublicBusinessPathId(input: { id: string; name: string }) {
  return `${slugifyBusinessName(input.name)}-${getBusinessPublicCode(input.id)}`;
}
