import { ValidationIssue } from "../types.js";
import { validateCodeableConcept } from "../coding.js";
import { validateReference } from "../reference-rules.js";

const VALID_OBSERVATION_STATUSES = [
  "registered",
  "preliminary",
  "final",
  "amended",
  "corrected",
  "cancelled",
  "entered-in-error",
  "unknown",
];

/**
 * Validates base structural rules for FHIR R4 Observation resource.
 */
export function validateObservation(resource: Record<string, unknown>, path = "Observation"): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const effectiveFields = ["effectiveDateTime", "effectivePeriod", "effectiveTiming", "effectiveInstant"].filter((field) => resource[field] !== undefined);
  if (effectiveFields.length > 1) issues.push({ severity: "error", path: `${path}.effective[x]`, code: "cardinality", message: "Observation may contain only one effective[x] value." });
  const valueFields = ["valueQuantity", "valueCodeableConcept", "valueString", "valueBoolean", "valueInteger", "valueRange", "valueRatio", "valueSampledData", "valueTime", "valueDateTime", "valuePeriod"].filter((field) => resource[field] !== undefined);
  if (valueFields.length > 1) issues.push({ severity: "error", path: `${path}.value[x]`, code: "cardinality", message: "Observation may contain only one value[x] value." });

  if (resource.resourceType !== "Observation") {
    issues.push({
      severity: "error",
      path: `${path}.resourceType`,
      code: "invalid-resource-type",
      message: `Expected resourceType 'Observation', found '${String(resource.resourceType)}'.`,
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
  } else if (typeof resource.status !== "string" || !VALID_OBSERVATION_STATUSES.includes(resource.status)) {
    issues.push({
      severity: "error",
      path: `${path}.status`,
      code: "invalid-value",
      message: `Invalid Observation status '${String(resource.status)}'. Allowed values: ${VALID_OBSERVATION_STATUSES.join(", ")}.`,
    });
  }

  // code (Required CodeableConcept)
  if (resource.code === undefined || resource.code === null) {
    issues.push({
      severity: "error",
      path: `${path}.code`,
      code: "required",
      message: `Missing required 'code' in '${path}'.`,
    });
  } else {
    issues.push(...validateCodeableConcept(resource.code, `${path}.code`, { requireCoding: true }));
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

  // subject (Reference: Patient | Group | Device | Location)
  if (resource.subject !== undefined) {
    issues.push(...validateReference(resource.subject, `${path}.subject`, ["Patient", "Group", "Device", "Location"]));
  }

  // encounter (Reference: Encounter)
  if (resource.encounter !== undefined) {
    issues.push(...validateReference(resource.encounter, `${path}.encounter`, ["Encounter"]));
  }

  // performer (Reference[])
  if (resource.performer !== undefined) {
    if (!Array.isArray(resource.performer)) {
      issues.push({
        severity: "error",
        path: `${path}.performer`,
        code: "invalid-type",
        message: `Expected '${path}.performer' to be an array, got ${typeof resource.performer}.`,
      });
    } else {
      resource.performer.forEach((perf, idx) => {
        issues.push(...validateReference(perf, `${path}.performer[${idx}]`, ["Practitioner", "PractitionerRole", "Organization", "CareTeam", "Patient", "RelatedPerson"]));
      });
    }
  }

  // valueQuantity
  if (resource.valueQuantity !== undefined) {
    if (typeof resource.valueQuantity !== "object" || resource.valueQuantity === null || Array.isArray(resource.valueQuantity)) {
      issues.push({
        severity: "error",
        path: `${path}.valueQuantity`,
        code: "invalid-structure",
        message: `Expected '${path}.valueQuantity' to be an object.`,
      });
    } else {
      const q = resource.valueQuantity as Record<string, unknown>;
      if (q.value !== undefined && (typeof q.value !== "number" || !Number.isFinite(q.value))) {
        issues.push({
          severity: "error",
          path: `${path}.valueQuantity.value`,
          code: "invalid-type",
          message: `Expected '${path}.valueQuantity.value' to be a number, got ${typeof q.value}.`,
        });
      }
      if (q.unit !== undefined && typeof q.unit !== "string") {
        issues.push({
          severity: "error",
          path: `${path}.valueQuantity.unit`,
          code: "invalid-type",
          message: `Expected '${path}.valueQuantity.unit' to be a string.`,
        });
      }
      if (q.system !== undefined && typeof q.system !== "string") {
        issues.push({
          severity: "error",
          path: `${path}.valueQuantity.system`,
          code: "invalid-type",
          message: `Expected '${path}.valueQuantity.system' to be a string.`,
        });
      }
      if (q.code !== undefined && typeof q.code !== "string") {
        issues.push({
          severity: "error",
          path: `${path}.valueQuantity.code`,
          code: "invalid-type",
          message: `Expected '${path}.valueQuantity.code' to be a string.`,
        });
      }
      if (q.system !== undefined && q.system === "http://unitsofmeasure.org" && (typeof q.code !== "string" || !q.code.trim())) {
        issues.push({ severity: "error", path: `${path}.valueQuantity.code`, code: "required", message: "UCUM Quantity requires a non-empty code." });
      }
    }
  }

  if (resource.effectiveDateTime !== undefined && (typeof resource.effectiveDateTime !== "string" || Number.isNaN(Date.parse(resource.effectiveDateTime)))) {
    issues.push({ severity: "error", path: `${path}.effectiveDateTime`, code: "invalid-value", message: "effectiveDateTime must be a valid date-time string." });
  }
  if (resource.effectivePeriod !== undefined) {
    if (!resource.effectivePeriod || typeof resource.effectivePeriod !== "object" || Array.isArray(resource.effectivePeriod)) {
      issues.push({ severity: "error", path: `${path}.effectivePeriod`, code: "invalid-structure", message: "effectivePeriod must be an object." });
    } else {
      const period = resource.effectivePeriod as Record<string, unknown>;
      const start = typeof period.start === "string" ? Date.parse(period.start) : NaN;
      const end = typeof period.end === "string" ? Date.parse(period.end) : NaN;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end) issues.push({ severity: "error", path: `${path}.effectivePeriod`, code: "invalid-value", message: "effectivePeriod requires valid start and end values in chronological order." });
    }
  }

  // valueCodeableConcept
  if (resource.valueCodeableConcept !== undefined) {
    issues.push(...validateCodeableConcept(resource.valueCodeableConcept, `${path}.valueCodeableConcept`));
  }

  // component (Array of components)
  if (resource.component !== undefined) {
    if (!Array.isArray(resource.component)) {
      issues.push({
        severity: "error",
        path: `${path}.component`,
        code: "invalid-type",
        message: `Expected '${path}.component' to be an array, got ${typeof resource.component}.`,
      });
    } else {
      resource.component.forEach((comp, idx) => {
        const compPath = `${path}.component[${idx}]`;
        if (typeof comp !== "object" || comp === null || Array.isArray(comp)) {
          issues.push({
            severity: "error",
            path: compPath,
            code: "invalid-structure",
            message: `Expected '${compPath}' to be an object.`,
          });
        } else {
          const c = comp as Record<string, unknown>;
          if (c.code === undefined || c.code === null) {
            issues.push({
              severity: "error",
              path: `${compPath}.code`,
              code: "required",
              message: `Missing required 'code' in '${compPath}'.`,
            });
          } else {
            issues.push(...validateCodeableConcept(c.code, `${compPath}.code`, { requireCoding: true }));
          }

          if (c.valueQuantity !== undefined) {
            const q = c.valueQuantity as Record<string, unknown>;
            if (!q || Array.isArray(q)) {
              issues.push({ severity: "error", path: `${compPath}.valueQuantity`, code: "invalid-structure", message: `Expected '${compPath}.valueQuantity' to be an object.` });
            } else if (typeof q.value !== "number" || !Number.isFinite(q.value)) {
              issues.push({
                severity: "error",
                path: `${compPath}.valueQuantity.value`,
                code: "invalid-type",
                message: `Expected '${compPath}.valueQuantity.value' to be a number.`,
              });
            }
          }
          if (c.valueCodeableConcept !== undefined) {
            issues.push(...validateCodeableConcept(c.valueCodeableConcept, `${compPath}.valueCodeableConcept`));
          }
        }
      });
    }
  }

  // hasMember / derivedFrom
  if (resource.hasMember !== undefined) {
    if (Array.isArray(resource.hasMember)) {
      resource.hasMember.forEach((hm, idx) => {
        issues.push(...validateReference(hm, `${path}.hasMember[${idx}]`, ["Observation", "QuestionnaireResponse", "MolecularSequence"]));
      });
    }
  }

  if (resource.derivedFrom !== undefined) {
    if (Array.isArray(resource.derivedFrom)) {
      resource.derivedFrom.forEach((df, idx) => {
        issues.push(...validateReference(df, `${path}.derivedFrom[${idx}]`, ["DocumentReference", "ImagingStudy", "Media", "QuestionnaireResponse", "Observation", "MolecularSequence"]));
      });
    }
  }

  return issues;
}
