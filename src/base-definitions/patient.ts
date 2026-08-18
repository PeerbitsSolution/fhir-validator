import { ValidationIssue } from "../types";
import { validateCodeableConcept } from "../coding";
import { validateReference } from "../reference-rules";

const VALID_GENDERS = ["male", "female", "other", "unknown"];
const DATE_REGEX = /^\d{4}(-\d{2}(-\d{2})?)?$/;

/**
 * Validates base structural rules for FHIR R4 Patient resource.
 */
export function validatePatient(resource: Record<string, unknown>, path = "Patient"): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (resource.resourceType !== "Patient") {
    issues.push({
      severity: "error",
      path: `${path}.resourceType`,
      code: "invalid-resource-type",
      message: `Expected resourceType 'Patient', found '${String(resource.resourceType)}'.`,
    });
  }

  // active
  if (resource.active !== undefined && typeof resource.active !== "boolean") {
    issues.push({
      severity: "error",
      path: `${path}.active`,
      code: "invalid-type",
      message: `Expected '${path}.active' to be a boolean, got ${typeof resource.active}.`,
    });
  }

  // gender
  if (resource.gender !== undefined) {
    if (typeof resource.gender !== "string" || !VALID_GENDERS.includes(resource.gender)) {
      issues.push({
        severity: "error",
        path: `${path}.gender`,
        code: "invalid-value",
        message: `Invalid gender '${String(resource.gender)}'. Allowed values: ${VALID_GENDERS.join(", ")}.`,
      });
    }
  }

  // birthDate
  if (resource.birthDate !== undefined) {
    if (typeof resource.birthDate !== "string" || !DATE_REGEX.test(resource.birthDate)) {
      issues.push({
        severity: "error",
        path: `${path}.birthDate`,
        code: "invalid-format",
        message: `Expected '${path}.birthDate' to match YYYY, YYYY-MM, or YYYY-MM-DD format.`,
      });
    }
  }

  // name (HumanName[])
  if (resource.name !== undefined) {
    if (!Array.isArray(resource.name)) {
      issues.push({
        severity: "error",
        path: `${path}.name`,
        code: "invalid-type",
        message: `Expected '${path}.name' to be an array, got ${typeof resource.name}.`,
      });
    } else {
      resource.name.forEach((n, idx) => {
        const namePath = `${path}.name[${idx}]`;
        if (typeof n !== "object" || n === null) {
          issues.push({
            severity: "error",
            path: namePath,
            code: "invalid-structure",
            message: `Expected '${namePath}' to be a HumanName object.`,
          });
        } else {
          const hn = n as Record<string, unknown>;
          if (hn.family !== undefined && typeof hn.family !== "string") {
            issues.push({
              severity: "error",
              path: `${namePath}.family`,
              code: "invalid-type",
              message: `Expected '${namePath}.family' to be a string.`,
            });
          }
          if (hn.given !== undefined && (!Array.isArray(hn.given) || hn.given.some((g) => typeof g !== "string"))) {
            issues.push({
              severity: "error",
              path: `${namePath}.given`,
              code: "invalid-type",
              message: `Expected '${namePath}.given' to be an array of strings.`,
            });
          }
        }
      });
    }
  }

  // identifier (Identifier[])
  if (resource.identifier !== undefined) {
    if (!Array.isArray(resource.identifier)) {
      issues.push({
        severity: "error",
        path: `${path}.identifier`,
        code: "invalid-type",
        message: `Expected '${path}.identifier' to be an array, got ${typeof resource.identifier}.`,
      });
    } else {
      resource.identifier.forEach((ident, idx) => {
        const idPath = `${path}.identifier[${idx}]`;
        if (typeof ident !== "object" || ident === null) {
          issues.push({
            severity: "error",
            path: idPath,
            code: "invalid-structure",
            message: `Expected '${idPath}' to be an Identifier object.`,
          });
        } else {
          const idObj = ident as Record<string, unknown>;
          if (idObj.system !== undefined && typeof idObj.system !== "string") {
            issues.push({
              severity: "error",
              path: `${idPath}.system`,
              code: "invalid-type",
              message: `Expected '${idPath}.system' to be a string.`,
            });
          }
          if (idObj.value !== undefined && typeof idObj.value !== "string") {
            issues.push({
              severity: "error",
              path: `${idPath}.value`,
              code: "invalid-type",
              message: `Expected '${idPath}.value' to be a string.`,
            });
          }
          if (idObj.type !== undefined) {
            issues.push(...validateCodeableConcept(idObj.type, `${idPath}.type`));
          }
        }
      });
    }
  }

  // generalPractitioner (Reference[])
  if (resource.generalPractitioner !== undefined) {
    if (!Array.isArray(resource.generalPractitioner)) {
      issues.push({
        severity: "error",
        path: `${path}.generalPractitioner`,
        code: "invalid-type",
        message: `Expected '${path}.generalPractitioner' to be an array.`,
      });
    } else {
      resource.generalPractitioner.forEach((gp, idx) => {
        issues.push(...validateReference(gp, `${path}.generalPractitioner[${idx}]`, ["Organization", "Practitioner", "PractitionerRole"]));
      });
    }
  }

  // managingOrganization (Reference)
  if (resource.managingOrganization !== undefined) {
    issues.push(...validateReference(resource.managingOrganization, `${path}.managingOrganization`, ["Organization"]));
  }

  // maritalStatus (CodeableConcept)
  if (resource.maritalStatus !== undefined) {
    issues.push(...validateCodeableConcept(resource.maritalStatus, `${path}.maritalStatus`));
  }

  return issues;
}
