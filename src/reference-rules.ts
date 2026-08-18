import { ValidationIssue } from "./types";

/**
 * Maps field paths to their allowed target FHIR resource types per FHIR R4 base spec.
 */
export const ALLOWED_REFERENCE_TARGETS: Record<string, string[]> = {
  // Patient
  "Patient.generalPractitioner": ["Organization", "Practitioner", "PractitionerRole"],
  "Patient.managingOrganization": ["Organization"],
  "Patient.link.other": ["Patient", "RelatedPerson"],

  // Observation
  "Observation.subject": ["Patient", "Group", "Device", "Location"],
  "Observation.focus": ["Resource"],
  "Observation.encounter": ["Encounter"],
  "Observation.performer": ["Practitioner", "PractitionerRole", "Organization", "CareTeam", "Patient", "RelatedPerson"],
  "Observation.specimen": ["Specimen"],
  "Observation.device": ["Device", "DeviceMetric"],
  "Observation.hasMember": ["Observation", "QuestionnaireResponse", "MolecularSequence"],
  "Observation.derivedFrom": ["DocumentReference", "ImagingStudy", "Media", "QuestionnaireResponse", "Observation", "MolecularSequence"],

  // Encounter
  "Encounter.subject": ["Patient", "Group"],
  "Encounter.episodeOfCare": ["EpisodeOfCare"],
  "Encounter.basedOn": ["ServiceRequest"],
  "Encounter.participant.individual": ["Practitioner", "PractitionerRole", "RelatedPerson"],
  "Encounter.appointment": ["Appointment"],
  "Encounter.reasonReference": ["Condition", "Procedure", "Observation", "ImmunizationRecommendation"],
  "Encounter.diagnosis.condition": ["Condition", "Procedure"],
  "Encounter.location.location": ["Location"],
  "Encounter.serviceProvider": ["Organization"],
  "Encounter.partOf": ["Encounter"],

  // Condition
  "Condition.subject": ["Patient", "Group"],
  "Condition.encounter": ["Encounter"],
  "Condition.recorder": ["Practitioner", "PractitionerRole", "Patient", "RelatedPerson"],
  "Condition.asserter": ["Practitioner", "PractitionerRole", "Patient", "RelatedPerson"],
  "Condition.stage.assessment": ["ClinicalImpression", "DiagnosticReport", "Observation"],
  "Condition.evidence.detail": ["Resource"],

  // Coverage
  "Coverage.policyHolder": ["Patient", "RelatedPerson", "Organization"],
  "Coverage.subscriber": ["Patient", "RelatedPerson"],
  "Coverage.beneficiary": ["Patient"],
  "Coverage.payor": ["Organization", "Patient", "RelatedPerson"],
  "Coverage.contract": ["Contract"],

  // Claim
  "Claim.patient": ["Patient"],
  "Claim.enterer": ["Practitioner", "PractitionerRole"],
  "Claim.insurer": ["Organization"],
  "Claim.provider": ["Practitioner", "PractitionerRole", "Organization"],
  "Claim.facility": ["Location"],
  "Claim.prescription": ["MedicationRequest", "VisionPrescription"],
  "Claim.originalPrescription": ["MedicationRequest"],
  "Claim.payee.party": ["Practitioner", "PractitionerRole", "Organization", "Patient", "RelatedPerson"],
  "Claim.referral": ["ServiceRequest"],
  "Claim.careTeam.provider": ["Practitioner", "PractitionerRole", "Organization"],
  "Claim.supportingInfo.valueReference": ["Resource"],
  "Claim.diagnosis.diagnosisReference": ["Condition"],
  "Claim.procedure.procedureReference": ["Procedure"],
  "Claim.insurance.coverage": ["Coverage"],
  "Claim.insurance.claimResponse": ["ClaimResponse"],
  "Claim.item.locationReference": ["Location"],
  "Claim.item.encounter": ["Encounter"],

  // ClaimResponse
  "ClaimResponse.patient": ["Patient"],
  "ClaimResponse.insurer": ["Organization"],
  "ClaimResponse.requestor": ["Practitioner", "PractitionerRole", "Organization"],
  "ClaimResponse.request": ["Claim"],
  "ClaimResponse.insurance.coverage": ["Coverage"],
  "ClaimResponse.insurance.claimResponse": ["ClaimResponse"],
};

/**
 * Extracts target resource type from a Reference object.
 * Looks at explicit `type` field, or parses relative/absolute URL in `reference`.
 */
export function extractReferenceType(referenceObj: Record<string, unknown>): string | null {
  if (typeof referenceObj.type === "string" && referenceObj.type.trim()) {
    return referenceObj.type.trim();
  }

  if (typeof referenceObj.reference === "string") {
    const ref = referenceObj.reference.trim();
    // Pattern: [ResourceType]/[id] or http[s]://.../[ResourceType]/[id]
    const match = ref.match(/(?:^|\/)([A-Z][A-Za-z0-9]+)\/[A-Za-z0-9\-._~]+$/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validates a FHIR Reference element against allowed target resource types.
 */
export function validateReference(
  reference: unknown,
  path: string,
  allowedTypes?: string[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    issues.push({
      severity: "error",
      path,
      code: "invalid-structure",
      message: `Expected '${path}' to be a Reference object, got ${Array.isArray(reference) ? "array" : typeof reference}.`,
    });
    return issues;
  }

  const ref = reference as Record<string, unknown>;

  if (ref.reference !== undefined && typeof ref.reference !== "string") {
    issues.push({
      severity: "error",
      path: `${path}.reference`,
      code: "invalid-type",
      message: `Expected '${path}.reference' to be a string, got ${typeof ref.reference}.`,
    });
  }

  if (ref.type !== undefined && typeof ref.type !== "string") {
    issues.push({
      severity: "error",
      path: `${path}.type`,
      code: "invalid-type",
      message: `Expected '${path}.type' to be a string URI/type, got ${typeof ref.type}.`,
    });
  }

  if (ref.display !== undefined && typeof ref.display !== "string") {
    issues.push({
      severity: "error",
      path: `${path}.display`,
      code: "invalid-type",
      message: `Expected '${path}.display' to be a string, got ${typeof ref.display}.`,
    });
  }

  // Target type checking
  const targets = allowedTypes ?? ALLOWED_REFERENCE_TARGETS[path];
  if (targets && targets.length > 0 && !targets.includes("Resource")) {
    const detectedType = extractReferenceType(ref);
    if (detectedType && !targets.includes(detectedType)) {
      issues.push({
        severity: "error",
        path,
        code: "invalid-reference-type",
        message: `Reference at '${path}' targets disallowed resource type '${detectedType}'. Allowed types: ${targets.join(", ")}.`,
      });
    }
  }

  return issues;
}
