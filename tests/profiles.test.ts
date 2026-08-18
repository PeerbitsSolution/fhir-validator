import { describe, expect, it } from "vitest";
import { validate, USCorePatientProfile, USCoreObservationVitalsProfile } from "../src";

import patientFixture from "../fixtures/valid/patient.json";
import observationFixture from "../fixtures/valid/observation.json";

describe("fhir-validator: pluggable profile constraints", () => {
  it("us-core-patient profile catches extra required elements the base spec leaves optional", () => {
    // Base FHIR leaves Patient.identifier and Patient.name optional
    const minimalPatient = {
      resourceType: "Patient",
      id: "minimal-patient",
      gender: "female",
    };

    // Base validation passes
    const baseResult = validate(minimalPatient);
    expect(baseResult.valid).toBe(true);

    // Profile validation catches missing identifier and name
    const profileResult = validate(minimalPatient, { profile: USCorePatientProfile });
    expect(profileResult.valid).toBe(false);
    expect(
      profileResult.issues.some(
        (i) => i.path === "Patient.identifier" && i.code === "profile-required-element"
      )
    ).toBe(true);
    expect(
      profileResult.issues.some(
        (i) => i.path === "Patient.name" && i.code === "profile-required-element"
      )
    ).toBe(true);

    // Complete patient passes profile validation
    const completeResult = validate(patientFixture, { profile: USCorePatientProfile });
    expect(completeResult.valid).toBe(true);
  });

  it("us-core-observation-vitals profile catches missing category or wrong fixed category code", () => {
    // Base FHIR does not require category or fixed category coding
    const obsWithoutCategory = {
      resourceType: "Observation",
      status: "final",
      code: {
        coding: [{ system: "http://loinc.org", code: "8867-4" }],
      },
      subject: { reference: "Patient/synthetic-patient-001" },
    };

    // Base validation passes
    const baseResult = validate(obsWithoutCategory);
    expect(baseResult.valid).toBe(true);

    // Profile validation fails because category is missing
    const profileResult = validate(obsWithoutCategory, { profile: USCoreObservationVitalsProfile });
    expect(profileResult.valid).toBe(false);
    expect(
      profileResult.issues.some(
        (i) => i.path === "Observation.category" && i.code === "profile-required-element"
      )
    ).toBe(true);

    // Complete vital signs observation passes profile validation
    const completeResult = validate(observationFixture, { profile: USCoreObservationVitalsProfile });
    expect(completeResult.valid).toBe(true);
  });

  it("flags profile mismatch when applied to incorrect resource type", () => {
    const result = validate(patientFixture, { profile: USCoreObservationVitalsProfile });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === "profile-mismatch")).toBe(true);
  });
});
