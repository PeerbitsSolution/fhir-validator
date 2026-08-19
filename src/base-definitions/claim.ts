import { ValidationIssue } from "../types.js";
import { validateCodeableConcept } from "../coding.js";
import { validateReference } from "../reference-rules.js";

const VALID_CLAIM_STATUSES = ["active", "cancelled", "draft", "entered-in-error"];
const VALID_CLAIM_USES = ["claim", "preauthorization", "predetermination"];

/**
 * Validates base structural rules for FHIR R4 Claim resource.
 */
export function validateClaim(resource: Record<string, unknown>, path = "Claim"): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (resource.resourceType !== "Claim") {
    issues.push({
      severity: "error",
      path: `${path}.resourceType`,
      code: "invalid-resource-type",
      message: `Expected resourceType 'Claim', found '${String(resource.resourceType)}'.`,
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
  } else if (typeof resource.status !== "string" || !VALID_CLAIM_STATUSES.includes(resource.status)) {
    issues.push({
      severity: "error",
      path: `${path}.status`,
      code: "invalid-value",
      message: `Invalid Claim status '${String(resource.status)}'. Allowed values: ${VALID_CLAIM_STATUSES.join(", ")}.`,
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
  } else if (typeof resource.use !== "string" || !VALID_CLAIM_USES.includes(resource.use)) {
    issues.push({
      severity: "error",
      path: `${path}.use`,
      code: "invalid-value",
      message: `Invalid Claim use '${String(resource.use)}'. Allowed values: ${VALID_CLAIM_USES.join(", ")}.`,
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

  // provider (Required Reference: Practitioner | PractitionerRole | Organization)
  if (resource.provider === undefined || resource.provider === null) {
    issues.push({
      severity: "error",
      path: `${path}.provider`,
      code: "required",
      message: `Missing required 'provider' in '${path}'.`,
    });
  } else {
    issues.push(...validateReference(resource.provider, `${path}.provider`, ["Practitioner", "PractitionerRole", "Organization"]));
  }

  // priority (Required CodeableConcept)
  if (resource.priority === undefined || resource.priority === null) {
    issues.push({
      severity: "error",
      path: `${path}.priority`,
      code: "required",
      message: `Missing required 'priority' in '${path}'.`,
    });
  } else {
    issues.push(...validateCodeableConcept(resource.priority, `${path}.priority`));
  }

  // insurer (Reference: Organization)
  if (resource.insurer !== undefined) {
    issues.push(...validateReference(resource.insurer, `${path}.insurer`, ["Organization"]));
  }

  // facility (Reference: Location)
  if (resource.facility !== undefined) {
    issues.push(...validateReference(resource.facility, `${path}.facility`, ["Location"]));
  }

  // insurance (Required array, min 1)
  if (resource.insurance === undefined || resource.insurance === null) {
    issues.push({
      severity: "error",
      path: `${path}.insurance`,
      code: "required",
      message: `Missing required 'insurance' in '${path}'.`,
    });
  } else if (!Array.isArray(resource.insurance)) {
    issues.push({
      severity: "error",
      path: `${path}.insurance`,
      code: "invalid-type",
      message: `Expected '${path}.insurance' to be an array, got ${typeof resource.insurance}.`,
    });
  } else if (resource.insurance.length === 0) {
    issues.push({
      severity: "error",
      path: `${path}.insurance`,
      code: "cardinality",
      message: `Expected at least 1 insurance element in '${path}.insurance', found 0.`,
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

  // item (Array)
  if (resource.item !== undefined) {
    if (!Array.isArray(resource.item)) {
      issues.push({
        severity: "error",
        path: `${path}.item`,
        code: "invalid-type",
        message: `Expected '${path}.item' to be an array, got ${typeof resource.item}.`,
      });
    } else {
      resource.item.forEach((it, idx) => {
        const itPath = `${path}.item[${idx}]`;
        if (typeof it !== "object" || it === null || Array.isArray(it)) {
          issues.push({
            severity: "error",
            path: itPath,
            code: "invalid-structure",
            message: `Expected '${itPath}' to be an object.`,
          });
        } else {
          const itemObj = it as Record<string, unknown>;
          if (typeof itemObj.sequence !== "number") {
            issues.push({
              severity: "error",
              path: `${itPath}.sequence`,
              code: "required",
              message: `Missing or invalid 'sequence' number in '${itPath}'.`,
            });
          }
          if (itemObj.productOrService === undefined || itemObj.productOrService === null) {
            issues.push({
              severity: "error",
              path: `${itPath}.productOrService`,
              code: "required",
              message: `Missing required 'productOrService' in '${itPath}'.`,
            });
          } else {
            issues.push(...validateCodeableConcept(itemObj.productOrService, `${itPath}.productOrService`));
          }
        }
      });
    }
  }

  return issues;
}
