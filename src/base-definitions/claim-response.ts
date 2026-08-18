import { ValidationIssue } from "../types";
import { validateCodeableConcept } from "../coding";
import { validateReference } from "../reference-rules";

const VALID_CLAIM_RESPONSE_STATUSES = ["active", "cancelled", "draft", "entered-in-error"];
const VALID_CLAIM_RESPONSE_USES = ["claim", "preauthorization", "predetermination"];
const VALID_CLAIM_RESPONSE_OUTCOMES = ["queued", "complete", "error", "partial"];

/**
 * Validates base structural rules for FHIR R4 ClaimResponse resource.
 */
export function validateClaimResponse(resource: Record<string, unknown>, path = "ClaimResponse"): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (resource.resourceType !== "ClaimResponse") {
    issues.push({
      severity: "error",
      path: `${path}.resourceType`,
      code: "invalid-resource-type",
      message: `Expected resourceType 'ClaimResponse', found '${String(resource.resourceType)}'.`,
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
  } else if (typeof resource.status !== "string" || !VALID_CLAIM_RESPONSE_STATUSES.includes(resource.status)) {
    issues.push({
      severity: "error",
      path: `${path}.status`,
      code: "invalid-value",
      message: `Invalid ClaimResponse status '${String(resource.status)}'. Allowed values: ${VALID_CLAIM_RESPONSE_STATUSES.join(", ")}.`,
    });
  }

  // type (Required CodeableConcept)
  if (resource.type === undefined || resource.type === null) {
    issues.push({
      severity: "error",
      path: `${path}.type`,
      code: "required",
      message: `Missing required 'type' in '${path}'.`,
    });
  } else {
    issues.push(...validateCodeableConcept(resource.type, `${path}.type`));
  }

  // use (Required enum: claim | preauthorization | predetermination)
  if (resource.use === undefined || resource.use === null || resource.use === "") {
    issues.push({
      severity: "error",
      path: `${path}.use`,
      code: "required",
      message: `Missing required 'use' in '${path}'.`,
    });
  } else if (typeof resource.use !== "string" || !VALID_CLAIM_RESPONSE_USES.includes(resource.use)) {
    issues.push({
      severity: "error",
      path: `${path}.use`,
      code: "invalid-value",
      message: `Invalid ClaimResponse use '${String(resource.use)}'. Allowed values: ${VALID_CLAIM_RESPONSE_USES.join(", ")}.`,
    });
  }

  // patient (Required Reference: Patient)
  if (resource.patient === undefined || resource.patient === null) {
    issues.push({
      severity: "error",
      path: `${path}.patient`,
      code: "required",
      message: `Missing required 'patient' in '${path}'.`,
    });
  } else {
    issues.push(...validateReference(resource.patient, `${path}.patient`, ["Patient"]));
  }

  // created (Required string dateTime)
  if (resource.created === undefined || resource.created === null || resource.created === "") {
    issues.push({
      severity: "error",
      path: `${path}.created`,
      code: "required",
      message: `Missing required 'created' in '${path}'.`,
    });
  } else if (typeof resource.created !== "string") {
    issues.push({
      severity: "error",
      path: `${path}.created`,
      code: "invalid-type",
      message: `Expected '${path}.created' to be a string dateTime.`,
    });
  }

  // insurer (Required Reference: Organization)
  if (resource.insurer === undefined || resource.insurer === null) {
    issues.push({
      severity: "error",
      path: `${path}.insurer`,
      code: "required",
      message: `Missing required 'insurer' in '${path}'.`,
    });
  } else {
    issues.push(...validateReference(resource.insurer, `${path}.insurer`, ["Organization"]));
  }

  // outcome (Required enum: queued | complete | error | partial)
  if (resource.outcome === undefined || resource.outcome === null || resource.outcome === "") {
    issues.push({
      severity: "error",
      path: `${path}.outcome`,
      code: "required",
      message: `Missing required 'outcome' in '${path}'.`,
    });
  } else if (typeof resource.outcome !== "string" || !VALID_CLAIM_RESPONSE_OUTCOMES.includes(resource.outcome)) {
    issues.push({
      severity: "error",
      path: `${path}.outcome`,
      code: "invalid-value",
      message: `Invalid ClaimResponse outcome '${String(resource.outcome)}'. Allowed values: ${VALID_CLAIM_RESPONSE_OUTCOMES.join(", ")}.`,
    });
  }

  // request (Reference: Claim)
  if (resource.request !== undefined) {
    issues.push(...validateReference(resource.request, `${path}.request`, ["Claim"]));
  }

  // requestor (Reference: Practitioner | PractitionerRole | Organization)
  if (resource.requestor !== undefined) {
    issues.push(...validateReference(resource.requestor, `${path}.requestor`, ["Practitioner", "PractitionerRole", "Organization"]));
  }

  // insurance (Array)
  if (resource.insurance !== undefined) {
    if (!Array.isArray(resource.insurance)) {
      issues.push({
        severity: "error",
        path: `${path}.insurance`,
        code: "invalid-type",
        message: `Expected '${path}.insurance' to be an array.`,
      });
    } else {
      resource.insurance.forEach((ins, idx) => {
        const insPath = `${path}.insurance[${idx}]`;
        if (typeof ins !== "object" || ins === null || Array.isArray(ins)) {
          issues.push({
            severity: "error",
            path: insPath,
            code: "invalid-structure",
            message: `Expected '${insPath}' to be an object.`,
          });
        } else {
          const obj = ins as Record<string, unknown>;
          if (typeof obj.sequence !== "number") {
            issues.push({
              severity: "error",
              path: `${insPath}.sequence`,
              code: "required",
              message: `Missing or invalid 'sequence' number in '${insPath}'.`,
            });
          }
          if (typeof obj.focal !== "boolean") {
            issues.push({
              severity: "error",
              path: `${insPath}.focal`,
              code: "required",
              message: `Missing or invalid 'focal' boolean in '${insPath}'.`,
            });
          }
          if (obj.coverage === undefined || obj.coverage === null) {
            issues.push({
              severity: "error",
              path: `${insPath}.coverage`,
              code: "required",
              message: `Missing required 'coverage' reference in '${insPath}'.`,
            });
          } else {
            issues.push(...validateReference(obj.coverage, `${insPath}.coverage`, ["Coverage"]));
          }
        }
      });
    }
  }

  return issues;
}
