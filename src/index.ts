/**
 * fhir-validator — structural, cardinality, and reference validation for
 * FHIR R4 resources. Explicitly NOT a full conformance engine — see
 * docs/KNOWN_LIMITATIONS.md and developer handover spec.
 */

export const VERSION = "0.1.0";

// Main API
export { validate, getNestedValue, validateProfileConstraints, hasCircularReference } from "./validate";

// Core Types
export type {
  ValidationIssue,
  ValidationResult,
  ValidationSeverity,
  ProfileConstraints,
  BindingStrength,
  ValidateOptions,
} from "./types";

// Coding & Reference Helpers
export { validateCoding, validateCodeableConcept } from "./coding";
export { validateReference, extractReferenceType, ALLOWED_REFERENCE_TARGETS } from "./reference-rules";

// Base Resource Validators
export { validatePatient } from "./base-definitions/patient";
export { validateObservation } from "./base-definitions/observation";
export { validateEncounter } from "./base-definitions/encounter";
export { validateCondition } from "./base-definitions/condition";
export { validateCoverage } from "./base-definitions/coverage";
export { validateClaim } from "./base-definitions/claim";
export { validateClaimResponse } from "./base-definitions/claim-response";

// Illustrative Profiles
export { USCorePatientProfile } from "./profiles/us-core-patient";
export { USCoreObservationVitalsProfile } from "./profiles/us-core-observation-vitals";
