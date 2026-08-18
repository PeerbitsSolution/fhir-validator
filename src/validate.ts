import {
  ProfileConstraints,
  ValidateOptions,
  ValidationIssue,
  ValidationResult,
} from "./types";
import { validatePatient } from "./base-definitions/patient";
import { validateObservation } from "./base-definitions/observation";
import { validateEncounter } from "./base-definitions/encounter";
import { validateCondition } from "./base-definitions/condition";
import { validateCoverage } from "./base-definitions/coverage";
import { validateClaim } from "./base-definitions/claim";
import { validateClaimResponse } from "./base-definitions/claim-response";

type ResourceValidator = (resource: Record<string, unknown>, path?: string) => ValidationIssue[];

const BASE_VALIDATORS: Record<string, ResourceValidator> = {
  Patient: validatePatient,
  Observation: validateObservation,
  Encounter: validateEncounter,
  Condition: validateCondition,
  Coverage: validateCoverage,
  Claim: validateClaim,
  ClaimResponse: validateClaimResponse,
};

/**
 * Detects whether an object contains a circular reference.
 */
export function hasCircularReference(obj: unknown, seen = new WeakSet<object>()): boolean {
  if (!obj || typeof obj !== "object") return false;
  if (seen.has(obj)) return true;
  seen.add(obj);
  for (const key of Object.keys(obj as object)) {
    const val = (obj as Record<string, unknown>)[key];
    if (val && typeof val === "object") {
      if (hasCircularReference(val, seen)) return true;
    }
  }
  seen.delete(obj);
  return false;
}

/**
 * Resolves a property path (e.g. "name", "category[0].coding[0].system") on an object.
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;

  // Normalize array access like a[0].b -> a.0.b
  const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1");
  const parts = normalizedPath.split(".");

  let current: any = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Validates profile constraints against a resource.
 */
export function validateProfileConstraints(
  resource: Record<string, unknown>,
  profile: ProfileConstraints,
  rootPath: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (profile.resourceType && profile.resourceType !== resource.resourceType) {
    issues.push({
      severity: "error",
      path: `${rootPath}.resourceType`,
      code: "profile-mismatch",
      message: `Profile '${profile.name}' applies to '${profile.resourceType}', but resource is '${String(resource.resourceType)}'.`,
    });
    return issues;
  }

  // Check required elements
  if (profile.requiredElements) {
    for (const elem of profile.requiredElements) {
      const val = getNestedValue(resource, elem);
      if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
        issues.push({
          severity: "error",
          path: `${rootPath}.${elem}`,
          code: "profile-required-element",
          message: `Profile '${profile.name}' requires element '${elem}' to be present.`,
        });
      }
    }
  }

  // Check cardinality overrides
  if (profile.cardinalityOverrides) {
    for (const [elem, card] of Object.entries(profile.cardinalityOverrides)) {
      const val = getNestedValue(resource, elem);
      if (card.min !== undefined && card.min > 0) {
        if (val === undefined || val === null) {
          issues.push({
            severity: "error",
            path: `${rootPath}.${elem}`,
            code: "profile-cardinality",
            message: `Profile '${profile.name}' requires at least ${card.min} item(s) for '${elem}', but none found.`,
          });
        } else if (Array.isArray(val) && val.length < card.min) {
          issues.push({
            severity: "error",
            path: `${rootPath}.${elem}`,
            code: "profile-cardinality",
            message: `Profile '${profile.name}' requires at least ${card.min} item(s) for '${elem}', found ${val.length}.`,
          });
        }
      }
      if (card.max !== undefined && Array.isArray(val) && val.length > card.max) {
        issues.push({
          severity: "error",
          path: `${rootPath}.${elem}`,
          code: "profile-cardinality",
          message: `Profile '${profile.name}' allows at most ${card.max} item(s) for '${elem}', found ${val.length}.`,
        });
      }
    }
  }

  // Check fixed values
  if (profile.fixedValues) {
    for (const [fixedPath, expectedValue] of Object.entries(profile.fixedValues)) {
      const actualValue = getNestedValue(resource, fixedPath);
      if (actualValue !== expectedValue) {
        issues.push({
          severity: "error",
          path: `${rootPath}.${fixedPath}`,
          code: "profile-fixed-value",
          message: `Profile '${profile.name}' requires '${fixedPath}' to equal '${String(expectedValue)}', found '${String(actualValue)}'.`,
        });
      }
    }
  }

  return issues;
}

/**
 * Validates a FHIR R4 resource against base structural rules and optional profile constraints.
 *
 * @param resource The FHIR JSON object to validate.
 * @param options Optional validation parameters (e.g. custom or illustrative profile).
 * @returns ValidationResult containing `valid` boolean and list of `issues`.
 */
export function validate(resource: unknown, options?: ValidateOptions): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!resource || typeof resource !== "object" || Array.isArray(resource)) {
    return {
      valid: false,
      issues: [
        {
          severity: "error",
          path: "resource",
          code: "invalid-structure",
          message: `Expected resource to be a JSON object, got ${Array.isArray(resource) ? "array" : typeof resource}.`,
        },
      ],
    };
  }

  if (hasCircularReference(resource)) {
    return {
      valid: false,
      issues: [
        {
          severity: "error",
          path: "resource",
          code: "circular-reference",
          message: "Resource contains an invalid circular reference.",
        },
      ],
    };
  }

  const res = resource as Record<string, unknown>;

  if (typeof res.resourceType !== "string" || !res.resourceType.trim()) {
    return {
      valid: false,
      issues: [
        {
          severity: "error",
          path: "resource.resourceType",
          code: "missing-resource-type",
          message: "Missing or invalid required 'resourceType' string property.",
        },
      ],
    };
  }

  const resourceType = res.resourceType.trim();
  const baseValidator = BASE_VALIDATORS[resourceType];

  if (!baseValidator) {
    issues.push({
      severity: "error",
      path: `${resourceType}.resourceType`,
      code: "unsupported-resource-type",
      message: `Resource type '${resourceType}' is not supported by fhir-validator v1. Supported types: ${Object.keys(BASE_VALIDATORS).join(", ")}.`,
    });
  } else {
    // 1. Run base structural validation
    issues.push(...baseValidator(res, resourceType));
  }

  // 2. Run profile constraints if provided
  if (options?.profile) {
    issues.push(...validateProfileConstraints(res, options.profile, resourceType));
  }

  const hasErrors = issues.some((i) => i.severity === "error");

  return {
    valid: !hasErrors,
    issues,
  };
}
