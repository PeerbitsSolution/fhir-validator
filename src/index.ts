/**
 * fhir-validator — structural, cardinality, and reference validation for
 * FHIR R4 resources. Explicitly NOT a full conformance engine — see
 * docs/KNOWN_LIMITATIONS.md and developer handover spec.
 */

export const VERSION = "1.0.1";

// Main API
export { validate, getNestedValue, validateProfileConstraints, hasCircularReference } from "./validate.js";

// Core Types
export type {
  ValidationIssue,
  ValidationResult,
  ValidationSeverity,
  ProfileConstraints,
  BindingStrength,
  ValidateOptions,
} from "./types.js";

// Coding & Reference Helpers
export { validateCoding, validateCodeableConcept } from "./coding.js";
export { validateReference, extractReferenceType, ALLOWED_REFERENCE_TARGETS } from "./reference-rules.js";

// Base Resource Validators
export { validatePatient } from "./base-definitions/patient.js";
export { validateObservation } from "./base-definitions/observation.js";
export { validateEncounter } from "./base-definitions/encounter.js";
export { validateCondition } from "./base-definitions/condition.js";
export { validateCoverage } from "./base-definitions/coverage.js";
export { validateClaim } from "./base-definitions/claim.js";
export { validateClaimResponse } from "./base-definitions/claim-response.js";

// Illustrative Profiles
export { USCorePatientProfile } from "./profiles/us-core-patient.js";
export { USCoreObservationVitalsProfile } from "./profiles/us-core-observation-vitals.js";
