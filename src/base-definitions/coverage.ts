import { ValidationIssue } from "../types.js";
import { validateCodeableConcept } from "../coding.js";
import { validateReference } from "../reference-rules.js";

const VALID_COVERAGE_STATUSES = ["active", "cancelled", "draft", "entered-in-error"];

/**
 * Validates base structural rules for FHIR R4 Coverage resource.
 */
export function validateCoverage(resource: Record<string, unknown>, path = "Coverage"): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (resource.resourceType !== "Coverage") {
    issues.push({
      severity: "error",
      path: `${path}.resourceType`,
      code: "invalid-resource-type",
      message: `Expected resourceType 'Coverage', found '${String(resource.resourceType)}'.`,
    });
  }

  // status (Required)
  if (resource.status === undefined || resource.status === null || resource.status === "") {
    issues.push({
      severity: "error",
      path: `${path}.status`,
      code: "required",
      message: `Missing required 'status' in '${path}'.`,
    });
  } else if (typeof resource.status !== "string" || !VALID_COVERAGE_STATUSES.includes(resource.status)) {
    issues.push({
      severity: "error",
      path: `${path}.status`,
      code: "invalid-value",
      message: `Invalid Coverage status '${String(resource.status)}'. Allowed values: ${VALID_COVERAGE_STATUSES.join(", ")}.`,
    });
  }

  // beneficiary (Required Reference: Patient)
  if (resource.beneficiary === undefined || resource.beneficiary === null) {
    issues.push({
      severity: "error",
      path: `${path}.beneficiary`,
      code: "required",
      message: `Missing required 'beneficiary' in '${path}'.`,
    });
  } else {
    issues.push(...validateReference(resource.beneficiary, `${path}.beneficiary`, ["Patient"]));
  }

  // payor (Required Reference[]: Organization | Patient | RelatedPerson, min 1)
  if (resource.payor === undefined || resource.payor === null) {
    issues.push({
      severity: "error",
      path: `${path}.payor`,
      code: "required",
      message: `Missing required 'payor' in '${path}'.`,
    });
  } else if (!Array.isArray(resource.payor)) {
    issues.push({
      severity: "error",
      path: `${path}.payor`,
      code: "invalid-type",
      message: `Expected '${path}.payor' to be an array, got ${typeof resource.payor}.`,
    });
  } else if (resource.payor.length === 0) {
    issues.push({
      severity: "error",
      path: `${path}.payor`,
      code: "cardinality",
      message: `Expected at least 1 payor in '${path}.payor', found 0.`,
    });
  } else {
    resource.payor.forEach((p, idx) => {
      issues.push(...validateReference(p, `${path}.payor[${idx}]`, ["Organization", "Patient", "RelatedPerson"]));
    });
  }

  // subscriber (Reference: Patient | RelatedPerson)
  if (resource.subscriber !== undefined) {
    issues.push(...validateReference(resource.subscriber, `${path}.subscriber`, ["Patient", "RelatedPerson"]));
  }

  // subscriberId (string)
  if (resource.subscriberId !== undefined && typeof resource.subscriberId !== "string") {
    issues.push({
      severity: "error",
      path: `${path}.subscriberId`,
      code: "invalid-type",
      message: `Expected '${path}.subscriberId' to be a string.`,
    });
  }

  // type (CodeableConcept)
  if (resource.type !== undefined) {
    issues.push(...validateCodeableConcept(resource.type, `${path}.type`));
  }

  // relationship (CodeableConcept)
  if (resource.relationship !== undefined) {
    issues.push(...validateCodeableConcept(resource.relationship, `${path}.relationship`));
  }

  // period (Period)
  if (resource.period !== undefined) {
    if (typeof resource.period !== "object" || resource.period === null || Array.isArray(resource.period)) {
      issues.push({
        severity: "error",
        path: `${path}.period`,
        code: "invalid-structure",
        message: `Expected '${path}.period' to be an object.`,
      });
    }
  }

  return issues;
}
