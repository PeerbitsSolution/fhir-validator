import { describe, expect, it } from "vitest";
import { validate, validateCoding, validateCodeableConcept } from "../src";
import malformedCodingConditionFixture from "../fixtures/invalid/condition-malformed-coding.json";

describe("fhir-validator: CodeableConcept/Coding shape", () => {
  it("flags a coding missing a required system URI via full validation", () => {
    const result = validate(malformedCodingConditionFixture);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some(
        (i) => i.path === "Condition.code.coding[0].system" && i.code === "required"
      )
    ).toBe(true);
  });

  it("flags a coding missing code string", () => {
    const issues = validateCoding({ system: "http://loinc.org" }, "Observation.code.coding[0]");
    expect(issues.some((i) => i.path === "Observation.code.coding[0].code" && i.code === "required")).toBe(true);
  });

  it("flags non-string code and system types", () => {
    const issues = validateCoding(
      { system: 12345, code: true, display: [] },
      "test.coding[0]"
    );
    expect(issues.some((i) => i.path === "test.coding[0].system" && i.code === "invalid-type")).toBe(true);
    expect(issues.some((i) => i.path === "test.coding[0].code" && i.code === "invalid-type")).toBe(true);
    expect(issues.some((i) => i.path === "test.coding[0].display" && i.code === "invalid-type")).toBe(true);
  });

  it("validates valid Coding successfully", () => {
    const issues = validateCoding(
      { system: "http://snomed.info/sct", code: "38341003", display: "Hypertension" },
      "test.coding[0]"
    );
    expect(issues).toHaveLength(0);
  });

  it("validates CodeableConcept structure and minCodings", () => {
    const issues = validateCodeableConcept(
      { coding: [] },
      "test.concept",
      { requireCoding: true, minCodings: 1 }
    );
    expect(issues.some((i) => i.path === "test.concept.coding" && i.code === "cardinality")).toBe(true);
  });
});
