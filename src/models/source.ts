// Pure business logic for source aggregation, CRUD, archive, icon resolution, and expiry.
// No React dependency — fully testable with plain unit tests.

import type {
  Source,
  Benefit,
  SourceCategory,
  SourceIconInfo,
  CreateSourceInput,
  UpdateSourceInput,
  ValidationError,
  DependentsSummary,
} from "@/models/types";
import { stripUndefined } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Icon resolution
// ---------------------------------------------------------------------------

/** Default lucide icon name for each source category. */
const CATEGORY_ICONS: Record<SourceCategory, string> = {
  "credit-card": "credit-card",
  insurance: "shield",
  membership: "crown",
  telecom: "smartphone",
  other: "package",
};

/**
 * Extract the domain from a URL, stripping the `www.` prefix.
 * Returns null if the URL is invalid.
 */
export function extractDomain(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch {
    return null;
  }
}

/**
 * Resolve the display icon for a source.
 * Priority: favicon (from website) > manual icon > default category icon.
 */
export function resolveSourceIcon(source: Source): SourceIconInfo {
  // Try favicon from website
  if (source.website) {
    const domain = extractDomain(source.website);
    if (domain) {
      return { type: "favicon", value: `https://favicon.im/${domain}` };
    }
  }

  // Fallback to manual icon
  if (source.icon) {
    return { type: "icon", value: source.icon };
  }

  // Fallback to category default
  return { type: "category", value: CATEGORY_ICONS[source.category] };
}

// ---------------------------------------------------------------------------
// Temporal checks
// ---------------------------------------------------------------------------

/**
 * Check if a source has expired (validUntil < today).
 * Returns false if validUntil is null (no expiry).
 * The source is still valid on its validUntil date.
 */
export function isSourceExpired(source: Source, today: string): boolean {
  if (!source.validUntil) return false;
  return source.validUntil < today;
}

/**
 * Check if a source is expiring soon (within threshold days).
 * Returns false if already expired, or if validUntil is null.
 */
export function isSourceExpiringSoon(
  source: Source,
  today: string,
  threshold: number = 30,
): boolean {
  if (!source.validUntil) return false;
  if (isSourceExpired(source, today)) return false;

  const todayMs = new Date(today).getTime();
  const untilMs = new Date(source.validUntil).getTime();
  const diffDays = Math.ceil((untilMs - todayMs) / (1000 * 60 * 60 * 24));

  return diffDays <= threshold;
}

// ---------------------------------------------------------------------------
// CRUD pure functions
// ---------------------------------------------------------------------------

/**
 * Add a new source. Returns a new array (immutable).
 * Generates `id` and `createdAt` automatically. Sets `archived` to false.
 */
export function addSource(
  sources: readonly Source[],
  input: CreateSourceInput,
): Source[] {
  const newSource: Source = {
    id: crypto.randomUUID(),
    memberId: input.memberId,
    name: input.name,
    website: input.website ?? null,
    icon: input.icon ?? null,
    phone: input.phone ?? null,
    category: input.category,
    currency: input.currency,
    cycleAnchor: input.cycleAnchor,
    validFrom: input.validFrom ?? null,
    validUntil: input.validUntil ?? null,
    archived: false,
    memo: input.memo ?? null,
    createdAt: new Date().toISOString(),
  };
  return [...sources, newSource];
}

/**
 * Update an existing source by id. Returns a new array (immutable).
 */
export function updateSource(
  sources: readonly Source[],
  id: string,
  input: UpdateSourceInput,
): Source[] {
  return sources.map((s) => {
    if (s.id !== id) return s;
    return { ...s, ...stripUndefined(input) };
  });
}

/**
 * Remove a source by id. Returns a new array (immutable).
 */
export function removeSource(
  sources: readonly Source[],
  id: string,
): Source[] {
  return sources.filter((s) => s.id !== id);
}

/**
 * Toggle the archived flag of a source. Returns a new array (immutable).
 */
export function toggleSourceArchived(
  sources: readonly Source[],
  id: string,
): Source[] {
  return sources.map((s) => {
    if (s.id !== id) return s;
    return { ...s, archived: !s.archived };
  });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a CreateSourceInput or UpdateSourceInput.
 * Returns an empty array when all validations pass.
 */
export function validateSourceInput(
  input: CreateSourceInput | UpdateSourceInput,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const isCreate = "memberId" in input && "category" in input && "cycleAnchor" in input;

  // Name validation
  if (isCreate) {
    const name = (input as CreateSourceInput).name;
    if (!name || name.trim().length === 0) {
      errors.push({ field: "name", message: "来源名称不能为空" });
    } else if (name.length > 50) {
      errors.push({ field: "name", message: "来源名称不能超过50个字符" });
    }
  } else if (input.name !== undefined) {
    if (input.name.trim().length === 0) {
      errors.push({ field: "name", message: "来源名称不能为空" });
    } else if (input.name.length > 50) {
      errors.push({ field: "name", message: "来源名称不能超过50个字符" });
    }
  }

  // Currency validation
  if (isCreate) {
    const currency = (input as CreateSourceInput).currency;
    if (!currency || currency.length !== 3) {
      errors.push({ field: "currency", message: "币种必须为3位ISO 4217代码" });
    }
  } else if (input.currency !== undefined) {
    if (input.currency.length !== 3) {
      errors.push({ field: "currency", message: "币种必须为3位ISO 4217代码" });
    }
  }

  // Website validation (optional)
  if (input.website !== undefined && input.website !== null) {
    if (extractDomain(input.website) === null) {
      errors.push({ field: "website", message: "网站地址格式不正确" });
    }
  }

  // Phone validation (optional)
  if (input.phone !== undefined && input.phone !== null) {
    if (input.phone.length > 20) {
      errors.push({ field: "phone", message: "服务热线不能超过20个字符" });
    }
  }

  // validUntil >= validFrom check
  const validFrom = input.validFrom;
  const validUntil = input.validUntil;
  if (validFrom && validUntil && validUntil < validFrom) {
    errors.push({ field: "validUntil", message: "到期日期不能早于生效日期" });
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Cascade checks
// ---------------------------------------------------------------------------

/**
 * Count dependents (benefits) that belong to a source.
 * Used to show impact before delete confirmation.
 */
export function checkSourceDependents(
  sourceId: string,
  benefits: readonly Benefit[],
): DependentsSummary {
  const count = benefits.filter((b) => b.sourceId === sourceId).length;
  return { benefits: count };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------


