import { ValidationIssue } from "../types";
import { validateCodeableConcept } from "../coding";
import { validateReference } from "../reference-rules";

/**
 * Validates base structural rules for FHIR R4 Condition resource.
 */
export function validateCondition(resource: Record<string, unknown>, path = "Condition"): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (resource.resourceType !== "Condition") {
    issues.push({
      severity: "error",
      path: `${path}.resourceType`,
      code: "invalid-resource-type",
      message: `Expected resourceType 'Condition', found '${String(resource.resourceType)}'.`,
    });
  }

  // subject (Required Reference: Patient | Group)
  if (resource.subject === undefined || resource.subject === null) {
    issues.push({
      severity: "error",
      path: `${path}.subject`,
      code: "required",
      message: `Missing required 'subject' in '${path}'.`,
    });
  } else {
    issues.push(...validateReference(resource.subject, `${path}.subject`, ["Patient", "Group"]));
  }

  // clinicalStatus (CodeableConcept)
  if (resource.clinicalStatus !== undefined) {
    issues.push(...validateCodeableConcept(resource.clinicalStatus, `${path}.clinicalStatus`));
  }

  // verificationStatus (CodeableConcept)
  if (resource.verificationStatus !== undefined) {
    issues.push(...validateCodeableConcept(resource.verificationStatus, `${path}.verificationStatus`));
  }

  // category (CodeableConcept[])
  if (resource.category !== undefined) {
    if (!Array.isArray(resource.category)) {
      issues.push({
        severity: "error",
        path: `${path}.category`,
        code: "invalid-type",
        message: `Expected '${path}.category' to be an array, got ${typeof resource.category}.`,
      });
    } else {
      resource.category.forEach((cat, idx) => {
        issues.push(...validateCodeableConcept(cat, `${path}.category[${idx}]`));
      });
    }
  }

  // code (CodeableConcept)
  if (resource.code !== undefined) {
    issues.push(...validateCodeableConcept(resource.code, `${path}.code`));
  }

  // encounter (Reference: Encounter)
  if (resource.encounter !== undefined) {
    issues.push(...validateReference(resource.encounter, `${path}.encounter`, ["Encounter"]));
  }

  // recorder (Reference)
  if (resource.recorder !== undefined) {
    issues.push(...validateReference(resource.recorder, `${path}.recorder`, ["Practitioner", "PractitionerRole", "Patient", "RelatedPerson"]));
  }

  // asserter (Reference)
  if (resource.asserter !== undefined) {
    issues.push(...validateReference(resource.asserter, `${path}.asserter`, ["Practitioner", "PractitionerRole", "Patient", "RelatedPerson"]));
  }

  // recordedDate
  if (resource.recordedDate !== undefined && typeof resource.recordedDate !== "string") {
    issues.push({
      severity: "error",
      path: `${path}.recordedDate`,
      code: "invalid-type",
      message: `Expected '${path}.recordedDate' to be a string.`,
    });
  }

  return issues;
}
