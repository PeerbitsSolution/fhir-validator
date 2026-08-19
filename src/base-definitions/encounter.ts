import { ValidationIssue } from "../types.js";
import { validateCodeableConcept, validateCoding } from "../coding.js";
import { validateReference } from "../reference-rules.js";

const VALID_ENCOUNTER_STATUSES = [
  "planned",
  "arrived",
  "triaged",
  "in-progress",
  "onleave",
  "finished",
  "cancelled",
  "entered-in-error",
  "unknown",
];

/**
 * Validates base structural rules for FHIR R4 Encounter resource.
 */
export function validateEncounter(resource: Record<string, unknown>, path = "Encounter"): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (resource.resourceType !== "Encounter") {
    issues.push({
      severity: "error",
      path: `${path}.resourceType`,
      code: "invalid-resource-type",
      message: `Expected resourceType 'Encounter', found '${String(resource.resourceType)}'.`,
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
  } else if (typeof resource.status !== "string" || !VALID_ENCOUNTER_STATUSES.includes(resource.status)) {
    issues.push({
      severity: "error",
      path: `${path}.status`,
      code: "invalid-value",
      message: `Invalid Encounter status '${String(resource.status)}'. Allowed values: ${VALID_ENCOUNTER_STATUSES.join(", ")}.`,
    });
  }

  // class (Required Coding / Coding-like object)
  if (resource.class === undefined || resource.class === null) {
    issues.push({
      severity: "error",
      path: `${path}.class`,
      code: "required",
      message: `Missing required 'class' in '${path}'.`,
    });
  } else {
    // In FHIR R4, Encounter.class is a Coding
    issues.push(...validateCoding(resource.class, `${path}.class`));
  }

  // subject (Reference: Patient | Group)
  if (resource.subject !== undefined) {
    issues.push(...validateReference(resource.subject, `${path}.subject`, ["Patient", "Group"]));
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
    } else {
      const p = resource.period as Record<string, unknown>;
      if (p.start !== undefined && typeof p.start !== "string") {
        issues.push({
          severity: "error",
          path: `${path}.period.start`,
          code: "invalid-type",
          message: `Expected '${path}.period.start' to be a string.`,
        });
      }
      if (p.end !== undefined && typeof p.end !== "string") {
        issues.push({
          severity: "error",
          path: `${path}.period.end`,
          code: "invalid-type",
          message: `Expected '${path}.period.end' to be a string.`,
        });
      }
    }
  }

  // participant
  if (resource.participant !== undefined) {
    if (!Array.isArray(resource.participant)) {
      issues.push({
        severity: "error",
        path: `${path}.participant`,
        code: "invalid-type",
        message: `Expected '${path}.participant' to be an array.`,
      });
    } else {
      resource.participant.forEach((part, idx) => {
        const partPath = `${path}.participant[${idx}]`;
        if (typeof part !== "object" || part === null || Array.isArray(part)) {
          issues.push({
            severity: "error",
            path: partPath,
            code: "invalid-structure",
            message: `Expected '${partPath}' to be an object.`,
          });
        } else {
          const p = part as Record<string, unknown>;
          if (p.individual !== undefined) {
            issues.push(...validateReference(p.individual, `${partPath}.individual`, ["Practitioner", "PractitionerRole", "RelatedPerson"]));
          }
          if (p.type !== undefined && Array.isArray(p.type)) {
            p.type.forEach((t, tIdx) => {
              issues.push(...validateCodeableConcept(t, `${partPath}.type[${tIdx}]`));
            });
          }
        }
      });
    }
  }

  // serviceProvider (Reference: Organization)
  if (resource.serviceProvider !== undefined) {
    issues.push(...validateReference(resource.serviceProvider, `${path}.serviceProvider`, ["Organization"]));
  }

  // type (CodeableConcept[])
  if (resource.type !== undefined && Array.isArray(resource.type)) {
    resource.type.forEach((t, idx) => {
      issues.push(...validateCodeableConcept(t, `${path}.type[${idx}]`));
    });
  }

  return issues;
}
