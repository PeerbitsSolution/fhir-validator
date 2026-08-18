import { validate, USCorePatientProfile } from "@peerbits/fhir-validator";

// 1. Valid FHIR Patient
const validPatient = {
  resourceType: "Patient",
  id: "patient-101",
  name: [{ family: "Smith", given: ["Alice"] }],
  gender: "female",
  birthDate: "1988-04-12",
  identifier: [{ system: "http://hospital.example.org", value: "MRN-101" }],
};

console.log("=== Validating Valid Patient ===");
const validResult = validate(validPatient, { profile: USCorePatientProfile });
console.log("Valid:", validResult.valid); // true
console.log("Issues:", validResult.issues); // []

// 2. Resource with deliberate structural errors
const invalidObservation = {
  resourceType: "Observation",
  // Missing required 'status'
  code: {
    coding: [
      {
        // Missing required 'system'
        code: "8867-4",
      },
    ],
  },
  subject: {
    // Disallowed target resource type for Observation.subject
    reference: "Claim/claim-999",
  },
};

console.log("\n=== Validating Invalid Observation ===");
const invalidResult = validate(invalidObservation);
console.log("Valid:", invalidResult.valid); // false
console.log("Found", invalidResult.issues.length, "issue(s):");
invalidResult.issues.forEach((issue) => {
  console.log(`- [${issue.severity.toUpperCase()}] ${issue.path} (${issue.code}): ${issue.message}`);
});
