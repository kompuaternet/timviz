export function slugifyBusinessName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яіїєґ]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 36) || "business";
}

type PathBusiness = {
  id: string;
  name: string;
  createdAt?: string;
};

export function buildPublicBusinessPathMap(businesses: PathBusiness[]) {
  const sorted = [...businesses].sort((left, right) => {
    const leftCreatedAt = left.createdAt || "";
    const rightCreatedAt = right.createdAt || "";

    if (leftCreatedAt !== rightCreatedAt) {
      return leftCreatedAt.localeCompare(rightCreatedAt);
    }

    return left.id.localeCompare(right.id);
  });

  const counters = new Map<string, number>();
  const pathMap = new Map<string, string>();

  for (const business of sorted) {
    const baseSlug = slugifyBusinessName(business.name);
    const currentCount = counters.get(baseSlug) ?? 0;
    const nextSlug = currentCount === 0 ? baseSlug : `${baseSlug}-${currentCount}`;

    counters.set(baseSlug, currentCount + 1);
    pathMap.set(business.id, nextSlug);
  }

  return pathMap;
}

export function getPublicBusinessPathId(input: PathBusiness, businesses?: PathBusiness[]) {
  if (businesses?.length) {
    return buildPublicBusinessPathMap(businesses).get(input.id) ?? slugifyBusinessName(input.name);
  }

  return slugifyBusinessName(input.name);
}

export function findBusinessIdByPublicPath(pathId: string, businesses: PathBusiness[]) {
  const normalizedPathId = String(pathId || "").trim().toLowerCase();
  if (!normalizedPathId) {
    return null;
  }

  const pathMap = buildPublicBusinessPathMap(businesses);

  for (const [businessId, slug] of pathMap.entries()) {
    if (slug === normalizedPathId) {
      return businessId;
    }
  }

  // Fallback for stale numeric suffixes in old links:
  // "barber-drive-test-9" can still resolve to "barber-drive-test".
  const baseCandidate = normalizedPathId.replace(/-\d+$/, "");
  if (baseCandidate && baseCandidate !== normalizedPathId) {
    for (const business of businesses) {
      if (slugifyBusinessName(business.name) === baseCandidate) {
        return business.id;
      }
    }
  }

  return null;
}
