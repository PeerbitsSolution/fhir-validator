import { ProfileConstraints } from "../types.js";

/**
 * ILLUSTRATIVE ONLY — not a certified reproduction of the real US Core
 * Vital Signs profile. See handover doc §6 FR5 and §13.
 *
 * This profile demonstrates the ProfileConstraints mechanism by enforcing:
 * - Presence of category containing vital-signs coding
 * - Mandatory subject referencing Patient
 * - Effective date/time or period
 */
export const USCoreObservationVitalsProfile: ProfileConstraints = {
  name: "us-core-observation-vitals",
  resourceType: "Observation",
  url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-vital-signs",
  requiredElements: ["status", "category", "code", "subject"],
  cardinalityOverrides: {
    category: { min: 1 },
  },
  fixedValues: {
    "category[0].coding[0].system": "http://terminology.hl7.org/CodeSystem/observation-category",
    "category[0].coding[0].code": "vital-signs",
  },
};
