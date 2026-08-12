export type ValidationIssueType =
  | "empty_source"
  | "empty_target"
  | "too_short"
  | "duplicate"
  | "untranslated";

export interface ValidationIssue {
  type: ValidationIssueType;
  message: string;
  field?: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function normalizeSentence(text: string): string {
  return normalizeText(text);
}

/** Detect if the two texts look identical (possible untranslated sentence). */
export function detectUntranslated(source: string, target: string): boolean {
  if (!source || !target) return false;
  const a = normalizeText(source).toLowerCase();
  const b = normalizeText(target).toLowerCase();
  return a === b;
}

export function validateTranslation(input: {
  sourceText: string;
  targetText: string;
  existingSources: string[];
}): ValidationResult {
  const issues: ValidationIssue[] = [];
  const source = normalizeText(input.sourceText);
  const target = normalizeText(input.targetText);

  if (source.length === 0) {
    issues.push({ type: "empty_source", message: "Source text cannot be empty.", field: "sourceText", severity: "error" });
  }
  if (target.length === 0) {
    issues.push({ type: "empty_target", message: "Target text cannot be empty.", field: "targetText", severity: "error" });
  }

  if (source.length >= 1 && source.length < 2) {
    issues.push({ type: "too_short", message: "Source text is too short.", field: "sourceText", severity: "error" });
  }
  if (target.length >= 1 && target.length < 2) {
    issues.push({ type: "too_short", message: "Target text is too short.", field: "targetText", severity: "error" });
  }

  if (source && target && detectUntranslated(source, target)) {
    issues.push({
      type: "untranslated",
      message: "Possible untranslated sentence: source and target look identical.",
      severity: "warning",
    });
  }

  if (source) {
    const normalized = source.toLowerCase();
    const isDuplicate = input.existingSources.some(
      (existing) => normalizeText(existing).toLowerCase() === normalized
    );
    if (isDuplicate) {
      issues.push({
        type: "duplicate",
        message: "Duplicate detected: an identical source sentence already exists.",
        field: "sourceText",
        severity: "error",
      });
    }
  }

  return { valid: issues.every((i) => i.severity !== "error"), issues };
}