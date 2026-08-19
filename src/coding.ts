import { ValidationIssue } from "./types.js";

/**
 * Validates the structural shape of a FHIR Coding element.
 * Checks for non-empty string code and valid URI system format.
 */
export function validateCoding(
  coding: unknown,
  path: string,
  options?: { requireSystem?: boolean; requireCode?: boolean }
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!coding || typeof coding !== "object" || Array.isArray(coding)) {
    issues.push({
      severity: "error",
      path,
      code: "invalid-structure",
      message: `Expected '${path}' to be a Coding object, got ${Array.isArray(coding) ? "array" : typeof coding}.`,
    });
    return issues;
  }

  const c = coding as Record<string, unknown>;
  const requireSystem = options?.requireSystem ?? true;
  const requireCode = options?.requireCode ?? true;

  if (requireCode) {
    if (c.code === undefined || c.code === null || c.code === "") {
      issues.push({
        severity: "error",
        path: `${path}.code`,
        code: "required",
        message: `Missing required 'code' in '${path}'.`,
      });
    } else if (typeof c.code !== "string") {
      issues.push({
        severity: "error",
        path: `${path}.code`,
        code: "invalid-type",
        message: `Expected 'code' in '${path}' to be a string, got ${typeof c.code}.`,
      });
    }
  } else if (c.code !== undefined && typeof c.code !== "string") {
    issues.push({
      severity: "error",
      path: `${path}.code`,
      code: "invalid-type",
      message: `Expected 'code' in '${path}' to be a string, got ${typeof c.code}.`,
    });
  }

  if (requireSystem) {
    if (c.system === undefined || c.system === null || c.system === "") {
      issues.push({
        severity: "error",
        path: `${path}.system`,
        code: "required",
        message: `Missing required 'system' URI in '${path}'.`,
      });
    } else if (typeof c.system !== "string") {
      issues.push({
        severity: "error",
        path: `${path}.system`,
        code: "invalid-type",
        message: `Expected 'system' in '${path}' to be a string URI, got ${typeof c.system}.`,
      });
    }
  } else if (c.system !== undefined && typeof c.system !== "string") {
    issues.push({
      severity: "error",
      path: `${path}.system`,
      code: "invalid-type",
      message: `Expected 'system' in '${path}' to be a string URI, got ${typeof c.system}.`,
    });
  }

  if (c.display !== undefined && typeof c.display !== "string") {
    issues.push({
      severity: "error",
      path: `${path}.display`,
      code: "invalid-type",
      message: `Expected 'display' in '${path}' to be a string, got ${typeof c.display}.`,
    });
  }

  return issues;
}

/**
 * Validates the structural shape of a FHIR CodeableConcept element.
 * Checks for coding array structure and validates individual Coding elements.
 */
export function validateCodeableConcept(
  concept: unknown,
  path: string,
  options?: { requireCoding?: boolean; minCodings?: number }
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!concept || typeof concept !== "object" || Array.isArray(concept)) {
    issues.push({
      severity: "error",
      path,
      code: "invalid-structure",
      message: `Expected '${path}' to be a CodeableConcept object, got ${Array.isArray(concept) ? "array" : typeof concept}.`,
    });
    return issues;
  }

  const cc = concept as Record<string, unknown>;
  const requireCoding = options?.requireCoding ?? false;
  const minCodings = options?.minCodings ?? (requireCoding ? 1 : 0);

  if (cc.coding !== undefined) {
    if (!Array.isArray(cc.coding)) {
      issues.push({
        severity: "error",
        path: `${path}.coding`,
        code: "invalid-type",
        message: `Expected '${path}.coding' to be an array, got ${typeof cc.coding}.`,
      });
    } else {
      if (cc.coding.length < minCodings) {
        issues.push({
          severity: "error",
          path: `${path}.coding`,
          code: "cardinality",
          message: `Expected at least ${minCodings} coding(s) in '${path}.coding', found ${cc.coding.length}.`,
        });
      }
      cc.coding.forEach((item, idx) => {
        issues.push(...validateCoding(item, `${path}.coding[${idx}]`));
      });
    }
  } else if (requireCoding || minCodings > 0) {
    issues.push({
      severity: "error",
      path: `${path}.coding`,
      code: "required",
      message: `Missing required 'coding' array in '${path}'.`,
    });
  }

  if (cc.text !== undefined && typeof cc.text !== "string") {
    issues.push({
      severity: "error",
      path: `${path}.text`,
      code: "invalid-type",
      message: `Expected 'text' in '${path}' to be a string, got ${typeof cc.text}.`,
    });
  }

  return issues;
}
