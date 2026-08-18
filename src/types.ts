/**
 * Core validation types and interfaces for fhir-validator.
 * Mirrors FHIR R4 OperationOutcome.issue structure.
 */

export type ValidationSeverity = "error" | "warning" | "information";

export interface ValidationIssue {
  /** Severity level: 'error' (fails validation), 'warning', or 'information' */
  severity: ValidationSeverity;
  /** Dot-separated or JSON pointer-like field path (e.g. 'Patient.gender', 'Observation.subject') */
  path: string;
  /** Machine-readable error code */
  code: string;
  /** Human-readable explanation of the issue */
  message: string;
}

export interface ValidationResult {
  /** True if no issues with severity 'error' exist */
  valid: boolean;
  /** List of all validation issues encountered */
  issues: ValidationIssue[];
}

export type BindingStrength = "required" | "extensible" | "preferred" | "example";

export interface ProfileConstraints {
  /** Identifier/name of the profile */
  name: string;
  /** Target FHIR resource type this profile applies to */
  resourceType: string;
  /** Canonical URL or identifier of the profile */
  url?: string;
  /** List of element paths that MUST be present on the resource */
  requiredElements?: string[];
  /** Cardinality overrides per field path (e.g. { "name": { min: 1 }, "identifier": { min: 1 } }) */
  cardinalityOverrides?: Record<string, { min?: number; max?: number }>;
  /** Fixed or pattern values required at specific paths */
  fixedValues?: Record<string, any>;
  /** Binding strength overrides for coded elements */
  bindingStrength?: Record<string, BindingStrength>;
}

export interface ValidateOptions {
  /** Optional profile constraints to evaluate on top of base structural rules */
  profile?: ProfileConstraints;
}
