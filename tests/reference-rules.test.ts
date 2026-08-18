import { describe, expect, it } from "vitest";
import { validate, validateReference, extractReferenceType } from "../src";
import badRefObservationFixture from "../fixtures/invalid/observation-bad-reference-type.json";

describe("fhir-validator: reference target-type checking", () => {
  it("flags a Reference field pointing at a disallowed target resource type", () => {
    const result = validate(badRefObservationFixture);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some(
        (i) =>
          i.path === "Observation.subject" &&
          i.code === "invalid-reference-type" &&
          i.message.includes("targets disallowed resource type 'Claim'")
      )
    ).toBe(true);
  });

  it("extracts resource type from relative URL reference", () => {
    expect(extractReferenceType({ reference: "Patient/12345" })).toBe("Patient");
    expect(extractReferenceType({ reference: "http://example.com/fhir/Organization/org-1" })).toBe("Organization");
  });

  it("extracts resource type from explicit type attribute", () => {
    expect(extractReferenceType({ reference: "urn:uuid:abc-123", type: "Encounter" })).toBe("Encounter");
  });

  it("allows permitted target types", () => {
    const issues = validateReference(
      { reference: "Patient/synthetic-patient-001" },
      "Observation.subject",
      ["Patient", "Group", "Device", "Location"]
    );
    expect(issues).toHaveLength(0);
  });

  it("flags disallowed target types directly", () => {
    const issues = validateReference(
      { reference: "Observation/synthetic-obs-001" },
      "Coverage.beneficiary",
      ["Patient"]
    );
    expect(issues.some((i) => i.code === "invalid-reference-type")).toBe(true);
  });
});
