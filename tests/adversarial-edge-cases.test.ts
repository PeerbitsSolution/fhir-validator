import { describe, expect, it } from "vitest";
import {
  validate,
  validateCoding,
  validateCodeableConcept,
  validateReference,
  extractReferenceType,
  getNestedValue,
  hasCircularReference,
  USCorePatientProfile,
} from "../src";

describe("fhir-validator: adversarial edge cases & stress tests", () => {
  describe("Primitive, Non-Object, & Poisoned Inputs", () => {
    it("safely rejects non-object inputs", () => {
      expect(validate(null).valid).toBe(false);
      expect(validate(undefined).valid).toBe(false);
      expect(validate(0).valid).toBe(false);
      expect(validate(NaN).valid).toBe(false);
      expect(validate(Infinity).valid).toBe(false);
      expect(validate("").valid).toBe(false);
      expect(validate("   ").valid).toBe(false);
      expect(validate(true).valid).toBe(false);
      expect(validate(false).valid).toBe(false);
      expect(validate([]).valid).toBe(false);
      expect(validate([1, 2, 3]).valid).toBe(false);
      expect(validate([{ resourceType: "Patient" }]).valid).toBe(false);
      expect(validate(() => {}).valid).toBe(false);
      expect(validate(Symbol("test")).valid).toBe(false);
      expect(validate(new Date()).valid).toBe(false);
      expect(validate(/regex/).valid).toBe(false);
    });
  });

  describe("Prototype Pollution & Malicious Payloads", () => {
    it("survives __proto__ injection without polluting global Object prototype", () => {
      const poisoned = JSON.parse('{"resourceType": "Patient", "__proto__": {"polluted": true}}');
      const res = validate(poisoned);
      expect(typeof res.valid).toBe("boolean");
      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it("survives constructor/toString overrides", () => {
      const poisoned = {
        resourceType: "Patient",
        constructor: { prototype: { admin: true } },
        toString: "not a function",
      };
      const res = validate(poisoned);
      expect(typeof res.valid).toBe("boolean");
    });
  });

  describe("Circular Object References", () => {
    it("handles circular references safely without infinite loops or stack overflow", () => {
      const circular: any = { resourceType: "Patient", name: [] };
      circular.name.push(circular);

      expect(hasCircularReference(circular)).toBe(true);
      const res = validate(circular);
      expect(res.valid).toBe(false);
      expect(res.issues.some((i) => i.code === "circular-reference")).toBe(true);
    });
  });

  describe("Extreme Array Corruptions", () => {
    it("detects multiple array corruptions without throwing or halting early", () => {
      const patientWithCorruptArrays = {
        resourceType: "Patient",
        name: [null, undefined, 123, "string", true, [], {}, { family: 999, given: [123, null] }],
        identifier: [null, { system: 123, value: {} }, { type: { coding: "not-array" } }],
        generalPractitioner: [null, 456, { reference: 789 }],
        active: "yes",
        gender: "MALE",
        birthDate: "99999-99-99",
      };
      const res = validate(patientWithCorruptArrays);
      expect(res.valid).toBe(false);
      expect(res.issues.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe("Reference Formats", () => {
    it("parses and validates various URL and URN reference schemes", () => {
      expect(extractReferenceType({ reference: "Patient/123" })).toBe("Patient");
      expect(extractReferenceType({ reference: "http://example.com/fhir/Encounter/enc-99" })).toBe("Encounter");
      expect(extractReferenceType({ reference: "https://secure.org/base/Coverage/cov-1" })).toBe("Coverage");
      expect(extractReferenceType({ reference: "urn:uuid:1234", type: "Claim" })).toBe("Claim");
      expect(extractReferenceType({ reference: "#contained-1" })).toBeNull();
      expect(extractReferenceType({ reference: "" })).toBeNull();
      expect(extractReferenceType({ reference: 1234 } as any)).toBeNull();
      expect(extractReferenceType({})).toBeNull();
    });

    it("accepts valid reference targets and flags invalid targets", () => {
      const bad = validateReference({ reference: "Device/dev-1" }, "Observation.subject", ["Patient", "Group"]);
      expect(bad.some((i) => i.code === "invalid-reference-type")).toBe(true);

      const good = validateReference({ reference: "Patient/p-1" }, "Observation.subject", ["Patient", "Group"]);
      expect(good).toHaveLength(0);
    });
  });

  describe("Coding & CodeableConcept Shape checks", () => {
    it("flags null, empty, or wrong-type Coding objects", () => {
      expect(validateCoding(null, "path").some((i) => i.code === "invalid-structure")).toBe(true);
      expect(validateCoding({}, "path").length).toBeGreaterThanOrEqual(2);
      expect(validateCoding({ system: "", code: "" }, "path").length).toBeGreaterThanOrEqual(2);
      expect(validateCoding({ system: 123, code: 456, display: 789 }, "path")).toHaveLength(3);
    });

    it("flags malformed CodeableConcept payloads", () => {
      expect(validateCodeableConcept(null, "path").some((i) => i.code === "invalid-structure")).toBe(true);
      expect(validateCodeableConcept([], "path").some((i) => i.code === "invalid-structure")).toBe(true);
      expect(validateCodeableConcept({ coding: "bad" }, "path").some((i) => i.code === "invalid-type")).toBe(true);
    });
  });

  describe("Profile Path Traversal Bounds", () => {
    it("safely navigates deep nested properties and out-of-bounds keys", () => {
      const sample = {
        resourceType: "Observation",
        category: [{ coding: [{ system: "http://example.org", code: "test-code" }] }],
      };
      expect(getNestedValue(sample, "category[0].coding[0].code")).toBe("test-code");
      expect(getNestedValue(sample, "category[999].coding[0].code")).toBeUndefined();
      expect(getNestedValue(sample, "non.existent.path")).toBeUndefined();
      expect(getNestedValue(null, "any.path")).toBeUndefined();
      expect(getNestedValue(undefined, "any.path")).toBeUndefined();
      expect(getNestedValue("string", "any.path")).toBeUndefined();
    });
  });

  describe("High Throughput Performance", () => {
    it("executes 5,000 validations in under 1 second", () => {
      const validPatient = {
        resourceType: "Patient",
        id: "perf-test",
        name: [{ family: "Tester", given: ["Stress"] }],
        gender: "other",
        birthDate: "1990-01-01",
        identifier: [{ system: "http://test.org", value: "ID-1" }],
      };

      const start = Date.now();
      for (let i = 0; i < 5000; i++) {
        const r = validate(validPatient, { profile: USCorePatientProfile });
        expect(r.valid).toBe(true);
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });
  });
});
