import { describe, expect, it } from "vitest";
import { validate } from "../src";

import patientFixture from "../fixtures/valid/patient.json";
import observationFixture from "../fixtures/valid/observation.json";
import encounterFixture from "../fixtures/valid/encounter.json";
import conditionFixture from "../fixtures/valid/condition.json";
import coverageFixture from "../fixtures/valid/coverage.json";
import claimFixture from "../fixtures/valid/claim.json";
import claimResponseFixture from "../fixtures/valid/claim-response.json";

import invalidPatientFixture from "../fixtures/invalid/patient-missing-required-field.json";

describe("fhir-validator: base structural rules", () => {
  describe("Valid fixtures pass across all 7 supported resource types", () => {
    it("validates Patient fixture successfully", () => {
      const result = validate(patientFixture);
      expect(result.valid).toBe(true);
      expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    });

    it("validates Observation fixture successfully", () => {
      const result = validate(observationFixture);
      expect(result.valid).toBe(true);
      expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    });

    it("validates Encounter fixture successfully", () => {
      const result = validate(encounterFixture);
      expect(result.valid).toBe(true);
      expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    });

    it("validates Condition fixture successfully", () => {
      const result = validate(conditionFixture);
      expect(result.valid).toBe(true);
      expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    });

    it("validates Coverage fixture successfully", () => {
      const result = validate(coverageFixture);
      expect(result.valid).toBe(true);
      expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    });

    it("validates Claim fixture successfully", () => {
      const result = validate(claimFixture);
      expect(result.valid).toBe(true);
      expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    });

    it("validates ClaimResponse fixture successfully", () => {
      const result = validate(claimResponseFixture);
      expect(result.valid).toBe(true);
      expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    });
  });

  describe("Invalid fixtures fail correctly with specific issues", () => {
    it("flags invalid types, invalid gender, and malformed birthDate in Patient", () => {
      const result = validate(invalidPatientFixture);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.path === "Patient.active" && i.code === "invalid-type")).toBe(true);
      expect(result.issues.some((i) => i.path === "Patient.gender" && i.code === "invalid-value")).toBe(true);
      expect(result.issues.some((i) => i.path === "Patient.birthDate" && i.code === "invalid-format")).toBe(true);
    });

    it("flags missing required fields in Observation (status, code)", () => {
      const result = validate({ resourceType: "Observation" });
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.path === "Observation.status" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "Observation.code" && i.code === "required")).toBe(true);
    });

    it("flags missing required fields in Encounter (status, class)", () => {
      const result = validate({ resourceType: "Encounter" });
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.path === "Encounter.status" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "Encounter.class" && i.code === "required")).toBe(true);
    });

    it("flags missing required fields in Condition (subject)", () => {
      const result = validate({ resourceType: "Condition" });
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.path === "Condition.subject" && i.code === "required")).toBe(true);
    });

    it("flags missing required fields in Coverage (status, beneficiary, payor)", () => {
      const result = validate({ resourceType: "Coverage" });
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.path === "Coverage.status" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "Coverage.beneficiary" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "Coverage.payor" && i.code === "required")).toBe(true);
    });

    it("flags missing required fields in Claim (status, type, use, patient, created, provider, priority, insurance)", () => {
      const result = validate({ resourceType: "Claim" });
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.path === "Claim.status" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "Claim.type" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "Claim.use" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "Claim.patient" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "Claim.created" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "Claim.provider" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "Claim.priority" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "Claim.insurance" && i.code === "required")).toBe(true);
    });

    it("flags missing required fields in ClaimResponse (status, type, use, patient, created, insurer, outcome)", () => {
      const result = validate({ resourceType: "ClaimResponse" });
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.path === "ClaimResponse.status" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "ClaimResponse.type" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "ClaimResponse.use" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "ClaimResponse.patient" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "ClaimResponse.created" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "ClaimResponse.insurer" && i.code === "required")).toBe(true);
      expect(result.issues.some((i) => i.path === "ClaimResponse.outcome" && i.code === "required")).toBe(true);
    });

    it("flags unsupported resource types", () => {
      const result = validate({ resourceType: "MedicationRequest" });
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === "unsupported-resource-type")).toBe(true);
    });

    it("flags null or non-object payloads", () => {
      expect(validate(null).valid).toBe(false);
      expect(validate("string").valid).toBe(false);
      expect(validate([]).valid).toBe(false);
      expect(validate({}).valid).toBe(false);
    });
  });
});
