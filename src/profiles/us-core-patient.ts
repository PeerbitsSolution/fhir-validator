import { ProfileConstraints } from "../types.js";

/**
 * ILLUSTRATIVE ONLY — not a certified reproduction of the real US Core
 * Patient StructureDefinition. See handover doc §6 FR5 and §13.
 *
 * This profile demonstrates the ProfileConstraints mechanism by requiring
 * elements (such as `identifier`, `name`, `gender`) that the base FHIR R4
 * specification leaves optional.
 */
export const USCorePatientProfile: ProfileConstraints = {
  name: "us-core-patient",
  resourceType: "Patient",
  url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient",
  requiredElements: ["identifier", "name", "gender"],
  cardinalityOverrides: {
    identifier: { min: 1 },
    name: { min: 1 },
  },
  bindingStrength: {
    gender: "required",
  },
};
